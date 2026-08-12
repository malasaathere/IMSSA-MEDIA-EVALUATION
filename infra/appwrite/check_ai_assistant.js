import { Client, Functions } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const functions = new Functions(client);

try {
  const assistant = await functions.get('api-ai-assistant');
  const deployments = await functions.listDeployments('api-ai-assistant');
  const active = deployments.deployments.find((deployment) => deployment.$id === assistant.deployment);
  const variables = await functions.listVariables('api-ai-assistant');
  console.log(JSON.stringify({
    exists: true,
    enabled: assistant.enabled,
    deploymentId: assistant.deployment || null,
    deploymentStatus: active?.status || null,
    execute: assistant.execute,
    geminiConfigured: variables.variables.some((variable) => variable.key === 'GEMINI_API_KEY'),
  }, null, 2));
} catch (error) {
  if (error.code === 404) console.log(JSON.stringify({ exists: false }, null, 2));
  else throw error;
}
