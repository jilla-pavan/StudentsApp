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
    console.error('Error fetching students:', error);
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
    const newStudent = {
      id: docRef.id,
      ...student
    };

    // Send registration confirmation email if student has an email
    let emailResult = null;
    if (isValidEmail(newStudent.email)) {
      try {
        // Send registration confirmation email
        emailResult = await sendRegistrationConfirmationEmail(
          newStudent,
          'New Registration'
        );
      } catch (emailError) {
        console.error(`❌ STUDENT SERVICE EMAIL ERROR:`, emailError);
        console.error(`❌ STUDENT SERVICE EMAIL ERROR DETAILS:`, emailError.stack);
        // We still continue even if email fails
      }
    }

    return {
      ...newStudent,
      emailSent: !!emailResult,
      emailDetails: emailResult
    };
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

export const updateStudent = async (studentId, data) => {
  try {
    // First get the current student data to compare
    const studentRef = doc(db, 'students', studentId);
    const studentSnapshot = await getDoc(studentRef);
    
    if (!studentSnapshot.exists()) {
      console.error(`❌ STUDENT SERVICE ERROR: Student ${studentId} not found in database`);
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
          console.error(`❌ STUDENT SERVICE ERROR: Batch ${data.batchId} not found in database`);
          throw new Error('Assigned batch does not exist');
        }
        
        const batchName = batchSnapshot.data().name;
        
        // Verify student has an email address
        if (!isValidEmail(updatedStudentData.email)) {
          console.error(`❌ STUDENT SERVICE ERROR: Student ${studentId} has invalid email: "${updatedStudentData.email}"`);
          throw new Error('Student has invalid email address');
        }
        
        // Must have roll number and ID for batch assignment
        if (!updatedStudentData.rollNumber || updatedStudentData.rollNumber === 'unassigned') {
          console.error(`❌ STUDENT SERVICE ERROR: Student ${studentId} missing valid roll number`);
          throw new Error('Student must have a valid roll number for batch assignment');
        }
        
        try {
          // Use the dedicated batch assignment email service with login credentials
          emailResult = await sendBatchAssignmentEmail(
            updatedStudentData,
            batchName
          );
        } catch (emailError) {
          console.error(`❌ STUDENT SERVICE EMAIL ERROR:`, emailError);
          console.error(`❌ STUDENT SERVICE EMAIL ERROR DETAILS:`, emailError.stack);
          
          // We still continue even if email fails
        }
      } catch (emailError) {
        console.error(`❌ STUDENT SERVICE ERROR: Error in email process for student ${studentId}:`, emailError);
        console.error(`❌ STUDENT SERVICE ERROR DETAILS:`, emailError.stack);
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
    console.error('❌ STUDENT SERVICE ERROR: Error updating student:', error);
    console.error('❌ STUDENT SERVICE ERROR DETAILS:', error.stack);
    throw new Error(`Failed to update student: ${error.message}`);
  }
};

export const deleteStudent = async (id) => {
  try {
    const studentRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(studentRef);
    return id;
  } catch (error) {
    console.error('Error deleting student:', error);
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
    console.error('Error verifying student:', error);
    return false;
  }
};

export const updateStudentFeeStatus = async (studentId, feePaid) => {
  try {
    const studentRef = doc(db, COLLECTION_NAME, studentId);
    await updateDoc(studentRef, { feePaid });
    
    return { 
      id: studentId, 
      feePaid 
    };
  } catch (error) {
    console.error('Error updating fee status:', error);
    throw error;
  }
};

