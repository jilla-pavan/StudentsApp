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
  Timestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'mockTests';

export const getMockTests = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    // Convert date to ISO string format
    const dateObj = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
    return {
      id: doc.id,
      ...data,
      date: dateObj.toISOString().split('T')[0] // Format as YYYY-MM-DD
    };
  });
};

export const addMockTest = async (mockTestData) => {
  // Convert date string to Timestamp before saving
  const dataToSave = {
    ...mockTestData,
    date: Timestamp.fromDate(new Date(mockTestData.date))
  };
  
  const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToSave);
  return {
    id: docRef.id,
    ...mockTestData
  };
};

export const updateMockTest = async (id, mockTestData) => {
  const mockTestRef = doc(db, COLLECTION_NAME, id);
  // Convert date string to Timestamp before saving
  const dataToUpdate = {
    ...mockTestData,
    date: Timestamp.fromDate(new Date(mockTestData.date))
  };
  
  await updateDoc(mockTestRef, dataToUpdate);
  return {
    id,
    ...mockTestData
  };
};

export const deleteMockTest = async (id) => {
  const mockTestRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(mockTestRef);
  return id;
};

export const getMockTestsByBatch = async (batchId) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('batchId', '==', batchId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    const dateObj = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
    return {
      id: doc.id,
      ...data,
      date: dateObj.toISOString().split('T')[0] // Format as YYYY-MM-DD
    };
  });
};

export const getStudentMockScore = (student, testId) => {
  return student.mockScores?.find((score) => score.testId === testId)?.score || 0;
};

export const canScoreTest = (test) => {
  if (!test) return false;
  const testDate = new Date(test.date);
  const today = new Date();
  return testDate <= today;
};

export const getStudentLevel = (student) => {
  if (!student.mockScores || student.mockScores.length === 0) return 1;
  
  const highestScore = Math.max(...student.mockScores.map(score => score.score));
  if (highestScore >= 90) return 3;
  if (highestScore >= 75) return 2;
  return 1;
};

export const hasClearedLevel = (student, level) => {
  if (!student.mockScores || student.mockScores.length === 0) return false;
  
  const requiredScore = level === 2 ? 75 : 90;
  return student.mockScores.some(score => score.score >= requiredScore);
};

export const calculateAverageScore = (scores) => {
  if (!scores || scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return sum / scores.length;
};

export const getClassPerformance = (testId, students) => {
  const scores = students
    .filter(student => student.mockScores?.some(score => score.testId === testId))
    .map(student => student.mockScores.find(score => score.testId === testId).score);

  if (!scores.length) {
    return {
      average: 0,
      highest: 0,
      lowest: 0,
      totalStudents: students.length,
      attempted: 0,
      distribution: {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
      }
    };
  }

  const distribution = scores.reduce((acc, score) => {
    if (score <= 20) acc['0-20']++;
    else if (score <= 40) acc['21-40']++;
    else if (score <= 60) acc['41-60']++;
    else if (score <= 80) acc['61-80']++;
    else acc['81-100']++;
    return acc;
  }, {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  });

  return {
    average: scores.reduce((a, b) => a + b, 0) / scores.length,
    highest: Math.max(...scores),
    lowest: Math.min(...scores),
    totalStudents: students.length,
    attempted: scores.length,
    distribution
  };
};

export const getStudentPerformanceSummary = (student) => {
  if (!student.mockScores || student.mockScores.length === 0) {
    return { average: 0, highest: 0, total: 0 };
  }

  const scores = student.mockScores.map(score => score.score);
  return {
    average: calculateAverageScore(scores),
    highest: Math.max(...scores),
    total: scores.length
  };
}; 