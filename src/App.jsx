import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useStudents } from './hooks/useStudents';
import { useBatches } from './hooks/useBatches';
import { useMockTests } from './hooks/useMockTests';
import StudentCard from './components/StudentCard';
import BatchCard from './components/BatchCard';
import MockTestCard from './components/MockTestCard';
import AttendanceDetailsModal from './components/AttendanceDetailsModal';
import StudentForm from './components/forms/StudentForm';
import BatchForm from './components/forms/BatchForm';
import MockTestForm from './components/forms/MockTestForm';
import Modal from './components/common/Modal';
import { getTodayDate, formatDateForInput } from './utils/dateUtils';
import { getAttendanceForDate, markAttendance } from './services/attendanceService';
import { updateStudent } from './services/studentService';
import { FiUsers } from 'react-icons/fi';
import { BsBook } from 'react-icons/bs';
import { RiFileListLine } from 'react-icons/ri';
import { AiOutlineClockCircle } from 'react-icons/ai';
import { BiBarChart } from 'react-icons/bi';
import './App.css';
import { Toaster, toast } from 'react-hot-toast';
import AttendanceView from './components/views/AttendanceView';
import BatchStudentsView from './components/views/BatchStudentsView';
import AssignScoresModal from './components/AssignScoresModal';
import StudentProgressReport from './components/views/StudentProgressReport';

// Separate components for each route
const StudentsView = ({ renderFilters, renderStudentList, onAddStudent, onFilterChange }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your students and their information</p>
      </div>
      <button
        onClick={onAddStudent}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
      >
        <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add New Student
      </button>
    </div>
    {renderFilters(onFilterChange)}
    {renderStudentList()}
  </div>
);

const BatchesView = ({ renderBatchList, onAddBatch, totalBatches }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your training batches and schedules
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <div className="flex flex-col">
            <span className="text-sm text-gray-600">Total Batches</span>
            <span className="text-2xl font-semibold text-blue-600">{totalBatches}</span>
          </div>
        </div>
        <button
          onClick={onAddBatch}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="text-lg">+</span>
          Add New Batch
        </button>
      </div>
    </div>
    {renderBatchList()}
  </div>
);

