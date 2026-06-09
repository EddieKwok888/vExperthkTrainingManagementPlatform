const fs = require('fs');

const path = 'src/features/admin/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = "          {(activeTab === 'staff' || activeTab === 'students') && (";
const endStr = "          {activeTab === 'logs' && (";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const extracted = content.substring(startIndex + startStr.length, endIndex);
  console.log('Extracted length:', extracted.length);
  fs.writeFileSync('extracted_users.txt', startStr + extracted, 'utf8');
} else {
  console.log('Could not find start or end index', startIndex, endIndex);
}
