import { Client, Databases, Query } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const newPasskey = 'legacy';

async function run() {
  const response = await databases.listDocuments(databaseId, 'users', [Query.limit(500)]);
  const administrators = response.documents.filter((user) =>
    (user.roles || []).map((role) => String(role).toUpperCase()).includes('ADMIN')
  );

  if (administrators.length === 0) throw new Error('No ADMIN user was found.');
  if (administrators.length > 1) throw new Error('Multiple ADMIN users were found; refusing to assign one shared passkey.');

  const administrator = administrators[0];
  await databases.updateDocument(databaseId, 'users', administrator.$id, { passkey: newPasskey });
  console.log(`Administrator passkey updated for ${administrator.name}.`);
}

run().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
