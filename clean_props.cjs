const fs = require('fs');
const glob = require('fs').readdirSync('src/features/admin/components/modals').map(f => 'src/features/admin/components/modals/' + f);

const badProps = new Set([
  'sessionDates', 'sessionLessons', 'sm', 'md', 'lg', 'xl', 'start', 'todayStr', 'y', 'end', 'enrolled', 'lessonDate', 
  'session', 'endTime', 'startTime', 'course', 'date', 'instructor', 'label', 'month', 'allowed', 'i',
  'data', 'template', 'tutor', 'v', 'val', 'currentCourseTemplate', 'dates', 'hasOverlap', 
  'baseDates', 'current', 'currentIndex', 'd', 'displayDates', 'endD', 'isConfirmed', 'isFirstDay', 
  'isRecordPresent', 'pastDates', 'issuedAt', 'reg', 'total', 'tutorFeedbacks'
]);

// Wait, I should literally just remove these lines from the Props interfaces and destructuring in the modal files.
glob.forEach(file => {
   let content = fs.readFileSync(file, 'utf8');
   
   const lines = content.split('\n');
   const newLines = lines.filter(line => {
       // match interface property definition like '  sm: any;'
       const propMatch = line.match(/^\s*([a-zA-Z0-9_$]+)\s*:\s*any\s*;/);
       if (propMatch && badProps.has(propMatch[1])) return false;
       
       // match destructured argument like '  sm,'
       const destrMatch = line.match(/^\s*([a-zA-Z0-9_$]+)\s*,$/);
       if (destrMatch && badProps.has(destrMatch[1])) return false;
       
       return true;
   });
   
   let newContent = newLines.join('\n');
   
   // Fix anyRound
   newContent = newContent.replace(/anyRound/g, 'KeyRound');

   fs.writeFileSync(file, newContent, 'utf8');
});

// Fix AdminDashboard.tsx to remove any bad props that I might have missed
let adContent = fs.readFileSync('src/features/admin/AdminDashboard.tsx', 'utf8');
badProps.forEach(bad => {
   const rx = new RegExp(`\\s+${bad}=\\{${bad}\\}`, 'g');
   adContent = adContent.replace(rx, '');
});

// AdminDashboard.tsx 'PROMO_CATEGORIES' does not exist error on PromoModal
if (!adContent.includes('const PROMO_CATEGORIES')) {
   // actually PROMO_CATEGORIES is declared inside PromoModal now? No it's in AdminDashboard.
}

fs.writeFileSync('src/features/admin/AdminDashboard.tsx', adContent, 'utf8');
console.log('Cleaned up bad props');
