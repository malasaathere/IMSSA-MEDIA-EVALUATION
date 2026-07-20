import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'infra/appwrite/.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function run() {
    try {
        console.log("Updating users collection permissions...");
        await databases.updateCollection(
            'imssa_media',
            'users',
            'Users',
            [
                Permission.read(Role.any()), // Allow anyone (including guests) to read, so login works!
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ]
        );
        console.log("Permissions updated successfully!");
    } catch (e) {
        console.error("Failed:", e.message);
    }
}

run();
