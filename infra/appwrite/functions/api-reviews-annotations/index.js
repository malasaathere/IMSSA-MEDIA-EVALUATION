import { Client, Databases, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  log('Processing review...');

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
    const { taskId, versionId, reviewerId, decision, comment } = JSON.parse(req.payload || '{}');

    if (!taskId || !versionId || !reviewerId || !decision) {
      return res.json({ success: false, error: 'Missing required parameters' }, 400);
    }

    // 1. Fetch version to validate current state
    const version = await databases.getDocument(DB_ID, 'deliverable_versions', versionId);
    if (version.status !== 'PENDING') {
      return res.json({ success: false, error: 'Only PENDING versions can be reviewed' }, 400);
    }

    // 2. Validate decision
    const allowedDecisions = ['APPROVED', 'REVISION_REQUESTED'];
    if (!allowedDecisions.includes(decision)) {
      return res.json({ success: false, error: 'Invalid decision' }, 400);
    }

    // 3. Save review record
    await databases.createDocument(DB_ID, 'reviews', ID.unique(), {
      taskId: taskId,
      versionId: versionId,
      reviewerId: reviewerId,
      decision: decision,
      comment: comment || ''
    });

    // 4. Update version status
    await databases.updateDocument(DB_ID, 'deliverable_versions', versionId, {
      status: decision
    });

    // 5. Update task status based on decision
    if (decision === 'APPROVED') {
      await databases.updateDocument(DB_ID, 'tasks', taskId, {
        status: 'APPROVED',
        approvedVersionId: versionId,
        completedAt: new Date().toISOString()
      });
    } else if (decision === 'REVISION_REQUESTED') {
      const task = await databases.getDocument(DB_ID, 'tasks', taskId);
      await databases.updateDocument(DB_ID, 'tasks', taskId, {
        status: 'IN_PROGRESS',
        revisionRound: (task.revisionRound || 0) + 1
      });
    }

    log(`Review processed for version ${versionId} - Decision: ${decision}`);
    return res.json({ success: true, message: `Review processed: ${decision}` });
  } catch (err) {
    error('Failed to process review: ' + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
