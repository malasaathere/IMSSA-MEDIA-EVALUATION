import { Client, Databases, ID, Query, Users } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const ALLOWED_ROLES = new Set([
  'ADMIN',
  'CHIEF_COORDINATOR',
  'MARKETING_COORDINATOR',
  'DESIGNER',
  'VIDEO_EDITOR',
  'MEDIA_DIRECTOR',
  'CONTENT_WRITER',
]);
const ACTIVE_TASK_STATUSES = new Set(['ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'REVISION_REQUESTED', 'READY_FOR_REVIEW', 'IN_REVIEW']);

const clean = (value) => String(value ?? '').trim();
const normalizeRole = (value) => clean(value).toUpperCase().replace(/[ -]+/g, '_');
const eventSlug = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

async function uniquePasskey(databases) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = String(Math.floor(1000 + Math.random() * 9000));
    const existing = await databases.listDocuments(DATABASE_ID, 'users', [Query.equal('passkey', candidate), Query.limit(1)]);
    if (existing.total === 0) return candidate;
  }
  return '';
}

async function createManagedUser({ databases, users, name, roles, events }) {
  const passkey = await uniquePasskey(databases);
  if (!passkey) throw Object.assign(new Error('Could not generate a unique passkey.'), { code: 503 });
  const email = `${passkey}@imssa.local`;
  const authUser = await users.create(ID.unique(), email, undefined, passkey.padEnd(8, '0'), name);
  try {
    const profile = await databases.createDocument(DATABASE_ID, 'users', ID.unique(), {
      authUserId: authUser.$id, name, email, passkey, status: 'ACTIVE', roles, events,
    });
    return { passkey, profile };
  } catch (profileError) {
    await users.delete(authUser.$id).catch(() => undefined);
    throw profileError;
  }
}

async function allDocuments(databases, collectionId) {
  const documents = [];
  for (let offset = 0; ; offset += 500) {
    const page = await databases.listDocuments(DATABASE_ID, collectionId, [Query.limit(500), Query.offset(offset)]);
    documents.push(...page.documents);
    if (documents.length >= page.total || page.documents.length === 0) return documents;
  }
}

function requestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.bodyText || req.bodyRaw || req.payload || '{}'); } catch { return {}; }
}

function callerId(req) {
  const headers = req.headers || {};
  return headers['x-appwrite-user-id'] || headers['X-Appwrite-User-Id'] || '';
}

