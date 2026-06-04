import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function testCreate() {
  try {
    const docRef = await addDoc(collection(db, 'registrations'), {
      courseId: "test",
      sessionId: "test",
      studentName: "test",
      studentEmail: "test@test.com",
      status: "pending",
      amount: 100,
      createdAt: serverTimestamp(),
    });
    console.log("Success: ", docRef.id);
  } catch (e: any) {
    console.log("Error: ", e.message);
  }
}

testCreate();
