import { Client, Databases, Storage } from 'node-appwrite';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'imssa-media-staging')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = 'imssa_media';

async function setup() {
  console.log('Setting up Appwrite schema (Education Add-on version)...');
  
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

  // Define required collections exactly as per the spec
  const collections = [
    { id: 'profiles', name: 'Profiles' },
    { id: 'roles', name: 'Roles' },
    { id: 'user_roles', name: 'User Roles' },
    { id: 'notification_preferences', name: 'Notification Preferences' },
    { id: 'events', name: 'Events' },
    { id: 'event_memberships', name: 'Event Memberships' },
    { id: 'tasks', name: 'Tasks' },
    { id: 'task_assignments', name: 'Task Assignments' },
    { id: 'task_watchers', name: 'Task Watchers' },
    { id: 'task_status_history', name: 'Task Status History' },
    { id: 'files', name: 'Files' },
    { id: 'deliverable_versions', name: 'Deliverable Versions' },
    { id: 'reviews', name: 'Reviews' },
    { id: 'annotations', name: 'Annotations' },
    { id: 'annotation_replies', name: 'Annotation Replies' },
    { id: 'approval_feedback', name: 'Approval Feedback' },
    { id: 'approval_feedback_history', name: 'Approval Feedback History' },
    { id: 'task_messages', name: 'Task Messages' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'outbox_events', name: 'Outbox Events' },
    { id: 'webhook_deliveries', name: 'Webhook Deliveries' },
    { id: 'audit_logs', name: 'Audit Logs' },
    { id: 'marketing_plan_integrations', name: 'Marketing Plan Integrations' },
    { id: 'tab_mappings', name: 'Tab Mappings' },
    { id: 'marketing_plan_items', name: 'Marketing Plan Items' },
    { id: 'sheet_rows', name: 'Sheet Rows' },
    { id: 'imports', name: 'Imports' },
    { id: 'ai_precheck_runs', name: 'AI Precheck Runs' },
    { id: 'ai_precheck_findings', name: 'AI Precheck Findings' },
    { id: 'ai_precheck_feedback', name: 'AI Precheck Feedback' },
    
    // Kept from previous setup for backward compatibility / login flows
    { id: 'users', name: 'Users (Legacy/Auth)' },
    { id: 'user_requests', name: 'User Requests' },
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

  // Basic attributes for new core collections (we will add fields iteratively if needed)
  // Profiles
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'profiles', 'authUserId', 50, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'profiles', 'name', 255, true));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'profiles', 'email', 255, true));

  // Users (Legacy/Auth)
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'users', 'passkey', 50, false));
  await ignoreConflict(databases.createStringAttribute(DB_ID, 'users', 'email', 255, false));
  
  // Storage Buckets
  console.log('Setting up Storage Buckets...');
  const buckets = [
    { id: 'avatars', name: 'avatars' },
    { id: 'task-references', name: 'task-references' },
    { id: 'draft-images', name: 'draft-images' },
    { id: 'draft-videos', name: 'draft-videos' },
    { id: 'approved-deliverables', name: 'approved-deliverables' },
    { id: 'review-previews', name: 'review-previews' },
    { id: 'temporary-ai-assets', name: 'temporary-ai-assets' },
    { id: 'report-exports', name: 'report-exports' },
  ];

  for (const b of buckets) {
    try {
      await storage.getBucket(b.id);
      console.log(`Bucket ${b.id} already exists.`);
    } catch (err) {
      if (err.code === 404) {
        // By default buckets are created with file security enabled and no global read permissions.
        await storage.createBucket(b.id, b.name, [], false, true);
        console.log(`Bucket ${b.id} created.`);
      } else {
        console.error(`Error checking bucket ${b.id}:`, err);
      }
    }
  }

  console.log('Setup script finished successfully.');
}

setup().catch(console.error);
