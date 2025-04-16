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
    console.log('👤 HANDLER: Student form submitted:', JSON.stringify(formData, null, 2));
    try {
      if (formData.editingStudent) {
        console.log('👤 HANDLER: Editing existing student');
        const oldStudent = formData.editingStudent;
        console.log('👤 HANDLER: Original student data:', JSON.stringify(oldStudent, null, 2));
        
        // Create a clean copy of the form data without the editingStudent property
        const updatedData = { ...formData };
        delete updatedData.editingStudent;
        
        // Preserve the student ID to ensure we're updating the existing record
        // This ensures we're not creating a new document
        console.log('👤 HANDLER: Student ID being updated:', oldStudent.id);
        
        console.log('👤 HANDLER: Updated student data:', JSON.stringify(updatedData, null, 2));
        
        // Check if this is a batch assignment
        const isBatchAssignment = 
          (oldStudent.batchId === 'unassigned' || !oldStudent.batchId) && 
          updatedData.batchId && 
          updatedData.batchId !== 'unassigned';
        
        console.log('👤 HANDLER: Is this a batch assignment?', isBatchAssignment);
        console.log('👤 HANDLER: Old batch condition:', (oldStudent.batchId === 'unassigned' || !oldStudent.batchId));
        console.log('👤 HANDLER: Old batch value:', oldStudent.batchId);
        console.log('👤 HANDLER: New batch condition:', (updatedData.batchId && updatedData.batchId !== 'unassigned'));
        console.log('👤 HANDLER: New batch value:', updatedData.batchId);
        
        if (isBatchAssignment) {
          console.log('👤 HANDLER: Batch assignment detected. Old batch:', oldStudent.batchId, 'New batch:', updatedData.batchId);
        }
        
        // Display "processing" toast for batch assignments
        let toastId;
        if (isBatchAssignment) {
          const batch = batches.find(b => b.id === updatedData.batchId);
          const batchName = batch ? batch.name : 'selected batch';
          console.log('👤 HANDLER: Found batch name for display:', batchName);
          console.log('👤 HANDLER: Batches available:', JSON.stringify(batches.map(b => ({id: b.id, name: b.name})), null, 2));
          
          toastId = toast.loading(
            `Assigning ${updatedData.name} to ${batchName} and sending confirmation email...`,
            { duration: 10000 }
          );
          console.log('👤 HANDLER: Displayed loading toast with ID:', toastId);
        }
        
        // Update the student
        console.log('👤 HANDLER: Calling updateStudent service with ID:', oldStudent.id);
        try {
          const result = await updateStudent(oldStudent.id, updatedData);
          console.log('👤 HANDLER: Update successful. Result:', JSON.stringify(result, null, 2));
          console.log('👤 HANDLER: Email sent status:', result.emailSent);
          
          if (result.emailDetails) {
            console.log('👤 HANDLER: Email details:', JSON.stringify(result.emailDetails, null, 2));
          } else {
            console.log('👤 HANDLER: No email details returned from update operation');
          }
        } catch (updateError) {
          console.error('❌ HANDLER ERROR: Student update failed:', updateError);
          throw updateError;
        }
        
        // Handle toast based on batch assignment
        if (isBatchAssignment) {
          // Dismiss the loading toast if it's still visible
          console.log('👤 HANDLER: Dismissing loading toast:', toastId);
          toast.dismiss(toastId);
          
          const batch = batches.find(b => b.id === updatedData.batchId);
          const batchName = batch ? batch.name : 'selected batch';
          console.log('👤 HANDLER: Showing success toast for batch assignment to:', batchName);
          toast.success(
            `Student assigned to ${batchName}. A confirmation email has been sent to ${updatedData.email}`,
            { duration: 6000 }
          );
        } else {
          console.log('👤 HANDLER: Showing generic success toast');
          toast.success('Student updated successfully');
        }
      } else {
        // This is a new student
        console.log('👤 HANDLER: Adding new student');
        try {
          const newStudent = await addStudent({
            ...formData,
            attendance: { class: [] },
            mockScores: []
          });
          console.log('👤 HANDLER: New student added successfully:', JSON.stringify(newStudent, null, 2));
          toast.success('Student added successfully');
        } catch (addError) {
          console.error('❌ HANDLER ERROR: Failed to add student:', addError);
          throw addError;
        }
      }
      
      // Close the form
      console.log('👤 HANDLER: Closing student form');
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

      console.log('📊 HANDLER: Updating mock scores for students...');
      await Promise.all(
        updatedStudents
          .filter(student => scores[student.id] !== undefined)
          .map(student => {
            console.log(`📊 HANDLER: Updating mock scores for student ${student.id}`);
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