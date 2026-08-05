import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function listDbs() {
    try {
        const dbs = await databases.list();
        console.log("Databases in this project:");
        for (const db of dbs.databases) {
            console.log(`- ${db.name} (ID: ${db.$id})`);
        }
    } catch (e) {
        console.error(e);
    }
}
listDbs();
