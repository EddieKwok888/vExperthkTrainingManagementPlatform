const fs = require('fs');
const glob = require('fs').readdirSync('src/features/admin/components/modals').map(f => 'src/features/admin/components/modals/' + f);

glob.forEach(file => {
  let text = fs.readFileSync(file, 'utf8');
  
  // Find all lucide-react import lines
  const lines = text.split('\n');
  const lucideLines = lines.filter(l => l.includes('lucide-react'));
  
  if (lucideLines.length > 0) {
     let allIcons = new Set();
     
     // Extract all words that could be icons
     lucideLines.forEach(l => {
        const matches = l.match(/([a-zA-Z0-9_$]+(\s+as\s+[a-zA-Z0-9_$]+)?)/g);
        if (matches) matches.forEach(m => {
           if (!['import', 'from', 'lucide', 'react'].includes(m.trim())) {
               allIcons.add(m.trim());
           }
        });
     });
     
     // Remove old lucide lines
     text = lines.filter(l => !l.includes('lucide-react')).join('\n');
     
     // Prepend the combined import
     if (allIcons.size > 0) {
         text = `import { ${[...allIcons].join(', ')} } from 'lucide-react';\n` + text;
     }
  }

  // Same thing for firebase
  const fbLines = text.split('\n').filter(l => l.includes('firebase/firestore'));
  if (fbLines.length > 0) {
    let allFb = new Set();
    fbLines.forEach(l => {
       const matches = l.match(/([a-zA-Z0-9_$]+)/g);
       if (matches) matches.forEach(m => {
          if (!['import', 'from', 'firebase', 'firestore'].includes(m)) allFb.add(m);
       });
    });
    text = text.split('\n').filter(l => !l.includes('firebase/firestore')).join('\n');
    text = `import { ${[...allFb].join(', ')} } from 'firebase/firestore';\n` + text;
  }
  
  fs.writeFileSync(file, text, 'utf8');
});
console.log('Fixed imports syntaxes');