export default async ({ req, res, log, error }) => {
  if (clean(req.method || 'POST').toUpperCase() !== 'POST') {
    return res.json({ success: false, error: 'Method not allowed.' }, 405);
  }

  const authUserId = callerId(req);
  if (!authUserId) return res.json({ success: false, error: 'Please sign in again.' }, 401);

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY);
  const databases = new Databases(client);
  const users = new Users(client);

  try {
    const actorResult = await databases.listDocuments(DATABASE_ID, 'users', [
      Query.equal('authUserId', authUserId),
      Query.limit(1),
    ]);
    const actor = actorResult.documents[0];
    const actorRoles = (actor?.roles || []).map(normalizeRole);
    if (!actor || !actorRoles.includes('ADMIN')) {
      return res.json({ success: false, error: 'Administrator access is required.' }, 403);
    }

    const body = requestBody(req);
    const action = clean(body.action || 'UPDATE_USER').toUpperCase();
    if (action === 'LIST_EVENTS') {
      const result = await databases.listDocuments(DATABASE_ID, 'events', [Query.orderAsc('name'), Query.limit(500)]);
      return res.json({ success: true, events: result.documents.map((event) => ({
        $id: event.$id, name: event.name, description: event.description || '', startsAt: event.startsAt || '', endsAt: event.endsAt || '', color: event.color || '#18a88a',
      })) });
    }
    if (action === 'CREATE_USER') {
      const name = clean(body.name);
      const roles = [...new Set((Array.isArray(body.roles) ? body.roles : []).map(normalizeRole))];
      const events = [...new Set((Array.isArray(body.events) ? body.events : []).map(clean).filter(Boolean))];
      if (name.length < 2 || name.length > 100) return res.json({ success: false, error: 'Enter a valid user name.' }, 400);
      if (!roles.length || roles.some((role) => !ALLOWED_ROLES.has(role))) {
        return res.json({ success: false, error: 'Select at least one valid position.' }, 400);
      }

      const created = await createManagedUser({ databases, users, name, roles, events });
      log(JSON.stringify({ action: 'CREATE_USER', actorId: actor.$id, targetId: created.profile.$id, name, roles, events }));
      return res.json({ success: true, passkey: created.passkey, user: { $id: created.profile.$id, name, email: created.profile.email, status: 'ACTIVE', roles, events } }, 201);
    }
    if (action === 'CREATE_EVENT') {
      const name = clean(body.name);
      const description = clean(body.description);
      const startsAt = clean(body.startsAt);
      const endsAt = clean(body.endsAt);
      const color = /^#[0-9a-f]{6}$/i.test(clean(body.color)) ? clean(body.color) : '#18a88a';
      const rawAssignments = Array.isArray(body.coordinatorAssignments) ? body.coordinatorAssignments : [];
      const coordinatorAssignments = [...new Map(rawAssignments.map((assignment) => [clean(assignment?.userId), { userId: clean(assignment?.userId), role: normalizeRole(assignment?.role) }])).values()].filter((assignment) => assignment.userId);
      const newCoordinatorName = clean(body.newCoordinatorName);
      const newCoordinatorRole = normalizeRole(body.newCoordinatorRole || 'CHIEF_COORDINATOR');
      if (name.length < 2 || name.length > 120) return res.json({ success: false, error: 'Enter a valid event name.' }, 400);
      if (description.length > 1000) return res.json({ success: false, error: 'Event description is too long.' }, 400);
      if (startsAt && Number.isNaN(Date.parse(startsAt))) return res.json({ success: false, error: 'Select a valid start date.' }, 400);
      if (endsAt && Number.isNaN(Date.parse(endsAt))) return res.json({ success: false, error: 'Select a valid end date.' }, 400);
      if (startsAt && endsAt && Date.parse(endsAt) < Date.parse(startsAt)) return res.json({ success: false, error: 'The end date must be after the start date.' }, 400);
      if (newCoordinatorName && (newCoordinatorName.length < 2 || newCoordinatorName.length > 100)) return res.json({ success: false, error: 'Enter a valid new coordinator name.' }, 400);
      if (coordinatorAssignments.some((assignment) => !['CHIEF_COORDINATOR', 'MARKETING_COORDINATOR'].includes(assignment.role)) || !['CHIEF_COORDINATOR', 'MARKETING_COORDINATOR'].includes(newCoordinatorRole)) return res.json({ success: false, error: 'Select a valid coordinator position.' }, 400);
      const duplicate = await databases.listDocuments(DATABASE_ID, 'events', [Query.equal('name', name), Query.limit(1)]);
      if (duplicate.total) return res.json({ success: false, error: 'An event with this name already exists.' }, 409);

      const eventData = { name, slug: `${eventSlug(name) || 'event'}-${Date.now().toString(36)}`, description, color };
      if (startsAt) eventData.startsAt = new Date(startsAt).toISOString();
      if (endsAt) eventData.endsAt = new Date(endsAt).toISOString();
      const event = await databases.createDocument(DATABASE_ID, 'events', ID.unique(), eventData);
      for (const assignment of coordinatorAssignments) {
        const coordinator = await databases.getDocument(DATABASE_ID, 'users', assignment.userId);
        const coordinatorRoles = [...new Set([...(coordinator.roles || []).map(normalizeRole), assignment.role])];
        const coordinatorEvents = [...new Set([...(coordinator.events || []).map(clean).filter(Boolean), name])];
        await databases.updateDocument(DATABASE_ID, 'users', assignment.userId, { roles: coordinatorRoles, events: coordinatorEvents });
      }
      let newCoordinator = null;
      if (newCoordinatorName) {
        const created = await createManagedUser({ databases, users, name: newCoordinatorName, roles: [newCoordinatorRole], events: [name] });
        newCoordinator = { $id: created.profile.$id, name: newCoordinatorName, role: newCoordinatorRole, passkey: created.passkey };
      }
      log(JSON.stringify({ action: 'CREATE_EVENT', actorId: actor.$id, eventId: event.$id, name, coordinatorAssignments, newCoordinatorId: newCoordinator?.$id || null }));
      return res.json({ success: true, event: { $id: event.$id, ...eventData }, newCoordinator }, 201);
    }
    if (action === 'DELETE_USER') {
      const userId = clean(body.userId);
      if (!userId) return res.json({ success: false, error: 'Select a user to remove.' }, 400);
      const target = await databases.getDocument(DATABASE_ID, 'users', userId);
      if (target.$id === actor.$id || (target.authUserId && target.authUserId === authUserId)) {
        return res.json({ success: false, error: 'You cannot remove the account you are currently using.' }, 409);
      }
      const targetRoles = (target.roles || []).map(normalizeRole);
      if (targetRoles.includes('ADMIN')) {
        const admins = await databases.listDocuments(DATABASE_ID, 'users', [Query.contains('roles', 'ADMIN'), Query.limit(2)]);
        if (admins.total <= 1) return res.json({ success: false, error: 'The final administrator cannot be removed.' }, 409);
      }
      const tasks = await allDocuments(databases, 'tasks');
      const hasWork = tasks.some((task) => [target.$id, target.authUserId].filter(Boolean).includes(task.currentAssigneeId)
        && ACTIVE_TASK_STATUSES.has(clean(task.status).toUpperCase()));
      if (hasWork) return res.json({ success: false, error: 'This user still has assigned work. Reassign their tasks before removing the account.' }, 409);

      if (target.authUserId) await users.updateStatus(target.authUserId, false);
      await databases.deleteDocument(DATABASE_ID, 'users', target.$id);
      if (target.authUserId) await users.delete(target.authUserId);
      log(JSON.stringify({ action: 'DELETE_USER', actorId: actor.$id, targetId: target.$id, name: target.name }));
      return res.json({ success: true, removedUserId: target.$id });
    }
    if (action === 'DELETE_EVENT') {
      const eventId = clean(body.eventId);
      if (!eventId) return res.json({ success: false, error: 'Select an event to remove.' }, 400);
      const event = await databases.getDocument(DATABASE_ID, 'events', eventId);
      const eventName = clean(event.name);
      const [tasks, plans, profiles] = await Promise.all([
        allDocuments(databases, 'tasks'),
        allDocuments(databases, 'marketing_plan_items'),
        allDocuments(databases, 'users'),
      ]);
      const normalizedEvent = eventName.toLowerCase();
      const matchesEvent = (value) => clean(value).toLowerCase() === normalizedEvent || clean(value) === event.$id;
      const taskCount = tasks.filter((task) => matchesEvent(task.eventId) || matchesEvent(task.eventName)).length;
      const planCount = plans.filter((plan) => matchesEvent(plan.eventId) || matchesEvent(plan.eventName) || matchesEvent(plan.campaign)).length;
      if (taskCount || planCount) {
        return res.json({ success: false, error: `This event still has ${taskCount} task${taskCount === 1 ? '' : 's'} and ${planCount} marketing-plan item${planCount === 1 ? '' : 's'}. Remove or move those records first.` }, 409);
      }
      for (const profile of profiles) {
        const nextEvents = (profile.events || []).filter((assignedEvent) => !matchesEvent(assignedEvent));
        if (nextEvents.length !== (profile.events || []).length) {
          await databases.updateDocument(DATABASE_ID, 'users', profile.$id, { events: nextEvents });
        }
      }
      await databases.deleteDocument(DATABASE_ID, 'events', event.$id);
      log(JSON.stringify({ action: 'DELETE_EVENT', actorId: actor.$id, eventId: event.$id, name: eventName }));
      return res.json({ success: true, removedEventId: event.$id });
    }
    if (action !== 'UPDATE_USER') return res.json({ success: false, error: 'Unsupported administration action.' }, 400);
    const userId = clean(body.userId);
    const name = clean(body.name);
    const status = clean(body.status).toUpperCase();
    const roles = [...new Set((Array.isArray(body.roles) ? body.roles : []).map(normalizeRole))];
    const events = [...new Set((Array.isArray(body.events) ? body.events : []).map(clean).filter(Boolean))];
    if (!userId) return res.json({ success: false, error: 'Select a user to update.' }, 400);
    if (name.length < 2 || name.length > 100) return res.json({ success: false, error: 'Enter a valid user name.' }, 400);
    if (!['ACTIVE', 'INACTIVE'].includes(status)) return res.json({ success: false, error: 'Select a valid account status.' }, 400);
    if (!roles.length || roles.some((role) => !ALLOWED_ROLES.has(role))) {
      return res.json({ success: false, error: 'One or more selected positions are invalid.' }, 400);
    }

    const target = await databases.getDocument(DATABASE_ID, 'users', userId);
    const targetRoles = (target.roles || []).map(normalizeRole);
    if (targetRoles.includes('ADMIN') && !roles.includes('ADMIN')) {
      const admins = await databases.listDocuments(DATABASE_ID, 'users', [Query.contains('roles', 'ADMIN'), Query.limit(2)]);
      if (admins.total <= 1) return res.json({ success: false, error: 'The final administrator role cannot be removed.' }, 409);
    }
    if (targetRoles.includes('ADMIN') && status === 'INACTIVE') {
      const activeAdmins = await databases.listDocuments(DATABASE_ID, 'users', [
        Query.contains('roles', 'ADMIN'), Query.equal('status', 'ACTIVE'), Query.limit(2),
      ]);
      if (activeAdmins.total <= 1) return res.json({ success: false, error: 'The final active administrator cannot be deactivated.' }, 409);
    }

    if (target.authUserId) {
      if (target.name !== name) await users.updateName(target.authUserId, name);
      await users.updateStatus(target.authUserId, status === 'ACTIVE');
    }
    const updated = await databases.updateDocument(DATABASE_ID, 'users', userId, { name, status, roles, events });
    log(JSON.stringify({ action: 'UPDATE_USER_ACCESS', actorId: actor.$id, targetId: userId, name, status, roles, events }));
    return res.json({
      success: true,
      user: { $id: updated.$id, name: updated.name, status: updated.status, roles: updated.roles || [], events: updated.events || [] },
    });
  } catch (exception) {
    error(exception?.message || String(exception));
    if (exception?.code === 404) return res.json({ success: false, error: 'The selected user no longer exists.' }, 404);
    return res.json({ success: false, error: 'The administration action could not be completed.' }, 500);
  }
};
