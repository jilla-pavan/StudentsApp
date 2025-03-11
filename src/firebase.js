// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Initialize Firebase

const firebaseConfig = {
  apiKey: "AIzaSyCaQORL9YY5hsBJrqI0S6rgVLUygmzsN3s",
  authDomain: "studentsdashboard-6b96f.firebaseapp.com",
  projectId: "studentsdashboard-6b96f",
  storageBucket: "studentsdashboard-6b96f.firebasestorage.app",
  messagingSenderId: "523160780763",
  appId: "1:523160780763:web:058709493973a606af31fe",
  measurementId: "G-BBVK2J2DTN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app); 