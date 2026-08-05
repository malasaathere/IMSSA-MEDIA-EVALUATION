import { Client, Databases, Permission, Role, Storage } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'imssa-media';

async function ignoreConflict(action) {
  try {
    await action;
  } catch (error) {
    if (error.code !== 409) throw error;
  }
}

async function waitForAttributes(collectionId) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = await databases.listAttributes(databaseId, collectionId);
    if (result.attributes.every(attribute => attribute.status === 'available')) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${collectionId} attributes.`);
}

async function run() {
  await databases.updateCollection(
    databaseId,
    'notifications',
    'Notifications',
    [Permission.create(Role.users())],
    true,
    true,
  );

  await ignoreConflict(databases.createStringAttribute(databaseId, 'notifications', 'recipientId', 64, true));
  await ignoreConflict(databases.createStringAttribute(databaseId, 'notifications', 'type', 64, true));
  await ignoreConflict(databases.createStringAttribute(databaseId, 'notifications', 'title', 255, true));
  await ignoreConflict(databases.createStringAttribute(databaseId, 'notifications', 'message', 1000, true));
  await ignoreConflict(databases.createStringAttribute(databaseId, 'notifications', 'taskId', 64, true));
  await ignoreConflict(databases.createStringAttribute(databaseId, 'notifications', 'versionId', 64, false));
  await ignoreConflict(databases.createStringAttribute(databaseId, 'notifications', 'createdById', 64, true));
  await ignoreConflict(databases.createBooleanAttribute(databaseId, 'notifications', 'isRead', false, false));
  await waitForAttributes('notifications');
  await ignoreConflict(databases.createIndex(databaseId, 'notifications', 'recipient_created', 'key', ['recipientId', '$createdAt'], ['ASC', 'DESC']));

  await databases.updateCollection(
    databaseId,
    'deliverable_versions',
    'Deliverable Versions',
    [Permission.read(Role.users()), Permission.create(Role.users()), Permission.update(Role.users())],
    true,
    true,
  );

  for (const bucketId of ['draft-images', 'draft-videos']) {
    const bucket = await storage.getBucket(bucketId);
    await storage.updateBucket(
      bucketId,
      bucket.name,
      [Permission.create(Role.users())],
      true,
      true,
      bucket.maximumFileSize,
      bucket.allowedFileExtensions,
      bucket.compression,
      bucket.encryption,
      bucket.antivirus,
    );
  }

  console.log('Review submission and notification schema is ready.');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
