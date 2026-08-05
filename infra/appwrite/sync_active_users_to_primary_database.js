import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const sourceDatabaseId = 'imssa_media';
const primaryDatabaseId = 'imssa-media';

async function listAll(databaseId, collectionId) {
  const documents = [];
  let offset = 0;
  while (true) {
    const page = await databases.listDocuments(databaseId, collectionId, [Query.limit(100), Query.offset(offset)]);
    documents.push(...page.documents);
    if (documents.length >= page.total) return documents;
    offset += page.documents.length;
  }
}

async function run() {
  const [activeUsers, primaryUsers, tasks] = await Promise.all([
    listAll(sourceDatabaseId, 'users'),
    listAll(primaryDatabaseId, 'users'),
    listAll(primaryDatabaseId, 'tasks'),
  ]);

  const activeByName = new Map(activeUsers.map(user => [String(user.name).trim().toLowerCase(), user]));
  const idMap = new Map();
  let usersUpdated = 0;

  for (const primaryUser of primaryUsers) {
    const activeUser = activeByName.get(String(primaryUser.name).trim().toLowerCase());
    if (!activeUser) continue;

    if (primaryUser.authUserId && activeUser.authUserId) {
      idMap.set(primaryUser.authUserId, activeUser.authUserId);
    }

    await databases.updateDocument(primaryDatabaseId, 'users', primaryUser.$id, {
      authUserId: activeUser.authUserId,
      email: activeUser.email,
      passkey: activeUser.passkey,
      roles: activeUser.roles || primaryUser.roles || [],
    });
    usersUpdated += 1;
  }

  let tasksUpdated = 0;
  for (const task of tasks) {
    const updates = {};
    if (task.currentAssigneeId && idMap.has(task.currentAssigneeId)) {
      updates.currentAssigneeId = idMap.get(task.currentAssigneeId);
    }
    if (task.createdById && idMap.has(task.createdById)) {
      updates.createdById = idMap.get(task.createdById);
    }
    if (Object.keys(updates).length > 0) {
      await databases.updateDocument(primaryDatabaseId, 'tasks', task.$id, updates);
      tasksUpdated += 1;
    }
  }

  console.log(`Synchronized ${usersUpdated} users and remapped ${tasksUpdated} tasks.`);
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
