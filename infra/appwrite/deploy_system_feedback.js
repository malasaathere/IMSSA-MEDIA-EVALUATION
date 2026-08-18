import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Functions, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import 'dotenv/config';

const functionId = 'api-system-feedback';
const root = path.dirname(fileURLToPath(import.meta.url));
const functionDirectory = path.resolve(root, '..', '..', 'apps', 'functions', functionId);
const archivePath = '/tmp/imssa-api-system-feedback.tar.gz';
for (const key of ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY']) if (!process.env[key]) throw new Error(`Missing ${key} in infra/appwrite/.env`);
const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const functions = new Functions(client);
try { await functions.get(functionId); await functions.update(functionId, 'IMSSA System Feedback', 'node-18.0', [Role.users()], [], '', 30, true, true, 'src/main.js', 'npm install'); }
catch (error) { if (error.code !== 404) throw error; await functions.create(functionId, 'IMSSA System Feedback', 'node-18.0', [Role.users()], [], '', 30, true, true, 'src/main.js', 'npm install'); }
const variables = { APPWRITE_ENDPOINT: process.env.APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID: process.env.APPWRITE_PROJECT_ID, APPWRITE_API_KEY: process.env.APPWRITE_API_KEY, APPWRITE_DATABASE_ID: process.env.APPWRITE_DATABASE_ID || 'imssa-media' };
const listed = await functions.listVariables(functionId);
for (const [key, value] of Object.entries(variables)) { const existing = listed.variables.find((item) => item.key === key); if (existing) await functions.updateVariable(functionId, existing.$id, key, value); else await functions.createVariable(functionId, key, value); }
execFileSync('tar', ['-czf', archivePath, 'package.json', 'src'], { cwd: functionDirectory });
const deployment = await functions.createDeployment(functionId, InputFile.fromPath(archivePath, 'imssa-api-system-feedback.tar.gz'), true, 'src/main.js', 'npm install');
console.log(JSON.stringify({ functionId, deploymentId: deployment.$id, authenticatedUsersOnly: true }));
