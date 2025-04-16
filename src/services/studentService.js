import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { 
  sendRegistrationConfirmationEmail, 
  sendBatchAssignmentEmail, 
  isBatchAssigned, 
  isValidEmail,
  EMAIL_NOTIFICATIONS 
} from './emailService';

const COLLECTION_NAME = 'students';

export const getStudents = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        contactNumber: data.contactNumber || '',
        batchId: data.batchId || '',
        rollNumber: data.rollNumber || '',
        gender: data.gender || '',
        attendance: data.attendance || { class: [] },
        mockScores: data.mockScores || [],
        ...data
      };
    });
  } catch (error) {
    throw error;
  }
};

export const addStudent = async (studentData) => {
  try {
    const student = {
      name: studentData.name?.trim() || '',
      email: '',
      contactNumber: '',
      batchId: '',
      rollNumber: '',
      gender: '',
      attendance: { class: [] },
      mockScores: [],
      ...studentData
    };

    delete student.id;

    const docRef = await addDoc(collection(db, COLLECTION_NAME), student);
    return {
      id: docRef.id,
      ...student
    };
  } catch (error) {
    throw error;
  }
};

export const updateStudent = async (studentId, data) => {
  try {
    // First get the current student data to compare
    const studentRef = doc(db, 'students', studentId);
    const studentSnapshot = await getDoc(studentRef);
    
    if (!studentSnapshot.exists()) {
      throw new Error('Student not found');
    }
    
    const oldStudentData = studentSnapshot.data();
    
    // Update the student record
    await updateDoc(studentRef, data);
    
    // Create merged data to represent the updated student
    const updatedStudentData = { 
      id: studentId, 
      ...oldStudentData, 
      ...data 
    };
    
    let emailResult = null;
    
    if (data.batchId && isBatchAssigned(oldStudentData, updatedStudentData)) {
      try {
        // Get the batch name
        const batchRef = doc(db, 'batches', data.batchId);
        const batchSnapshot = await getDoc(batchRef);
        
        if (!batchSnapshot.exists()) {
          throw new Error('Assigned batch does not exist');
        }
        
        const batchName = batchSnapshot.data().name;
        
        // Verify student has an email address
        if (!isValidEmail(updatedStudentData.email)) {
          throw new Error('Student has invalid email address');
        }
        
        // Must have roll number and ID for batch assignment
        if (!updatedStudentData.rollNumber || updatedStudentData.rollNumber === 'unassigned') {
          throw new Error('Student must have a valid roll number for batch assignment');
        }
        
        try {
          // Use the dedicated batch assignment email service with login credentials
          emailResult = await sendBatchAssignmentEmail(
            updatedStudentData,
            batchName
          );
        } catch (emailError) {
          // We still continue even if email fails
        }
      } catch (emailError) {
        // We don't throw here to avoid failing the update if email fails
      }
    }
    
    // Return the updated student data with the email result for UI notifications
    return {
      ...updatedStudentData,
      emailSent: !!emailResult,
      emailDetails: emailResult
    };
  } catch (error) {
    throw new Error(`Failed to update student: ${error.message}`);
  }
};

export const deleteStudent = async (id) => {
  try {
    const studentRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(studentRef);
    return id;
  } catch (error) {
    throw error;
  }
};

export const getStudentsByBatch = async (batchId) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('batchId', '==', batchId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      email: data.email || '',
      contactNumber: data.contactNumber || '',
      batchId: data.batchId || '',
      rollNumber: data.rollNumber || '',
      gender: data.gender || '',
      attendance: data.attendance || { class: [] },
      mockScores: data.mockScores || [],
      ...data
    };
  });
};

export const verifyStudent = async (studentId) => {
  try {
    const studentRef = doc(db, COLLECTION_NAME, studentId);
    const studentDoc = await getDoc(studentRef);
    return studentDoc.exists();
  } catch (error) {
    throw error;
  }
};

export const updateStudentFeeStatus = async (studentId, feePaid) => {
  try {
    // First get the current student data
    const studentRef = doc(db, 'students', studentId);
    const studentSnapshot = await getDoc(studentRef);
    
    if (!studentSnapshot.exists()) {
      throw new Error('Student not found');
    }
    
    // Update the fee status
    await updateDoc(studentRef, { feePaid });
    
    // Return the updated student data
    return {
      id: studentId,
      ...studentSnapshot.data(),
      feePaid
    };
  } catch (error) {
    throw new Error(`Failed to update fee status: ${error.message}`);
  }
};

