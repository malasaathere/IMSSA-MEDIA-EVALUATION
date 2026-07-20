import { Client, Databases, Query, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  log('Assigning task...');

  if (req.method !== 'POST') {
    return res.json({ success: false, error: 'Method not allowed' }, 405);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const DB_ID = 'imssa-media';

  try {
    const { taskId, assigneeId, assignedById } = JSON.parse(req.payload || '{}');

    if (!taskId || !assigneeId || !assignedById) {
      return res.json({ success: false, error: 'Missing required parameters' }, 400);
    }

    // 1. Verify capacity <= 3 active tasks for assignee
    const activeTasksQuery = await databases.listDocuments(DB_ID, 'tasks', [
      Query.equal('currentAssigneeId', assigneeId),
      Query.notEqual('status', 'APPROVED'),
      Query.notEqual('status', 'COMPLETED')
    ]);

    if (activeTasksQuery.total >= 3) {
      return res.json({ success: false, error: 'Assignee is at maximum capacity (3 active tasks)' }, 403);
    }

    // 2. Assign task and create assignment audit log
    await databases.updateDocument(DB_ID, 'tasks', taskId, {
      currentAssigneeId: assigneeId,
      status: 'ASSIGNED'
    });

    await databases.createDocument(DB_ID, 'task_assignments', ID.unique(), {
      taskId: taskId,
      assigneeId: assigneeId,
      assignedById: assignedById
    });

    log(`Task ${taskId} assigned to ${assigneeId} by ${assignedById}`);

    return res.json({ success: true, message: 'Task assigned successfully' });
  } catch (err) {
    error('Failed to assign task: ' + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
