const fs = require('fs');
let adContent = fs.readFileSync('src/features/admin/AdminDashboard.tsx', 'utf8');

// I will remove all assignments in AdminDashboard like:
// sessionDates={sessionDates}
// sessionLessons={sessionLessons}
// sm={sm}
// start={start}
// todayStr={todayStr}
// y={y}
// end={end}
// enrolled={enrolled}
// lessonDate={lessonDate}
// session={session}
// endTime={endTime}
// startTime={startTime}
// course={course}
// date={date}
// instructor={instructor}
// label={label}
// month={month}
// allowed={allowed}
// i={i}

const badProps = [
  'sessionDates', 'sessionLessons', 'sm', 'start', 'todayStr', 'y', 'end', 'enrolled', 'lessonDate', 
  'session', 'endTime', 'startTime', 'course', 'date', 'instructor', 'label', 'month', 'allowed', 'i', 'md', 'lg', 'xl'
];

badProps.forEach(v => {
  const regex = new RegExp(`\\s+${v}=\\{${v}\\}`, 'g');
  adContent = adContent.replace(regex, '');
});

fs.writeFileSync('src/features/admin/AdminDashboard.tsx', adContent, 'utf8');
console.log('Fixed bad props in AdminDashboard.tsx');
