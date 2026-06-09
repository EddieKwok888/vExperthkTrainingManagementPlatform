const fs = require('fs');
const content = fs.readFileSync('src/features/admin/AdminDashboard.tsx', 'utf8');

let startIndex = 0;
while (true) {
  const openIdx = content.indexOf('<Dialog open={', startIndex);
  if (openIdx === -1) break;
  
  // Need to correctly find the matching </Dialog> considering nested Dialogs. 
  // Fortunately, these dialogs are probably not nested in the file structure since they are top level inside the return.
  let searchIdx = openIdx;
  let nesting = 0;
  let closeIdx = -1;
  while (true) {
    const nextOpen = content.indexOf('<Dialog', searchIdx + 1);
    const nextClose = content.indexOf('</Dialog>', searchIdx + 1);
    
    if (nextClose === -1) break;
    
    if (nextOpen !== -1 && nextOpen < nextClose) {
      if (content[nextOpen + 7] === ' ' || content[nextOpen + 7] === '>') {
        nesting++;
      }
      searchIdx = nextOpen;
    } else {
      nesting--;
      if (nesting === -1) {
        // found matching close
        closeIdx = nextClose;
        break;
      }
      searchIdx = nextClose;
    }
  }

  if (closeIdx === -1) break;
  
  const dialogBlock = content.substring(openIdx, closeIdx + '</Dialog>'.length);
  
  const firstLine = dialogBlock.split('\n')[0];
  const linesCount = dialogBlock.split('\n').length;
  console.log(`Open at ${content.substring(0, openIdx).split('\n').length}:`, firstLine, `  (${linesCount} lines)`);
  
  startIndex = closeIdx + '</Dialog>'.length;
}
