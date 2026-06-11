const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  projectId: "gen-lang-client-0202962405",
  appId: "1:706877386137:web:c9547f2358d585435b3708",
  apiKey: "AIzaSyDIMdLzlPi2tanhKXNAnCdgNRv6Iq1BCT4",
  authDomain: "gen-lang-client-0202962405.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-3f3273cb-74ea-47b3-9822-07292d150a5b",
  storageBucket: "gen-lang-client-0202962405.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const coursesRef = collection(db, 'courses');
  const snapshot = await getDocs(coursesRef);
  let courseId = null;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.courseCode === 'AB-730' || (data.courseCode && data.courseCode.includes('AB-730'))) {
      courseId = doc.id;
    }
  });
  
  if (!courseId) {
    console.log("No course found with code AB-730");
    process.exit(1);
  }

  // Find the session for this course that starts around 2026-06-11
  const sessionsRef = collection(db, 'course_sessions');
  const sessionSnap = await getDocs(query(sessionsRef, where('courseId', '==', courseId)));
  let session = null;
  sessionSnap.forEach(doc => {
    const data = doc.data();
    if (data.startDate === '2026-06-11' || data.sessionName.includes('06-11')) {
      session = { id: doc.id, ...data };
    }
  });

  if (!session) {
    console.log("No session found starting on 2026-06-11. Available sessions for this course:");
    sessionSnap.forEach(d => console.log(d.id, d.data().sessionName, d.data().startDate));
    // Let's just pick the one the user might have meant, maybe it's WXvhqwTWEAeGQbzzUnyy which started on 06-10?
    // User explicitly said "2026-06-11 to 2026-06-12"
    process.exit(1);
  }

  const sessionId = session.id;
  console.log("Found session:", sessionId, session.sessionName);

  // Check if they already exist
  const lessonsQ = query(collection(db, 'lessons'), where('sessionId', '==', sessionId));
  const lessonsSnap = await getDocs(lessonsQ);
  const existingDates = lessonsSnap.docs.map(d => d.data().lessonDate);

  if (!existingDates.includes("2026-06-11")) {
    await addDoc(collection(db, 'lessons'), {
      sessionId: sessionId,
      lessonTitle: "Day 1",
      lessonDate: "2026-06-11",
      lessonNumber: 1,
      lessonStatus: "scheduled",
      startTime: "09:00",
      endTime: "18:00"
    });
    console.log("Added 2026-06-11");
  } else {
    console.log("2026-06-11 already exists");
  }

  if (!existingDates.includes("2026-06-12")) {
    await addDoc(collection(db, 'lessons'), {
      sessionId: sessionId,
      lessonTitle: "Day 2",
      lessonDate: "2026-06-12",
      lessonNumber: 2,
      lessonStatus: "scheduled",
      startTime: "09:00",
      endTime: "18:00"
    });
    console.log("Added 2026-06-12");
  } else {
    console.log("2026-06-12 already exists");
  }
  
  console.log("Done");
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
