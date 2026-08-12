import { Client, Databases, ID } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const OUTBOX_COLLECTION = 'outbox_events';

const clean = (value) => String(value ?? '').trim();

function requestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const raw = req.bodyText || req.payload || req.bodyRaw || '';
  try { return JSON.parse(raw); } catch { return {}; }
}

function sheetUpdate(document) {
  const row = Number(document.sourceRow);
  const tab = clean(document.sourceTab);
  if (!tab || !Number.isInteger(row) || row < 1) {
    throw new Error('Marketing plan item is missing a valid sourceTab/sourceRow mapping.');
  }

  if (tab === 'Exposition') {
    return {
      range: `'Exposition'!E${row}:O${row}`,
      values: [[
        clean(document.designer), clean(document.designStatus), clean(document.contentWriter),
        clean(document.captionStatus), clean(document.finalStatus), clean(document.handoverStatus),
        clean(document.handoverDate), clean(document.finishedBefore), clean(document.dateToShare),
        clean(document.dateShared), clean(document.platform),
      ]],
    };
  }

  if (tab === 'hackX' || tab === 'hackX Jr') {
    return {
      range: `'${tab}'!C${row}:K${row}`,
      values: [[
        clean(document.platform), clean(document.description), clean(document.finishedBefore),
        clean(document.dateToShare), clean(document.designer), clean(document.designStatus),
        clean(document.contentWriter), clean(document.captionStatus), clean(document.finalStatus),
      ]],
    };
  }

  throw new Error(`Unsupported Google Sheet tab: ${tab}`);
}

async function accessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Sheets write authorization is not configured.');
  }
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || 'Could not refresh Google access token.');
  return payload.access_token;
}

async function writeSheet(document) {
  if (!SPREADSHEET_ID) throw new Error('GOOGLE_SPREADSHEET_ID is not configured.');
  const token = await accessToken();
  const update = sheetUpdate(document);
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(update.range)}?valueInputOption=USER_ENTERED`;
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ range: update.range, majorDimension: 'ROWS', values: update.values }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `Google Sheets update failed: HTTP ${response.status}`);
  return { range: update.range, updatedCells: payload.updatedCells || update.values[0].length };
}

export default async ({ req, res, log, error }) => {
  const document = requestBody(req);
  const eventName = req.headers?.['x-appwrite-event'] || req.headers?.['X-Appwrite-Event'] || 'manual';
  if (!document.$id) return res.json({ success: true, skipped: true, reason: 'No marketing plan document in event.' });

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY);
  const databases = new Databases(client);

  try {
    const sheet = await writeSheet(document);
    log(JSON.stringify({ eventName, documentId: document.$id, ...sheet }));
    return res.json({ success: true, syncStatus: 'SYNCED', documentId: document.$id, ...sheet });
  } catch (exception) {
    const message = exception?.message || String(exception);
    error(message);
    try {
      await databases.createDocument(DATABASE_ID, OUTBOX_COLLECTION, ID.unique(), {
        event_type: 'marketing_plan_sheet_sync',
        payload: JSON.stringify({ documentId: document.$id, sourceTab: document.sourceTab, sourceRow: document.sourceRow, reason: message }),
        status: 'PENDING',
      });
    } catch (outboxError) {
      error(`Could not record retry event: ${outboxError.message}`);
    }
    return res.json({ success: false, syncStatus: 'PENDING', documentId: document.$id, error: message }, 500);
  }
};
