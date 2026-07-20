import { Client, Databases, Query, ID } from 'node-appwrite';

// Appwrite Function: worker-deadline-reminders
export default async ({ req, res, log, error }) => {
  log("Starting deadline reminder job...");

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    const dbId = 'imssa-media';
    const tasksCollection = 'tasks';
    const outboxCollection = 'outbox_events';

    // Calculate deadline threshold (e.g., next 48 hours)
    const now = new Date();
    const fortyEightHoursFromNow = new Date(now.getTime() + (48 * 60 * 60 * 1000));

    // Query tasks where status = 'PENDING' and deadline <= 48 hours
    const result = await databases.listDocuments(dbId, tasksCollection, [
      Query.equal('status', 'PENDING'),
      Query.lessThanEqual('deadline', fortyEightHoursFromNow.toISOString()),
      Query.greaterThan('deadline', now.toISOString()) // only future deadlines
    ]);

    log(`Found ${result.documents.length} pending tasks with upcoming deadlines.`);

    let notificationsCreated = 0;

    for (const task of result.documents) {
      log(`Creating reminder for Task ${task.$id} - "${task.title}"`);
      
      // Dispatch an outbox event which the api-notifications-messaging function or n8n can process
      await databases.createDocument(dbId, outboxCollection, ID.unique(), {
        event_type: 'deadline_reminder',
        payload: JSON.stringify({
          taskId: task.$id,
          title: task.title,
          deadline: task.deadline,
          assignees: task.assignees || [] // Assuming an array of assignee IDs exists
        }),
        status: 'PENDING'
      });
      notificationsCreated++;
    }

    return res.json({ 
      success: true, 
      message: "Deadline reminders processed",
      tasksProcessed: notificationsCreated
    });

  } catch (e) {
    error(`Failed to process deadlines: ${e.message}`);
    return res.json({ success: false, error: e.message }, 500);
  }
};
