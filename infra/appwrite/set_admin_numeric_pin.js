import { Client, Databases, Query, Users } from 'node-appwrite';
import { randomInt } from 'node:crypto';
import 'dotenv/config';

const databaseId = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const databases = new Databases(client);
const users = new Users(client);

const result = await databases.listDocuments(databaseId, 'users', [Query.contains('roles', 'ADMIN'), Query.limit(2)]);
if (result.total !== 1) throw new Error(`Expected exactly one administrator, found ${result.total}.`);
const administrator = result.documents[0];
if (!administrator.authUserId) throw new Error('Administrator has no linked Appwrite Auth account.');

let pin;
for (let attempt = 0; attempt < 30; attempt += 1) {
  const candidate = String(randomInt(1000, 10000));
  const matches = await databases.listDocuments(databaseId, 'users', [Query.equal('passkey', candidate), Query.limit(1)]);
  if (!matches.total) { pin = candidate; break; }
}
if (!pin) throw new Error('Could not generate a unique four-digit administrator PIN.');

const oldPasskey = String(administrator.passkey || '');
const oldEmail = String(administrator.email || `${oldPasskey}@imssa.local`);
const newEmail = `${pin}@imssa.local`;

try {
  await users.updateEmail(administrator.authUserId, newEmail);
  await users.updatePassword(administrator.authUserId, pin.padEnd(8, '0'));
  await databases.updateDocument(databaseId, 'users', administrator.$id, { passkey: pin, email: newEmail });
} catch (error) {
  try {
    await users.updateEmail(administrator.authUserId, oldEmail);
    if (oldPasskey) await users.updatePassword(administrator.authUserId, oldPasskey.padEnd(8, '0'));
    await databases.updateDocument(databaseId, 'users', administrator.$id, { passkey: oldPasskey, email: oldEmail });
  } catch { /* preserve the original update failure */ }
  throw error;
}

console.log(JSON.stringify({ updated: true, name: administrator.name, pin, digits: 4 }, null, 2));
