import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * [필독] 본인의 Firebase 프로젝트 연결 방법
 * 
 * 1. https://console.firebase.google.com/ 접속
 * 2. [프로젝트 추가] 클릭하여 새 프로젝트 생성
 * 3. 중앙의 [</> 웹] 아이콘 클릭하여 앱 등록
 * 4. 아래 'firebaseConfig' 부분에 본인의 설정값을 복사해서 붙여넣으세요.
 */
const firebaseConfig = {
  apiKey: "여기에_Firebase_콘솔에서_복사한_API_KEY를_넣으세요",
  authDomain: "본인의_프로젝트_ID.firebaseapp.com",
  projectId: "본인의_프로젝트_ID",
  storageBucket: "본인의_프로젝트_ID.firebasestorage.app",
  messagingSenderId: "본인의_SENDER_ID",
  appId: "본인의_APP_ID"
};

// API 키가 실제로 입력되었는지 엄격하게 확인
const isConfigValid = firebaseConfig.apiKey && 
                     firebaseConfig.apiKey !== "" && 
                     !firebaseConfig.apiKey.includes("여기에") &&
                     !firebaseConfig.apiKey.includes("API_KEY");

let app;
let db: any = null;

if (isConfigValid) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
}

export { db, isConfigValid };
