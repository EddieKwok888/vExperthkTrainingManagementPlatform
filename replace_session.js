import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function fixLessons() {
  const sessionsSnap = await db.collection('course_sessions').get();
  let count = 0;
  for (const sessionDoc of sessionsSnap.docs) {
    const session = sessionDoc.data();
    const lessonsSnap = await db.collection('lessons').where('sessionId', '==', sessionDoc.id).get();
    
    if (lessonsSnap.empty) {
      console.log(`Session ${sessionDoc.id} has no lessons. Generating one default lesson...`);
      await db.collection('lessons').add({
        sessionId: sessionDoc.id,
        lessonTitle: 'Schedule Pending',
        lessonNumber: 1,
        lessonDate: session.startDate || '2026-06-01',
        startTime: '19:00',
        endTime: '21:00',
        tutorId: session.tutorId || '',
        classroom: session.classroom || '',
        meetingLink: session.meetingLink || '',
        lessonStatus: 'scheduled',
        createdAt: new Date()
      });
      count++;
    }
  }
  console.log(`Generated default lessons for ${count} sessions.`);
}

fixLessons().catch(console.error);
