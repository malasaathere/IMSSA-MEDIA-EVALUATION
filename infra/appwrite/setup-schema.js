import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'imssa-media-staging')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

const DB_ID = 'imssa-media';

async function setup() {
  console.log('Setting up Appwrite schema...');
  
  try {
    await databases.get(DB_ID);
    console.log('Database already exists.');
  } catch (err) {
    if (err.code === 404) {
      await databases.create(DB_ID, 'IMSSA Media Platform');
      console.log('Database created.');
    } else {
      throw err;
    }
  }

  const collections = [
    { id: 'users', name: 'Users' },
    { id: 'roles', name: 'Roles' },
    { id: 'user_roles', name: 'User Roles' },
    { id: 'user_skills', name: 'User Skills' },
    { id: 'push_subscriptions', name: 'Push Subscriptions' },
    { id: 'events', name: 'Events' },
    { id: 'tasks', name: 'Tasks' },
    { id: 'task_assignments', name: 'Task Assignments' },
    { id: 'task_watchers', name: 'Task Watchers' },
    { id: 'task_references', name: 'Task References' },
    { id: 'task_status_history', name: 'Task Status History' },
    { id: 'file_objects', name: 'File Objects' },
    { id: 'deliverable_versions', name: 'Deliverable Versions' },
    { id: 'reviews', name: 'Reviews' },
    { id: 'approval_feedback', name: 'Approval Feedback' },
    { id: 'annotations', name: 'Annotations' },
    { id: 'annotation_replies', name: 'Annotation Replies' },
    { id: 'task_messages', name: 'Task Messages' },
    { id: 'calendar_links', name: 'Calendar Links' },
  ];

  for (const coll of collections) {
    try {
      await databases.getCollection(DB_ID, coll.id);
      console.log(`Collection ${coll.name} already exists.`);
    } catch (err) {
      if (err.code === 404) {
        await databases.createCollection(DB_ID, coll.id, coll.name);
        console.log(`Collection ${coll.name} created.`);
      } else {
        console.error(`Error checking collection ${coll.id}:`, err);
      }
    }
  }

  const ignoreConflict = async (promise) => {
    try {
      await promise;
    } catch (err) {
      if (err.code !== 409) throw err;
    }
  };

  console.log('Setting up attributes...');

  // Users
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'users', 'authUserId', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'users', 'name', 255, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'users', 'email', 255, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'users', 'timezone', 50, false, 'Asia/Colombo'));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'users', 'status', 20, false, 'ACTIVE'));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'users', 'avatarUrl', 1000, false));

  // Roles
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'roles', 'code', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'roles', 'displayName', 255, true));

  // User Roles
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'user_roles', 'userId', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'user_roles', 'roleId', 50, true));

  // Events
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'events', 'name', 255, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'events', 'slug', 255, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'events', 'description', 5000, false));
  await ignoreConflict(databases.createDatetimeAttribute(DB_ID, 'events', 'startsAt', false));
  await ignoreConflict(databases.createDatetimeAttribute(DB_ID, 'events', 'endsAt', false));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'events', 'color', 20, false));
  await ignoreConflict(databases.createDatetimeAttribute(DB_ID, 'events', 'archivedAt', false));

  // Tasks
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'tasks', 'eventId', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'tasks', 'title', 255, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'tasks', 'description', 5000, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'tasks', 'workType', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'tasks', 'priority', 20, false, 'NORMAL'));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'tasks', 'status', 50, false, 'DRAFT'));
  await ignoreConflict(databases.createDatetimeAttribute(DB_ID, 'tasks', 'deadline', true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'tasks', 'createdById', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'tasks', 'currentAssigneeId', 50, false));
  await ignoreConflict(databases.createIntegerAttribute(DB_ID, 'tasks', 'revisionRound', false, 0, 1000, 0));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'tasks', 'approvedVersionId', 50, false));
  await ignoreConflict(databases.createDatetimeAttribute(DB_ID, 'tasks', 'completedAt', false));

  // Task Assignments
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'task_assignments', 'taskId', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'task_assignments', 'assigneeId', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'task_assignments', 'assignedById', 50, true));
  await ignoreConflict(databases.createDatetimeAttribute(DB_ID, 'task_assignments', 'unassignedAt', false));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'task_assignments', 'reason', 1000, false));

  // Deliverable Versions
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'deliverable_versions', 'taskId', 50, true));
  await ignoreConflict(databases.createIntegerAttribute(DB_ID, 'deliverable_versions', 'versionNumber', true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'deliverable_versions', 'fileId', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'deliverable_versions', 'note', 5000, false));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'deliverable_versions', 'submittedById', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'deliverable_versions', 'status', 50, false, 'PENDING'));

  // Reviews
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'reviews', 'taskId', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'reviews', 'versionId', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'reviews', 'reviewerId', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'reviews', 'decision', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'reviews', 'comment', 5000, false));

  // Annotations
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'annotations', 'versionId', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'annotations', 'authorId', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'annotations', 'type', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'annotations', 'geometryJson', 10000, false));
  await ignoreConflict(databases.createIntegerAttribute(DB_ID, 'annotations', 'pageNumber', false));
  await ignoreConflict(databases.createIntegerAttribute(DB_ID, 'annotations', 'videoTimeMs', false));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'annotations', 'text', 5000, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'annotations', 'status', 20, false, 'OPEN'));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'annotations', 'resolvedById', 50, false));
  await ignoreConflict(databases.createDatetimeAttribute(DB_ID, 'annotations', 'resolvedAt', false));

  console.log('Setup script finished successfully.');
}

setup().catch(console.error);
