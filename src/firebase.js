// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAVLj1gx0s5XK2aV5fyFoHKahstjJ3gcuI",
  authDomain: "mrr3-6dcad.firebaseapp.com",
  projectId: "mrr3-6dcad",
  storageBucket: "mrr3-6dcad.firebasestorage.app",
  messagingSenderId: "747517851194",
  appId: "1:747517851194:web:4be7205ef6c8fd25d3e703",
  measurementId: "G-PD3PHXK5MV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
