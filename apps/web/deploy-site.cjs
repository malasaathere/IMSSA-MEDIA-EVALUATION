const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { Client, Sites } = require('node-appwrite');
const { InputFile } = require('node-appwrite/file');

const environmentFile = path.resolve(__dirname, '../../infra/appwrite/.env');
for (const line of fs.readFileSync(environmentFile, 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
  if (!match) continue;
  const [, key, rawValue] = match;
  process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
}

const required = ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing ${key} in infra/appwrite/.env`);
}

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const sites = new Sites(client);
const siteId = process.env.APPWRITE_SITE_ID || 'web-frontend';
const archivePath = '/tmp/imssa-web-frontend.tar.gz';

async function deploy() {
  try {
    await sites.get(siteId);
  } catch (exception) {
    if (exception.code !== 404) throw exception;
    await sites.create({ siteId, name: 'Web Frontend', framework: 'nextjs', buildRuntime: 'node-22' });
  }

  execFileSync('tar', ['-czf', archivePath, '-C', 'out', '.'], { cwd: __dirname });
  const deployment = await sites.createDeployment({
    siteId,
    code: InputFile.fromPath(archivePath, 'imssa-web-frontend.tar.gz'),
    activate: true,
  });
  console.log(`Frontend deployment created: ${deployment.$id}`);
}

deploy().catch((exception) => {
  console.error(exception.message);
  process.exitCode = 1;
});
