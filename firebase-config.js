import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXHMw_sAMyXVD_O18fYk_UEloyd2zuwx0",
  authDomain: "invasive-track.firebaseapp.com",
  projectId: "invasive-track",
  storageBucket: "invasive-track.firebasestorage.app",
  messagingSenderId: "354944475794",
  appId: "1:354944475794:web:72a5a2d3e0b53cd7127c4b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

signInAnonymously(auth).catch((error) => {
  console.error("Anonymous sign-in failed:", error);
});

export { db, collection, addDoc, getDocs, query, orderBy, auth, onAuthStateChanged, serverTimestamp };