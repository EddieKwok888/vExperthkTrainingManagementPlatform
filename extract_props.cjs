const fs = require('fs');
const content = fs.readFileSync('extracted_sessions.txt', 'utf8');

const regex = /\b(set[A-Z][a-zA-Z0-9_]*|handle[A-Z][a-zA-Z0-9_]*|selected[A-Z][a-zA-Z0-9_]*)\b/g;
let matches = [...content.matchAll(regex)].map(m => m[0]);
console.log(Array.from(new Set(matches)).join('\n'));
