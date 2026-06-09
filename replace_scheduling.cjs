const fs = require('fs');

const path = 'src/features/admin/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = "          {activeTab === 'scheduling' && (";
const endStr = "          {activeTab === 'courses' && (";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `          {activeTab === 'scheduling' && (
            <SchedulingTab 
              scheduleTab={scheduleTab}
              setScheduleTab={setScheduleTab}
              scheduleDate={scheduleDate}
              setScheduleDate={setScheduleDate}
              scheduleMonth={scheduleMonth}
              setScheduleMonth={setScheduleMonth}
              scheduleInstructorFilter={scheduleInstructorFilter}
              setScheduleInstructorFilter={setScheduleInstructorFilter}
              scheduleRoomFilter={scheduleRoomFilter}
              setScheduleRoomFilter={setScheduleRoomFilter}
              schoolInfo={schoolInfo}
              courses={courses}
              sessions={sessions}
              lessons={lessons}
              tutors={tutors}
              regs={regs}
            />
          )}

`;
  
  content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully replaced SchedulingTab');
} else {
  console.log('Could not find start or end index', startIndex, endIndex);
}
