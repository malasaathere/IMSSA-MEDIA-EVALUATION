const fs = require('fs');

const content = fs.readFileSync('sheet_data.csv', 'utf8');
const lines = content.split('\\n');

// Find header row to get indexes
let headerIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Designer') && lines[i].includes('Content Writer')) {
        headerIndex = i;
        break;
    }
}

if (headerIndex === -1) {
    console.log("Could not find headers");
    process.exit(1);
}

const headers = lines[headerIndex].split(',');
const designerIdx = headers.indexOf('Designer');
const writerIdx = headers.indexOf('Content Writer');

const users = new Map();

for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    if (row.length <= Math.max(designerIdx, writerIdx)) continue;
    
    const designer = row[designerIdx]?.trim();
    const writer = row[writerIdx]?.trim();

    if (designer) {
        const name = designer.toLowerCase();
        if (!users.has(name)) users.set(name, { name: designer, roles: new Set() });
        users.get(name).roles.add('Designer');
    }
    
    if (writer) {
        const name = writer.toLowerCase();
        if (!users.has(name)) users.set(name, { name: writer, roles: new Set() });
        users.get(name).roles.add('Content Writer');
    }
}

console.log("Found unique users:");
for (const [key, val] of users.entries()) {
    console.log(`- ${val.name}: ${Array.from(val.roles).join(', ')}`);
}
