import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const databaseId = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const databases = new Databases(client);
const collectionId = 'system_feedback';

async function ignoreConflict(promise) { try { await promise; } catch (error) { if (error.code !== 409) throw error; } }
async function run() {
  try { await databases.getCollection(databaseId, collectionId); }
  catch (error) { if (error.code === 404) await databases.createCollection(databaseId, collectionId, 'System Feedback'); else throw error; }
  await ignoreConflict(databases.createStringAttribute(databaseId, collectionId, 'reporterId', 64, true));
  await ignoreConflict(databases.createStringAttribute(databaseId, collectionId, 'reporterName', 120, true));
  await ignoreConflict(databases.createStringAttribute(databaseId, collectionId, 'role', 255, true));
  await ignoreConflict(databases.createStringAttribute(databaseId, collectionId, 'feature', 100, true));
  await ignoreConflict(databases.createIntegerAttribute(databaseId, collectionId, 'rating', true, 1, 5));
  await ignoreConflict(databases.createStringAttribute(databaseId, collectionId, 'severity', 20, true));
  await ignoreConflict(databases.createStringAttribute(databaseId, collectionId, 'status', 20, true));
  await ignoreConflict(databases.createStringAttribute(databaseId, collectionId, 'comment', 3000, true));
  console.log(JSON.stringify({ success: true, collectionId }));
}
run().catch((error) => { console.error(error.message || error); process.exitCode = 1; });
