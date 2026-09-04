import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { USERS_COLLECTION, getStudentByEmail } from '../services/dataService';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string, roleHint?: UserRole) => Promise<void>;
  loginWithGoogle: (roleHint?: UserRole) => Promise<void>;
  loginAsDemo: (role: UserRole) => Promise<void>;
  register: (name: string, email: string, pass: string, role: UserRole, registerNumber?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRoleForDemo: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ADMIN: UserProfile = {
  userId: 'admin_demo_id',
  name: 'Dean / Academic Admin',
  email: 'admin@attendance.edu',
  role: 'admin',
  createdAt: new Date().toISOString()
};

const DEMO_STUDENT: UserProfile = {
  userId: 'student_demo_id',
  name: 'Priya Sharma',
  email: 'priya.sharma@attendance.edu',
  role: 'student',
  studentId: 'stu_1',
  createdAt: new Date().toISOString()
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load stored demo user or listen to Firebase Auth
  useEffect(() => {
    // Check if demo user was saved in session
    const storedDemo = localStorage.getItem('demo_auth_user');
    if (storedDemo) {
      try {
        const parsed = JSON.parse(storedDemo);
        setUser(parsed);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('demo_auth_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, USERS_COLLECTION, fbUser.uid);
          const userSnap = await getDoc(userDocRef);
          const isAdminEmail =
            fbUser.email === 'ikshanasherina@gmail.com' ||
            fbUser.email === 'admin@attendance.edu' ||
            (fbUser.email != null && fbUser.email.toLowerCase().includes('admin'));

          if (userSnap.exists()) {
            const existing = userSnap.data() as UserProfile;
            if (isAdminEmail && existing.role !== 'admin') {
              const updated = { ...existing, role: 'admin' as UserRole };
              await setDoc(userDocRef, updated, { merge: true });
              setUser(updated);
            } else {
              setUser(existing);
            }
          } else {
            const matchedStudent = await getStudentByEmail(fbUser.email || '');
            const newProfile: UserProfile = {
              userId: fbUser.uid,
              name: fbUser.displayName || matchedStudent?.name || (isAdminEmail ? 'Admin' : 'Student User'),
              email: fbUser.email || '',
              role: isAdminEmail ? 'admin' : 'student',
              studentId: matchedStudent?.studentId,
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setUser(newProfile);
          }
        } catch (err) {
          console.warn('User profile retrieval note:', err);
          const isAdmin =
            fbUser.email === 'ikshanasherina@gmail.com' ||
            fbUser.email === 'admin@attendance.edu' ||
            (fbUser.email != null && fbUser.email.toLowerCase().includes('admin'));

          setUser({
            userId: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            role: isAdmin ? 'admin' : 'student'
          });
        }
      } else {
        if (!localStorage.getItem('demo_auth_user')) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (roleHint?: UserRole) => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const fbUser = cred.user;
      localStorage.removeItem('demo_auth_user');

      const isAdminEmail =
        fbUser.email === 'ikshanasherina@gmail.com' ||
        fbUser.email === 'admin@attendance.edu' ||
        (fbUser.email != null && fbUser.email.toLowerCase().includes('admin'));

      const userDocRef = doc(db, USERS_COLLECTION, fbUser.uid);
      try {
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const existing = userSnap.data() as UserProfile;
          if (isAdminEmail && existing.role !== 'admin') {
            const updated = { ...existing, role: 'admin' as UserRole };
            await setDoc(userDocRef, updated, { merge: true });
            setUser(updated);
          } else {
            setUser(existing);
          }
        } else {
          const matched = await getStudentByEmail(fbUser.email || '');
          const role: UserRole = isAdminEmail ? 'admin' : (roleHint || (matched ? 'student' : 'admin'));
          const profile: UserProfile = {
            userId: fbUser.uid,
            name: fbUser.displayName || (role === 'admin' ? 'Administrator' : 'Student'),
            email: fbUser.email || '',
            role,
            studentId: matched?.studentId,
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, profile);
          setUser(profile);
        }
      } catch (err) {
        console.warn('Google post-login user doc write note:', err);
        setUser({
          userId: fbUser.uid,
          name: fbUser.displayName || 'Google User',
          email: fbUser.email || '',
          role: isAdminEmail ? 'admin' : (roleHint || 'student')
        });
      }
    } catch (error: any) {
      console.error('Google Sign In error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string, roleHint?: UserRole) => {
    setLoading(true);
    try {
      // 1. Check if matching demo credentials
      if (email.toLowerCase() === 'admin@attendance.edu' || (email.toLowerCase() === 'admin' && pass === 'admin123')) {
        localStorage.setItem('demo_auth_user', JSON.stringify(DEMO_ADMIN));
        setUser(DEMO_ADMIN);
        setLoading(false);
        return;
      }
      if (email.toLowerCase() === 'priya.sharma@attendance.edu' || (email.toLowerCase() === 'student' && pass === 'student123')) {
        localStorage.setItem('demo_auth_user', JSON.stringify(DEMO_STUDENT));
        setUser(DEMO_STUDENT);
        setLoading(false);
        return;
      }

      // 2. Firebase Auth login
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const userDocRef = doc(db, USERS_COLLECTION, cred.user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        setUser(userSnap.data() as UserProfile);
      } else {
        const matched = await getStudentByEmail(email);
        const profile: UserProfile = {
          userId: cred.user.uid,
          name: matched?.name || email.split('@')[0],
          email: email.trim(),
          role: roleHint || (email.includes('admin') ? 'admin' : 'student'),
          studentId: matched?.studentId,
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, profile);
        setUser(profile);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (role: UserRole) => {
    setLoading(true);
    try {
      const demoUser = role === 'admin' ? DEMO_ADMIN : DEMO_STUDENT;
      localStorage.setItem('demo_auth_user', JSON.stringify(demoUser));
      setUser(demoUser);
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
    role: UserRole,
    _registerNumber?: string
  ) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const matched = await getStudentByEmail(email);
      const profile: UserProfile = {
        userId: cred.user.uid,
        name: name.trim(),
        email: email.trim(),
        role: role,
        studentId: matched?.studentId,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, USERS_COLLECTION, cred.user.uid), profile);
      setUser(profile);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('demo_auth_user');
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout note:', e);
    }
    setUser(null);
    setFirebaseUser(null);
  };

  const switchRoleForDemo = (role: UserRole) => {
    const demoUser = role === 'admin' ? DEMO_ADMIN : DEMO_STUDENT;
    localStorage.setItem('demo_auth_user', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        login,
        loginWithGoogle,
        loginAsDemo,
        register,
        logout,
        switchRoleForDemo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
