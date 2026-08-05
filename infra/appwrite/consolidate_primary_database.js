import { Client, Databases, Permission, Query, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const sourceDatabaseId = 'imssa_media';
const primaryDatabaseId = 'imssa-media';
const userPermissions = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

const marketingPlanFields = [
  ['campaign', 255],
  ['title', 500],
  ['description', 2000],
  ['type', 255],
  ['designer', 255],
  ['designStatus', 100],
  ['contentWriter', 255],
  ['captionStatus', 100],
  ['finalStatus', 100],
  ['handoverStatus', 100],
  ['handoverDate', 100],
  ['finishedBefore', 100],
  ['dateToShare', 100],
  ['dateShared', 100],
  ['platform', 500],
];

async function ignoreConflict(action) {
  try {
    return await action;
  } catch (error) {
    if (error.code !== 409) throw error;
    return null;
  }
}

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

async function waitForAttributes(collectionId) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await databases.listAttributes(primaryDatabaseId, collectionId);
    if (response.attributes.every(attribute => attribute.status === 'available')) return;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${collectionId} attributes.`);
}

async function ensureSchema() {
  await databases.updateCollection(primaryDatabaseId, 'marketing_plan_items', 'Marketing Plan Items', userPermissions);
  for (const [key, size] of marketingPlanFields) {
    await ignoreConflict(databases.createStringAttribute(primaryDatabaseId, 'marketing_plan_items', key, size, false));
  }

  await ignoreConflict(databases.createCollection(primaryDatabaseId, 'designer_packs', 'Designer Packs', userPermissions));
  await ignoreConflict(databases.createStringAttribute(primaryDatabaseId, 'designer_packs', 'text', 1000, true));

  await Promise.all([
    waitForAttributes('marketing_plan_items'),
    waitForAttributes('designer_packs'),
  ]);
}

async function copyCollection(collectionId, fields) {
  const sourceDocuments = await listAll(sourceDatabaseId, collectionId);
  let copied = 0;
  let existing = 0;

  for (const document of sourceDocuments) {
    const data = Object.fromEntries(fields.map(field => [field, document[field] ?? '']));
    const result = await ignoreConflict(
      databases.createDocument(primaryDatabaseId, collectionId, document.$id, data),
    );
    if (result) copied += 1;
    else existing += 1;
  }
  return { copied, existing, total: sourceDocuments.length };
}

async function run() {
  await ensureSchema();
  const marketingPlans = await copyCollection('marketing_plan_items', marketingPlanFields.map(([key]) => key));
  const designerPacks = await copyCollection('designer_packs', ['text']);
  console.log(JSON.stringify({ marketingPlans, designerPacks }, null, 2));
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
