import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

const initFirebaseAdmin = () => {
  if (!getApps().length) {
    if (process.env.FIREBASE_CLIENT_EMAIL && privateKey && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
    } else {
      console.warn(
        "Firebase Admin SDK not fully configured. Using default app initialization. Set env variables properly."
      );
      try {
        initializeApp();
      } catch (error) {
        console.error("Firebase Admin default initialization failed:", error);
      }
    }
  }
};

initFirebaseAdmin();

export const adminDb = getFirestore();
export const adminAuth = getAuth();
