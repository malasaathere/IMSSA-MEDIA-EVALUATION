import { Client, Databases, ID } from 'node-appwrite';

// Appwrite Function: api-events-marketing-plans
export default async ({ req, res, log, error }) => {
  log('Processing marketing plan update...');

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
    const { action, eventId, planData, updatedBy } = payload;

    if (!action || !eventId || !updatedBy) {
      return res.json({ success: false, error: 'Missing required parameters' }, 400);
    }

    if (action === 'CREATE_OR_UPDATE') {
      log(`Updating marketing plan for event ${eventId}`);
      
      // Simulate validation of planData before insertion
      if (!planData || typeof planData !== 'object') {
        return res.json({ success: false, error: 'Invalid plan data' }, 400);
      }
      
      // Here we would typically validate event scope, permissions, etc.
      // We assume valid for this implementation.

      // We use a predefined collection "marketing_plan_items" for the demonstration
      const newItem = await databases.createDocument(DB_ID, 'marketing_plan_items', ID.unique(), {
        eventId: eventId,
        content: JSON.stringify(planData),
        updatedBy: updatedBy
      });

      // Also dispatch an outbox event so `worker-google-sheets-sync` handles the async outbound sync
      await databases.createDocument(DB_ID, 'outbox_events', ID.unique(), {
        event_type: 'marketing_plan_updated',
        payload: JSON.stringify({ eventId, itemId: newItem.$id, updatedBy }),
        status: 'PENDING'
      });

      return res.json({ success: true, message: 'Marketing plan updated successfully', item: newItem });
    }

    return res.json({ success: false, error: 'Unknown action' }, 400);

  } catch (err) {
    error('Failed to process marketing plan: ' + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
