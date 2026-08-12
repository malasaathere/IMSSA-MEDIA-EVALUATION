import { Client, Databases, ID, Query, Users } from 'node-appwrite';
import { randomInt } from 'node:crypto';
import 'dotenv/config';

const databaseId = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const databases = new Databases(client);
const users = new Users(client);

const existingAdmins = await databases.listDocuments(databaseId, 'users', [Query.contains('roles', 'ADMIN'), Query.limit(10)]);
if (existingAdmins.total) {
  console.log(JSON.stringify({ created: false, reason: 'ADMIN_EXISTS', name: existingAdmins.documents[0].name }, null, 2));
  process.exit(0);
}

let passkey;
for (let attempt = 0; attempt < 20; attempt += 1) {
  const candidate = String(randomInt(100000, 1000000));
  const matches = await databases.listDocuments(databaseId, 'users', [Query.equal('passkey', candidate), Query.limit(1)]);
  if (!matches.total) { passkey = candidate; break; }
}
if (!passkey) throw new Error('Could not generate a unique administrator passkey.');

const email = `${passkey}@imssa.local`;
const password = passkey.padEnd(8, '0');
let authUser;
try {
  authUser = await users.create(ID.unique(), email, undefined, password, 'System Administrator');
  await databases.createDocument(databaseId, 'users', ID.unique(), {
    authUserId: authUser.$id,
    name: 'System Administrator',
    email,
    passkey,
    roles: ['ADMIN'],
  });
} catch (error) {
  if (authUser?.$id) {
    try { await users.delete(authUser.$id); } catch { /* preserve original failure */ }
  }
  throw error;
}

console.log(JSON.stringify({ created: true, name: 'System Administrator', passkey, portal: '/login → System access' }, null, 2));
