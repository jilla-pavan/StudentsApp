import { db } from '../config/firebase';
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  Timestamp,
  serverTimestamp,
  deleteField
} from 'firebase/firestore';

const STUDENTS_COLLECTION = 'students';
const ATTENDANCE_COLLECTION = 'attendance';

// Function to migrate old attendance data to new structure
const migrateStudentAttendance = async (studentId, studentData) => {
  try {
    if (!studentData.attendance?.class || studentData.attendance.class.length === 0) {
      return;
    }

    // Validate each record before migration
    const validRecords = studentData.attendance.class.filter(record => {
      return record && record.date && typeof record.present === 'boolean';
    });

    // Migrate each attendance record to the new collection
    const migrationPromises = validRecords.map(record => {
      const attendanceData = {
        studentId: studentId,
        date: record.date,
        present: record.present,
        batchId: studentData.batchId || null,
        timestamp: serverTimestamp(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        migratedFrom: 'legacy'
      };
      return addDoc(collection(db, ATTENDANCE_COLLECTION), attendanceData);
    });

    await Promise.all(migrationPromises);

    // Remove old attendance data from student document
    const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
    await updateDoc(studentRef, {
      attendance: deleteField()
    });

    console.log(`Successfully migrated ${validRecords.length} attendance records for student ${studentId}`);
  } catch (error) {
    console.error('Error migrating attendance:', error);
    throw error;
  }
};

export const markAttendance = async (studentId, date, present) => {
  try {
    if (!studentId) {
      throw new Error('Student ID is required');
    }

    // First check if the student exists
    const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
    const studentDoc = await getDoc(studentRef);

    if (!studentDoc.exists()) {
      throw new Error('Student not found. They may have been removed from the system.');
    }

    const studentData = studentDoc.data();
    
    // Check if we need to migrate old attendance data
    if (studentData.attendance?.class) {
      await migrateStudentAttendance(studentId, studentData);
    }

    // Check if attendance already exists for this date
    const existingAttendanceQuery = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('studentId', '==', studentId),
      where('date', '==', date)
    );

    const existingAttendance = await getDocs(existingAttendanceQuery);
    
    if (!existingAttendance.empty) {
      // Update existing attendance
      const attendanceDoc = existingAttendance.docs[0];
      await updateDoc(doc(db, ATTENDANCE_COLLECTION, attendanceDoc.id), {
        present,
        updatedAt: Timestamp.now()
      });
      return {
        id: attendanceDoc.id,
        ...attendanceDoc.data(),
        present
      };
    }

    // Create new attendance record with validated data
    const attendanceData = {
      studentId: studentId,
      date: date,
      present: present,
      batchId: studentData.batchId || null, // Handle case where batchId might be undefined
      timestamp: serverTimestamp(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Add to attendance collection
    const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), attendanceData);
    
    // Return only the data we know exists
    return {
      id: docRef.id,
      studentId: attendanceData.studentId,
      date: attendanceData.date,
      present: attendanceData.present,
      batchId: attendanceData.batchId,
      createdAt: attendanceData.createdAt,
      updatedAt: attendanceData.updatedAt
    };
  } catch (error) {
    console.error('Error marking attendance:', error);
    if (error.code === 'not-found') {
      throw new Error('Student not found. They may have been deleted.');
    } else if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to mark attendance.');
    } else {
      throw error;
    }
  }
};

export const getAttendanceForDate = async (studentId, date) => {
  try {
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('studentId', '==', studentId),
      where('date', '==', date)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting attendance:', error);
    throw error;
  }
};

export const getAttendanceForDateRange = async (studentId, startDate, endDate) => {
  try {
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('studentId', '==', studentId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting attendance range:', error);
    throw error;
  }
};

export const getBatchAttendance = async (batchId, date) => {
  try {
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('batchId', '==', batchId),
      where('date', '==', date)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting batch attendance:', error);
    throw error;
  }
};

export const calculateAttendancePercentage = async (studentId, startDate, endDate) => {
  try {
    const attendance = await getAttendanceForDateRange(studentId, startDate, endDate);
    
    if (!attendance || attendance.length === 0) return 0;
    
    const present = attendance.filter(record => record.present).length;
    return (present / attendance.length) * 100;
  } catch (error) {
    console.error('Error calculating attendance percentage:', error);
    throw error;
  }
};

export const calculateBatchAttendance = async (batchId, date) => {
  try {
    const attendance = await getBatchAttendance(batchId, date);
    
    if (!attendance || attendance.length === 0) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        percentage: 0
      };
    }
    
    const present = attendance.filter(record => record.present).length;
    
    return {
      total: attendance.length,
      present,
      absent: attendance.length - present,
      percentage: (present / attendance.length) * 100
    };
  } catch (error) {
    console.error('Error calculating batch attendance:', error);
    throw error;
  }
};

export const calculateAttendanceForRange = (history, startDate, endDate) => {
  if (!history || !Array.isArray(history)) return { total: 0, present: 0, percentage: 0 };

  const start = new Date(startDate);
  const end = new Date(endDate);

  const filteredHistory = history.filter((record) => {
    const recordDate = new Date(record.date);
    return recordDate >= start && recordDate <= end;
  });

  const total = filteredHistory.length;
  const present = filteredHistory.filter((record) => record.present).length;
  const percentage = total > 0 ? (present / total) * 100 : 0;

  return { total, present, percentage };
};

export const getStudentAttendanceHistory = async (studentId) => {
  try {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    const startDate = lastMonth.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('studentId', '==', studentId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting student attendance history:', error);
    throw error;
  }
};

export const calculateAverageAttendance = async (students) => {
  if (!students || students.length === 0) return 0;
  
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const startDate = lastMonth.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  try {
    const percentages = await Promise.all(
      students.map(async (student) => {
        const attendance = await getAttendanceForDateRange(student.id, startDate, endDate);
        if (!attendance || attendance.length === 0) return 0;
        const present = attendance.filter(record => record.present).length;
        return (present / attendance.length) * 100;
      })
    );

    return percentages.reduce((sum, percentage) => sum + percentage, 0) / students.length;
  } catch (error) {
    console.error('Error calculating average attendance:', error);
    return 0;
  }
};

export const getStudentAttendance = async (studentId) => {
  try {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    return getAttendanceForDateRange(studentId, lastMonth.toISOString().split('T')[0], today.toISOString().split('T')[0]);
  } catch (error) {
    console.error('Error getting student attendance:', error);
    throw error;
  }
};