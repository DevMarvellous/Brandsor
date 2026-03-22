import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Create or update user profile in Firestore
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      }, { merge: true });
    } catch (dbError) {
      console.error("Error saving user to Firestore (permissions might be missing):", dbError);
    }

    return user;
  } catch (error: any) {
    if (error.code === 'auth/cancelled-popup-request') {
      console.log('Login cancelled by user');
      return null;
    }
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};
