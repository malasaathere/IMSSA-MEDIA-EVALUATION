import { Client, Databases } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const USERS_COLLECTION = 'users';

async function dumpDatabase() {
    try {
        console.log("Fetching users from database...");
        const response = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION
        );

        let markdownOutput = `# Live Database Dump: Users Table\n\n`;
        markdownOutput += `*Total records found: ${response.total}*\n\n`;
        
        markdownOutput += `| Name | Passkey | Email | Roles | Document ID |\n`;
        markdownOutput += `|---|---|---|---|---|\n`;

        for (const doc of response.documents) {
            markdownOutput += `| ${doc.name} | \`${doc.passkey || 'MISSING'}\` | ${doc.email} | ${doc.roles ? doc.roles.join(', ') : 'NONE'} | ${doc.$id} |\n`;
        }

        // We will output this to the terminal so we can capture it, or save it as an artifact
        const outPath = path.join(process.cwd(), '../../.gemini/antigravity-ide/brain/c2fa52d7-a6c4-4bbc-ab36-a7f730527908/database_dump.md');
        // Ensure the directory exists (it should, but just in case we write locally first)
        fs.writeFileSync('database_dump.md', markdownOutput);
        console.log("Database dump generated successfully!");
    } catch (error) {
        console.error("Failed to dump database:", error);
    }
}

dumpDatabase();
