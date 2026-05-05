// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDoo3iareRXCMrsEhyyjhQYg0haPECeNHg",
  authDomain: "dikie001-portfolio.firebaseapp.com",
  projectId: "dikie001-portfolio",
  storageBucket: "dikie001-portfolio.firebasestorage.app",
  messagingSenderId: "276315203899",
  appId: "1:276315203899:web:e87048fd281d439310ef1e",
  measurementId: "G-912907EB5B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, db, googleProvider };

