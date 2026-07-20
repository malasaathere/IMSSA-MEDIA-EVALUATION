import { N8nTaskEventPayload } from '../packages/contracts/src/n8n-webhook.schema';

// This script simulates the NestJS backend firing a webhook to an n8n instance.
// Usage: ts-node test-n8n-webhook.ts [webhook_url]

const webhookUrl = process.argv[2] || 'http://localhost:5678/webhook-test/imssa-media';

const payload: N8nTaskEventPayload = {
  eventId: 'evt-123',
  eventName: 'Annual Tech Symposium',
  taskId: 'task-456',
  taskTitle: 'Symposium Promotional Video',
  action: 'APPROVED',
  triggerTime: new Date().toISOString(),
  
  deliverable: {
    versionId: 'ver-789',
    fileUrl: 'https://imssa.mock-cdn.com/videos/symposium-final.mp4',
    originalFileName: 'symposium_promo_v4_FINAL.mp4',
    mimeType: 'video/mp4',
  },

  users: {
    marketingCoordinator: {
      id: 'usr-mc-1',
      email: 'coordinator@imssa.example.com',
      name: 'Alice (MC)',
    },
    designer: {
      id: 'usr-ds-1',
      email: 'designer@imssa.example.com',
      name: 'Bob (Designer)',
    },
    director: {
      id: 'usr-dr-1',
      email: 'director@imssa.example.com',
      name: 'Charlie (Director)',
    },
  },
};

console.log(`Sending mock payload to ${webhookUrl}...`);
console.log(JSON.stringify(payload, null, 2));

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
})
  .then((res) => {
    console.log(`Response Status: ${res.status} ${res.statusText}`);
    return res.text();
  })
  .then((text) => console.log('Response Body:', text))
  .catch((err) => console.error('Error firing webhook:', err));
