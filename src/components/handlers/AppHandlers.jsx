import { toast } from 'react-hot-toast';
import { markAttendance } from '../../services/attendanceService';

const AppHandlers = ({
  students,
  batches,
  selectedMockTests,
  addStudent,
  updateStudent,
  deleteStudent,
  addBatch,
  updateBatch,
  deleteBatch,
  addMockTest,
  updateMockTest,
  deleteMockTest,
  toggleMockTestSelection,
  setShowStudentForm,
  setShowBatchForm,
  setShowMockForm,
  setShowAttendanceDetails,
  setShowAssignScores,
  setEditingStudent,
  setEditingBatch,
  setEditingMock,
  setSelectedStudent,
  setSelectedTest,
  setFilters
}) => {
  const handleMarkAttendance = async (studentId, date, present) => {
    try {
      // Verify student exists in our local state first
      const student = students.find(s => s.id === studentId);
      if (!student) {
        toast.error('Student not found in current data. Please refresh the page.');
        return;
      }

      await markAttendance(studentId, date, present);
      // The real-time listener will update the UI
      toast.success(`Attendance marked as ${present ? 'present' : 'absent'} for ${student.firstName}`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(error.message || 'Failed to mark attendance');
      
      // If student not found, refresh the students list
      if (error.message.includes('not found')) {
        // Trigger a refresh of the students data
        window.location.reload();
      }
    }
  };

  const handleStudentSubmit = async (formData) => {
    try {
      if (formData.editingStudent) {
        await updateStudent(formData.editingStudent.id, formData);
        toast.success('Student updated successfully');
      } else {
        await addStudent({
          ...formData,
          attendance: { class: [] },
          mockScores: []
        });
        toast.success('Student added successfully');
      }
      setShowStudentForm(false);
      setEditingStudent(null);
    } catch (error) {
      console.error('Error handling student submission:', error);
      toast.error(error.message || 'Failed to save student');
    }
  };

  const handleBatchSubmit = async (formData) => {
    if (formData.editingBatch) {
      await updateBatch(formData.editingBatch.id, formData);
    } else {
      await addBatch({
        id: Date.now().toString(),
        ...formData
      });
    }
    setShowBatchForm(false);
    setEditingBatch(null);
  };

  const handleMockSubmit = async (formData) => {
    if (formData.editingMock) {
      await updateMockTest(formData.editingMock.id, formData);
    } else {
      await addMockTest({
        id: Date.now().toString(),
        ...formData,
        scores: {}
      });
    }
    setShowMockForm(false);
    setEditingMock(null);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setShowStudentForm(true);
  };

  const handleEditBatch = (batch) => {
    setEditingBatch(batch);
    setShowBatchForm(true);
  };

  const handleEditMock = (mock) => {
    setEditingMock(mock);
    setShowMockForm(true);
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      if (window.confirm('Are you sure you want to delete this student?')) {
        await deleteStudent(studentId);
        toast.success('Student deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(error.message || 'Failed to delete student');
    }
  };

  const handleDeleteBatch = async (batchId, batchName) => {
    if (window.confirm(`Are you sure you want to delete batch "${batchName}"?`)) {
      await deleteBatch(batchId);
    }
  };

  const handleDeleteMock = async (mockId) => {
    if (window.confirm('Are you sure you want to delete this mock test?')) {
      await deleteMockTest(mockId);
    }
  };

  const handleBulkDeleteMocks = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedMockTests.length} mock tests?`)) {
      for (const mockId of selectedMockTests) {
        await deleteMockTest(mockId);
      }
    }
  };

  const handleAssignScores = async (scores, mockTest) => {
    try {
      const updatedStudents = students.map(student => {
        if (scores[student.id] !== undefined) {
          const mockScores = Array.isArray(student.mockScores) ? student.mockScores : [];
          const existingScoreIndex = mockScores.findIndex(s => s?.testId === mockTest.id);
          
          const newScore = {
            testId: mockTest.id,
            score: parseInt(scores[student.id]),
            totalMarks: mockTest.totalMarks,
            passingMarks: mockTest.passingMarks,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          if (existingScoreIndex >= 0) {
            // Update existing score
            mockScores[existingScoreIndex] = {
              ...mockScores[existingScoreIndex],
              score: parseInt(scores[student.id]),
              updatedAt: new Date().toISOString()
            };
          } else {
            // Add new score
            mockScores.push(newScore);
          }
          
          return {
            ...student,
            mockScores
          };
        }
        return student;
      });

      // Update all students with their new scores
      await Promise.all(
        updatedStudents
          .filter(student => scores[student.id] !== undefined)
          .map(student => updateStudent(student.id, {
            mockScores: student.mockScores
          }))
      );

      toast.success('Scores saved successfully');
    } catch (error) {
      console.error('Error saving scores:', error);
      toast.error('Failed to save scores');
    }
  };

  const onCloseStudentForm = () => {
    setShowStudentForm(false);
    setEditingStudent(null);
  };

  const onCloseBatchForm = () => {
    setShowBatchForm(false);
    setEditingBatch(null);
  };

  const onCloseMockForm = () => {
    setShowMockForm(false);
    setEditingMock(null);
  };

  const onCloseAttendanceDetails = () => {
    setShowAttendanceDetails(false);
    setSelectedStudent(null);
  };

  const onCloseAssignScores = () => {
    setShowAssignScores(false);
    setSelectedTest(null);
  };

  return {
    handleMarkAttendance,
    handleStudentSubmit,
    handleBatchSubmit,
    handleMockSubmit,
    handleEditStudent,
    handleEditBatch,
    handleEditMock,
    handleDeleteStudent,
    handleDeleteBatch,
    handleDeleteMock,
    handleBulkDeleteMocks,
    handleAssignScores,
    onCloseStudentForm,
    onCloseBatchForm,
    onCloseMockForm,
    onCloseAttendanceDetails,
    onCloseAssignScores
  };
};

export default AppHandlers; 