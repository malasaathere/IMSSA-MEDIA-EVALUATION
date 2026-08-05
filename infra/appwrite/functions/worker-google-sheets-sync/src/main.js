import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { Client, Databases, Query } from 'node-appwrite';

const COLLECTION_ID = 'marketing_plan_items';
const YEAR = 2026;
const TABS = [
  { name: 'Exposition', gid: '0' },
  { name: 'hackX', gid: '1047944072' },
  { name: 'hackX Jr', gid: '1173055638' },
];
const IGNORED_SOURCE_KEYS = new Set(['hackX Jr:72']);
const SYNC_FIELDS = [
  'campaign', 'title', 'description', 'type', 'designer', 'designStatus',
  'contentWriter', 'captionStatus', 'finalStatus', 'handoverStatus',
  'handoverDate', 'finishedBefore', 'dateToShare', 'dateShared', 'platform',
  'sourceTab', 'sourceRow', 'sourceKey', 'normalizedShareDate',
  'normalizedFinishedDate',
];

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const sourceKey = (tab, row) => `${tab}:${row}`;
const documentId = (key) => `sheet_${createHash('sha256').update(key).digest('hex').slice(0, 28)}`;
const inferType = (name) => /video|aftermovie|loop|live/i.test(name)
  ? 'Video'
  : (/flyer|photo|cover|profile|post/i.test(name) ? 'Flyer' : '');

function normalizeDate(value) {
  const text = clean(value).toLowerCase().replace(/(\d)(st|nd|rd|th)/g, '$1').replace(/\bof\b/g, ' ');
  if (!text || text === '--') return '';
  const months = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
  const match = text.match(/(\d{1,2})\s*([a-z]+)/);
  if (!match) return '';
  const monthName = Object.keys(months).find((name) => name.startsWith(match[2]) || match[2].startsWith(name.slice(0, 3)));
  const day = Number(match[1]);
  if (!monthName || day < 1 || day > 31) return '';
  const month = months[monthName];
  const test = new Date(Date.UTC(YEAR, month - 1, day));
  if (test.getUTCMonth() !== month - 1) return '';
  return `${YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseExposition(rows) {
  let title = '';
  return rows.flatMap((cols, index) => {
    const row = index + 1;
    if (row <= 5) return [];
    if (clean(cols[1])) title = clean(cols[1]);
    const description = clean(cols[2]);
    const type = clean(cols[3]);
    if (!description && !type) return [];
    return [{
      campaign: 'Exposition 2026', title: title || 'Exposition 2026', description, type,
      designer: clean(cols[4]), designStatus: clean(cols[5]), contentWriter: clean(cols[6]),
      captionStatus: clean(cols[7]), finalStatus: clean(cols[8]), handoverStatus: clean(cols[9]),
      handoverDate: clean(cols[10]), finishedBefore: clean(cols[11]), dateToShare: clean(cols[12]),
      dateShared: clean(cols[13]), platform: clean(cols[14]), sourceTab: 'Exposition', sourceRow: String(row),
    }];
  });
}

function parseHackX(rows, tab) {
  let section = tab === 'hackX' ? 'HackX 11.0' : 'hackX Jr 9.0';
  return rows.flatMap((cols, index) => {
    const row = index + 1;
    if (row <= (tab === 'hackX' ? 3 : 2)) return [];
    if (clean(cols[0])) section = clean(cols[0]);
    const description = clean(cols[3]);
    if (!description) return [];
    if (tab === 'hackX Jr' && /^(workshop\s+s(?:e|i)ries|hackx\s+jr.*grand\s+finals)/i.test(description)) {
      section = description;
      return [];
    }
    if (IGNORED_SOURCE_KEYS.has(sourceKey(tab, row))) return [];
    return [{
      campaign: tab === 'hackX' ? 'HackX 11.0' : 'hackX Jr 9.0', title: section, description,
      type: inferType(description), designer: clean(cols[6]), designStatus: clean(cols[7]),
      contentWriter: clean(cols[8]), captionStatus: clean(cols[9]), finalStatus: clean(cols[10]),
      handoverStatus: '', handoverDate: '', finishedBefore: clean(cols[4]), dateToShare: clean(cols[5]),
      dateShared: '', platform: clean(cols[2]), sourceTab: tab, sourceRow: String(row),
    }];
  });
}

async function fetchTab(spreadsheetId, tab) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${tab.gid}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sheet export failed for ${tab.name}: HTTP ${response.status}`);
  return parse(await response.text(), { relax_column_count: true, skip_empty_lines: false });
}

async function listAll(databases, databaseId) {
  const documents = [];
  for (let offset = 0;; offset += 100) {
    const page = await databases.listDocuments(databaseId, COLLECTION_ID, [Query.limit(100), Query.offset(offset)]);
    documents.push(...page.documents);
    if (documents.length >= page.total) return documents;
  }
}

function changed(existing, incoming) {
  return SYNC_FIELDS.some((field) => clean(existing[field]) !== clean(incoming[field]));
}

export default async ({ res, log, error }) => {
  try {
    const endpoint = process.env.APPWRITE_ENDPOINT;
    const projectId = process.env.APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY;
    const databaseId = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!endpoint || !projectId || !apiKey || !spreadsheetId) throw new Error('Missing required synchronization variables.');

    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const databases = new Databases(client);
    const rows = await Promise.all(TABS.map((tab) => fetchTab(spreadsheetId, tab)));
    const items = [
      ...parseExposition(rows[0]),
      ...parseHackX(rows[1], 'hackX'),
      ...parseHackX(rows[2], 'hackX Jr'),
    ].map((item) => ({
      ...item,
      sourceKey: sourceKey(item.sourceTab, item.sourceRow),
      normalizedShareDate: normalizeDate(item.dateToShare),
      normalizedFinishedDate: normalizeDate(item.finishedBefore),
    }));

    const existing = await listAll(databases, databaseId);
    const sheetDocuments = existing.filter((doc) => doc.sourceKey);
    const bySource = new Map(sheetDocuments.map((doc) => [doc.sourceKey, doc]));
    const canonicalKeys = new Set(items.map((item) => item.sourceKey));
    let created = 0, updated = 0, deleted = 0, unchanged = 0;

    for (const item of items) {
      const current = bySource.get(item.sourceKey);
      if (!current) {
        await databases.createDocument(databaseId, COLLECTION_ID, documentId(item.sourceKey), {
          ...item, lastSyncedAt: new Date().toISOString(),
        });
        created++;
      } else if (changed(current, item)) {
        await databases.updateDocument(databaseId, COLLECTION_ID, current.$id, {
          ...item, lastSyncedAt: new Date().toISOString(),
        });
        updated++;
      } else {
        unchanged++;
      }
    }

    for (const document of sheetDocuments) {
      if (!canonicalKeys.has(document.sourceKey)) {
        await databases.deleteDocument(databaseId, COLLECTION_ID, document.$id);
        deleted++;
      }
    }

    const result = { success: true, spreadsheetId, records: items.length, created, updated, deleted, unchanged };
    log(JSON.stringify(result));
    return res.json(result);
  } catch (exception) {
    error(exception.stack || exception.message);
    return res.json({ success: false, error: exception.message }, 500);
  }
};
