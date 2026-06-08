'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateUser: async () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          // Check admin custom claim
          const tokenResult = await fbUser.getIdTokenResult();
          let isCookieAdmin = false;
          try {
            const res = await fetch('/api/admin-check');
            if (res.ok) {
              const data = await res.json();
              isCookieAdmin = data.isAdmin;
            }
          } catch(e) {}
          
          setIsAdmin(!!tokenResult.claims.admin || isCookieAdmin);

          // Fetch user doc from Firestore
          const userRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUser({ uid: fbUser.uid, ...userSnap.data() } as User);
          } else {
            // New user — will need onboarding
            setUser(null);
          }
        } catch (error) {
          console.error("Auth context error:", error);
          setUser(null);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      // Check if user document exists
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create a minimal user doc — onboarding will complete it
        await setDoc(userRef, {
          uid: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || '',
          photo: fbUser.photoURL || '',
          country: '',
          city: '',
          area: '',
          onboardingCompleted: false,
          isVerified: false,
          isBlocked: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setIsAdmin(false);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!firebaseUser) return;
    const userRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });

    // Refresh local user state
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      setUser({ uid: firebaseUser.uid, ...userSnap.data() } as User);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        signInWithGoogle,
        signOut,
        updateUser,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