const MockTestsView = ({ renderMockTestList, students, filters, batches, onFilterChange, onAssignScores }) => {
  const [scores, setScores] = useState({});
  const [studentMockLevels, setStudentMockLevels] = useState({});
  const [mockAttendance, setMockAttendance] = useState({});
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
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 10)) {
      setScores(prev => ({
        ...prev,
        [studentId]: value
      }));
    }
  };

  const handleMockLevelChange = (studentId, level) => {
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
    try {
      const updatedAttendance = {
        ...mockAttendance[studentId],
        [`mock_${mockLevel}`]: {
          status: isPresent ? 'present' : 'absent',
          date: new Date().toISOString()
        }
      };

      // Update local state
      setMockAttendance(prev => ({
        ...prev,
        [studentId]: updatedAttendance
      }));

      // Update student in database
      await updateStudent(studentId, {
        mockAttendance: updatedAttendance
      });

      toast.success(`Attendance marked as ${isPresent ? 'present' : 'absent'}`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
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
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mock Tests</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and track student mock test performance</p>
        </div>
      </div>

      {/* Batch Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Batch
            </label>
            <div className="relative">
              <select
                value={filters.batch}
                onChange={(e) => onFilterChange({ ...filters, batch: e.target.value })}
                className="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {filters.batch && filters.batch !== 'all' 
                    ? `Students in ${batches.find(b => b.id === filters.batch)?.name}`
                    : 'All Students'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredStudents.map(student => {
              const selectedMockLevel = studentMockLevels[student.id];
              const mockScore = selectedMockLevel ? 
                student.mockScores?.find(s => s.testId === `mock_${selectedMockLevel}`) : 
                null;
              
              // Get all passed levels for this student
              const passedLevels = student.mockScores
                ?.filter(s => s.score >= 6)
                .map(s => parseInt(s.testId.split('_')[1]))
                .sort((a, b) => a - b) || [];

              // Get attendance status for current level
              const currentAttendance = mockAttendance[student.id]?.[`mock_${selectedMockLevel}`];
              
              return (
                <div key={student.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{student.firstName}</h3>
                    <p className="text-sm text-gray-500">{student.email}</p>
                    <div className="mt-1">
                      <span className="text-xs text-gray-500">
                        Passed Levels: {passedLevels.length > 0 ? passedLevels.join(', ') : 'None'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Mock Level Display */}
                    <div className="flex-1 min-w-[150px]">
                      <select
                        value={studentMockLevels[student.id] || '1'}
                        onChange={(e) => handleMockLevelChange(student.id, e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {mockLevels.map((level) => (
                          <option 
                            key={level.id} 
                            value={level.id}
                            disabled={level.id > (Math.max(...passedLevels, 0) + 1)}
                          >
                            {level.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Attendance Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAttendanceChange(student.id, selectedMockLevel, true)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          currentAttendance?.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(student.id, selectedMockLevel, false)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          currentAttendance?.status === 'absent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        Absent
                      </button>
                    </div>

                    {/* Score Input */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={scores[student.id] || ''}
                        onChange={(e) => handleScoreChange(student.id, e.target.value)}
                        placeholder={mockScore ? `Current: ${mockScore.score}` : "Enter score"}
                        className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={!currentAttendance}
                      />
                      <span className="text-sm text-gray-500">/10</span>
                      
                      <button
                        onClick={() => handleSaveScore(student.id)}
                        disabled={!scores[student.id] || !currentAttendance}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Save
                      </button>
                    </div>

                    {/* Current Score Display */}
                    {mockScore && (
                      <span className={`text-sm ${mockScore.score >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                        Current: {mockScore.score}/10
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mock Tests List */}
      {renderMockTestList()}
    </div>
  );
};

const FinalReportView = ({ renderFilters, students, batches, filters, onFilterChange }) => {
  const calculateAttendancePercentage = (student) => {
    if (!student.attendance?.class || !Array.isArray(student.attendance.class)) {
      return 0;
    }
    const totalDays = student.attendance.class.length;
    const presentDays = student.attendance.class.filter(a => a.status === 'present').length;
    return totalDays === 0 ? 0 : Math.round((presentDays / totalDays) * 100);
  };

  const calculateMockTestPercentage = (student) => {
    if (!student.mockScores || !Array.isArray(student.mockScores)) {
      return 0;
    }
    const totalTests = student.mockScores.length;
    const passedTests = student.mockScores.filter(score => score.score >= 6).length;
    return totalTests === 0 ? 0 : Math.round((passedTests / totalTests) * 100);
  };

  // Filter students based on selected batch
  const filteredStudents = filters.batch && filters.batch !== 'all'
    ? students.filter(student => student.batchId === filters.batch)
    : students;

  // Custom filter component for Final Report
  const renderFinalReportFilters = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Batch
            </label>
            <div className="relative">
              <select
                value={filters.batch || 'all'}
                onChange={(e) => onFilterChange({ ...filters, batch: e.target.value })}
                className="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderFinalReportFilters()}
      
      {/* Progress Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map(student => {
          const attendancePercentage = calculateAttendancePercentage(student);
          const mockTestPercentage = calculateMockTestPercentage(student);
          const batchName = batches.find(b => b.id === student.batchId)?.name || 'No Batch';
          
          // Calculate the overall grade
          const overallPercentage = Math.round((attendancePercentage + mockTestPercentage) / 2);
          let grade;
          if (overallPercentage >= 90) grade = 'A+';
          else if (overallPercentage >= 80) grade = 'A';
          else if (overallPercentage >= 70) grade = 'B+';
          else if (overallPercentage >= 60) grade = 'B';
          else if (overallPercentage >= 50) grade = 'C';
          else grade = 'F';

          return (
            <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Student Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{student.email}</p>
                    <p className="text-sm text-gray-500 mt-1">Batch: {batchName}</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-50">
                    <span className="text-xl font-bold text-purple-700">{grade}</span>
                  </div>
                </div>
              </div>

              {/* Progress Metrics */}
              <div className="p-6 space-y-6">
                {/* Attendance Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Attendance</span>
                    <span className="text-sm font-semibold text-gray-900">{attendancePercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        attendancePercentage >= 75 ? 'bg-green-500' : 
                        attendancePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${attendancePercentage}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {student.attendance?.class?.filter(a => a.status === 'present').length || 0} days present out of {student.attendance?.class?.length || 0}
                  </p>
                </div>

                {/* Mock Tests Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Mock Tests</span>
                    <span className="text-sm font-semibold text-gray-900">{mockTestPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        mockTestPercentage >= 75 ? 'bg-green-500' : 
                        mockTestPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${mockTestPercentage}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {student.mockScores?.filter(score => score.score >= 6).length || 0} tests passed out of {student.mockScores?.length || 0}
                  </p>
                </div>

                {/* Mock Test Details */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Mock Test History</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {student.mockScores?.map((score, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{score.testId}</span>
                        <span className={`font-medium ${score.score >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                          {score.score}/10
                        </span>
                      </div>
                    ))}
                    {(!student.mockScores || student.mockScores.length === 0) && (
                      <p className="text-sm text-gray-500">No mock tests taken yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Students Message */}
      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.batch && filters.batch !== 'all' 
                ? 'No students found in the selected batch' 
                : 'No students found in any batch'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Custom hooks
  const {
    students,
    selectedStudents,
    selectedStudent,
    setSelectedStudent,
    addStudent,
    updateStudent,
    deleteStudent,
    toggleStudentSelection,
    selectAllStudents,
    deselectAllStudents,
    getFilteredStudents,
    getStudentsByBatch
  } = useStudents([]);

  const {
    batches,
    selectedBatch,
    setSelectedBatch,
    addBatch,
    updateBatch,
    deleteBatch,
    getBatchById,
    getBatchProgress,
    getBatchStatus,
    getBatchStatusColor
  } = useBatches([]);

  const {
    mockTests,
    selectedMockTests,
    addMockTest,
    updateMockTest,
    deleteMockTest,
    toggleMockTestSelection,
    deselectAllMockTests,
    getFilteredMockTests,
    getMockTestById,
    getMockTestReport
  } = useMockTests([]);

  // Modal states
  const [showAttendanceDetails, setShowAttendanceDetails] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [showMockForm, setShowMockForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingBatch, setEditingBatch] = useState(null);
  const [editingMock, setEditingMock] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    batch: 'all',
    search: ''
  });

  // Date state
  const [date, setDate] = useState(getTodayDate());

  // Add this new state
  const [showAssignScores, setShowAssignScores] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  // Form handlers
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
      if (editingStudent) {
        await updateStudent(editingStudent.id, formData);
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
    if (editingBatch) {
      await updateBatch(editingBatch.id, formData);
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
    if (editingMock) {
      await updateMockTest(editingMock.id, formData);
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

  // Add this new handler
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

  // Render functions
  const renderStudentList = () => {
    const filteredStudents = getFilteredStudents(filters);

    return (
      <div className="space-y-6">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.batch && filters.batch !== 'all'
                ? 'No students found in the selected batch'
                : 'Get started by creating a new student.'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowStudentForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Student
              </button>
            </div>
          </div>
        ) : (
          <div>
            {filters.batch && filters.batch !== 'all' && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Students in {batches.find(b => b.id === filters.batch)?.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  batch={batches.find(b => b.id === student.batchId)}
                  onEdit={() => handleEditStudent(student)}
                  onDelete={() => handleDeleteStudent(student.id)}
                  onViewAttendance={() => {
                    setSelectedStudent(student);
                    setShowAttendanceDetails(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBatchList = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {batches.map((batch) => (
          <BatchCard
            key={batch.id}
            batch={batch}
            studentsCount={students.filter(s => s.batchId === batch.id).length}
            onEdit={() => handleEditBatch(batch)}
            onDelete={() => handleDeleteBatch(batch.id, batch.name)}
          />
        ))}
      </div>
    );
  };

  const renderMockTestList = () => {
    const filteredTests = getFilteredMockTests({
      ...filters,
      status: filters.mockStatus === 'all' ? undefined : filters.mockStatus
    });

    return (
      <div className="space-y-6">
        {selectedMockTests.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-purple-700">
                {selectedMockTests.length} test{selectedMockTests.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={handleBulkDeleteMocks}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Selected
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <MockTestCard
              key={test.id}
              test={test}
              onSelect={toggleMockTestSelection}
              isSelected={selectedMockTests.includes(test.id)}
              onEdit={() => handleEditMock(test)}
              onDelete={() => handleDeleteMock(test.id)}
              onAssignScores={() => {
                setSelectedTest(test);
                setShowAssignScores(true);
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderFilters = (onFilterChange) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Batch
            </label>
            <div className="relative">
              <select
                value={filters.batch || 'all'}
                onChange={(e) => onFilterChange({ batch: e.target.value })}
                className="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update renderSidebar to renderNavbar
  const renderNavbar = () => {
    return (
      <nav className="bg-white border-b border-purple-100 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-purple-900">
                Career Sure Academy
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/students')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/students'
                    ? 'bg-purple-100 text-purple-900'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <FiUsers className="text-lg" />
                Students
              </button>
              <button
                onClick={() => navigate('/batches')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/batches'
                    ? 'bg-purple-100 text-purple-900'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <BsBook className="text-lg" />
                Batches
              </button>
              <button
                onClick={() => navigate('/attendance')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/attendance'
                    ? 'bg-purple-100 text-purple-900'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <RiFileListLine className="text-lg" />
                Attendance
              </button>
              <button
                onClick={() => navigate('/mock-tests')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/mock-tests'
                    ? 'bg-purple-100 text-purple-900'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <AiOutlineClockCircle className="text-lg" />
                Mock Tests
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  };

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />

      {/* Modals */}
      {showAssignScores && selectedTest && (
        <Modal 
          isOpen={showAssignScores}
          onClose={() => setShowAssignScores(false)}
          title="Assign Mock Test Scores"
        >
          <AssignScoresModal
            test={selectedTest}
            students={students}
            onClose={() => setShowAssignScores(false)}
            onSave={handleAssignScores}
          />
        </Modal>
      )}
      
      <div className="min-h-screen bg-gray-50">
        {renderNavbar()}

        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route
                path="/"
                element={
                  <StudentsView 
                    renderFilters={() => renderFilters(setFilters)}
                    renderStudentList={renderStudentList}
                    onAddStudent={() => setShowStudentForm(true)}
                    onFilterChange={setFilters}
                  />
                }
              />
              <Route
                path="/students"
                element={
                  <StudentsView 
                    renderFilters={() => renderFilters(setFilters)}
                    renderStudentList={renderStudentList}
                    onAddStudent={() => setShowStudentForm(true)}
                    onFilterChange={setFilters}
                  />
                }
              />
              <Route
                path="/batches"
                element={
                  <BatchesView 
                    renderBatchList={renderBatchList}
                    onAddBatch={() => setShowBatchForm(true)}
                    totalBatches={batches.length}
                  />
                }
              />
              <Route
                path="/mock-tests"
                element={
                  <MockTestsView 
                    renderMockTestList={renderMockTestList}
                    students={students}
                    filters={filters}
                    batches={batches}
                    onFilterChange={setFilters}
                    onAssignScores={handleAssignScores}
                  />
                }
              />
              <Route
                path="/attendance"
                element={
                  <AttendanceView 
                    students={students}
                    batches={batches}
                    onMarkAttendance={handleMarkAttendance}
                  />
                }
              />
              <Route
                path="/batch/:batchId/students"
                element={
                  <BatchStudentsView 
                    students={students}
                    batches={batches}
                    onEditStudent={handleEditStudent}
                    onDeleteStudent={handleDeleteStudent}
                  />
                }
              />
              <Route path="/student/:studentId" element={
                <StudentProgressReport 
                  students={students}
                  batches={batches}
                />
              } />
            </Routes>
          </div>

          {/* Modals */}
          <Modal
            isOpen={showStudentForm}
            onClose={() => {
              setShowStudentForm(false);
              setEditingStudent(null);
            }}
            title={editingStudent ? "Edit Student" : "Add Student"}
          >
            <StudentForm
              student={editingStudent}
              batches={batches}
              onSubmit={handleStudentSubmit}
              onCancel={() => {
                setShowStudentForm(false);
                setEditingStudent(null);
              }}
            />
          </Modal>

          <Modal
            isOpen={showBatchForm}
            onClose={() => {
              setShowBatchForm(false);
              setEditingBatch(null);
            }}
            title={editingBatch ? "Edit Batch" : "Add Batch"}
          >
            <BatchForm
              batch={editingBatch}
              onSubmit={handleBatchSubmit}
              onCancel={() => {
                setShowBatchForm(false);
                setEditingBatch(null);
              }}
            />
          </Modal>

          <Modal
            isOpen={showMockForm}
            onClose={() => {
              setShowMockForm(false);
              setEditingMock(null);
            }}
            title={editingMock ? "Edit Mock Test" : "Add Mock Test"}
          >
            <MockTestForm
              test={editingMock}
              batches={batches}
              onSubmit={handleMockSubmit}
              onCancel={() => {
                setShowMockForm(false);
                setEditingMock(null);
              }}
            />
          </Modal>

          {selectedStudent && (
            <Modal
              isOpen={showAttendanceDetails}
              onClose={() => {
                setShowAttendanceDetails(false);
                setSelectedStudent(null);
              }}
              title="Attendance Details"
            >
              <AttendanceDetailsModal
                student={selectedStudent}
                onClose={() => {
                  setShowAttendanceDetails(false);
                  setSelectedStudent(null);
                }}
                onMarkAttendance={handleMarkAttendance}
              />
            </Modal>
          )}
        </main>
      </div>
    </>
  );
}

// Wrap the app with Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;