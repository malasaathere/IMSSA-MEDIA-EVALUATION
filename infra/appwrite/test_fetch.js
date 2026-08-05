import { Client, Databases, Query } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.APPWRITE_DATABASE_ID || 'imssa_media';

async function testFetch() {
    try {
        console.log(`Querying DB ${DB_ID} for authUserId = 'test_id' (just to check if index works)`);
        const result = await databases.listDocuments(DB_ID, 'users', [
            Query.equal('authUserId', 'test_id')
        ]);
        console.log("Query succeeded! Total:", result.total);
    } catch (e) {
        console.error("Query failed:", e.message);
    }
}
testFetch();
