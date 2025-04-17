import { toast } from 'react-hot-toast';
import { markAttendance } from '../../services/attendanceService';
import { isBatchAssigned } from '../../services/emailService';

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
  setFilters,
  navigate,
  logout
}) => {
  const handleMarkAttendance = async (studentId, date, present) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) {
        toast.error('Student not found in current data. Please refresh the page.');
        return;
      }

      await markAttendance(studentId, date, present);
      toast.success(`Attendance marked as ${present ? 'present' : 'absent'} for ${student.firstName}`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(error.message || 'Failed to mark attendance');
      
      if (error.message.includes('not found')) {
        window.location.reload();
      }
    }
  };

  const handleStudentSubmit = async (formData) => {
    try {
      if (formData.editingStudent) {
        const oldStudent = formData.editingStudent;
        
        // Create a clean copy of the form data without the editingStudent property
        const updatedData = { ...formData };
        delete updatedData.editingStudent;
        
        // Check if this is a batch assignment
        const isBatchAssignment = 
          (oldStudent.batchId === 'unassigned' || !oldStudent.batchId) && 
          updatedData.batchId && 
          updatedData.batchId !== 'unassigned';
        
        // Display "processing" toast for batch assignments
        let toastId;
        if (isBatchAssignment) {
          const batch = batches.find(b => b.id === updatedData.batchId);
          const batchName = batch ? batch.name : 'selected batch';
          
          toastId = toast.loading(
            `Assigning ${updatedData.name} to ${batchName} and sending confirmation email...`,
            { duration: 10000 }
          );
        }
        
        // Update the student
        try {
          const result = await updateStudent(oldStudent.id, updatedData);
        } catch (updateError) {
          console.error('❌ HANDLER ERROR: Student update failed:', updateError);
          throw updateError;
        }
        
        // Handle toast based on batch assignment
        if (isBatchAssignment) {
          // Dismiss the loading toast if it's still visible
          toast.dismiss(toastId);
          
          const batch = batches.find(b => b.id === updatedData.batchId);
          const batchName = batch ? batch.name : 'selected batch';
          toast.success(
            `Student assigned to ${batchName}. A confirmation email has been sent to ${updatedData.email}`,
            { duration: 6000 }
          );
        } else {
          toast.success('Student updated successfully');
        }
      } else {
        // This is a new student
        try {
          const newStudent = await addStudent({
            ...formData,
            attendance: { class: [] },
            mockScores: []
          });
          toast.success('Student added successfully');
        } catch (addError) {
          console.error('❌ HANDLER ERROR: Failed to add student:', addError);
          throw addError;
        }
      }
      
      // Close the form
      setShowStudentForm(false);
      setEditingStudent(null);
    } catch (error) {
      console.error('❌ HANDLER ERROR: Error in handleStudentSubmit:', error);
      console.error('❌ HANDLER ERROR DETAILS:', error.stack);
      toast.error(error.message || 'Failed to save student');
    }
  };

  const handleBatchSubmit = async (formData) => {
    try {
      if (formData.editingBatch) {
        await updateBatch(formData.editingBatch.id, {
          ...formData,
          id: formData.editingBatch.id
        });
        toast.success('Batch updated successfully');
      } else {
        await addBatch(formData);
        toast.success('Batch created successfully');
      }
      setShowBatchForm(false);
      setEditingBatch(null);
    } catch (error) {
      toast.error(error.message || 'Failed to save batch');
    }
  };

  const handleMockSubmit = async (formData) => {
    try {
      if (formData.editingMock) {
        await updateMockTest(formData.editingMock.id, formData);
      } else {
        await addMockTest({
          ...formData,
          scores: {}
        });
      }
      setShowMockForm(false);
      setEditingMock(null);
    } catch (error) {
      toast.error('Failed to save mock test');
    }
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
      toast.error(error.message || 'Failed to delete student');
    }
  };

  const handleDeleteBatch = async (batchId, batchName) => {
    try {
      const studentsInBatch = students.filter(s => s.batchId === batchId);
      if (studentsInBatch.length > 0) {
        toast.error(`Cannot delete batch "${batchName}" because it has ${studentsInBatch.length} student(s). Please remove or reassign the students first.`);
        return;
      }

      if (window.confirm(`Are you sure you want to delete batch "${batchName}"?`)) {
        await deleteBatch(batchId);
        toast.success(`Batch "${batchName}" deleted successfully`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete batch');
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
            mockScores[existingScoreIndex] = {
              ...mockScores[existingScoreIndex],
              score: parseInt(scores[student.id]),
              updatedAt: new Date().toISOString()
            };
          } else {
            mockScores.push(newScore);
          }
          
          return {
            ...student,
            mockScores
          };
        }
        return student;
      });

      await Promise.all(
        updatedStudents
          .filter(student => scores[student.id] !== undefined)
          .map(student => {
            return updateStudent(student.id, {
              mockScores: student.mockScores
            });
          })
      );

      toast.success('Scores saved successfully');
    } catch (error) {
      console.error('❌ HANDLER ERROR: Failed to save scores:', error);
      console.error('❌ HANDLER ERROR DETAILS:', error.stack);
      toast.error('Failed to save scores');
    }
  };

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        toast.success('Logged out successfully');
        navigate('/login');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to log out');
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
    handleLogout,
    onCloseStudentForm,
    onCloseBatchForm,
    onCloseMockForm,
    onCloseAttendanceDetails,
    onCloseAssignScores
  };
};

export default AppHandlers; 