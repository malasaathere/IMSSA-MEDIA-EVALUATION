import { Client, Databases, ID } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const TASKS_COLLECTION = 'tasks';
const USERS_COLLECTION = 'users';

async function ingestTasks() {
    console.log("Starting task ingestion...");

    try {
        const usersResponse = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION);
        const users = usersResponse.documents;

        const designers = users.filter(u => u.roles && u.roles.includes('DESIGNER'));
        if (designers.length === 0) {
            console.log("No designers found. Aborting.");
            return;
        }
        
        const creators = users.filter(u => u.roles && u.roles.includes('MARKETING_COORDINATOR'));
        const creatorId = creators.length > 0 ? creators[0].authUserId : designers[0].authUserId;

        const sampleTasks = [
            {
                title: "Exposition 2026 Logo Design",
                description: "Create primary and secondary logo marks for the Exposition 2026 event. Needs to incorporate tech themes.",
                status: "IN_PROGRESS",
                priority: "HIGH",
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                currentAssigneeId: designers[0].authUserId,
                eventId: 'hackx_2026',
                workType: 'POSTER',
                createdById: creatorId
            },
            {
                title: "Podcast Ep 1 Thumbnail",
                description: "Thumbnail for the first episode featuring Mr. Saman. Must follow brand guidelines.",
                status: "PENDING",
                priority: "MEDIUM",
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                currentAssigneeId: designers.length > 1 ? designers[1].authUserId : designers[0].authUserId,
                eventId: 'hackx_2026',
                workType: 'POSTER',
                createdById: creatorId
            },
            {
                title: "HackX Social Media Launch Flyer",
                description: "Initial flyer for IG/FB announcing the date and registration open.",
                status: "COMPLETED",
                priority: "HIGH",
                deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                currentAssigneeId: designers.length > 2 ? designers[2].authUserId : designers[0].authUserId,
                eventId: 'hackx_2026',
                workType: 'POSTER',
                createdById: creatorId
            }
        ];

        // Clear existing mock tasks
        const existingTasks = await databases.listDocuments(DATABASE_ID, TASKS_COLLECTION);
        for (const task of existingTasks.documents) {
            await databases.deleteDocument(DATABASE_ID, TASKS_COLLECTION, task.$id);
            console.log(`Deleted existing task: ${task.title}`);
        }

        for (const task of sampleTasks) {
            await databases.createDocument(
                DATABASE_ID,
                TASKS_COLLECTION,
                ID.unique(),
                task
            );
            console.log(`Created task: ${task.title} for assignee ${task.currentAssigneeId}`);
        }

        console.log("\nSuccessfully ingested tasks!");

    } catch (error) {
        console.error("Error during ingestion:", error);
    }
}

ingestTasks();
