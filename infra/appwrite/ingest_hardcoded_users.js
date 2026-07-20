import { Client, Databases, Users, ID } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const appwriteUsers = new Users(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'imssa-media';
const USERS_COLLECTION = 'users';

const hardcodedUsers = [
    { name: "Tharushi", roles: ["CHIEF_COORDINATOR"] },
    { name: "Praveen", roles: ["CHIEF_COORDINATOR"] },
    { name: "Lavindi", roles: ["CHIEF_COORDINATOR"] },
    { name: "Harshana", roles: ["CHIEF_COORDINATOR"] },
    { name: "Dulaj", roles: ["DESIGNER", "CHIEF_COORDINATOR"] },
    { name: "Andrina", roles: ["CHIEF_COORDINATOR"] },
    { name: "Charith", roles: ["MARKETING_COORDINATOR"] },
    { name: "Manumi", roles: ["MARKETING_COORDINATOR"] },
    { name: "Wasana", roles: ["MARKETING_COORDINATOR"] },
    { name: "Tharushan", roles: ["MARKETING_COORDINATOR"] },
    { name: "Nadeesha", roles: ["MARKETING_COORDINATOR"] },
    { name: "Ravindu A", roles: ["MARKETING_COORDINATOR"] },
    { name: "Maleesha", roles: ["MEDIA_DIRECTOR", "VIDEO_EDITOR", "DESIGNER"] },
    { name: "Osanda", roles: ["DESIGNER", "MEDIA_DIRECTOR"] },
    { name: "Thanushika", roles: ["MEDIA_DIRECTOR"] },
    { name: "Isuru", roles: ["DESIGNER", "MEDIA_DIRECTOR"] },
    { name: "Chamika", roles: ["MEDIA_DIRECTOR"] },
    { name: "Nadeesha A", roles: ["MEDIA_DIRECTOR"] },
    { name: "Kaveesha", roles: ["DESIGNER"] },
    { name: "Kasun", roles: ["DESIGNER"] }
];

async function ingestUsers() {
    console.log("Starting ingestion...");
    let markdownOutput = `# Generated Passkeys\n\n`;

    try {
        for (const user of hardcodedUsers) {
            // Generate a random 4-digit PIN
            const passkey = Math.floor(1000 + Math.random() * 9000).toString();
            const syntheticEmail = `${passkey}@imssa.local`;
            
            // Appwrite requires a password of at least 8 chars. We'll pad the passkey.
            const paddedPassword = `${passkey}0000`; 

            // Create user in Appwrite Auth
            const authUser = await appwriteUsers.create(
                ID.unique(),
                syntheticEmail,
                null,
                paddedPassword,
                user.name
            );

            // Create record in `users` collection
            await databases.createDocument(
                DATABASE_ID,
                USERS_COLLECTION,
                ID.unique(),
                {
                    authUserId: authUser.$id,
                    name: user.name,
                    email: syntheticEmail,
                    passkey: passkey,
                    roles: user.roles
                }
            );

            console.log(`Created user: ${user.name} with passkey ${passkey} and roles ${user.roles.join(', ')}`);
            markdownOutput += `- **${user.name}** | Passkey: \`${passkey}\` | Roles: ${user.roles.join(', ')}\n`;
        }

        const outPath = path.join(process.cwd(), '../../generated_passkeys.md');
        fs.writeFileSync(outPath, markdownOutput);
        console.log(`\nSuccessfully wrote passkeys to ${outPath}`);

    } catch (error) {
        console.error("Error during ingestion:", error);
    }
}

ingestUsers();
