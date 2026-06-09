const fs = require('fs');
const content = fs.readFileSync('extracted_sessions.txt', 'utf8');

const regex = /\b(toast|db|doc|collection|cn|deleteDoc|isWeekendOrHoliday)\b/g;
let matches = [...content.matchAll(regex)].map(m => m[0]);
console.log(Array.from(new Set(matches)).join('\n'));
