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
  try {
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, data);
  } catch (error) {
    console.error('Error updating student:', error);
    throw new Error('Failed to update student');
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

