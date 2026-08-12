import { Client, Functions } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const functions = new Functions(client);

try {
  const fn = await functions.get('worker-google-sheets-sync');
  const variables = await functions.listVariables('worker-google-sheets-sync');
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_SPREADSHEET_ID'];
  const state = Object.fromEntries(required.map((key) => {
    const variable = variables.variables.find((item) => item.key === key);
    const value = String(variable?.value || '');
    return [key, Boolean(value) && !value.startsWith('mock_')];
  }));
  console.log(JSON.stringify({ functionId: fn.$id, enabled: fn.enabled, events: fn.events, schedule: fn.schedule, variablesConfigured: state }, null, 2));
} catch (error) {
  console.error(error.message || error);
  process.exitCode = 1;
}
