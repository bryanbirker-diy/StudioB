// firebase-config.js — shared across all ours modules
// Firebase API keys are safe to be public — security is enforced by Firestore Rules.

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyA8xN42dfu8aNkZrfVJw4bHIax8lrJ43zk",
  authDomain:        "ours-family.firebaseapp.com",
  projectId:         "ours-family",
  storageBucket:     "ours-family.firebasestorage.app",
  messagingSenderId: "1057442621727",
  appId:             "1:1057442621727:web:2d2f275dc421e3db22282a",
};

const fbApp  = firebase.initializeApp(FIREBASE_CONFIG);
const db     = firebase.firestore();
const fbAuth = firebase.auth();

// Expose as window properties so text/babel scripts can access them
// (Babel standalone's eval doesn't always see script-scoped const)
window.db     = db;
window.fbAuth = fbAuth;
window.fbApp  = fbApp;
