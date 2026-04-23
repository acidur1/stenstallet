import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBtjAmGe8DoIN3tfN2wIraSH5A_jruqh3o",
  authDomain: "stenstallet-cdf6c.firebaseapp.com",
  projectId: "stenstallet-cdf6c",
  storageBucket: "stenstallet-cdf6c.firebasestorage.app",
  messagingSenderId: "757891030329",
  appId: "1:757891030329:web:885a9db3fdc41688ba5ce8",
};

const firebaseApp = initializeApp(firebaseConfig);
export const db   = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

export const saveDoc = async (path, data) => {
  try { await setDoc(doc(db, ...path.split("/")), data, { merge: true }); }
  catch (e) { console.error("Firebase write error:", e); }
};
