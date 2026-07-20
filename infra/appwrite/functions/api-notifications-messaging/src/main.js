import https from 'https';

// Appwrite Function: api-notifications-messaging
export default async ({ req, res, log, error }) => {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!n8nWebhookUrl) {
    error("Missing N8N_WEBHOOK_URL environment variable.");
    return res.json({ success: false, message: "Missing webhook URL" }, 500);
  }

  const eventName = req.headers['x-appwrite-event'] || 'unknown_event';
  const payload = req.body;

  log(`Triggered by event: ${eventName}`);

  // We can filter out specific events. For example, only send webhooks if a task is assigned or marked for review.
  const status = payload?.status;
  if (status && (status === 'IN_REVIEW' || status === 'PENDING' || status === 'APPROVED')) {
    log(`Task status is ${status}, forwarding to n8n webhook...`);
    
    // Convert webhook URL to options for http/https request
    const urlObj = new URL(n8nWebhookUrl);
    
    const requestData = JSON.stringify({
      event: eventName,
      task: payload
    });

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    return new Promise((resolve) => {
      const httpModule = urlObj.protocol === 'https:' ? https : require('http');
      const webhookReq = httpModule.request(options, (webhookRes) => {
        let responseBody = '';
        webhookRes.on('data', (chunk) => {
          responseBody += chunk;
        });

        webhookRes.on('end', () => {
          log(`Webhook responded with status ${webhookRes.statusCode}`);
          resolve(res.json({ success: true, n8nResponseStatus: webhookRes.statusCode }));
        });
      });

      webhookReq.on('error', (e) => {
        error(`Failed to send webhook: ${e.message}`);
        resolve(res.json({ success: false, error: e.message }, 500));
      });

      webhookReq.write(requestData);
      webhookReq.end();
    });
  } else {
    log(`Task status ${status} does not require webhook notification.`);
    return res.json({ success: true, message: "No webhook triggered." });
  }
};
