import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.APPWRITE_DATABASE_ID || 'imssa_media';
const collectionId = 'designer_packs';

async function setupDesignerPacks() {
    try {
        console.log('Checking if designer_packs collection exists...');
        try {
            await databases.getCollection(dbId, collectionId);
            console.log('Collection already exists.');
        } catch (err) {
            if (err.code === 404) {
                console.log('Creating designer_packs collection...');
                await databases.createCollection(dbId, collectionId, 'Designer Packs');
                
                await databases.createStringAttribute(dbId, collectionId, 'text', 255, true);
                
                // Wait a bit for the attribute to be fully created
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log('Collection created successfully.');
            } else {
                throw err;
            }
        }

        console.log('Inserting default checklist items...');
        const items = [
            'Check contrast ratios',
            'Verify required dimensions',
            'Ensure IMSSA branding is present',
            'Check safe zones for social media cropping'
        ];

        for (const text of items) {
            await databases.createDocument(dbId, collectionId, ID.unique(), { text });
            console.log(`Inserted: ${text}`);
        }

        console.log('Designer packs setup complete!');
    } catch (error) {
        console.error('Setup error:', error);
    }
}

setupDesignerPacks();
