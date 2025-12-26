import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * [주의] 이 부분에 Firebase 콘솔에서 복사한 본인의 정보를 정확히 붙여넣으세요.
 * 프로젝트 설정 > 내 앱 > 웹 앱(SDK 설정)에서 확인할 수 있습니다.
 */
const firebaseConfig = {
  apiKey: "AIzaSyA5V7v6oRnE8yVBtdSz714Bsz-9VeRtTKU",
  authDomain: "smart-device-management-system.firebaseapp.com",
  projectId: "smart-device-management-system",
  storageBucket: "smart-device-management-system.firebasestorage.app",
  messagingSenderId: "204878781002",
  appId: "1:204878781002:web:0a0720d028c0826e8264b3"
};

// 설정값이 실제로 채워졌는지 검사하는 로직
const isConfigValid = 
  firebaseConfig.apiKey !== "" && 
  !firebaseConfig.apiKey.includes("여기에") &&
  firebaseConfig.projectId !== "" &&
  !firebaseConfig.projectId.includes("본인의");

let app;
let db: any = null;

if (isConfigValid) {
  try {
    // 이미 초기화된 앱이 있으면 재사용, 없으면 새로 초기화
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase 초기화 에러:", error);
  }
}

export { db, isConfigValid };
