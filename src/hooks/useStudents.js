import { useState, useEffect } from 'react';
import * as studentService from '../services/studentService';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useStudents = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        const studentsData = snapshot.docs.map(doc => {
          const data = doc.data();
          const nameParts = data.name ? data.name.trim().split(' ') : ['', ''];
          return {
            id: doc.id,
            firstName: data.firstName || nameParts[0] || '',
            lastName: data.lastName || nameParts.slice(1).join(' ') || '',
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
        setStudents(studentsData);
        setError(null);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching students:', error);
        setError('Failed to fetch students');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addStudent = async (studentData) => {
    try {
      const newStudent = await studentService.addStudent(studentData);
      return newStudent;
    } catch (err) {
      setError('Failed to add student');
      console.error('Error adding student:', err);
      throw err;
    }
  };

  const updateStudent = async (id, studentData) => {
    try {
      const updatedStudent = await studentService.updateStudent(id, studentData);
      setStudents(prev => prev.map(student => 
        student.id === id ? { ...student, ...updatedStudent } : student
      ));
      return updatedStudent;
    } catch (err) {
      setError('Failed to update student');
      console.error('Error updating student:', err);
      throw err;
    }
  };

  const deleteStudent = async (id) => {
    try {
      setLoading(true);
      await studentService.deleteStudent(id);
      
      // Remove from selected students
      setSelectedStudents(prev => prev.filter(studentId => studentId !== id));
      
      // Clear selected student if it was the deleted one
      if (selectedStudent?.id === id) {
        setSelectedStudent(null);
      }
      
      return id;
    } catch (err) {
      setError('Failed to delete student');
      console.error('Error deleting student:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = (selected) => {
    setSelectedStudents(selected ? students.map(student => student.id) : []);
  };

  const getFilteredStudents = (filters) => {
    return students.filter(student => {
      // If batch is 'all' or not set, show all students
      const matchesBatch = !filters.batch || filters.batch === 'all' || student.batchId === filters.batch;
      const matchesSearch = !filters.search || 
        (student.firstName + ' ' + student.lastName).toLowerCase().includes(filters.search.toLowerCase()) ||
        student.email.toLowerCase().includes(filters.search.toLowerCase());
      
      // For 'all' batches, we want to show all students
      if (filters.batch === 'all') {
        return matchesSearch; // Only apply search filter
      }
      
      return matchesBatch && matchesSearch;
    });
  };

  const getStudentsByBatch = async (batchId) => {
    try {
      return await studentService.getStudentsByBatch(batchId);
    } catch (err) {
      setError('Failed to fetch students by batch');
      console.error('Error fetching students by batch:', err);
      return [];
    }
  };

  return {
    students,
    selectedStudents,
    selectedStudent,
    setSelectedStudent,
    loading,
    error,
    addStudent,
    updateStudent,
    deleteStudent,
    toggleStudentSelection,
    selectAllStudents,
    getFilteredStudents,
    getStudentsByBatch
  };
}; 