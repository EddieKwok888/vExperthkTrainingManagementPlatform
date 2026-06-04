import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
    const usersRefs = await getDocs(collection(db, 'users'));
    const users = usersRefs.docs.map(d => ({id: d.id, ...d.data()}));
    
    console.log("Roles found:", Array.from(new Set(users.map(u => (u as any).role))));
    
    const lessonsRefs = await getDocs(collection(db, 'lessons'));
    const lessons = lessonsRefs.docs.map(d => ({id: d.id, ...d.data()}));
    console.log("Lessons count:", lessons.length);
    console.log("Sample lesson:", lessons[0]);

    if (users.length > 0) {
        console.log("Sample user:", users[0]);
    }
}

main().catch(console.error);
