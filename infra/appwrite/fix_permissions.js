import { Client, Databases, Permission, Role } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const USERS_COLLECTION = 'users';

async function fixPermissions() {
    try {
        console.log("Updating permissions for users collection...");
        // In Appwrite, we need to allow unauthenticated users (guests) to query the passkeys
        // so they can log in. We grant read access to anyone.
        await databases.updateCollection(
            DATABASE_ID,
            USERS_COLLECTION,
            'Users (Legacy/Auth)',
            [
                Permission.read(Role.any())
            ]
        );
        console.log("Successfully updated permissions! Guests can now read the users collection.");
    } catch (error) {
        console.error("Failed to update permissions:", error);
    }
}

fixPermissions();
