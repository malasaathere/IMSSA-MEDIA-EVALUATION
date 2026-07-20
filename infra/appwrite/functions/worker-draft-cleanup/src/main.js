import { Client, Storage } from 'node-appwrite';

// Appwrite Function: worker-draft-cleanup
export default async ({ req, res, log, error }) => {
  log("Starting draft cleanup job...");

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const storage = new Storage(client);
  const bucketsToClean = ['draft-images', 'draft-videos'];
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const now = new Date();

  let totalDeleted = 0;

  try {
    for (const bucketId of bucketsToClean) {
      log(`Checking bucket: ${bucketId}`);
      
      // Get all files (might need pagination in production if there are >25 files)
      const fileList = await storage.listFiles(bucketId);
      
      for (const file of fileList.files) {
        const fileDate = new Date(file.$createdAt);
        const ageInMs = now.getTime() - fileDate.getTime();
        
        if (ageInMs > SEVEN_DAYS_MS) {
          log(`File ${file.$id} is older than 7 days. Deleting...`);
          await storage.deleteFile(bucketId, file.$id);
          totalDeleted++;
        }
      }
    }

    return res.json({ 
      success: true, 
      message: "Cleanup complete",
      filesDeleted: totalDeleted
    });

  } catch (e) {
    error(`Cleanup failed: ${e.message}`);
    return res.json({ success: false, error: e.message }, 500);
  }
};
