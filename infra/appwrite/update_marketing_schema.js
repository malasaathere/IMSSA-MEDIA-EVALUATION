import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Use the production database ID
const dbId = process.env.APPWRITE_DATABASE_ID || 'imssa-media';

async function updateMarketingSchema() {
    try {
        console.log(`Updating marketing_plan_items schema in DB: ${dbId}`);
        const collectionId = 'marketing_plan_items';

        // Set permissions to ensure it can be read by anyone and created by users
        await databases.updateCollection(dbId, collectionId, 'Marketing Plan Items', [
            Permission.read(Role.users()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
        ]);

        console.log('Collection permissions updated.');

        const attributes = [
            { id: 'campaign', type: 'string', size: 255, required: true },
            { id: 'title', type: 'string', size: 255, required: true },
            { id: 'description', type: 'string', size: 5000, required: false },
            { id: 'type', type: 'string', size: 255, required: false },
            { id: 'designer', type: 'string', size: 255, required: false },
            { id: 'designStatus', type: 'string', size: 255, required: false },
            { id: 'contentWriter', type: 'string', size: 255, required: false },
            { id: 'captionStatus', type: 'string', size: 255, required: false },
            { id: 'finalStatus', type: 'string', size: 255, required: false },
            { id: 'handoverStatus', type: 'string', size: 255, required: false },
            { id: 'handoverDate', type: 'string', size: 255, required: false },
            { id: 'finishedBefore', type: 'string', size: 255, required: false },
            { id: 'dateToShare', type: 'string', size: 255, required: false },
            { id: 'dateShared', type: 'string', size: 255, required: false },
            { id: 'platform', type: 'string', size: 255, required: false },
            { id: 'sourceTab', type: 'string', size: 255, required: false },
            { id: 'sourceRow', type: 'string', size: 32, required: false },
            { id: 'sourceKey', type: 'string', size: 255, required: false },
            { id: 'normalizedShareDate', type: 'string', size: 32, required: false },
            { id: 'normalizedFinishedDate', type: 'string', size: 32, required: false },
            { id: 'googleCalendarEventId', type: 'string', size: 255, required: false },
            { id: 'lastSyncedAt', type: 'string', size: 64, required: false }
        ];

        for (const attr of attributes) {
            try {
                await databases.createStringAttribute(dbId, collectionId, attr.id, attr.size, attr.required);
                console.log(`Created attribute: ${attr.id}`);
            } catch (err) {
                if (err.message.includes('already exists')) {
                    console.log(`Attribute ${attr.id} already exists`);
                } else {
                    console.error(`Error creating attribute ${attr.id}:`, err.message);
                }
            }
        }

        console.log('Marketing schema update complete.');
    } catch (error) {
        console.error('Error updating schema:', error);
    }
}

updateMarketingSchema();
