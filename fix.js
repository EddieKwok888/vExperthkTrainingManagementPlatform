const fs = require('fs');
const lines = fs.readFileSync('src/features/student/StudentDashboard.tsx', 'utf8').split('\n');
const newLines = [...lines.slice(0, 312), ...lines.slice(383)];
fs.writeFileSync('src/features/student/StudentDashboard.tsx', newLines.join('\n'));
