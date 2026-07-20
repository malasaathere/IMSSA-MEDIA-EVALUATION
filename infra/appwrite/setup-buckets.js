import { Client, Storage } from 'node-appwrite';
import * as dotenv from 'dotenv';
dotenv.config();

console.log("Endpoint: ", process.env.APPWRITE_ENDPOINT);
console.log("Project: ", process.env.APPWRITE_PROJECT_ID);

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'imssa-media-staging')
  .setKey(process.env.APPWRITE_API_KEY || '');

const storage = new Storage(client);

const buckets = [
  { id: 'avatars', name: 'Avatars' },
  { id: 'task-references', name: 'Task References' },
  { id: 'draft-images', name: 'Draft Images' },
  { id: 'draft-videos', name: 'Draft Videos' },
  { id: 'approved-deliverables', name: 'Approved Deliverables' },
  { id: 'review-previews', name: 'Review Previews' },
  { id: 'temporary-ai-assets', name: 'Temporary AI Assets' },
  { id: 'report-exports', name: 'Report Exports' },
];

async function setupBuckets() {
  console.log('Setting up Appwrite storage buckets...');
  
  for (const bucket of buckets) {
    try {
      await storage.getBucket(bucket.id);
      console.log(`Bucket ${bucket.name} already exists.`);
    } catch (err) {
      if (err.code === 404) {
        // Create the bucket
        await storage.createBucket(
          bucket.id, 
          bucket.name, 
          [], // Permissions will be handled via server/functions or specific role settings
          false, // fileSecurity
          true, // enabled
          50000000 // 50MB for general, adjust per bucket if needed
        );
        console.log(`Bucket ${bucket.name} created.`);
      } else {
        console.error(`Error checking bucket ${bucket.id}:`, err);
      }
    }
  }

  console.log('Setup buckets script finished successfully.');
}

setupBuckets().catch(console.error);
