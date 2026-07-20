import { Client, Databases, Query, ID } from 'node-appwrite';

// Appwrite Function: api-uploads-versions
export default async ({ req, res, log, error }) => {
  log('Processing upload versioning...');

  if (req.method !== 'POST') {
    return res.json({ success: false, error: 'Method not allowed' }, 405);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const DB_ID = 'imssa-media';

  try {
    const payload = JSON.parse(req.payload || '{}');
    const { taskId, fileId, uploaderId, versionNotes } = payload;

    if (!taskId || !fileId || !uploaderId) {
      return res.json({ success: false, error: 'Missing required parameters' }, 400);
    }

    // 1. Check existing versions to determine new version number
    const existingVersions = await databases.listDocuments(DB_ID, 'deliverable_versions', [
      Query.equal('taskId', taskId),
      Query.orderDesc('versionNumber'),
      Query.limit(1)
    ]);

    const newVersionNumber = existingVersions.total > 0 
      ? existingVersions.documents[0].versionNumber + 1 
      : 1;

    // 2. Create new deliverable version record
    const newVersion = await databases.createDocument(DB_ID, 'deliverable_versions', ID.unique(), {
      taskId: taskId,
      fileId: fileId,
      uploaderId: uploaderId,
      versionNumber: newVersionNumber,
      notes: versionNotes || '',
      status: 'PENDING_REVIEW'
    });

    log(`Created version ${newVersionNumber} for task ${taskId}`);

    // 3. Update task status to reflect review needed
    await databases.updateDocument(DB_ID, 'tasks', taskId, {
      status: 'REVIEW'
    });

    return res.json({ 
      success: true, 
      message: 'Version created successfully', 
      version: newVersion 
    });

  } catch (err) {
    error('Failed to process upload version: ' + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
