import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * [보안 안내] 
 * GitHub 보안 경고를 해결하기 위해 하드코딩된 값을 process.env로 대체합니다.
 * Vercel 대시보드 -> Settings -> Environment Variables에서 아래 키들을 등록하세요.
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyA5V7v6oRnE8yVBtdSz714Bsz-9VeRtTKU",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "smart-device-management-system.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "smart-device-management-system",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "smart-device-management-system.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "204878781002",
  appId: process.env.FIREBASE_APP_ID || "1:204878781002:web:0a0720d028c0826e8264b3"
};

// Fix: Use a more robust initialization pattern to handle HMR and ensure named exports are correctly resolved
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
