import { Client, Functions, ID, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

dotenv.config();

console.log("Endpoint: ", process.env.APPWRITE_ENDPOINT);
console.log("Project: ", process.env.APPWRITE_PROJECT_ID);

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'imssa-media-staging')
  .setKey(process.env.APPWRITE_API_KEY || '');

const functionsClient = new Functions(client);

const FUNCTIONS_TO_CREATE = [
  {
    $id: 'api-ai-assistant',
    name: 'api-ai-assistant',
    runtime: 'node-18.0',
    events: [],
    schedule: '',
    timeout: 30,
    execute: [Role.users()],
    entrypoint: 'src/main.js',
    commands: 'npm install',
    variables: [
      { key: 'APPWRITE_API_KEY', value: process.env.APPWRITE_API_KEY || '' },
      { key: 'APPWRITE_ENDPOINT', value: process.env.APPWRITE_ENDPOINT || 'http://localhost/v1' },
      { key: 'APPWRITE_PROJECT_ID', value: process.env.APPWRITE_PROJECT_ID || '' },
      { key: 'APPWRITE_DATABASE_ID', value: process.env.APPWRITE_DATABASE_ID || 'imssa-media' },
      { key: 'AI_PROVIDER_ENABLED', value: process.env.AI_PROVIDER_ENABLED || 'false' },
      { key: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY || '' },
      { key: 'AI_MODEL', value: process.env.AI_MODEL || 'gemini-1.5-flash' },
    ]
  },
  {
    $id: 'integration-google-oauth',
    name: 'integration-google-oauth',
    runtime: 'node-18.0',
    events: [],
    schedule: '',
    timeout: 15,
    entrypoint: 'src/main.js',
    commands: 'npm install',
    variables: [
      { key: 'GOOGLE_CLIENT_ID', value: process.env.GOOGLE_CLIENT_ID || 'mock_client_id' },
      { key: 'GOOGLE_CLIENT_SECRET', value: process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret' },
      { key: 'GOOGLE_OAUTH_CALLBACK_URL', value: process.env.GOOGLE_OAUTH_CALLBACK_URL || 'http://localhost/v1/functions/integration-google-oauth/executions' }
    ]
  },
  {
    $id: 'worker-google-sheets-sync',
    name: 'worker-google-sheets-sync',
    runtime: 'node-18.0',
    events: ['databases.imssa-media.collections.marketing_plan_items.documents.*.update'],
    schedule: '',
    timeout: 15,
    entrypoint: 'src/main.js',
    commands: 'npm install',
    variables: [
      { key: 'GOOGLE_CLIENT_ID', value: process.env.GOOGLE_CLIENT_ID || 'mock_client_id' },
      { key: 'GOOGLE_CLIENT_SECRET', value: process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret' },
      { key: 'GOOGLE_REFRESH_TOKEN', value: process.env.GOOGLE_REFRESH_TOKEN || 'mock_refresh_token' },
      { key: 'GOOGLE_SPREADSHEET_ID', value: process.env.GOOGLE_SPREADSHEET_ID || '1g2uRSKIlIhbjNPYPyFjV6_O7RFWKxn9ztnwDWhsjMEQ' },
      { key: 'APPWRITE_API_KEY', value: process.env.APPWRITE_API_KEY || '' },
      { key: 'APPWRITE_ENDPOINT', value: process.env.APPWRITE_ENDPOINT || '' },
      { key: 'APPWRITE_PROJECT_ID', value: process.env.APPWRITE_PROJECT_ID || '' },
      { key: 'APPWRITE_DATABASE_ID', value: process.env.APPWRITE_DATABASE_ID || 'imssa-media' },
    ]
  },
  {
    $id: 'api-notifications-messaging',
    name: 'api-notifications-messaging',
    runtime: 'node-18.0',
    events: ['databases.imssa-media.collections.tasks.documents.*.update'],
    schedule: '',
    timeout: 15,
    entrypoint: 'src/main.js',
    commands: 'npm install',
    variables: [
      { key: 'N8N_WEBHOOK_URL', value: process.env.N8N_WEBHOOK_URL || 'mock_n8n_url' }
    ]
  },
  {
    $id: 'worker-ai-precheck',
    name: 'worker-ai-precheck',
    runtime: 'node-18.0',
    events: [
      'buckets.*.files.*.create' // Appwrite actually uses bucket specific events, but we'll listen to all file creations and filter in code
    ],
    schedule: '',
    timeout: 15,
    entrypoint: 'src/main.js',
    commands: 'npm install',
    variables: [
      { key: 'APPWRITE_API_KEY', value: process.env.APPWRITE_API_KEY || '' },
      { key: 'APPWRITE_ENDPOINT', value: process.env.APPWRITE_ENDPOINT || 'http://localhost/v1' },
      { key: 'APPWRITE_PROJECT_ID', value: process.env.APPWRITE_PROJECT_ID || '' }
    ]
  },
  {
    $id: 'worker-deadline-reminders',
    name: 'worker-deadline-reminders',
    runtime: 'node-18.0',
    events: [],
    schedule: '0 9 * * *', // Every day at 9 AM
    timeout: 15,
    entrypoint: 'src/main.js',
    commands: 'npm install',
    variables: [
      { key: 'APPWRITE_API_KEY', value: process.env.APPWRITE_API_KEY || '' },
      { key: 'APPWRITE_ENDPOINT', value: process.env.APPWRITE_ENDPOINT || 'http://localhost/v1' },
      { key: 'APPWRITE_PROJECT_ID', value: process.env.APPWRITE_PROJECT_ID || '' }
    ]
  },
  {
    $id: 'worker-draft-cleanup',
    name: 'worker-draft-cleanup',
    runtime: 'node-18.0',
    events: [],
    schedule: '0 2 * * *', // Every day at 2 AM
    timeout: 15,
    entrypoint: 'src/main.js',
    commands: 'npm install',
    variables: [
      { key: 'APPWRITE_API_KEY', value: process.env.APPWRITE_API_KEY || '' },
      { key: 'APPWRITE_ENDPOINT', value: process.env.APPWRITE_ENDPOINT || 'http://localhost/v1' },
      { key: 'APPWRITE_PROJECT_ID', value: process.env.APPWRITE_PROJECT_ID || '' }
    ]
  },
  {
    $id: 'worker-backup-export',
    name: 'worker-backup-export',
    runtime: 'node-18.0',
    events: [],
    schedule: '0 3 * * *', // Every day at 3 AM
    timeout: 15,
    entrypoint: 'src/main.js',
    commands: 'npm install',
    variables: [
      { key: 'APPWRITE_API_KEY', value: process.env.APPWRITE_API_KEY || '' },
      { key: 'APPWRITE_ENDPOINT', value: process.env.APPWRITE_ENDPOINT || 'http://localhost/v1' },
      { key: 'APPWRITE_PROJECT_ID', value: process.env.APPWRITE_PROJECT_ID || '' }
    ]
  },
  {
    $id: 'api-tasks-assignments',
    name: 'api-tasks-assignments',
    runtime: 'node-18.0',
    events: [],
    schedule: '',
    timeout: 15,
    entrypoint: 'src/main.js',
    commands: 'npm install',
    variables: [
      { key: 'APPWRITE_API_KEY', value: process.env.APPWRITE_API_KEY || '' },
      { key: 'APPWRITE_ENDPOINT', value: process.env.APPWRITE_ENDPOINT || 'http://localhost/v1' },
      { key: 'APPWRITE_PROJECT_ID', value: process.env.APPWRITE_PROJECT_ID || '' },
      { key: 'APPWRITE_DATABASE_ID', value: process.env.APPWRITE_DATABASE_ID || 'imssa_media' }
    ]
  },
  {
    $id: 'api-reviews-annotations',
    name: 'api-reviews-annotations',
    runtime: 'node-18.0',
    events: [],
    schedule: '',
    timeout: 15,
    entrypoint: 'index.js',
    commands: 'npm install',
    variables: [
      { key: 'APPWRITE_API_KEY', value: process.env.APPWRITE_API_KEY || '' },
      { key: 'APPWRITE_ENDPOINT', value: process.env.APPWRITE_ENDPOINT || 'http://localhost/v1' },
      { key: 'APPWRITE_PROJECT_ID', value: process.env.APPWRITE_PROJECT_ID || '' }
    ]
  },
  {
    $id: 'api-events-marketing-plans',
    name: 'api-events-marketing-plans',
    runtime: 'node-18.0',
    events: [],
    schedule: '',
    timeout: 15,
    entrypoint: 'src/main.js',
    commands: 'npm install',
    variables: [
      { key: 'APPWRITE_API_KEY', value: process.env.APPWRITE_API_KEY || '' },
      { key: 'APPWRITE_ENDPOINT', value: process.env.APPWRITE_ENDPOINT || 'http://localhost/v1' },
      { key: 'APPWRITE_PROJECT_ID', value: process.env.APPWRITE_PROJECT_ID || '' }
    ]
  },
  {
    $id: 'api-uploads-versions',
    name: 'api-uploads-versions',
    runtime: 'node-18.0',
    events: [],
    schedule: '',
    timeout: 15,
    entrypoint: 'src/main.js',
    commands: 'npm install',
    variables: [
      { key: 'APPWRITE_API_KEY', value: process.env.APPWRITE_API_KEY || '' },
      { key: 'APPWRITE_ENDPOINT', value: process.env.APPWRITE_ENDPOINT || 'http://localhost/v1' },
      { key: 'APPWRITE_PROJECT_ID', value: process.env.APPWRITE_PROJECT_ID || '' }
    ]
  }
];

async function setupFunctions() {
  console.log('Setting up Appwrite Functions...');

  for (const funcDef of FUNCTIONS_TO_CREATE) {
    let funcObj;
    try {
      funcObj = await functionsClient.get(funcDef.$id);
      console.log(`Function ${funcDef.name} already exists. Checking deployment...`);
    } catch (e) {
      if (e.code === 404) {
        console.log(`Creating function ${funcDef.name}...`);
        funcObj = await functionsClient.create(
          funcDef.$id,
          funcDef.name,
          funcDef.runtime,
          funcDef.execute || [],
          funcDef.events,
          funcDef.schedule,
          funcDef.timeout,
          true,
          true
        );
      } else {
        throw e;
      }
    }

    // Set variables
    console.log(`Setting variables for ${funcDef.name}...`);
    for (const variable of funcDef.variables) {
      try {
        await functionsClient.createVariable(funcDef.$id, variable.key, variable.value);
      } catch (e) {
        if (e.code === 409) {
          // Variable exists, update it
          try {
            await functionsClient.updateVariable(funcDef.$id, variable.key, variable.key, variable.value);
          } catch (updateErr) {
            console.warn(`Could not update variable ${variable.key}: ${updateErr.message}`);
          }
        } else {
          console.warn(`Could not set variable ${variable.key}: ${e.message}`);
        }
      }
    }

    // Create Deployment if folder exists
    const funcDir = path.join(process.cwd(), 'functions', funcDef.name);
    if (fs.existsSync(funcDir)) {
      console.log(`Packaging and deploying ${funcDef.name}...`);
      const tarPath = path.join(funcDir, 'code.tar.gz');
      if (fs.existsSync(tarPath)) {
        fs.unlinkSync(tarPath);
      }
      
      try {
        execSync(`tar -czf code.tar.gz .`, { cwd: funcDir });
        const inputFile = InputFile.fromPath(tarPath, 'code.tar.gz');
        await functionsClient.createDeployment(
          funcDef.$id,
          inputFile,
          true, // activate
          funcDef.entrypoint,
          funcDef.commands
        );
        console.log(`Deployed ${funcDef.name} successfully.`);
      } catch (e) {
        console.error(`Failed to deploy ${funcDef.name}:`, e.message);
      } finally {
        if (fs.existsSync(tarPath)) {
          fs.unlinkSync(tarPath);
        }
      }
    } else {
      console.log(`Source code directory ${funcDir} not found, skipping deployment.`);
    }
  }

  console.log('Setup functions complete.');
}

setupFunctions().catch(console.error);
