import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.APPWRITE_DATABASE_ID || 'imssa_media';
const collectionId = 'marketing_plan_items';

const plans = [
    {
        campaign: 'HackX 2026',
        title: 'HackX 2026 Launch',
        description: 'Main event announcement flyer',
        type: 'Flyer',
        designer: 'Dulaj',
        designStatus: 'Planned',
        contentWriter: 'Unassigned',
        captionStatus: 'Planned',
        finalStatus: 'Planned',
        handoverStatus: 'Not Started',
        handoverDate: '2026-08-01',
        finishedBefore: '2026-08-05',
        dateToShare: '2026-08-10',
        dateShared: '',
        platform: 'Facebook, LinkedIn'
    },
    {
        campaign: 'HackX Jr 2026',
        title: 'HackX Jr School Registration',
        description: 'Call for school participants',
        type: 'Flyer',
        designer: 'Unassigned',
        designStatus: 'Planned',
        contentWriter: 'Unassigned',
        captionStatus: 'Planned',
        finalStatus: 'Planned',
        handoverStatus: 'Not Started',
        handoverDate: '2026-08-15',
        finishedBefore: '2026-08-20',
        dateToShare: '2026-08-25',
        dateShared: '',
        platform: 'Facebook, WhatsApp'
    }
];

async function ingest() {
    try {
        console.log(`Starting ingestion of HackX plans into DB: ${dbId}`);
        for (const item of plans) {
            await databases.createDocument(dbId, collectionId, ID.unique(), item);
            console.log(`Inserted: [${item.campaign}] ${item.title}`);
        }
        console.log('Ingestion complete!');
    } catch (error) {
        console.error('Ingestion error:', error);
    }
}

ingest();
