import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import { Client, Databases, Query } from 'node-appwrite';
import 'dotenv/config';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1g2uRSKIlIhbjNPYPyFjV6_O7RFWKxn9ztnwDWhsjMEQ';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const COLLECTION_ID = 'marketing_plan_items';
const YEAR = Number(process.env.MARKETING_PLAN_YEAR || 2026);
const TABS = [
  { name: 'Exposition', gid: '0' },
  { name: 'hackX', gid: '1047944072' },
  { name: 'hackX Jr', gid: '1173055638' },
];
// Confirmed accidental duplicate in the source plan. Keep this explicit so
// legitimate repeated partner slots (Gold Partner, Silver Partner, etc.) remain.
const IGNORED_SOURCE_KEYS = new Set(['hackX Jr:72']);

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const databases = new Databases(client);

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const inferType = (name) => /video|aftermovie|loop|live/i.test(name) ? 'Video' : (/flyer|photo|cover|profile|post/i.test(name) ? 'Flyer' : '');
const sourceKey = (tab, row) => `${tab}:${row}`;
const documentId = (key) => `sheet_${createHash('sha256').update(key).digest('hex').slice(0, 28)}`;

function normalizeDate(value) {
  const text = clean(value).toLowerCase().replace(/(\d)(st|nd|rd|th)/g, '$1').replace(/\bof\b/g, ' ');
  if (!text || text === '--') return '';
  const months = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
  const match = text.match(/(\d{1,2})\s*([a-z]+)/);
  if (!match) return '';
  const day = Number(match[1]);
  const monthName = Object.keys(months).find((name) => name.startsWith(match[2]) || match[2].startsWith(name.slice(0, 3)));
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

    // hackX Jr stores some section headings in the Post Name column instead
    // of the first column. Treat them as headings so Workshop Series 01 and
    // Workshop Series 02 do not appear as duplicated plans.
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

async function fetchTab(tab) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${tab.gid}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google Sheet export failed for ${tab.name}: ${response.status}`);
  return parse(await response.text(), { relax_column_count: true, skip_empty_lines: false });
}

async function listAllDocuments() {
  const documents = [];
  for (let offset = 0;; offset += 100) {
    const page = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [Query.limit(100), Query.offset(offset)]);
    documents.push(...page.documents);
    if (documents.length >= page.total) return documents;
  }
}

function legacyKey(item) {
  return [clean(item.campaign).toLowerCase(), clean(item.title).toLowerCase(), clean(item.description).toLowerCase(), clean(item.dateToShare).toLowerCase()].join('|');
}

async function upsert(items) {
  const existing = await listAllDocuments();
  const bySource = new Map(existing.filter((d) => d.sourceKey).map((d) => [d.sourceKey, d]));
  const byLegacy = new Map(existing.map((d) => [legacyKey(d), d]));
  let created = 0, updated = 0;
  for (const raw of items) {
    const key = sourceKey(raw.sourceTab, raw.sourceRow);
    const data = {
      ...raw, sourceKey: key,
      normalizedShareDate: normalizeDate(raw.dateToShare),
      normalizedFinishedDate: normalizeDate(raw.finishedBefore),
      lastSyncedAt: new Date().toISOString(),
    };
    const found = bySource.get(key) || byLegacy.get(legacyKey(raw));
    if (found) {
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, found.$id, data);
      updated++;
    } else {
      await databases.createDocument(DATABASE_ID, COLLECTION_ID, documentId(key), data);
      created++;
    }
  }
  return { created, updated, before: existing.length, after: existing.length + created };
}

function escapeIcs(value) { return clean(value).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n'); }
function writeCalendar(items) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const events = items.filter((i) => normalizeDate(i.dateToShare)).map((i) => {
    const date = normalizeDate(i.dateToShare).replaceAll('-', '');
    const next = new Date(`${normalizeDate(i.dateToShare)}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
    const nextDate = next.toISOString().slice(0, 10).replaceAll('-', '');
    return ['BEGIN:VEVENT', `UID:${escapeIcs(sourceKey(i.sourceTab, i.sourceRow))}@imssa.media`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${date}`, `DTEND;VALUE=DATE:${nextDate}`, `SUMMARY:${escapeIcs(`${i.campaign}: ${i.description}`)}`, `DESCRIPTION:${escapeIcs(`Designer: ${i.designer || 'Unassigned'} | Writer: ${i.contentWriter || 'Unassigned'} | Status: ${i.finalStatus || i.designStatus || 'Pending'} | Source: ${i.sourceTab} row ${i.sourceRow}`)}`, 'END:VEVENT'].join('\r\n');
  });
  const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//IMSSA//Media Evaluation//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:IMSSA Media Post Plan', 'X-WR-TIMEZONE:Asia/Colombo', ...events, 'END:VCALENDAR', ''].join('\r\n');
  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'imssa-media-post-plan-2026.ics');
  fs.writeFileSync(out, content);
  return { path: out, events: events.length };
}

const rows = await Promise.all(TABS.map(fetchTab));
const items = [...parseExposition(rows[0]), ...parseHackX(rows[1], 'hackX'), ...parseHackX(rows[2], 'hackX Jr')];
const result = await upsert(items);
const calendar = writeCalendar(items);
console.log(JSON.stringify({ spreadsheetId: SPREADSHEET_ID, records: items.length, tabs: TABS.map((t, i) => ({ name: t.name, records: i === 0 ? parseExposition(rows[i]).length : parseHackX(rows[i], t.name).length })), appwrite: result, calendar }, null, 2));
