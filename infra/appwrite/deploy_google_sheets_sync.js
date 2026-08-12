import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Functions } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import 'dotenv/config';

const FUNCTION_ID = 'worker-google-sheets-sync';
const FUNCTION_NAME = 'Google Sheets Marketing Plan Sync';
const SCHEDULE = '';
const EVENTS = ['databases.imssa-media.collections.marketing_plan_items.documents.*.update'];
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1g2uRSKIlIhbjNPYPyFjV6_O7RFWKxn9ztnwDWhsjMEQ';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const root = path.dirname(fileURLToPath(import.meta.url));
const functionDirectory = path.resolve(root, '..', '..', 'apps', 'functions', FUNCTION_ID);
const archivePath = '/tmp/imssa-worker-google-sheets-sync.tar.gz';

for (const key of ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN']) {
  if (!process.env[key]) throw new Error(`Missing ${key} in infra/appwrite/.env`);
}

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const functions = new Functions(client);

let current;
try {
  current = await functions.get(FUNCTION_ID);
  await functions.update(
    FUNCTION_ID,
    FUNCTION_NAME,
    current.runtime || 'node-18.0',
    [],
    EVENTS,
    SCHEDULE,
    120,
    true,
    true,
    'src/main.js',
    'npm install'
  );
} catch (exception) {
  if (exception.code !== 404) throw exception;
  current = await functions.create(
    FUNCTION_ID,
    FUNCTION_NAME,
    'node-18.0',
    [],
    EVENTS,
    SCHEDULE,
    120,
    true,
    true,
    'src/main.js',
    'npm install'
  );
}

const variables = {
  APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID: DATABASE_ID,
  GOOGLE_SPREADSHEET_ID: SPREADSHEET_ID,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
};
const listedVariables = await functions.listVariables(FUNCTION_ID);
for (const [key, value] of Object.entries(variables)) {
  const existing = listedVariables.variables.find((variable) => variable.key === key);
  if (existing) await functions.updateVariable(FUNCTION_ID, existing.$id, key, value);
  else await functions.createVariable(FUNCTION_ID, key, value);
}

execFileSync('tar', ['-czf', archivePath, 'package.json', 'src'], { cwd: functionDirectory });
const deployment = await functions.createDeployment(
  FUNCTION_ID,
  InputFile.fromPath(archivePath, 'worker-google-sheets-sync.tar.gz'),
  true,
  'src/main.js',
  'npm install'
);

console.log(JSON.stringify({
  functionId: FUNCTION_ID,
  deploymentId: deployment.$id,
  schedule: SCHEDULE,
  events: EVENTS,
  spreadsheetId: SPREADSHEET_ID,
  databaseId: DATABASE_ID,
}, null, 2));
