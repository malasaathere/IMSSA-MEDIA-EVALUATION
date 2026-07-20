import { Client, Databases, ID } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = 'imssa_media';
const SHEET_PATH = path.resolve(process.cwd(), '../../sheet_data.csv');

function generatePin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

async function run() {
    try {
        const content = fs.readFileSync(SHEET_PATH, 'utf8');
        // Actually split on \n or \r
        const lines = content.split(/\r\n|\n|\r/);
        console.log(`Read ${lines.length} lines from ${SHEET_PATH}`);

        let headerIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('Designer') && lines[i].includes('Content Writer')) {
                headerIndex = i;
                break;
            }
        }

        if (headerIndex === -1) {
            console.log("Could not find headers in sheet_data.csv");
            process.exit(1);
        }

        const headers = lines[headerIndex].split(',');
        const designerIdx = headers.indexOf('Designer');
        const writerIdx = headers.indexOf('Content Writer');

        console.log(`Found headers at index ${headerIndex}, Designer idx: ${designerIdx}, Writer idx: ${writerIdx}`);
        const users = new Map();

        for (let i = headerIndex + 1; i < lines.length; i++) {
            const row = lines[i].split(',');
            if (row.length <= Math.max(designerIdx, writerIdx)) continue;
            
            const designer = row[designerIdx]?.trim();
            const writer = row[writerIdx]?.trim();

            if (designer) {
                const name = designer.toLowerCase() === 'poojami' ? 'Poojani' : designer;
                const lowerName = name.toLowerCase();
                if (!users.has(lowerName)) users.set(lowerName, { name: name.charAt(0).toUpperCase() + name.slice(1), roles: new Set() });
                users.get(lowerName).roles.add('Designer');
            }
            
            if (writer) {
                const name = writer.toLowerCase() === 'poojami' ? 'Poojani' : writer;
                const lowerName = name.toLowerCase();
                if (!users.has(lowerName)) users.set(lowerName, { name: name.charAt(0).toUpperCase() + name.slice(1), roles: new Set() });
                users.get(lowerName).roles.add('Content Writer');
            }
        }

        console.log(`Parsed ${users.size} unique users.`);
        console.log("Generating passkeys and ingesting users into Appwrite...");
        
        const generatedPins = new Set();
        const results = [];
        
        for (const [key, val] of users.entries()) {
            let pin;
            do {
                pin = generatePin();
            } while (generatedPins.has(pin));
            generatedPins.add(pin);
            
            const rolesArr = Array.from(val.roles);
            
            try {
                await databases.createDocument(
                    DB_ID,
                    'users',
                    ID.unique(),
                    {
                        name: val.name,
                        passkey: pin,
                        roles: rolesArr
                    }
                );
                
                results.push(`- **${val.name}**: \`${pin}\` (Roles: ${rolesArr.join(', ')})`);
                console.log(`Ingested: ${val.name} with pin ${pin}`);
            } catch (err) {
                console.error(`Failed to ingest ${val.name}:`, err.message);
            }
        }
        
        const artifactPath = path.resolve(process.cwd(), '../../generated_passkeys.md');
        fs.writeFileSync(artifactPath, '# Generated User Passkeys\n\n' + results.join('\n'));
        console.log(`\nAll done! Passkeys written to generated_passkeys.md`);
        
    } catch (e) {
        console.error("Script failed:", e);
    }
}

run();
