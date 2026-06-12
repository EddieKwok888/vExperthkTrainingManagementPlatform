import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import firebaseConfig from './firebase-applet-config.json' assert { type: "json" };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

async function check() {
  // 1. Get user
  const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', 'trainer@vexperthk.com')));
  if (usersSnap.empty) {
    console.log("User not found!");
    return;
  }
  const user = usersSnap.docs[0];
  const uid = user.id;
  console.log("User ID:", uid, user.data().name);

  // 2. Get sessions for this user
  const sessionsSnap = await getDocs(collection(db, 'sessions'));
  const sessions = sessionsSnap.docs.map(d => ({id: d.id, ...d.data()})).filter((s:any) => s.tutorId === uid || s.tutor_id === uid);
  console.log("Found", sessions.length, "sessions directly assigned to tutor");

  // 3. Get lessons for these sessions or this user
  const lessonsSnap = await getDocs(collection(db, 'lessons'));
  const lessons = lessonsSnap.docs.map(d => ({id: d.id, ...d.data()}));
  const tutorLessons = lessons.filter((l:any) => l.tutorId === uid || l.tutor_id === uid || sessions.some(s => s.id === l.sessionId || s.id === l.session_id));
  console.log("Found", tutorLessons.length, "lessons for this tutor");

  // 4. Get courses for these sessions
  const coursesSnap = await getDocs(collection(db, 'courses'));
  const courses = coursesSnap.docs.map(d => ({id: d.id, ...d.data()}));

  // Analyze
  console.log("\n--- Lessons assigned to this tutor ---");
  tutorLessons.forEach((l:any) => {
    const session = sessions.find(s => s.id === l.sessionId || s.id === l.session_id) || sessionsSnap.docs.map(d => ({id:d.id, ...d.data()})).find((s:any) => s.id === l.sessionId || s.id === l.session_id);
    const course = session ? courses.find((c:any) => c.id === session.courseId) : null;
    console.log("");
    console.log("Lesson ID:", l.id);
    console.log("Date:", l.lessonDate || l.lesson_date);
    console.log("Assigned to tutorId:", l.tutorId || l.tutor_id || session?.tutorId || session?.tutor_id);
    console.log("Course Title:", course?.title);
    console.log("Course Category:", course?.category);
    console.log("Session Name:", session?.sessionName);
  });

  const hoursSnap = await getDocs(query(collection(db, 'tutor_hours'), where('tutorId', '==', uid)));
  console.log("\n--- Manual Hours ---");
  hoursSnap.docs.forEach(d => {
      const data = d.data();
      console.log(data.date, data.course, data.hours, data.isManual ? "Manual" : "Auto");
  });
  
  process.exit(0);
}

check().catch(console.error);
