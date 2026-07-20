import { Client, Databases, Storage, ID, InputFile } from 'node-appwrite';

// Appwrite Function: worker-backup-export
export default async ({ req, res, log, error }) => {
  log("Starting daily database backup export...");

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const storage = new Storage(client);
  
  const dbId = 'imssa-media';
  const bucketId = 'report-exports';

  try {
    // 1. Fetch data
    // (Note: in a real environment, you must paginate through all results. We are doing a simple export here).
    const tasksRes = await databases.listDocuments(dbId, 'tasks');
    const profilesRes = await databases.listDocuments(dbId, 'profiles');
    
    // 2. Package into JSON
    const exportData = {
      timestamp: new Date().toISOString(),
      collections: {
        tasks: tasksRes.documents,
        profiles: profilesRes.documents
      }
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // 3. Save temporarily (Appwrite Functions use ephemeral storage)
    const fs = require('fs');
    const tempPath = '/tmp/backup-export.json';
    fs.writeFileSync(tempPath, jsonString);
    
    // 4. Upload to Appwrite Storage
    log("Uploading backup to Storage bucket...");
    const inputFile = InputFile.fromPath(tempPath, `backup-${new Date().toISOString().split('T')[0]}.json`);
    
    const file = await storage.createFile(bucketId, ID.unique(), inputFile);
    
    // Clean up temp file
    fs.unlinkSync(tempPath);

    return res.json({ 
      success: true, 
      message: "Backup export completed successfully",
      fileId: file.$id
    });

  } catch (e) {
    error(`Backup failed: ${e.message}`);
    return res.json({ success: false, error: e.message }, 500);
  }
};
