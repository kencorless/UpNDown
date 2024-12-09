// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDK8F33jAB8-k9Qx9TvBSDFkEKFQnjwShY",
  authDomain: "upndown-kc88.firebaseapp.com",
  databaseURL: "https://upndown-kc88-default-rtdb.firebaseio.com/",
  projectId: "upndown-kc88",
  storageBucket: "upndown-kc88.firebasestorage.app",
  messagingSenderId: "906102847004",
  appId: "1:906102847004:web:a4c67a9241f7a028d551d9",
  measurementId: "G-XFM1ZJ803X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);