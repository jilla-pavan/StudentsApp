import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const MockTestsView = ({ renderMockTestList, students, filters, batches, onFilterChange, onAssignScores, updateStudent }) => {
    const [scores, setScores] = useState({});
    const [studentMockLevels, setStudentMockLevels] = useState({});
    const [mockAttendance, setMockAttendance] = useState({});
    const [isUpdating, setIsUpdating] = useState(false);
    const mockLevels = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Level ${i + 1}` }));
  
    // Initialize student levels and attendance based on their highest passed level
    useEffect(() => {
      const initialLevels = {};
      const initialAttendance = {};
      students.forEach(student => {
        if (student.mockScores && Array.isArray(student.mockScores)) {
          // Get all passed levels
          const passedLevels = student.mockScores
            .filter(score => score.score >= 6)
            .map(score => parseInt(score.testId.split('_')[1]));
          
          // If they have passed levels, set them to the next level
          // If not, start them at level 1
          const highestPassedLevel = Math.max(...passedLevels, 0);
          const nextLevel = Math.min(highestPassedLevel + 1, 10);
          initialLevels[student.id] = nextLevel.toString();
  
          // Initialize attendance from existing data
          initialAttendance[student.id] = student.mockAttendance || {};
        } else {
          // Start at level 1 if no scores
          initialLevels[student.id] = "1";
          initialAttendance[student.id] = {};
        }
      });
      setStudentMockLevels(initialLevels);
      setMockAttendance(initialAttendance);
    }, [students]);
  
    // Filter students based on selected batch
    const filteredStudents = filters.batch && filters.batch !== 'all'
      ? students.filter(student => student.batchId === filters.batch)
      : students;
  
    const handleScoreChange = (studentId, value) => {
      // Only allow numbers between 0 and 10
      if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 10)) {
        setScores(prev => ({
          ...prev,
          [studentId]: value
        }));
      }
    };
  
    const handleMockLevelChange = (studentId, level) => {
      const levelNum = parseInt(level);
      if (isNaN(levelNum) || levelNum < 1 || levelNum > 10) return;

      setStudentMockLevels(prev => ({
        ...prev,
        [studentId]: level
      }));
      // Clear previous score when changing level
      setScores(prev => ({
        ...prev,
        [studentId]: ''
      }));
    };
  
    const handleAttendanceChange = async (studentId, mockLevel, isPresent) => {
      if (isUpdating) return; // Prevent multiple simultaneous updates
      
      try {
        setIsUpdating(true);
        const updatedAttendance = {
          ...mockAttendance[studentId],
          [`mock_${mockLevel}`]: {
            status: isPresent ? 'present' : 'absent',
            date: new Date().toISOString()
          }
        };
  
        // Update student in database first
        await updateStudent(studentId, {
          mockAttendance: updatedAttendance
        });
  
        // Then update local state
        setMockAttendance(prev => ({
          ...prev,
          [studentId]: updatedAttendance
        }));
  
        toast.success(`Attendance marked as ${isPresent ? 'present' : 'absent'}`);
      } catch (error) {
        console.error('Error marking attendance:', error);
        toast.error('Failed to mark attendance');
      } finally {
        setIsUpdating(false);
      }
    };
  
    const handleSaveScore = async (studentId) => {
      try {
        const mockLevel = studentMockLevels[studentId];
        const score = scores[studentId];
  
        if (!mockLevel || !score) {
          toast.error('Please select a mock level and enter a score');
          return;
        }
  
        if (parseInt(score) > 10) {
          toast.error('Score cannot be greater than 10');
          return;
        }
  
        // Check if attendance is marked
        const attendance = mockAttendance[studentId]?.[`mock_${mockLevel}`];
        if (!attendance) {
          toast.error('Please mark attendance before entering score');
          return;
        }
  
        const mockTest = {
          id: `mock_${mockLevel}`,
          title: `Mock Test Level ${mockLevel}`,
          totalMarks: 10,
          passingMarks: 6
        };
  
        const scoreData = {
          [studentId]: score
        };
  
        await onAssignScores(scoreData, mockTest);
        
        // Clear the score after saving
        setScores(prev => ({
          ...prev,
          [studentId]: ''
        }));
  
        // If student passed this level, automatically set them to the next level
        if (parseInt(score) >= 6) {
          const nextLevel = Math.min(parseInt(mockLevel) + 1, 10);
          setStudentMockLevels(prev => ({
            ...prev,
            [studentId]: nextLevel.toString()
          }));
        }
      } catch (error) {
        console.error('Error saving score:', error);
        toast.error('Failed to save score');
      }
    };
  
    return (
 <></>
    );
  };

  export default MockTestsView;