import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.APPWRITE_DATABASE_ID || 'imssa_media';

async function createIndex() {
    try {
        console.log(`Checking/Creating index on authUserId for DB: ${DB_ID}`);
        await databases.createIndex(
            DB_ID,
            'users',
            'authUserId_index',
            'key',
            ['authUserId'],
            ['ASC']
        );
        console.log("Index created successfully.");
    } catch (e) {
        console.error("Failed to create index (might already exist):", e.message);
    }
}
createIndex();
