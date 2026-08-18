import { Client, Databases, ID, Query } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const COLLECTION_ID = 'system_feedback';
const FEATURES = new Set(['Authentication & roles', 'Dashboard', 'Marketing plan', 'Google Sheets sync', 'Designer uploads', 'Review inbox', 'Calendar', 'Analytics', 'Administration', 'AI assistant', 'Team chat', 'Theme & mobile experience', 'Other']);
const clean = (value) => String(value ?? '').trim();
const normalizeRole = (value) => clean(value).toUpperCase().replace(/[ -]+/g, '_');

function bodyOf(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.bodyText || req.bodyRaw || req.payload || '{}'); } catch { return {}; }
}

function callerId(req) {
  const headers = req.headers || {};
  return headers['x-appwrite-user-id'] || headers['X-Appwrite-User-Id'] || '';
}

export default async ({ req, res, log, error }) => {
  if (clean(req.method || 'POST').toUpperCase() !== 'POST') return res.json({ success: false, error: 'Method not allowed.' }, 405);
  const authUserId = callerId(req);
  if (!authUserId) return res.json({ success: false, error: 'Please sign in to submit a system review.' }, 401);

  const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY);
  const databases = new Databases(client);

  try {
    const profiles = await databases.listDocuments(DATABASE_ID, 'users', [Query.equal('authUserId', authUserId), Query.limit(1)]);
    const profile = profiles.documents[0];
    if (!profile) return res.json({ success: false, error: 'Your workspace profile could not be found.' }, 403);
    const body = bodyOf(req);
    const action = clean(body.action || 'SUBMIT').toUpperCase();
    const roles = (profile.roles || []).map(normalizeRole);

    if (action === 'LIST') {
      if (!roles.includes('ADMIN')) return res.json({ success: false, error: 'Administrator access is required.' }, 403);
      const feedback = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.orderDesc('$createdAt'), Query.limit(100)]);
      return res.json({ success: true, feedback: feedback.documents });
    }

    const feature = clean(body.feature);
    const comment = clean(body.comment);
    const rating = Number(body.rating);
    const severity = clean(body.severity || 'Suggestion');
    if (!FEATURES.has(feature)) return res.json({ success: false, error: 'Select a valid feature area.' }, 400);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.json({ success: false, error: 'Choose a rating from 1 to 5.' }, 400);
    if (!['Blocker', 'Problem', 'Suggestion', 'Working well'].includes(severity)) return res.json({ success: false, error: 'Select a valid review type.' }, 400);
    if (comment.length < 8 || comment.length > 3000) return res.json({ success: false, error: 'Write between 8 and 3,000 characters.' }, 400);

    const feedback = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      reporterId: profile.$id,
      reporterName: clean(profile.name).slice(0, 120),
      role: roles.join(', ') || 'TEAM_MEMBER',
      feature,
      rating,
      severity,
      status: 'OPEN',
      comment,
    });
    log(JSON.stringify({ action: 'SUBMIT', feedbackId: feedback.$id, reporterId: profile.$id, feature, severity }));
    return res.json({ success: true, feedback: { $id: feedback.$id, feature, rating, severity } }, 201);
  } catch (exception) {
    error(exception?.message || String(exception));
    return res.json({ success: false, error: 'The system review could not be saved.' }, 500);
  }
};
