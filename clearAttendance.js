import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function clearAttendance() {
  console.log('Clearing attendance collection...');
  const querySnapshot = await getDocs(collection(db, 'attendance'));
  let deleted = 0;
  for (const document of querySnapshot.docs) {
    await deleteDoc(document.ref);
    deleted++;
  }
  console.log(`Deleted ${deleted} attendance records.`);
  process.exit(0);
}

clearAttendance().catch(e => {
  console.error(e);
  process.exit(1);
});
