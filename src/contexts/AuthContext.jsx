import { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, getDocs, collection, updateDoc, addDoc, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { sendRegistrationConfirmationEmail } from '../services/emailService';

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
      const userDoc = await getDoc(doc(db, 'admins', result.user.uid));

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
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        setCurrentUser({ id: studentId, ...studentData });
        setUserType('student');
        return { success: true, studentId };
      }
      return { success: false, error: 'Student ID Not Found, Check Your ID' };
    } catch (error) {
      return { success: false, error: 'Failed to verify student ID' };
    }
  }
  
  // Student login with email and password (student ID)
  async function studentLoginWithEmail(email, password) {
    try {
      // Validate inputs
      if (!email || !email.trim()) {
        return { success: false, error: 'Email is required' };
      }
      
      if (!password || !password.trim()) {
        return { success: false, error: 'Student ID is required' };
      }
      
      // Check if student exists with this email
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, error: 'No student account found with this email' };
      }
      
      // Get the first matching student
      const studentDoc = querySnapshot.docs[0];
      const studentId = studentDoc.id;
      const studentData = studentDoc.data();
      
      // Helper function to handle successful login
      const handleSuccessfulLogin = async () => {
        setCurrentUser({ id: studentId, ...studentData });
        setUserType('student');
        
        // Record login timestamp
        try {
          await updateDoc(doc(db, 'students', studentId), {
            lastLogin: new Date().toISOString()
          });
        } catch (error) {
          // Continue login even if timestamp update fails
        }
        
        // Check fee payment status
        const hasFeeDue = studentData.feePaid === false;
        
        return { 
          success: true, 
          studentId,
          feeStatus: {
            feePaid: !hasFeeDue,
            message: hasFeeDue ? 'Please contact Career Sure Academy sales team' : null
          }
        }; 
      };
      
      // Verify the password (student ID)
      if (password === studentId) {
        return await handleSuccessfulLogin();
      }
      
      // Check if roll number matches (alternative login method)
      if (studentData.rollNumber && password === studentData.rollNumber) {
        return await handleSuccessfulLogin();
      }
      
      return { 
        success: false, 
        error: 'Incorrect Student ID. Use the ID that was sent to your email when you were assigned to a batch.' 
      };
    } catch (error) {
      return { success: false, error: 'An error occurred while verifying your credentials. Please try again.' };
    }
  }
  
  // Student login with Google
  async function studentGoogleLogin() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user email exists in any student record
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentMatch = studentsSnapshot.docs.find(doc => 
        doc.data().email?.toLowerCase() === result.user.email?.toLowerCase()
      );
      
      if (studentMatch) {
        const studentData = studentMatch.data();
        const studentId = studentMatch.id;
        
        setCurrentUser({ id: studentId, ...studentData });
        setUserType('student');
        
        // Update student record with Google UID for future logins
        await updateDoc(doc(db, 'students', studentId), {
          googleUid: result.user.uid
        });
        
        return { success: true, studentId };
      } else {
        // Not a registered student
        await signOut(auth);
        return { success: false, error: 'No student account found with this email. Register Yourself First' };
      }
    } catch (error) {
      return { success: false, error: 'Failed to sign in with Google' };
    }
  }

  // Student registration with Google
  async function studentRegister() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user email already exists in student records
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const existingStudent = studentsSnapshot.docs.find(doc => 
        doc.data().email?.toLowerCase() === result.user.email?.toLowerCase()
      );
      
      if (existingStudent) {
        // User is already registered, log them in
        const studentData = existingStudent.data();
        const studentId = existingStudent.id;
        
        setCurrentUser({ id: studentId, ...studentData });
        setUserType('student');
        
        // Update student record with Google UID if not already set
        if (!studentData.googleUid) {
          await updateDoc(doc(db, 'students', studentId), {
            googleUid: result.user.uid
          });
        }
        
        return { 
          success: true, 
          studentId,
          isNewUser: false,
          message: 'You are already registered. Signed in successfully!'
        };
      } else {
        // Return the Google user info for registration form
        await signOut(auth); // Sign out temporarily
        return { 
          success: true, 
          isNewUser: true,
          googleUser: {
            email: result.user.email,
            name: result.user.displayName,
            uid: result.user.uid,
            photoURL: result.user.photoURL
          }
        };
      }
    } catch (error) {
      return { success: false, error: 'Failed to register with Google' };
    }
  }

  // Complete student registration with additional details
  async function completeStudentRegistration(studentData, googleUser) {
    try {
      // Add student to Firestore
      const newStudent = {
        name: studentData.name,
        email: googleUser.email,
        contactNumber: studentData.contactNumber,
        batchId: studentData.batchId || 'unassigned',
        rollNumber: 'unassigned', // Admin will assign roll number later
        gender: studentData.gender,
        address: studentData.address || '',
        googleUid: googleUser.uid,
        photoURL: googleUser.photoURL,
        attendance: { class: [] },
        mockScores: [],
        registeredAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'students'), newStudent);
      const studentId = docRef.id;
      
      // Generate a temporary roll number from the student ID
      const tempRollNumber = studentId.slice(-6).toUpperCase();
      
      // Update the student with the temporary roll number
      await updateDoc(doc(db, 'students', studentId), {
        rollNumber: tempRollNumber
      });
      
      // Send registration confirmation email
      try {
        // Include student ID in email data
        const studentWithId = {
          ...newStudent,
          id: studentId,
          rollNumber: tempRollNumber
        };
        
        await sendRegistrationConfirmationEmail(studentWithId, 'New Registration');
      } catch (emailError) {
        // Continue with registration even if email fails
      }
      
      // Instead of logging the user in, return success with guidance
      return { 
        success: true, 
        registered: true,
        message: 'Registration completed successfully! Check your email for confirmation. You can now log in with your email and Student ID.',
        studentId,
        email: googleUser.email
      };
    } catch (error) {
      return { success: false, error: 'Failed to complete registration' };
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
          // Check if user is a student by Google UID
          const studentsSnapshot = await getDocs(collection(db, 'students'));
          const studentMatch = studentsSnapshot.docs.find(doc => 
            doc.data().googleUid === user.uid
          );
          
          if (studentMatch) {
            const studentData = studentMatch.data();
            const studentId = studentMatch.id;
            setCurrentUser({ id: studentId, ...studentData });
            setUserType('student');
          } else {
            // If not a student or admin, sign them out
            await signOut(auth);
            setCurrentUser(null);
            setUserType(null);
          }
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
    studentLoginWithEmail,
    studentGoogleLogin,
    studentRegister,
    completeStudentRegistration,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 