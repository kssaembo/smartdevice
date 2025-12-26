
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * [연동 가이드]
 * 1. Firebase 콘솔 사이드바 최상단 '프로젝트 개요' 옆의 ⚙️(톱니바퀴) 클릭
 * 2. [프로젝트 설정] 선택 -> [일반] 탭 하단으로 스크롤
 * 3. '내 앱' 섹션에서 웹(</>) 아이콘 클릭하여 앱 등록
 * 4. 아래 객체의 값을 실제 발급받은 값으로 교체하세요.
 */
const firebaseConfig = {
  // 발급받은 값을 여기에 붙여넣으세요.
  apiKey: "AIzaSyA5V7v6oRnE8yVBtdSz714Bsz-9VeRtTKU",
  authDomain: "smart-device-management-system.firebaseapp.com",
  projectId: "smart-device-management-system",
  storageBucket: "smart-device-management-system.firebasestorage.app",
  messagingSenderId: "204878781002",
  appId: "1:204878781002:web:0a0720d028c0826e8264b3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
