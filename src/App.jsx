import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import { Toaster, toast } from 'react-hot-toast';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Utilities
import { getTodayDate } from './utils/dateUtils';

// Services
import { markAttendance } from './services/attendanceService';

// Custom Hooks
import { useStudents } from './hooks/useStudents';
import { useBatches } from './hooks/useBatches';
import { useMockTests } from './hooks/useMockTests';

// Icons
import { FiUsers, FiLogOut } from 'react-icons/fi';
import { BsBook } from 'react-icons/bs';
import { RiFileListLine } from 'react-icons/ri';
import { AiOutlineClockCircle } from 'react-icons/ai';

// Pages
import Login from './pages/Login';

// Components - Common
import Modal from './components/common/Modal';

// Components - Cards
import StudentCard from './components/StudentCard';
import BatchCard from './components/BatchCard';
import MockTestCard from './components/MockTestCard';

// Components - Forms
import StudentForm from './components/forms/StudentForm';
import BatchForm from './components/forms/BatchForm';
import MockTestForm from './components/forms/MockTestForm';

// Components - Views
import StudentsView from './components/views/StudentView';
import BatchesView from './components/views/BatchesView';
import AttendanceView from './components/views/AttendanceView';
import BatchStudentsView from './components/views/BatchStudentsView';
import StudentProgressReport from './components/views/StudentProgressReport';
import FinalReportView from './components/views/FinalReportView';
import MockTestsView from './components/views/MockTestsView';

// Import AppHandlers at the top with other imports
import AppHandlers from './components/handlers/AppHandlers';

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { currentUser, userType } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin can access all routes
  if (userType === 'admin') {
    return children;
  }

  // For students
  if (userType === 'student') {
    const studentRoute = `/student/${currentUser.id}`;
    
    // If trying to access any route other than their specific student route
    if (location.pathname !== studentRoute) {
      return <Navigate to={studentRoute} replace />;
    }
    
    // Allow access to their specific route
    return children;
  }

  // Fallback - shouldn't reach here
  return <Navigate to="/login" replace />;
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userType, logout } = useAuth();

  // Custom hooks
  const {
    students,
    selectedStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    getFilteredStudents,
  } = useStudents([]);

  const {
    batches,
    addBatch,
    updateBatch,
    deleteBatch,
  } = useBatches([]);

  const {
    mockTests,
    selectedMockTests,
    addMockTest,
    updateMockTest,
    deleteMockTest,
    toggleMockTestSelection,
    getFilteredMockTests,
  } = useMockTests([]);

  // State management
  const [showAttendanceDetails, setShowAttendanceDetails] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [showMockForm, setShowMockForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingBatch, setEditingBatch] = useState(null);
  const [editingMock, setEditingMock] = useState(null);
  const [filters, setFilters] = useState({ batch: 'all', search: '' });
  const [date, setDate] = useState(getTodayDate());
  const [showAssignScores, setShowAssignScores] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Get handlers
  const handlers = AppHandlers({
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
  });

  const {
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
  } = handlers;

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

  // Update renderNavbar to renderNavbar
  const renderNavbar = () => {
    return (
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-purple-900">
                Career Sure Academy
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              {userType === 'admin' && (
                <>
                  <button
                    onClick={() => navigate('/')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <FiUsers className="text-lg" />
                    Students
                  </button>
                  <button
                    onClick={() => navigate('/batches')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/batches'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <BsBook className="text-lg" />
                    Batches
                  </button>
                  <button
                    onClick={() => navigate('/attendance')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/attendance'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <RiFileListLine className="text-lg" />
                    Attendance
                  </button>
                  <button
                    onClick={() => navigate('/mock-tests')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/mock-tests'
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <AiOutlineClockCircle className="text-lg" />
                    Mock Tests
                  </button>
                </>
              )}

              {/* User Menu & Logout */}
              <div className="flex items-center pl-6 ml-6 border-l border-gray-200">
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-700">
                    {userType === 'admin' ? 'Admin' : `Student ID: ${currentUser?.id}`}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  title="Logout"
                >
                  <FiLogOut className="text-lg" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  };

  // Don't show navbar on login page
  const showNavbar = location.pathname !== '/login';

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && currentUser && renderNavbar()}
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
      <main className={`${showNavbar ? 'pt-20' : ''} max-w-7xl mx-auto px-6 py-8`}>
        <div className="w-full">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Admin Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <StudentsView
                    renderFilters={renderFilters}
                    renderStudentList={renderStudentList}
                    onAddStudent={() => setShowStudentForm(true)}
                    onFilterChange={setFilters}
                  />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/batches"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <BatchesView
                    renderBatchList={renderBatchList}
                    onAddBatch={() => setShowBatchForm(true)}
                    totalBatches={batches.length}
                  />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/mock-tests"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <MockTestsView
                    renderMockTestList={renderMockTestList}
                    students={students}
                    filters={filters}
                    batches={batches}
                    onFilterChange={setFilters}
                    onAssignScores={handleAssignScores}
                  />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/attendance"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AttendanceView
                    students={students}
                    batches={batches}
                    filters={filters}
                    onFilterChange={setFilters}
                    onMarkAttendance={handleMarkAttendance}
                  />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/batch/:batchId/students"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <BatchStudentsView
                    students={students}
                    batches={batches}
                    onEditStudent={handleEditStudent}
                    onDeleteStudent={handleDeleteStudent}
                  />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/final-report"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <FinalReportView
                    renderFilters={renderFilters}
                    students={students}
                    batches={batches}
                    filters={filters}
                    onFilterChange={setFilters}
                  />
                </ProtectedRoute>
              }
            />

            {/* Student Route - Accessible by both admin and students */}
            <Route
              path="/student/:studentId"
              element={
                <ProtectedRoute requireAdmin={false}>
                  <StudentProgressReport students={students} batches={batches} />
                </ProtectedRoute>
              }
            />
          </Routes>

          {/* Modals */}
          <Modal
            isOpen={showStudentForm}
            onClose={onCloseStudentForm}
            title={editingStudent ? "Edit Student" : "Add Student"}
          >
            <StudentForm
              student={editingStudent}
              batches={batches}
              onSubmit={handleStudentSubmit}
              onCancel={onCloseStudentForm}
            />
          </Modal>

          <Modal
            isOpen={showBatchForm}
            onClose={onCloseBatchForm}
            title={editingBatch ? "Edit Batch" : "Add Batch"}
          >
            <BatchForm
              batch={editingBatch}
              onSubmit={handleBatchSubmit}
              onCancel={onCloseBatchForm}
            />
          </Modal>

          <Modal
            isOpen={showMockForm}
            onClose={onCloseMockForm}
            title={editingMock ? "Edit Mock Test" : "Add Mock Test"}
          >
            <MockTestForm
              test={editingMock}
              batches={batches}
              onSubmit={handleMockSubmit}
              onCancel={onCloseMockForm}
            />
          </Modal>

          {selectedStudent && (
            <Modal
              isOpen={showAttendanceDetails}
              onClose={onCloseAttendanceDetails}
              title="Attendance Details"
            >
              <AttendanceDetailsModal
                student={selectedStudent}
                onClose={onCloseAttendanceDetails}
                onMarkAttendance={handleMarkAttendance}
              />
            </Modal>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;