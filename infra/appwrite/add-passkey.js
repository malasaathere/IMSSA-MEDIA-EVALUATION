import { Client, Databases, ID } from 'node-appwrite';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || 'imssa-media-staging')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

async function addPasskey() {
  try {
    await databases.createDocument('imssa_media', 'users', ID.unique(), {
      passkey: '1234',
      email: '1234@imssa.local'
    });
    console.log('Successfully added passkey 1234 to the database.');
  } catch (error) {
    console.error('Failed to add passkey:', error);
  }
}

addPasskey();
