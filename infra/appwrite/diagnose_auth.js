import { Client, Databases, Query, Users } from 'node-appwrite';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
if (!endpoint || !projectId || !process.env.APPWRITE_API_KEY) throw new Error('Missing Appwrite configuration.');

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(process.env.APPWRITE_API_KEY);
const databases = new Databases(client);
const users = new Users(client);

const database = await databases.get(databaseId);
const collection = await databases.getCollection(databaseId, 'users');
const [profileResult, authResult] = await Promise.all([
  databases.listDocuments(databaseId, 'users', [Query.limit(500)]),
  users.list([Query.limit(500)]),
]);

const authById = new Map(authResult.users.map((user) => [user.$id, user]));
const authByEmail = new Map(authResult.users.map((user) => [String(user.email || '').toLowerCase(), user]));
const passkeyCounts = new Map();
let missingPasskeys = 0;
let invalidPasskeys = 0;
let missingAuthLinks = 0;
let staleAuthLinks = 0;
let emailMismatches = 0;

for (const profile of profileResult.documents) {
  const passkey = String(profile.passkey || '').trim().toLowerCase();
  if (!passkey) missingPasskeys += 1;
  else {
    passkeyCounts.set(passkey, (passkeyCounts.get(passkey) || 0) + 1);
    if (!/^[a-z0-9_-]{4,20}$/.test(passkey)) invalidPasskeys += 1;
  }
  const expectedEmail = passkey ? `${passkey}@imssa.local` : '';
  const linked = profile.authUserId ? authById.get(profile.authUserId) : null;
  if (!profile.authUserId) missingAuthLinks += 1;
  else if (!linked) staleAuthLinks += 1;
  if (expectedEmail && !authByEmail.has(expectedEmail)) emailMismatches += 1;
}

const duplicatePasskeys = [...passkeyCounts.values()].filter((count) => count > 1).length;
const publicRead = (collection.$permissions || []).some((permission) => permission === 'read("any")');
const userRead = (collection.$permissions || []).some((permission) => permission.includes('read("users'));
const passkeyDocumentPath = path.resolve(process.cwd(), '../../generated_passkeys.md');
let localPasskeyDocument = { found: false, entries: 0, matched: 0, mismatchedNames: [] };
if (fs.existsSync(passkeyDocumentPath)) {
  const rows = [...fs.readFileSync(passkeyDocumentPath, 'utf8').matchAll(/\*\*(.+?)\*\*\s*\|\s*Passkey:\s*`([^`]+)`/g)];
  const profilesByName = new Map(profileResult.documents.map((profile) => [String(profile.name || '').trim().toLowerCase(), profile]));
  const mismatchedNames = [];
  let matched = 0;
  for (const [, name, passkey] of rows) {
    const profile = profilesByName.get(name.trim().toLowerCase());
    if (profile && String(profile.passkey || '').trim().toLowerCase() === passkey.trim().toLowerCase()) matched += 1;
    else mismatchedNames.push(name.trim());
  }
  localPasskeyDocument = { found: true, entries: rows.length, matched, mismatchedNames };
}

const origin = process.env.LOGIN_TEST_ORIGIN || 'http://localhost:3000';
const publicResponse = await fetch(`${endpoint}/databases/${encodeURIComponent(databaseId)}/collections/users/documents`, {
  headers: { 'x-appwrite-project': projectId, origin },
});
let publicPayload = {};
try { publicPayload = await publicResponse.json(); } catch { /* status is reported below */ }
const browserPath = {
  origin,
  publicUserQueryStatus: publicResponse.status,
  allowedOrigin: publicResponse.headers.get('access-control-allow-origin') || null,
  publicUserQueryError: publicResponse.ok ? null : publicPayload.message || 'Unknown request error',
};

if (process.env.AUTH_CHECK === '1') {
  const authChecks = [];
  for (const profile of profileResult.documents) {
    const passkey = String(profile.passkey || '').trim().toLowerCase();
    const response = await fetch(`${endpoint}/account/sessions/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-appwrite-project': projectId, origin },
      body: JSON.stringify({ email: `${passkey}@imssa.local`, password: passkey.padEnd(8, '0') }),
    });
    let payload = {};
    try { payload = await response.json(); } catch { /* status is enough */ }
    authChecks.push({ name: profile.name, ok: response.ok, status: response.status, reason: response.ok ? null : payload.message || 'Unknown login error' });
    const cookie = response.headers.get('set-cookie')?.split(';')[0];
    if (response.ok && cookie) {
      await fetch(`${endpoint}/account/sessions/current`, {
        method: 'DELETE',
        headers: { 'x-appwrite-project': projectId, origin, cookie },
      });
    }
  }
  browserPath.passkeyLoginChecks = {
    tested: authChecks.length,
    passed: authChecks.filter((check) => check.ok).length,
    failures: authChecks.filter((check) => !check.ok),
  };
}

console.log(JSON.stringify({
  connection: 'ok',
  endpointHost: new URL(endpoint).host,
  projectIdMatchesWeb: projectId === '6a5d22360034431fb3fd',
  database: { id: database.$id, name: database.name },
  usersCollection: {
    profiles: profileResult.total,
    authAccounts: authResult.total,
    publicRead,
    signedInUserRead: userRead,
    documentSecurity: collection.documentSecurity,
  },
  browserPath,
  integrity: {
    missingPasskeys,
    invalidPasskeys,
    duplicatePasskeys,
    missingAuthLinks,
    staleAuthLinks,
    profilesWithoutMatchingSyntheticAuthEmail: emailMismatches,
  },
  localPasskeyDocument,
}, null, 2));
