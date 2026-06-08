import fs from 'fs';

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace specific capitalized phrases first
    content = content.replace(/Session Certificates/g, 'Course Certificates');
    content = content.replace(/Session Name/g, 'Course Name');
    content = content.replace(/Session Details/g, 'Course Details');
    content = content.replace(/Sessions & Attendance/g, 'Courses & Attendance');
    content = content.replace(/Session Attendance/g, 'Course Attendance');
    content = content.replace(/View Session/g, 'View Course');
    content = content.replace(/Edit Session/g, 'Edit Course');
    content = content.replace(/Create Session/g, 'Create Course');
    content = content.replace(/New Session/g, 'New Course');
    content = content.replace(/Duplicate Session/g, 'Duplicate Course');
    content = content.replace(/Cancel Session/g, 'Cancel Course');
    content = content.replace(/Reschedule Session/g, 'Reschedule Course');
    content = content.replace(/Delete Session/g, 'Delete Course');
    content = content.replace(/All Sessions/g, 'All Courses');
    content = content.replace(/Completed Sessions/g, 'Completed Courses');
    content = content.replace(/Active Sessions/g, 'Active Courses');
    content = content.replace(/Session:/g, 'Course:');
    
    // We shouldn't replace lower case "session" because it's used in properties like `sessionId`, `sessionStatus`.
    // Wait, the user said "所有Session未眼轉為Course" -> "All Session words to Course".
    // "Session Date" -> "Course Date". We did this manually already but let's cover it just in case.
    content = content.replace(/Session Date/g, 'Course Date');
    
    // Any remaining "Session" with boundaries (in text/JSX)
    // Be careful with property names like "SessionCreationModalOpen" etc.
    // Let's only target visible labels like `"Session created!"`, `"Session "`
    content = content.replace(/"Session /g, '"Course ');
    content = content.replace(/ Session"/g, ' Course"');
    content = content.replace(/"Sessions /g, '"Courses ');
    content = content.replace(/>Session</g, '>Course<');
    content = content.replace(/>Sessions</g, '>Courses<');
    content = content.replace(/>Session /g, '>Course ');
    content = content.replace(/ Session</g, ' Course<');
    content = content.replace(/>Sessions /g, '>Courses ');
    content = content.replace(/ Sessions</g, ' Courses<');
    content = content.replace(/'Session /g, '\'Course ');
    content = content.replace(/ Session'/g, ' Course\'');
    content = content.replace(/Session created!/g, 'Course created!');
    content = content.replace(/Session updated successfully/g, 'Course updated successfully');
    content = content.replace(/Session duplicated successfully!/g, 'Course duplicated successfully!');
    content = content.replace(/Session rescheduled/g, 'Course rescheduled');
    content = content.replace(/Session cannot overlap/g, 'Course cannot overlap');
    content = content.replace(/Session \$\{/g, 'Course \$\{');
    content = content.replace(/Course \/ Session/g, 'Course \/ Course'); // Wait, Course / Course is weird.
    
    // Handle "Course / Session"
    content = content.replace(/Course \/ Session/g, 'Course / Intake'); 
    
    fs.writeFileSync(filePath, content, 'utf-8');
}

['src/features/admin/AdminDashboard.tsx', 'src/features/instructor/InstructorDashboard.tsx'].forEach(replaceInFile);

console.log("Replaced UI texts.");
