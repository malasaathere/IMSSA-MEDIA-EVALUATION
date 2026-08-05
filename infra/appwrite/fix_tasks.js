import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.APPWRITE_DATABASE_ID || 'imssa_media';

async function run() {
    try {
        console.log(`Checking tasks collection in ${DB_ID}...`);
        
        await databases.updateCollection(DB_ID, 'tasks', 'Tasks', [
            Permission.read(Role.users()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
        ]);
        console.log('Permissions updated for tasks collection.');
    } catch (e) {
        console.error("Error with tasks collection:", e.message);
    }
}

run();
