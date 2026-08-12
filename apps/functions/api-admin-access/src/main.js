import { Client, Databases, Query, Users } from 'node-appwrite';

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

const clean = (value) => String(value ?? '').trim();
const normalizeRole = (value) => clean(value).toUpperCase().replace(/[ -]+/g, '_');

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
    return res.json({ success: false, error: 'Could not update this user assignment.' }, 500);
  }
};
