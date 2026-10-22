import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  connectAuthEmulator,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
} from "firebase/firestore";
// Public Firebase web configuration. VITE_FIREBASE_* variables can override this project.
// These keys identify the project; firestore.rules enforce authorization. Never put service-account keys here.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyClrWlFjSD92wkTl0sf3wR6ONJr7znIvC0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "camilo-community.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "camilo-community",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "camilo-community.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1089013585522",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1089013585522:web:5867c581396ad417fb94eb",
};
export const configured = Object.values(firebaseConfig).every(Boolean);
export const app = configured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
// The master email is also checked against a verified Auth token in firestore.rules.
// Other staff permissions come from owner-managed Firestore access documents.
export const ADMIN_EMAILS: readonly string[] = ["camiloguerra2010@gmail.com"];
export const SPOTTER_EMAILS: readonly string[] = [];
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "5215515889090";
if (
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_EMULATORS === "true" &&
  auth &&
  db
) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

