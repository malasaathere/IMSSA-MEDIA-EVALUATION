import { Client, Databases, ID, Query } from 'node-appwrite';

const ACTIVE_STATUSES = ['ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'REVISION_REQUESTED', 'READY_FOR_REVIEW', 'IN_REVIEW'];
const ALLOWED_CREATORS = new Set(['MARKETING_COORDINATOR', 'ADMIN']);
const ALLOWED_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH']);

function readJson(req) {
  if (req.bodyJson && typeof req.bodyJson === 'object') return req.bodyJson;
  const raw = req.bodyText || req.payload || req.body || '{}';
  if (typeof raw === 'object') return raw;
  return JSON.parse(raw || '{}');
}

function send(res, body, status = 200) {
  return res.json(body, status);
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export default async ({ req, res, log, error }) => {
  if (req.method && req.method !== 'POST') {
    return send(res, { success: false, code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' }, 405);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  const databases = new Databases(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'imssa_media';

  try {
    const body = readJson(req);
    if (body.action !== 'CREATE_AND_ASSIGN') {
      return send(res, { success: false, code: 'UNKNOWN_ACTION', message: 'Unknown task action.' }, 400);
    }

    const actorId = req.headers?.['x-appwrite-user-id'];
    if (!actorId) {
      return send(res, { success: false, code: 'UNAUTHENTICATED', message: 'Sign in before creating a task.' }, 401);
    }

    const actorResult = await databases.listDocuments(databaseId, 'users', [Query.equal('authUserId', actorId), Query.limit(1)]);
    const actor = actorResult.documents[0];
    const actorRoles = Array.isArray(actor?.roles) ? actor.roles : [];
    if (!actor || !actorRoles.some((role) => ALLOWED_CREATORS.has(role))) {
      return send(res, { success: false, code: 'FORBIDDEN', message: 'You do not have permission to create tasks.' }, 403);
    }

    const input = body.task || {};
    const title = cleanText(input.title, 255);
    const description = cleanText(input.description, 5000);
    const eventId = cleanText(input.eventId, 255);
    const workType = cleanText(input.workType, 100);
    const assigneeId = cleanText(input.currentAssigneeId, 64);
    const priority = cleanText(input.priority, 20).toUpperCase();
    const deadline = new Date(input.deadline);

    if (!title || !eventId || !workType || !assigneeId || !ALLOWED_PRIORITIES.has(priority) || Number.isNaN(deadline.getTime())) {
      return send(res, { success: false, code: 'VALIDATION_ERROR', message: 'Title, event, work type, priority, assignee, and a valid deadline are required.' }, 400);
    }
    if (deadline.getTime() <= Date.now()) {
      return send(res, { success: false, code: 'DEADLINE_IN_PAST', message: 'Deadline must be in the future.' }, 400);
    }

    const assigneeResult = await databases.listDocuments(databaseId, 'users', [Query.equal('authUserId', assigneeId), Query.limit(1)]);
    const assignee = assigneeResult.documents[0];
    const assigneeRoles = Array.isArray(assignee?.roles) ? assignee.roles : [];
    if (!assignee || !assigneeRoles.some((role) => role === 'DESIGNER' || role === 'VIDEO_EDITOR')) {
      return send(res, { success: false, code: 'INVALID_ASSIGNEE', message: 'The selected user is not a designer or video editor.' }, 400);
    }

    const activeResult = await databases.listDocuments(databaseId, 'tasks', [
      Query.equal('currentAssigneeId', assigneeId), Query.equal('status', ACTIVE_STATUSES), Query.limit(4),
    ]);
    if (activeResult.total >= 3) {
      return send(res, {
        success: false,
        code: 'ASSIGNEE_CAPACITY_REACHED',
        message: 'This person already has 3 active tasks.',
        assigneeId,
        activeTasks: activeResult.documents.slice(0, 3).map((task) => ({
          id: task.$id, title: task.title, eventName: task.eventId, deadline: task.deadline,
        })),
      }, 409);
    }

    const now = new Date().toISOString();
    const task = await databases.createDocument(databaseId, 'tasks', ID.unique(), {
      title, description, eventId, workType, priority, status: 'ASSIGNED', currentAssigneeId: assigneeId,
      createdById: actorId, deadline: deadline.toISOString(),
    });

    try {
      await databases.createDocument(databaseId, 'task_assignments', ID.unique(), {
        taskId: task.$id, assigneeId, assignedById: actorId, assignedAt: now,
      });
      await databases.createDocument(databaseId, 'task_status_history', ID.unique(), {
        taskId: task.$id, fromStatus: 'DRAFT', toStatus: 'ASSIGNED', changedById: actorId, changedAt: now,
      });
    } catch (historyError) {
      error(`Task ${task.$id} was created but history creation failed: ${historyError.message}`);
    }

    log(`Task ${task.$id} created and assigned to ${assigneeId} by ${actorId}.`);
    return send(res, { success: true, task }, 201);
  } catch (err) {
    error(`Failed to create task: ${err.message}`);
    return send(res, { success: false, code: 'TASK_CREATE_FAILED', message: 'The task could not be created.', detail: err.message }, 500);
  }
};
