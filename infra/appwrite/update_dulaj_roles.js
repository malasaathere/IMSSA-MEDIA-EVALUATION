import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.APPWRITE_DATABASE_ID || 'imssa_media';
const collectionId = 'users';

async function updateDulaj() {
    try {
        console.log('Fetching users to find Dulaj Malporu...');
        const response = await databases.listDocuments(dbId, collectionId, []);
        
        const user = response.documents.find(u => u.name && u.name.includes('Dulaj'));

        if (!user) {
            console.log('Dulaj not found in the users collection!');
            return;
        }
        console.log(`Found user: ${user.name} (${user.$id})`);

        const roles = new Set(user.roles || []);
        roles.add('CHIEF_COORDINATOR');
        roles.add('DESIGNER');

        await databases.updateDocument(dbId, collectionId, user.$id, {
            roles: Array.from(roles)
        });

        console.log('Successfully updated Dulaj Malporu roles.');
    } catch (error) {
        console.error('Update error:', error);
    }
}

updateDulaj();
