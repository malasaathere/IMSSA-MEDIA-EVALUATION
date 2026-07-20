import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.APPWRITE_DATABASE_ID || 'imssa-media';

async function ignoreConflict(promise) {
    try {
        await promise;
    } catch (err) {
        if (err.code !== 409) throw err;
    }
}

async function run() {
    try {
        console.log("Adding new attributes to users collection...");
        await ignoreConflict(databases.createStringAttribute(DB_ID, 'users', 'name', 255, false));
        await ignoreConflict(databases.createStringAttribute(DB_ID, 'users', 'authUserId', 50, false));
        await ignoreConflict(databases.createStringAttribute(DB_ID, 'users', 'roles', 255, false, undefined, true)); // array of strings
        console.log("Attributes added! Waiting a few seconds for Appwrite to process them...");
        
        // Wait for Appwrite to create attributes
        await new Promise(r => setTimeout(r, 3000));
        console.log("Done!");
    } catch (e) {
        console.error("Failed:", e.message);
    }
}

run();
