import { Client, Databases, Permission, Role } from 'node-appwrite';
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
        console.log("Adding attributes to task_messages collection...");
        // Define attributes
        await ignoreConflict(databases.createStringAttribute(DB_ID, 'task_messages', 'taskId', 50, true));
        await ignoreConflict(databases.createStringAttribute(DB_ID, 'task_messages', 'senderId', 50, true));
        await ignoreConflict(databases.createStringAttribute(DB_ID, 'task_messages', 'senderName', 255, true));
        await ignoreConflict(databases.createStringAttribute(DB_ID, 'task_messages', 'content', 5000, true));
        
        console.log("Attributes created! Waiting for Appwrite to process them...");
        await new Promise(r => setTimeout(r, 4000));
        
        console.log("Creating indices...");
        await ignoreConflict(databases.createIndex(DB_ID, 'task_messages', 'taskId_index', 'key', ['taskId'], ['ASC']));

        console.log("Updating permissions to allow authenticated users to chat...");
        // Set permissions so anyone logged in can read and write to the chat
        await databases.updateCollection(DB_ID, 'task_messages', 'Task Messages', [
            Permission.read(Role.users()),
            Permission.create(Role.users()),
            Permission.update(Role.users()), // If they need to edit (optional)
            Permission.delete(Role.users())
        ]);
        
        console.log("Done configuring task_messages!");
    } catch (e) {
        console.error("Failed:", e.message);
    }
}

run();
