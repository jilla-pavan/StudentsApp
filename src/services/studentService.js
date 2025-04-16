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
    return {
      id: docRef.id,
      ...student
    };
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

export const updateStudent = async (studentId, data) => {
  console.log('🔄 STUDENT SERVICE: Starting update for student:', studentId);
  console.log('🔄 STUDENT SERVICE: Update data:', JSON.stringify(data, null, 2));
  
  try {
    console.log(`🔄 STUDENT SERVICE: Updating student ${studentId}...`);
    
    // First get the current student data to compare
    console.log(`🔄 STUDENT SERVICE: Fetching current data for student ${studentId}...`);
    const studentRef = doc(db, 'students', studentId);
    const studentSnapshot = await getDoc(studentRef);
    
    if (!studentSnapshot.exists()) {
      console.error(`❌ STUDENT SERVICE ERROR: Student ${studentId} not found in database`);
      throw new Error('Student not found');
    }
    
    const oldStudentData = studentSnapshot.data();
    console.log(`🔄 STUDENT SERVICE: Previous student data:`, JSON.stringify(oldStudentData, null, 2));
    console.log(`🔄 STUDENT SERVICE: Previous batchId: "${oldStudentData.batchId}"`);
    console.log(`🔄 STUDENT SERVICE: New batchId: "${data.batchId}"`);
    
    // Update the student record
    console.log(`🔄 STUDENT SERVICE: Updating student ${studentId} in Firestore...`);
    await updateDoc(studentRef, data);
    console.log(`✅ STUDENT SERVICE: Successfully updated student ${studentId} in Firestore`);
    
    // Create merged data to represent the updated student
    const updatedStudentData = { 
      id: studentId, 
      ...oldStudentData, 
      ...data 
    };
    console.log(`🔄 STUDENT SERVICE: Merged student data:`, JSON.stringify(updatedStudentData, null, 2));
    
    // Check if the batch was just assigned (changed from 'unassigned' to something else)
    console.log(`🔄 STUDENT SERVICE: Checking if batch was just assigned...`);
    console.log(`🔄 STUDENT SERVICE: isBatchAssigned result:`, isBatchAssigned(oldStudentData, updatedStudentData));
    console.log(`🔄 STUDENT SERVICE: Old batch condition:`, (oldStudentData.batchId === 'unassigned' || !oldStudentData.batchId));
    console.log(`🔄 STUDENT SERVICE: New batch condition:`, (!!updatedStudentData.batchId && updatedStudentData.batchId !== 'unassigned'));
    
    let emailResult = null;
    
    if (data.batchId && isBatchAssigned(oldStudentData, updatedStudentData)) {
      console.log(`🔄 STUDENT SERVICE: Batch assignment detected! Old: "${oldStudentData.batchId}", New: "${data.batchId}"`);
      
      try {
        // Get the batch name
        console.log(`🔄 STUDENT SERVICE: Fetching details for batch ${data.batchId}...`);
        const batchRef = doc(db, 'batches', data.batchId);
        const batchSnapshot = await getDoc(batchRef);
        
        if (!batchSnapshot.exists()) {
          console.error(`❌ STUDENT SERVICE ERROR: Batch ${data.batchId} not found in database`);
          throw new Error('Assigned batch does not exist');
        }
        
        const batchName = batchSnapshot.data().name;
        console.log(`🔄 STUDENT SERVICE: Found batch name: "${batchName}" for batch ID: ${data.batchId}`);
        
        // Verify student has an email address
        console.log(`🔄 STUDENT SERVICE: Validating student email: "${updatedStudentData.email}"`);
        if (!isValidEmail(updatedStudentData.email)) {
          console.error(`❌ STUDENT SERVICE ERROR: Student ${studentId} has invalid email: "${updatedStudentData.email}"`);
          throw new Error('Student has invalid email address');
        }
        
        // Must have roll number and ID for batch assignment
        console.log(`🔄 STUDENT SERVICE: Checking roll number: "${updatedStudentData.rollNumber}"`);
        console.log(`🔄 STUDENT SERVICE: Checking student ID: "${updatedStudentData.id}"`);
        if (!updatedStudentData.rollNumber || updatedStudentData.rollNumber === 'unassigned') {
          console.error(`❌ STUDENT SERVICE ERROR: Student ${studentId} missing valid roll number`);
          throw new Error('Student must have a valid roll number for batch assignment');
        }
        
        // Student data is ready - use the batch assignment email endpoint
        console.log(`📧 STUDENT SERVICE: Initiating batch assignment email process for student ${updatedStudentData.name}...`);
        console.log(`📧 STUDENT SERVICE: Email data being sent:`, JSON.stringify({
          studentId: updatedStudentData.id,
          email: updatedStudentData.email,
          name: updatedStudentData.name,
          rollNumber: updatedStudentData.rollNumber,
          batchName: batchName
        }, null, 2));
        
        try {
          // Show sending notification (this can be connected to a UI notification component)
          console.log(`📱 UX NOTIFICATION: ${EMAIL_NOTIFICATIONS.BATCH_ASSIGNMENT.SENDING}`);
          
          // Use the dedicated batch assignment email service with login credentials
          console.log(`📧 STUDENT SERVICE: Calling sendBatchAssignmentEmail function...`);
          emailResult = await sendBatchAssignmentEmail(
            updatedStudentData,
            batchName
          );
          
          console.log(`✅ STUDENT SERVICE: Batch assignment email sent successfully:`, JSON.stringify(emailResult, null, 2));
          
          // Show success notification (this can be connected to a UI notification component)
          console.log(`📱 UX NOTIFICATION: ${EMAIL_NOTIFICATIONS.BATCH_ASSIGNMENT.SUCCESS}`);
          console.log(`📱 UX NOTIFICATION: Credentials sent to ${emailResult.studentEmail}`);
        } catch (emailError) {
          console.error(`❌ STUDENT SERVICE EMAIL ERROR:`, emailError);
          console.error(`❌ STUDENT SERVICE EMAIL ERROR DETAILS:`, emailError.stack);
          
          // Show error notification (this can be connected to a UI notification component)
          console.log(`📱 UX NOTIFICATION: ${EMAIL_NOTIFICATIONS.BATCH_ASSIGNMENT.ERROR}`);
          
          // We still continue even if email fails
          console.log(`⚠️ STUDENT SERVICE WARNING: Email failed but continuing with student update`);
        }
      } catch (emailError) {
        console.error(`❌ STUDENT SERVICE ERROR: Error in email process for student ${studentId}:`, emailError);
        console.error(`❌ STUDENT SERVICE ERROR DETAILS:`, emailError.stack);
        // We don't throw here to avoid failing the update if email fails
      }
    } else {
      console.log(`🔄 STUDENT SERVICE: No batch assignment detected for student ${studentId}. Conditions not met.`);
    }
    
    console.log(`✅ STUDENT SERVICE: Update completed successfully for student ${studentId}`);
    console.log(`✅ STUDENT SERVICE: Email was sent: ${!!emailResult}`);
    
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
    console.log(`🔄 STUDENT SERVICE: Updating fee status for student ${studentId} to ${feePaid ? 'PAID' : 'UNPAID'}`);
    
    const studentRef = doc(db, COLLECTION_NAME, studentId);
    const studentSnapshot = await getDoc(studentRef);
    
    if (!studentSnapshot.exists()) {
      console.error(`❌ STUDENT SERVICE ERROR: Student ${studentId} not found in database`);
      throw new Error('Student not found');
    }
    
    // Update only the fee payment status
    await updateDoc(studentRef, { feePaid });
    
    // Get the updated student record
    const updatedSnapshot = await getDoc(studentRef);
    const updatedStudentData = { 
      id: studentId, 
      ...updatedSnapshot.data() 
    };
    
    console.log(`✅ STUDENT SERVICE: Successfully updated fee status for student ${studentId} to ${feePaid ? 'PAID' : 'UNPAID'}`);
    
    return updatedStudentData;
  } catch (error) {
    console.error(`❌ STUDENT SERVICE ERROR: Error updating fee status for student ${studentId}:`, error);
    throw new Error(`Failed to update fee status: ${error.message}`);
  }
};

