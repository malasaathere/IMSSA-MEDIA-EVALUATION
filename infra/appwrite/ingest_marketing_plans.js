import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.APPWRITE_DATABASE_ID || 'imssa_media';
const collectionId = 'marketing_plan_items';

function parseCSVLine(text) {
    const result = [];
    let startValue = 0;
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') {
            inQuotes = !inQuotes;
        } else if (text[i] === ',' && !inQuotes) {
            result.push(text.substring(startValue, i).replace(/^"|"$/g, '').trim());
            startValue = i + 1;
        }
    }
    result.push(text.substring(startValue).replace(/^"|"$/g, '').trim());
    return result;
}

async function ingestPlans() {
    try {
        const filePath = path.join(__dirname, '..', '..', 'sheet_data.csv');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n');

        let currentCampaign = 'Uncategorized';
        let currentTitle = '';

        console.log(`Starting ingestion into DB: ${dbId}`);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = parseCSVLine(line);
            
            // Check if it's a completely empty row (all commas)
            if (cols.every(c => !c)) continue;

            const col1 = cols[1] || '';
            const col2 = cols[2] || '';
            const col3 = cols[3] || '';

            // If it's the header row, skip
            if (col1 === 'Title' && col2 === 'Post Description') continue;

            // If it's a campaign header (Col 1 has value, Col 2+ are empty)
            if (col1 && !col2 && !col3 && !cols[4] && !cols[5]) {
                currentCampaign = col1;
                console.log(`\nFound Campaign: ${currentCampaign}`);
                continue;
            }

            // If Col 1 has a value, update currentTitle
            if (col1) {
                currentTitle = col1;
            }

            // If Col 2 is empty but there's a title, it might be a malformed row, or if Col 2 has value, it's a data row
            if (col2 || col3) {
                const item = {
                    campaign: currentCampaign,
                    title: currentTitle || currentCampaign,
                    description: col2,
                    type: col3,
                    designer: cols[4] || '',
                    designStatus: cols[5] || '',
                    contentWriter: cols[6] || '',
                    captionStatus: cols[7] || '',
                    finalStatus: cols[8] || '',
                    handoverStatus: cols[9] || '',
                    handoverDate: cols[10] || '',
                    finishedBefore: cols[11] || '',
                    dateToShare: cols[12] || '',
                    dateShared: cols[13] || '',
                    platform: cols[14] || ''
                };

                // Remove undefined or empty string values if they cause issues, but appwrite allows empty strings for string attributes.
                // Insert into DB
                try {
                    await databases.createDocument(dbId, collectionId, ID.unique(), item);
                    console.log(`Inserted: [${item.campaign}] ${item.title} - ${item.description}`);
                } catch (err) {
                    console.error(`Failed to insert: ${item.title} - ${item.description}. Error: ${err.message}`);
                }
            }
        }
        
        console.log('\nIngestion complete!');
    } catch (error) {
        console.error('Ingestion error:', error);
    }
}

ingestPlans();
