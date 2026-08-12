import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Client, Databases, Query } from 'node-appwrite';
import * as dotenv from 'dotenv';

dotenv.config({ path: fileURLToPath(new URL('.env', import.meta.url)) });

const DB_ID = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const databases = new Databases(client);

const roleDefinitions = [
  ['ADMIN', 'Administrator'],
  ['CHIEF_COORDINATOR', 'Chief Coordinator'],
  ['MARKETING_COORDINATOR', 'Marketing Coordinator'],
  ['DESIGNER', 'Designer'],
  ['VIDEO_EDITOR', 'Video Editor'],
  ['MEDIA_DIRECTOR', 'Media Director'],
];

const eventDefinitions = [
  { id: 'hackx_2026', name: 'HackX 11.0', slug: 'hackx-11-0', color: '#2563EB' },
  { id: 'hackx_jr_2026', name: 'HackX Jr 9.0', slug: 'hackx-jr-9-0', color: '#7C3AED' },
  { id: 'exposition_2026', name: 'Exposition 2026', slug: 'exposition-2026', color: '#059669' },
];

function stableId(...parts) {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);
}

async function ignoreConflict(operation) {
  try {
    return await operation;
  } catch (error) {
    if (error.code !== 409) throw error;
    return null;
  }
}

async function waitForAttributes(collectionId, expectedKeys) {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const response = await databases.listAttributes(DB_ID, collectionId, [Query.limit(100)]);
    const available = new Set(
      response.attributes.filter((attribute) => attribute.status === 'available').map((attribute) => attribute.key),
    );
    if (expectedKeys.every((key) => available.has(key))) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${collectionId} attributes.`);
}

async function ensureSchema() {
  const definitions = {
    event_memberships: [
      ['string', 'eventId', 50, true],
      ['string', 'userId', 50, true],
      ['string', 'membershipRole', 50, false],
    ],
    task_assignments: [
      ['datetime', 'assignedAt', null, true],
    ],
    task_status_history: [
      ['string', 'taskId', 50, true],
      ['string', 'fromStatus', 50, true],
      ['string', 'toStatus', 50, true],
      ['string', 'changedById', 50, true],
      ['datetime', 'changedAt', null, true],
    ],
    notification_preferences: [
      ['string', 'userId', 50, true],
      ['boolean', 'inAppEnabled', null, false, true],
      ['boolean', 'emailEnabled', null, false, false],
      ['boolean', 'deadlineReminders', null, false, true],
    ],
  };

  for (const [collectionId, attributes] of Object.entries(definitions)) {
    const existing = await databases.listAttributes(DB_ID, collectionId, [Query.limit(100)]);
    const existingKeys = new Set(existing.attributes.map((attribute) => attribute.key));
    for (const [type, key, size, required, defaultValue] of attributes) {
      if (existingKeys.has(key)) continue;
      if (type === 'string') {
        await ignoreConflict(databases.createStringAttribute(DB_ID, collectionId, key, size, required));
      } else if (type === 'datetime') {
        await ignoreConflict(databases.createDatetimeAttribute(DB_ID, collectionId, key, required));
      } else if (type === 'boolean') {
        await ignoreConflict(databases.createBooleanAttribute(DB_ID, collectionId, key, required, defaultValue));
      }
    }
    await waitForAttributes(collectionId, attributes.map((attribute) => attribute[1]));
  }
}

async function upsert(collectionId, documentId, data) {
  try {
    await databases.getDocument(DB_ID, collectionId, documentId);
    await databases.updateDocument(DB_ID, collectionId, documentId, data);
    return 'updated';
  } catch (error) {
    if (error.code !== 404) throw error;
    await databases.createDocument(DB_ID, collectionId, documentId, data);
    return 'created';
  }
}

async function run() {
  if (DB_ID !== 'imssa-media') {
    throw new Error(`Refusing to backfill unexpected database ${DB_ID}; expected imssa-media.`);
  }

  await ensureSchema();

  const users = (await databases.listDocuments(DB_ID, 'users', [Query.limit(100)])).documents;
  const tasks = (await databases.listDocuments(DB_ID, 'tasks', [Query.limit(100)])).documents;
  const marketingItems = (await databases.listDocuments(DB_ID, 'marketing_plan_items', [Query.limit(500)])).documents;
  const usersByName = new Map(users.map((user) => [String(user.name).trim().toLowerCase(), user]));
  const summary = {};
  const count = (key, action) => { summary[`${key}_${action}`] = (summary[`${key}_${action}`] || 0) + 1; };

  for (const [code, displayName] of roleDefinitions) {
    count('roles', await upsert('roles', code.toLowerCase(), { code, displayName }));
  }

  for (const user of users) {
    for (const roleCode of user.roles || []) {
      const roleId = roleCode.toLowerCase();
      count('user_roles', await upsert('user_roles', stableId(user.authUserId, roleId), {
        userId: user.authUserId,
        roleId,
      }));
    }
    count('notification_preferences', await upsert('notification_preferences', stableId('prefs', user.authUserId), {
      userId: user.authUserId,
      inAppEnabled: true,
      emailEnabled: false,
      deadlineReminders: true,
    }));
  }

  for (const event of eventDefinitions) {
    count('events', await upsert('events', event.id, {
      name: event.name,
      slug: event.slug,
      description: `Media production and publishing work for ${event.name}.`,
      color: event.color,
    }));
  }

  const campaignToEvent = new Map([
    ['hackx 11.0', 'hackx_2026'],
    ['hackx jr 9.0', 'hackx_jr_2026'],
    ['exposition 2026', 'exposition_2026'],
  ]);
  const memberships = new Map();
  for (const item of marketingItems) {
    const eventId = campaignToEvent.get(String(item.campaign || '').trim().toLowerCase());
    if (!eventId) continue;
    for (const field of ['designer', 'contentWriter']) {
      const name = String(item[field] || '').trim().toLowerCase();
      const user = usersByName.get(name);
      if (!user) continue;
      memberships.set(`${eventId}|${user.authUserId}`, { eventId, userId: user.authUserId });
    }
  }
  for (const membership of memberships.values()) {
    count('event_memberships', await upsert(
      'event_memberships',
      stableId(membership.eventId, membership.userId),
      { ...membership, membershipRole: 'CONTRIBUTOR' },
    ));
  }

  for (const task of tasks) {
    let eventId = task.eventId;
    if (/exposition/i.test(task.title) && task.eventId !== 'exposition_2026') {
      eventId = 'exposition_2026';
      await databases.updateDocument(DB_ID, 'tasks', task.$id, { eventId });
      count('tasks', 'corrected');
    }
    if (task.currentAssigneeId) {
      count('task_assignments', await upsert('task_assignments', stableId('assignment', task.$id), {
        taskId: task.$id,
        assigneeId: task.currentAssigneeId,
        assignedById: task.createdById,
        assignedAt: task.$createdAt,
        reason: 'Backfilled from the task current assignee.',
      }));
      count('event_memberships', await upsert(
        'event_memberships',
        stableId(eventId, task.currentAssigneeId),
        { eventId, userId: task.currentAssigneeId, membershipRole: 'CONTRIBUTOR' },
      ));
    }
    count('task_status_history', await upsert('task_status_history', stableId('status', task.$id), {
      taskId: task.$id,
      fromStatus: 'DRAFT',
      toStatus: task.status,
      changedById: task.createdById,
      changedAt: task.$createdAt,
    }));
  }

  console.log(JSON.stringify({ databaseId: DB_ID, users: users.length, tasks: tasks.length, marketingItems: marketingItems.length, summary }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
