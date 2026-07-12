import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBGhubJl1DFuOzYcjYUPBGBQ4r15dQLyIA",
  authDomain: "chat-app-32ee5.firebaseapp.com",
  projectId: "chat-app-32ee5",
  storageBucket: "chat-app-32ee5.firebasestorage.app",
  messagingSenderId: "845295011176",
  appId: "1:845295011176:web:f1595854660117b58782dd",
  measurementId: "G-EBHCT2MX9T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
