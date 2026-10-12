import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const createApp = (): FirebaseApp => {
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp(firebaseConfig);
};

const createFirestore = (app: FirebaseApp): Firestore => {
  try {
    return initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache(),
    });
  } catch {
    // Hot reload calls initializeFirestore again on the same app
    return getFirestore(app);
  }
};

const app = firebaseConfigured ? createApp() : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const firestore: Firestore | null = app ? createFirestore(app) : null;

if (auth) {
  void setPersistence(auth, browserLocalPersistence);
}
