const fs = require('fs');

const path = 'src/features/admin/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Get everything from "export function AdminDashboard" to "return ("
const startMatch = content.indexOf('export function AdminDashboard');
const returnMatch = content.lastIndexOf('return (');

const header = content.substring(startMatch, returnMatch);
const declarations = [...header.matchAll(/(?:const|let|var|function)\s+(?:\[?\s*([a-zA-Z0-9_$]+)(?:\s*,\s*([a-zA-Z0-9_$]+))?\s*\]?|([a-zA-Z0-9_$]+))\s*(?:=|:|\()/g)];

const validVars = new Set();
// some globals as well:
validVars.add('db');
// Add all imported things? No, we just need everything that the dialogs might reference from AdminDashboard scope.

declarations.forEach(m => {
  if (m[1]) validVars.add(m[1]);
  if (m[2]) validVars.add(m[2]);
  if (m[3]) validVars.add(m[3]);
});

// also extract role & user
validVars.add('user');
validVars.add('role');
validVars.add('courses');
validVars.add('sessions');
validVars.add('tutors');
validVars.add('regs');
validVars.add('schoolInfo');
validVars.add('allUsers');

fs.writeFileSync('valid_vars.json', JSON.stringify([...validVars]));
console.log('Valid vars:', validVars.size);
