import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Functions, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import 'dotenv/config';

const FUNCTION_ID = 'api-ai-assistant';
const root = path.dirname(fileURLToPath(import.meta.url));
const functionDirectory = path.resolve(root, '..', '..', 'apps', 'functions', FUNCTION_ID);
const archivePath = '/tmp/imssa-api-ai-assistant.tar.gz';

for (const key of ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY']) {
  if (!process.env[key]) throw new Error(`Missing ${key} in infra/appwrite/.env`);
}

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const functions = new Functions(client);
const execute = [Role.users()];

try {
  await functions.get(FUNCTION_ID);
  await functions.update(FUNCTION_ID, 'IMSSA AI Assistant', 'node-18.0', execute, [], '', 30, true, true, 'src/main.js', 'npm install');
} catch (exception) {
  if (exception.code !== 404) throw exception;
  await functions.create(FUNCTION_ID, 'IMSSA AI Assistant', 'node-18.0', execute, [], '', 30, true, true, 'src/main.js', 'npm install');
}

const variables = {
  APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY: process.env.APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID: process.env.APPWRITE_DATABASE_ID || 'imssa-media',
  AI_PROVIDER_ENABLED: 'false',
  AI_MODEL: process.env.AI_MODEL || 'gemini-1.5-flash',
};
const listed = await functions.listVariables(FUNCTION_ID);
for (const [key, value] of Object.entries(variables)) {
  const existing = listed.variables.find((variable) => variable.key === key);
  if (existing) await functions.updateVariable(FUNCTION_ID, existing.$id, key, value);
  else await functions.createVariable(FUNCTION_ID, key, value);
}

execFileSync('tar', ['-czf', archivePath, 'package.json', 'src'], { cwd: functionDirectory });
const deployment = await functions.createDeployment(
  FUNCTION_ID,
  InputFile.fromPath(archivePath, 'imssa-api-ai-assistant.tar.gz'),
  true,
  'src/main.js',
  'npm install'
);

console.log(JSON.stringify({
  functionId: FUNCTION_ID,
  deploymentId: deployment.$id,
  authenticatedUsersOnly: true,
  externalAIEnabled: false,
  fallbackEnabled: true,
}, null, 2));
