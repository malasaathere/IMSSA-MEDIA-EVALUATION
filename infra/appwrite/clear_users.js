import { Client, Databases, Users } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const USERS_COLLECTION = 'users';

async function clearUsers() {
    console.log("Starting to clear all users...");
    try {
        // 1. Clear from Auth
        console.log("Clearing Appwrite Auth accounts...");
        const authUsersList = await users.list();
        for (const user of authUsersList.users) {
            await users.delete(user.$id);
            console.log(`Deleted auth user: ${user.$id}`);
        }

        // 2. Clear from Database
        console.log("Clearing 'users' collection documents...");
        const dbUsersList = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION);
        for (const doc of dbUsersList.documents) {
            await databases.deleteDocument(DATABASE_ID, USERS_COLLECTION, doc.$id);
            console.log(`Deleted database document: ${doc.$id}`);
        }

        console.log("Successfully cleared all users!");
    } catch (error) {
        console.error("Error clearing users:", error);
    }
}

clearUsers();
