import fs from 'fs';
import { parse } from 'csv-parse/sync';

const data = fs.readFileSync('../../sheet_data.csv', 'utf8');
const records = parse(data, {
  columns: false,
  skip_empty_lines: true
});

// Row 3 (index 2) is the header
const header = records[2];
console.log("HEADER:", header);

const tasks = [];
let currentEvent = null;

for (let i = 4; i < records.length; i++) {
  const row = records[i];
  if (row[1] && row[1].trim() !== '') {
    currentEvent = row[1].trim();
  }
  
  if (row[2] && row[2].trim() !== '') {
    tasks.push({
      event: currentEvent,
      title: row[2].trim(),
      type: row[3] ? row[3].trim() : null,
      designer: row[4] ? row[4].trim() : null,
      designStatus: row[5] ? row[5].trim() : null,
      writer: row[6] ? row[6].trim() : null,
      captionStatus: row[7] ? row[7].trim() : null,
      finalStatus: row[8] ? row[8].trim() : null,
      handoverStatus: row[9] ? row[9].trim() : null,
      handoverDate: row[10] ? row[10].trim() : null,
      finishedBefore: row[11] ? row[11].trim() : null,
      dateShared: row[13] ? row[13].trim() : null,
      platform: row[14] ? row[14].trim() : null
    });
  }
}

console.log("FIRST 3 TASKS:");
console.log(JSON.stringify(tasks.slice(0, 3), null, 2));
