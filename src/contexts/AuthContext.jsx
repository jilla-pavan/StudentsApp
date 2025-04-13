import { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null); // 'admin' or 'student'

  // Admin login with email and password
  async function adminLogin(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase Auth Result:", result);

      // Check if user is admin in Firestore
      const userDoc = await getDoc(doc(db, 'admins', result.user.uid));
      console.log("Admin Doc:", userDoc.exists());

      if (userDoc.exists()) {
        setCurrentUser(result.user);
        setUserType('admin');
        return { success: true };
      } else {
        await signOut(auth);
        setCurrentUser(null);
        setUserType(null);
        return { success: false, error: 'Not authorized as admin' };
      }
    } catch (error) {
      console.error("Admin Login Error:", error);
      let errorMessage = 'Failed to log in';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // Student login with student ID
  async function studentLogin(studentId) {
    try {
      // Check if student exists in Firestore
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        // Set the student data including their ID
        setCurrentUser({ id: studentId, ...studentData });
        setUserType('student');
        return { success: true, studentId }; // Return studentId for redirect
      }
      return { success: false, error: 'Student ID not found' };
    } catch (error) {
      console.error("Student Login Error:", error);
      return { success: false, error: 'Failed to verify student ID' };
    }
  }

  async function logout() {
    try {
      if (userType === 'admin') {
        await signOut(auth);
      }
      setCurrentUser(null);
      setUserType(null);
      return { success: true };
    } catch (error) {
      console.error("Logout Error:", error);
      return { success: false, error: 'Failed to log out' };
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if the user is an admin
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          setCurrentUser(user);
          setUserType('admin');
        } else {
          // If not an admin, sign them out
          await signOut(auth);
          setCurrentUser(null);
          setUserType(null);
        }
      } else {
        setCurrentUser(null);
        setUserType(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userType,
    adminLogin,
    studentLogin,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 