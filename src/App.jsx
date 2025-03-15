import { useState, useEffect } from 'react'
import './App.css'
import { db, storage } from './firebase'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
  collectionGroup,
  setDoc
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { auth } from './firebase'
import { initializeApp } from 'firebase/app';

// Update the style constants with more professional and consistent styling
const cardStyle = `
  bg-white rounded-xl border border-gray-200/80 shadow-sm
  transition-all duration-300 hover:shadow-lg hover:border-blue-200/50
  backdrop-filter backdrop-blur-sm
`

const buttonStyle = `
  px-4 py-2.5 rounded-lg font-medium shadow-sm
  transition-all duration-300 transform active:scale-95
  focus:outline-none focus:ring-2 focus:ring-offset-2
`

const primaryButtonStyle = `
  ${buttonStyle}
  bg-gradient-to-r from-blue-600 to-blue-700 
  hover:from-blue-700 hover:to-blue-800
  text-white focus:ring-blue-500
`

const secondaryButtonStyle = `
  ${buttonStyle}
  bg-gray-50 hover:bg-gray-100 
  text-gray-700 hover:text-gray-900
  border border-gray-200 hover:border-gray-300
  focus:ring-gray-500
`

const dangerButtonStyle = `
  ${buttonStyle}
  bg-red-50 hover:bg-red-100
  text-red-600 hover:text-red-700
  border border-red-200 hover:border-red-300
  focus:ring-red-500
`

const successButtonStyle = `
  ${buttonStyle}
  bg-green-50 hover:bg-green-100
  text-green-600 hover:text-green-700
  border border-green-200 hover:border-green-300
  focus:ring-green-500
`

const inputStyle = `
  w-full px-4 py-2.5 rounded-lg border border-gray-300
  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
  transition-all duration-200 bg-white
  placeholder-gray-400 text-gray-900
`

const selectStyle = `
  ${inputStyle}
  appearance-none bg-no-repeat
  bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"%3E%3Cpath stroke="%236B7280" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 8l4 4 4-4"/%3E%3C/svg%3E')]
  bg-[length:1.25em_1.25em] bg-[right_0.5rem_center]
  pr-10
`

const labelStyle = `
  block text-sm font-medium text-gray-700 mb-1
`

const cardHeaderStyle = `
  p-6 border-b border-gray-100
  bg-gradient-to-r from-gray-50 to-white
`

// Add these new professional styles
const tableStyle = `
  min-w-full divide-y divide-gray-200 
  bg-white shadow-sm rounded-lg border border-gray-200
`

const tableHeaderStyle = `
  px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
  bg-gray-50 border-b border-gray-200
`

const tableRowStyle = `
  hover:bg-gray-50 transition-colors duration-200
`

const tableCellStyle = `
  px-6 py-4 whitespace-nowrap text-sm text-gray-900
`

const badgeStyle = (color) => `
  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
  ${color === 'green' ? 'bg-green-100 text-green-800' :
    color === 'red' ? 'bg-red-100 text-red-800' :
      color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
        color === 'blue' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'}
`

const modalStyle = `
  fixed inset-0 bg-black/40 backdrop-blur-sm
  flex items-center justify-center z-50
  transition-opacity duration-300
`

const modalContentStyle = `
  bg-white rounded-xl shadow-xl
  max-w-2xl w-full mx-4 max-h-[90vh]
  overflow-y-auto border border-gray-200
  transform transition-all duration-300
  scale-95 opacity-0 animate-in
`

// Add new animation classes
const fadeInAnimation = `
  animate-[fadeIn_0.2s_ease-in-out]
`

const slideUpAnimation = `
  animate-[slideUp_0.3s_ease-out]
`

// Add back the sidebarButtonStyle with improvements
const sidebarButtonStyle = `
  w-full text-left px-4 py-3 rounded-lg 
  transition-all duration-300 
  hover:bg-blue-50/80 
  focus:outline-none focus:ring-2 focus:ring-blue-200
  flex items-center justify-between
  text-gray-600 hover:text-gray-900
`

// Update the sidebar styling to include both old and new styles
const sidebarStyle = `
  w-64 bg-white shadow-lg
  flex flex-col
  border-r border-gray-200
`

const sidebarItemStyle = `
  flex items-center gap-3 px-4 py-3 rounded-lg
  transition-all duration-200
  text-gray-600 hover:text-gray-900
  hover:bg-gray-50
`

const sidebarItemActiveStyle = `
  ${sidebarItemStyle}
  bg-blue-50 text-blue-600
  font-medium
`

// Keep only this declaration with the other attendance-related styles
const attendanceCardStyle = `
  ${cardStyle}
  overflow-hidden
`

const attendanceHeaderStyle = `
  ${cardHeaderStyle}
  bg-gradient-to-r from-blue-50 to-gray-50
`

const attendanceTableStyle = `
  ${tableStyle}
  bg-white backdrop-filter backdrop-blur-sm
`

const attendanceButtonStyle = (isActive, type) => `
  ${buttonStyle}
  flex items-center gap-2 text-sm
  ${isActive
    ? type === 'present'
      ? 'bg-green-100 text-green-800 border border-green-200'
      : 'bg-red-100 text-red-800 border border-red-200'
    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50'}
`

const attendanceStatusBadge = (status) => `
  ${badgeStyle(
  status === 'present' ? 'green' :
    status === 'absent' ? 'red' : 'gray'
)}
`

const mockTestCardStyle = `
  ${cardStyle}
  hover:border-blue-200
`

const mockTestHeaderStyle = `
  ${cardHeaderStyle}
  bg-gradient-to-r from-blue-50 to-gray-50
`

const mockScoreStyle = (score, maxScore) => `
  ${badgeStyle(
  score >= maxScore * 0.8 ? 'green' :
    score >= maxScore * 0.6 ? 'yellow' : 'red'
)}
`

// Add back the search input style
const searchInputStyle = `
  ${inputStyle}
  w-72
  bg-white/90 backdrop-blur-sm backdrop-filter
`

// Add these new components for better UX
const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
)

const EmptyState = ({ icon, title, description }) => (
  <div className="text-center py-12">
    <div className="bg-gray-50 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 max-w-sm mx-auto">{description}</p>
  </div>
)

// Update the Alert component for better visibility
const Alert = ({ type, message, onClose }) => (
  <div className={`
    fixed top-4 right-4 z-50 
    ${fadeInAnimation}
    max-w-md w-full
  `}>
    <div className={`
      rounded-lg shadow-lg p-4
      ${type === 'success' ? 'bg-green-50 border border-green-200' :
        type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'}
    `}>
      <div className="flex items-center gap-3">
        {type === 'success' ? (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <p className={`font-medium ${type === 'success' ? 'text-green-800' :
          type === 'error' ? 'text-red-800' :
            'text-blue-800'
          }`}>
          {message}
        </p>
        <button
          onClick={onClose}
          className="ml-auto p-1 rounded-full hover:bg-white/50 transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
)

// Add a new component for form sections
const FormSection = ({ title, description, children }) => (
  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
    <div className="mb-4">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
    </div>
    {children}
  </div>
)

// Add this new component for the attendance details modal
const AttendanceDetailsModal = ({ student, onClose }) => {
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly', 'monthly', 'overall'
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Get attendance records based on active tab
  const getFilteredRecords = () => {
    const records = student.attendance?.class || [];
    const today = new Date();

    switch (activeTab) {
      case 'weekly':
        const lastWeek = new Date(today.setDate(today.getDate() - 7));
        return records.filter(record => new Date(record.date) >= lastWeek);
      case 'monthly':
        return records.filter(record => record.date.startsWith(selectedMonth));
      default:
        return records;
    }
  };

  // Calculate attendance statistics
  const calculateStats = (records) => {
    const total = records.length;
    const present = records.filter(r => r.present).length;
    const percentage = total > 0 ? (present / total) * 100 : 0;

    return { total, present, absent: total - present, percentage };
  };

  const filteredRecords = getFilteredRecords();
  const stats = calculateStats(filteredRecords);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 ring-4 ring-white">
                {student.imageUrl ? (
                  <img src={student.imageUrl} alt={student.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-blue-50 text-blue-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
                <p className="text-sm text-gray-600">Roll No: {student.rollNumber}</p>
                <p className="text-sm text-gray-600">Batch: {student.batch}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            {['weekly', 'monthly', 'overall'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm font-medium text-blue-600">Total Days</p>
              <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-sm font-medium text-green-600">Present</p>
              <p className="text-2xl font-bold text-green-700">{stats.present}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-sm font-medium text-red-600">Absent</p>
              <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <p className="text-sm font-medium text-purple-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-purple-700">{stats.percentage.toFixed(1)}%</p>
            </div>
          </div>

          {/* Month Selector for Monthly View */}
          {activeTab === 'monthly' && (
            <div className="mb-6">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              />
            </div>
          )}

          {/* Attendance Calendar */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {filteredRecords.map((record) => (
                <div
                  key={record.date}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(record.date).toLocaleDateString('en-US', { year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${record.present
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {record.present ? 'Present' : 'Absent'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add back the cardHoverStyle with improvements
const cardHoverStyle = `
  hover:shadow-lg hover:border-blue-200/50
  transition-all duration-300 transform
  hover:-translate-y-0.5
`

function App() {
  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  // Helper function to get last 7 dates
  const getLast7Days = () => {
    const dates = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  // Change from const to state
  const [batches, setBatches] = useState([
    {
      id: 1,
      name: 'Morning Batch',
      startTime: '09:00', // Changed to 24-hour format
      endTime: '11:00',
      daysOfWeek: ['Monday', 'Wednesday', 'Friday'],
      trainer: 'John Doe'
    },
    {
      id: 2,
      name: 'Afternoon Batch',
      startTime: '14:00',
      endTime: '16:00',
      daysOfWeek: ['Tuesday', 'Thursday', 'Saturday'],
      trainer: 'Jane Smith'
    },
    {
      id: 3,
      name: 'Evening Batch',
      startTime: '18:00',
      endTime: '20:00',
      daysOfWeek: ['Monday', 'Tuesday', 'Thursday'],
      trainer: 'Mike Johnson'
    },
    {
      id: 4,
      name: 'Weekend Batch',
      startTime: '10:00',
      endTime: '13:00',
      daysOfWeek: ['Saturday', 'Sunday'],
      trainer: 'Sarah Brown'
    }
  ])

  // Update student structure to include batch
  const [students, setStudents] = useState([
    {
      id: 1,
      name: 'John Doe',
      rollNumber: '001',
      batchId: 1,
      attendance: {
        scrum: [],
        class: [],
      }
    },
    { id: 2, name: 'Jane Smith', attendance: false },
    { id: 3, name: 'Mike Johnson', attendance: true },
  ])

  console.log(students)

  // First, make sure the newStudent state includes gender
  const [newStudent, setNewStudent] = useState({
    name: '',
    rollNumber: '',
    batch: '',
    gender: '',
    contactNumber: '',
    email: '',
    image: null,
    imageUrl: '',
    attendance: {
      scrum: [],
      class: []
    }
  })

  const [showForm, setShowForm] = useState(false)

  const [selectedStudent, setSelectedStudent] = useState(null)

  // Add new state for selected students
  const [selectedStudents, setSelectedStudents] = useState([])
  const [bulkAction, setBulkAction] = useState(false)
  const [bulkScore, setBulkScore] = useState('')

  // Add state for mock test selection
  const [selectedMock, setSelectedMock] = useState(null);
  const [bulkMockScore, setBulkMockScore] = useState('')

  // Add new view option in state
  const [currentView, setCurrentView] = useState('students') // 'students', 'attendance', or 'mock'

  // Add these new state variables at the top of the App component
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [dateRange, setDateRange] = useState({
    start: getTodayDate(),
    end: getTodayDate()
  })

  // Add search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('all')

  // Add new state for single date filter
  const [filterType, setFilterType] = useState('range'); // 'range' or 'single'
  const [singleDate, setSingleDate] = useState(getTodayDate());

  // Add these new states for date filtering
  const [attendanceFilterType, setAttendanceFilterType] = useState('single') // 'single' or 'range'
  const [attendanceDateRange, setAttendanceDateRange] = useState({
    start: getTodayDate(),
    end: getTodayDate()
  })

  // Add this new helper function
  const formatDateForInput = (date) => {
    return new Date(date).toISOString().split('T')[0]
  }

  // Add this function to get attendance status for a specific date and type
  const getAttendanceForDate = (student, date, type) => {
    return student.attendance[type]?.find(record => record.date === date)?.present || false
  }

  // Add function to check if today is a mock test day
  const isMockTestDay = (testId) => {
    const test = mockTests.find(t => t.id === testId)
    return test?.date === getTodayDate()
  }

  // Update the mock test table to show scheduled dates
  const getMockTestStatus = (test) => {
    const today = getTodayDate()
    if (test.date < today) return 'Completed'
    if (test.date === today) return 'Today'
    return `Scheduled for ${formatDate(test.date)}`
  }

  // Modify the mock score input to only allow entry on test day
  const canEnterMockScore = (testId) => {
    const test = mockTests.find(t => t.id === testId)
    return test?.date === getTodayDate()
  }

  // Add attendance type selection
  const [attendanceType, setAttendanceType] = useState('class') // 'scrum' or 'class'

  // Update attendance tracking
  const toggleAttendance = async (studentId) => {
    try {
      const studentRef = doc(db, 'students', studentId);
      const student = students.find(s => s.id === studentId);
      const newAttendance = !getAttendanceForDate(student, selectedDate, attendanceType);

      // Update attendance in Firestore
      await updateDoc(studentRef, {
        attendance: {
          ...student.attendance,
          [attendanceType]: [
            ...(student.attendance[attendanceType] || []).filter(
              record => record.date !== selectedDate
            ),
            { date: selectedDate, present: newAttendance }
          ].sort((a, b) => new Date(b.date) - new Date(a.date))
        }
      });

      // Remove scrum attendance data if it exists
      if (attendanceType === 'scrum') {
        delete student.attendance.scrum; // Remove scrum attendance
        await updateDoc(studentRef, {
          attendance: {
            ...student.attendance
          }
        });
      }

      // Store attendance data in a separate collection if needed
      await addDoc(collection(db, 'attendance'), {
        studentId: studentId,
        date: selectedDate,
        type: attendanceType,
        present: newAttendance
      });

      await fetchStudents();
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  // Update mock score function
  const updateMockScore = async (studentId, newScore) => {
    try {
      const studentRef = doc(db, 'students', studentId);
      const student = students.find(s => s.id === studentId);
      const parsedScore = parseInt(newScore);

      await updateDoc(studentRef, {
        mockScores: student.mockScores.map(score =>
          score.mockId === selectedMock ? { ...score, score: parsedScore } : score
        )
      });

      await fetchStudents();
    } catch (error) {
      console.error('Error updating mock score:', error);
    }
  };

  // Add these new functions for Firebase operations
  const fetchStudents = async () => {
    try {
      // First ensure the collection exists
      await initializeStudentsCollection();

      const studentsRef = collection(db, 'students');
      const querySnapshot = await getDocs(studentsRef);
      const studentsData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(student => !student._initialized); // Filter out initialization document if it exists

      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      // setAlertMessage('Failed to fetch students data');
      // setAlertType('error');
      // setShowAlert(true);
    }
  };

  const fetchBatches = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'batches'));
      const batchesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBatches(batchesData);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  // Add these new states
  const [batchStartDate, setBatchStartDate] = useState(getTodayDate());

  // Add this helper function to generate attendance records from batch start date
  const generateAttendanceRecords = (startDate, batchDays) => {
    const records = [];
    const start = new Date(startDate);
    const today = new Date();

    // Loop through each date from start date to today
    for (let date = new Date(start); date <= today; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

      // Only add record if it's a batch day
      if (batchDays.includes(dayOfWeek)) {
        records.push({
          date: date.toISOString().split('T')[0],
          present: false // Mark as absent by default
        });
      }
    }

    return records;
  };

  // Update handleSubmit for students
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate required fields
      const requiredFields = ['name', 'rollNumber', 'batch', 'gender', 'contactNumber', 'email'];
      const missingFields = requiredFields.filter(field => !newStudent[field]);

      if (missingFields.length > 0) {
        // setAlertMessage(`Please fill in all required fields: ${missingFields.join(', ')}`);
        // setAlertType('error');
        // setShowAlert(true);
        return;
      }

      // setAlertMessage('Processing your request...');
      // setAlertType('info');
      // setShowAlert(true);

      let imageUrl = newStudent.imageUrl;

      // Handle image upload if there's a new image
      if (newStudent.image) {
        const storageRef = ref(storage, `student-images/${Date.now()}-${newStudent.image.name}`);
        await uploadBytes(storageRef, newStudent.image);
        imageUrl = await getDownloadURL(storageRef);
      }

      // Get batch details
      const selectedBatchData = batches.find(b => b.name === newStudent.batch);

      if (!selectedBatchData) {
        throw new Error('Selected batch not found');
      }

      // Generate attendance records from batch start date
      const attendanceRecords = generateAttendanceRecords(
        selectedBatchData.startDate,
        selectedBatchData.daysOfWeek
      );

      // Create base student data
      const studentData = {
        name: newStudent.name.trim(),
        rollNumber: newStudent.rollNumber.trim(),
        batch: newStudent.batch,
        gender: newStudent.gender,
        contactNumber: newStudent.contactNumber.trim(),
        email: newStudent.email.trim(),
        imageUrl,
        attendance: {
          class: attendanceRecords,
          scrum: []
        },
        status: 'active',
        updatedAt: serverTimestamp(),
        mockScores: [],
        batchId: selectedBatchData.id // Add reference to batch
      };

      if (editingStudent) {
        // Update existing student
        const studentRef = doc(db, 'students', editingStudent.id);

        // Merge existing attendance with new records
        const existingRecords = editingStudent.attendance?.class || [];
        const mergedRecords = [...existingRecords];

        attendanceRecords.forEach(newRecord => {
          const existingIndex = mergedRecords.findIndex(r => r.date === newRecord.date);
          if (existingIndex === -1) {
            mergedRecords.push(newRecord);
          }
        });

        studentData.attendance.class = mergedRecords;
        studentData.mockScores = editingStudent.mockScores || []; // Preserve existing mock scores

        await updateDoc(studentRef, studentData);

        // Update local state
        setStudents(prevStudents =>
          prevStudents.map(s =>
            s.id === editingStudent.id
              ? { ...s, ...studentData, id: editingStudent.id }
              : s
          )
        );

        // setAlertMessage(`${newStudent.name}'s information has been successfully updated!`);
      } else {
        // Add new student
        studentData.createdAt = serverTimestamp();
        studentData.mockScores = []; // Initialize empty mock scores for new student

        // Create the student document
        const studentsRef = collection(db, 'students');
        const docRef = await addDoc(studentsRef, studentData);

        // Update local state
        setStudents(prevStudents => [...prevStudents, { ...studentData, id: docRef.id }]);

        // setAlertMessage(`${newStudent.name} has been successfully added!`);
      }

      // setAlertType('success');
      // setShowAlert(true);
      // setTimeout(() => setShowAlert(false), 3000);

      // Reset form
      setNewStudent({
        name: '',
        rollNumber: '',
        batch: '',
        gender: '',
        contactNumber: '',
        email: '',
        image: null,
        imageUrl: '',
        attendance: { scrum: [], class: [] }
      });
      setEditingStudent(null);
      setShowForm(false);
      setCurrentView('students-view');

      // Refresh data
      await fetchStudents();

      // Inside the try block of handleSubmit, after creating studentData
      console.log('Student data to be added:', studentData);

      // After successfully adding a new student
      console.log('New student added with ID:', docRef.id);

      // After successfully updating an existing student
      console.log('Student updated:', editingStudent.id);

    } catch (error) {
      console.error('Error saving student:', error);
      // setAlertMessage(`Failed to ${editingStudent ? 'update' : 'add'} student: ${error.message}`);
      // setAlertType('error');
      // setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  // Update handleBatchSubmit
  const handleBatchSubmit = async (e) => {
    e.preventDefault();

    try {
      const batchData = {
        ...newBatch,
        startDate: batchStartDate,
        createdAt: new Date().toISOString()
      };

      if (editingBatch) {
        // Update existing batch
        const batchRef = doc(db, 'batches', editingBatch.id);
        await updateDoc(batchRef, batchData);

        // Update local batches state immediately
        setBatches(prevBatches =>
          prevBatches.map(b =>
            b.id === editingBatch.id
              ? { ...b, ...batchData }
              : b
          )
        );

        // Update attendance records for all students in this batch
        const studentsToUpdate = students.filter(
          student => student.batch?.toString() === editingBatch.name?.toString()
        );

        const updatedStudents = [];
        for (const student of studentsToUpdate) {
          const studentRef = doc(db, 'students', student.id);
          const newRecords = generateAttendanceRecords(batchStartDate, newBatch.daysOfWeek);

          // Merge existing attendance with new records
          const existingRecords = student.attendance?.class || [];
          const mergedRecords = [...existingRecords];

          newRecords.forEach(newRecord => {
            const existingIndex = mergedRecords.findIndex(r => r.date === newRecord.date);
            if (existingIndex === -1) {
              mergedRecords.push(newRecord);
            }
          });

          const updatedStudent = {
            ...student,
            batch: newBatch.name,
            attendance: {
              ...student.attendance,
              class: mergedRecords
            }
          };
          updatedStudents.push(updatedStudent);

          await updateDoc(studentRef, {
            batch: newBatch.name,
            attendance: updatedStudent.attendance
          });
        }

        // Update local students state immediately
        setStudents(prevStudents =>
          prevStudents.map(student =>
            updatedStudents.find(u => u.id === student.id) || student
          )
        );

        setAlert({
          type: 'success',
          message: 'Batch updated successfully!'
        });
      } else {
        // Create new batch
        const docRef = await addDoc(collection(db, 'batches'), batchData);

        // Update local state immediately with the new batch
        setBatches(prevBatches => [...prevBatches, { id: docRef.id, ...batchData }]);

        setAlert({
          type: 'success',
          message: 'New batch created successfully!'
        });
      }

      // Reset form and state
      setNewBatch({
        name: '',
        startTime: '',
        endTime: '',
        daysOfWeek: [],
        trainer: ''
      });
      setBatchStartDate(getTodayDate());
      setEditingBatch(null);
      setShowBatchForm(false);
      setCurrentView('batches-view');

      // Refresh data in the background to ensure consistency
      fetchBatches();
      fetchStudents();
    } catch (error) {
      console.error('Error saving batch:', error);
      setAlert({
        type: 'error',
        message: `Failed to save batch: ${error.message}`
      });
    }
  };

  // Update handleDeleteStudent
  const handleDeleteStudent = async (studentId) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        // Delete student document
        await deleteDoc(doc(db, 'students', studentId));

        // Delete student image if exists
        const student = students.find(s => s.id === studentId);
        if (student?.imageUrl) {
          const imageRef = ref(storage, student.imageUrl);
          await deleteObject(imageRef);
        }

        // Refresh students list
        await fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };

  // Add useEffect to fetch initial data
  useEffect(() => {
    fetchStudents();
    fetchBatches();
  }, []);



  const closeReport = () => {
    setSelectedStudent(null)
  }

  // Update the average score calculation to handle absent students and affect the average
  const calculateAverageScore = (scores) => {
    if (!scores || scores.length === 0) return 0
    const totalTests = scores.length
    const totalScore = scores.reduce((acc, test) => {
      // If student was absent, count it as 0
      return acc + (test.absent ? 0 : test.score)
    }, 0)
    return (totalScore / totalTests).toFixed(1)
  }

  // Update the attendance calculation to include absent days
  const calculateAttendancePercentage = (attendance, type) => {
    if (!attendance || !attendance[type] || attendance[type].length === 0) return 0
    const totalDays = attendance[type].length
    const presentDays = attendance[type].filter(day => day.present).length
    return ((presentDays / totalDays) * 100).toFixed(1)
  }

  // Keep only this version
  const calculateAttendanceForRange = (history, startDate, endDate) => {
    if (!history || history.length === 0) return 0
    const filteredHistory = history.filter(record => {
      const recordDate = new Date(record.date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return recordDate >= start && recordDate <= end
    })
    const present = filteredHistory.filter(day => day.present).length
    return filteredHistory.length > 0
      ? ((present / filteredHistory.length) * 100).toFixed(1)
      : '0.0'
  }

  // Add a function to get class performance including absents
  const getClassPerformance = (testId) => {
    const test = mockTests.find(t => t.id === testId)
    if (!test) return 0

    const studentsWithScores = students.filter(s =>
      s.mockScores.some(score => score.mockId === testId)
    )

    if (studentsWithScores.length === 0) return 0

    const totalScore = studentsWithScores.reduce((acc, student) => {
      const score = student.mockScores.find(s => s.mockId === testId)
      return acc + (score.absent ? 0 : score.score)
    }, 0)

    return (totalScore / studentsWithScores.length).toFixed(1)
  }

  // Add a function to get student's performance summary
  const getStudentPerformanceSummary = (student) => {
    const totalTests = student.mockScores.length
    const absentCount = student.mockScores.filter(score => score.absent).length
    const averageScore = calculateAverageScore(student.mockScores)

    return {
      totalTests,
      absentCount,
      averageScore,
      attendanceRate: ((totalTests - absentCount) / totalTests * 100).toFixed(1)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  // Add select all function
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(students.map(student => student.id))
    } else {
      setSelectedStudents([])
    }
  }

  // Add toggle single selection function
  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  // Update the bulk attendance marking function to handle both types
  const markBulkAttendance = (present) => {
    const today = getTodayDate()

    setStudents(students.map(student => {
      if (selectedStudents.includes(student.id)) {
        return {
          ...student,
          attendance: {
            ...student.attendance,
            [attendanceType]: [
              ...(student.attendance[attendanceType] || []).filter(
                record => record.date !== today
              ),
              { date: today, present }
            ]
          }
        }
      }
      return student
    }))
    setSelectedStudents([]) // Clear selection after marking
  }

  // Add bulk score update function
  const updateBulkScore = () => {
    if (!bulkScore) return

    const today = getTodayDate()
    const score = parseInt(bulkScore)

    setStudents(students.map(student => {
      if (selectedStudents.includes(student.id)) {
        return {
          ...student,
          mockScores: student.mockScores.map(s =>
            s.mockId === selectedMock ? { ...s, score } : s
          ),
          attendanceHistory: [
            ...(student.attendanceHistory || []).filter(
              record => record.date !== today
            ),
            { date: today, present: score > 0 }
          ].sort((a, b) => new Date(b.date) - new Date(a.date))
        }
      }
      return student
    }))
    setBulkScore('')
  }

  // Update bulk score function for specific mock tests
  const updateBulkMockScore = () => {
    const test = mockTests.find(t => t.id === selectedMock)
    if (!test) return

    setStudents(students.map(student => {
      if (selectedStudents.includes(student.id)) {
        const updatedMockScores = [
          ...(student.mockScores || []).filter(s => s.mockId !== selectedMock),
          {
            mockId: selectedMock,
            score: parseInt(bulkMockScore),
            date: test.date,
            absent: false
          }
        ].sort((a, b) => new Date(b.date) - new Date(a.date))
        return { ...student, mockScores: updatedMockScores }
      }
      return student
    }))
    setBulkMockScore('')
    setSelectedStudents([])
  }

  // Function to get mock test score for a student
  const getStudentMockScore = (student, testId) => {
    const score = student.mockScores?.find(s => s.mockId === testId)
    if (!score) return ''
    return score.absent ? 'Absent' : score.score
  }

  // Add these new state variables
  const [selectedTest, setSelectedTest] = useState(null)

  // Add this function to check if a test can be scored
  const canScoreTest = (test) => {
    const testDate = new Date(test.date)
    const today = new Date(getTodayDate())
    return testDate <= today
  }

  // Add edit student state
  const [editingStudent, setEditingStudent] = useState(null)

  // Add function to handle student edit
  const handleEditStudent = (student) => {
    setEditingStudent(student)
    setShowForm(true)
  }

  // Add function to get unique classes
  const getUniqueClasses = () => {
    const classes = new Set(students.map(student => student.class))
    return ['all', ...Array.from(classes)]
  }

  // Add function to filter students
  const getFilteredStudents = () => {
    return students.filter(student => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        student.name?.toLowerCase().includes(searchLower) ||
        student.rollNumber?.toLowerCase().includes(searchLower) ||
        student.batch?.toString().includes(searchLower);
      const matchesClass = filterClass === 'all' || student.class === filterClass
      return matchesSearch && matchesClass
    })
  }

  // Add this function to get attendance records for the date range
  const getAttendanceRecords = (student) => {
    return student.attendanceHistory?.filter(record =>
      record.date >= dateRange.start &&
      record.date <= dateRange.end
    ).sort((a, b) => new Date(b.date) - new Date(a.date)) || []
  }

  // Add this function to get formatted attendance history
  const getFormattedAttendanceHistory = (student) => {
    return (student.attendanceHistory || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(record => ({
        ...record,
        formattedDate: formatDate(record.date)
      }))
  }

  // Add this function to get formatted mock test history
  const getFormattedMockHistory = (student) => {
    return (student.mockScores || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(score => ({
        ...score,
        testName: mockTests.find(test => test.id === score.mockId)?.name || 'Unknown Test',
        maxScore: mockTests.find(test => test.id === score.mockId)?.maxScore || 100,
        formattedDate: formatDate(score.date)
      }))
  }

  // Add batch selection state
  const [selectedBatch, setSelectedBatch] = useState('')

  // Add batch filtering function
  const getStudentsByBatch = () => {
    return students.filter(student => student.batch?.toString() === selectedBatch?.toString());
  }

  const [editingMock, setEditingMock] = useState(null)
  const [newMock, setNewMock] = useState({
    name: '',
    maxScore: '',
    date: getTodayDate()
  })

  // Add state for feedback messages
  const [feedback, setFeedback] = useState({ message: '', type: '' }) // type can be 'success' or 'error'

  // Handle mock test form submission
  const handleSubmitMockTest = (e) => {
    e.preventDefault()

    const newMockTest = {
      id: editingMock ? editingMock.id : Date.now(),
      name: newMock.name,
      maxScore: parseInt(newMock.maxScore),
      date: newMock.date,
      allowAbsent: true
    }

    if (editingMock) {
      // Update existing mock test
      setMockTests(mockTests.map(test =>
        test.id === editingMock.id ? newMockTest : test
      ))
    } else {
      // Add new mock test
      setMockTests([...mockTests, newMockTest])
    }

    // Reset form
    setNewMock({ name: '', maxScore: '', date: getTodayDate() })
    setEditingMock(null)
    setShowMockForm(false)
  }

  // Add validation to the form
  const validateMockTest = () => {
    if (!newMock.name.trim()) {
      alert('Please enter a test name')
      return false
    }
    if (!newMock.maxScore || parseInt(newMock.maxScore) <= 0) {
      alert('Please enter a valid maximum score')
      return false
    }
    if (!newMock.date) {
      alert('Please select a test date')
      return false
    }
    return true
  }

  // Update the form submission to include validation
  const handleMockSubmit = (e) => {
    e.preventDefault()
    if (!validateMockTest()) return

    const newMockTest = {
      id: editingMock ? editingMock.id : Date.now(),
      name: newMock.name.trim(),
      maxScore: parseInt(newMock.maxScore),
      date: newMock.date,
      allowAbsent: true
    }

    if (editingMock) {
      setMockTests(mockTests.map(test =>
        test.id === editingMock.id ? newMockTest : test
      ))
    } else {
      setMockTests([...mockTests, newMockTest])
    }

    setNewMock({ name: '', maxScore: '', date: getTodayDate() })
    setEditingMock(null)
    setShowMockForm(false)
  }

  // Update the score input component
  const handleScoreChange = async (student, testId, value) => {
    try {
      // Handle empty value
      if (value === '') {
        setStudents(prevStudents =>
          prevStudents.map(s =>
            s.id === student.id
              ? {
                ...s,
                mockScores: (s.mockScores || []).filter(ms => ms.mockId !== testId)
              }
              : s
          )
        );
        return;
      }

      // Parse and validate score
      const score = parseInt(value);

      // Check if it's a valid number
      if (isNaN(score)) {
        setAlert({
          type: 'warning',
          message: 'Please enter a valid number'
        });
        return;
      }

      // Check score range
      if (score < 0 || score > 10) {
        setAlert({
          type: 'warning',
          message: 'Score must be between 0 and 10 marks'
        });
        return;
      }

      // Create score object
      const scoreData = {
        mockId: testId,
        score: score,
        date: new Date().toISOString(),
        absent: false,
        submittedBy: auth.currentUser?.uid || 'system',
        submittedAt: new Date().toISOString()
      };

      // Get existing scores or initialize empty array
      const existingScores = student.mockScores || [];
      const scoreIndex = existingScores.findIndex(s => s.mockId === testId);

      // Update or add new score
      const updatedScores = scoreIndex >= 0
        ? existingScores.map((s, i) => i === scoreIndex ? scoreData : s)
        : [...existingScores, scoreData];

      // Update in Firestore
      const studentRef = doc(db, 'students', student.id);
      await updateDoc(studentRef, {
        mockScores: updatedScores
      });

      // Update local state
      setStudents(prev => prev.map(s =>
        s.id === student.id
          ? { ...s, mockScores: updatedScores }
          : s
      ));

      // Show success message
      setAlert({
        type: 'success',
        message: `Score saved successfully for ${student.name}`
      });

      // Update mock test statistics
      await updateMockTestStats(testId);

    } catch (error) {
      console.error('Error saving score:', error);
      setAlert({
        type: 'error',
        message: 'Failed to save score. Please try again.'
      });
    }
  };

  // Add this function to handle the save button click
  const handleSaveScore = async (student) => {
    try {
      const mockId = student.selectedMockId;
      const score = student.mockScores?.find(s => s.mockId === mockId)?.score;
      const mockTest = mockTests.find(t => t.id === mockId);

      if (!mockId) {
        setAlert({
          type: 'warning',
          message: 'Please select a mock test first'
        });
        return;
      }

      if (!score && score !== 0) {
        setAlert({
          type: 'warning',
          message: 'Please enter a score first'
        });
        return;
      }

      // Create score object
      const scoreData = {
        mockId,
        score,
        date: mockTest?.date || new Date().toISOString(),
        absent: false,
        submittedBy: auth.currentUser?.uid || 'system',
        submittedAt: new Date().toISOString()
      };

      // Update in Firestore
      const studentRef = doc(db, 'students', student.id);
      const updatedMockScores = [
        ...(student.mockScores || []).filter(ms => ms.mockId !== mockId),
        scoreData
      ];

      await updateDoc(studentRef, {
        mockScores: updatedMockScores
      });

      // Update local state
      setStudents(prevStudents =>
        prevStudents.map(s =>
          s.id === student.id
            ? { ...s, mockScores: updatedMockScores }
            : s
        )
      );

      // Show success message
      setAlert({
        type: 'success',
        message: `${student.name}'s score of ${score}/10 has been recorded for ${mockTest?.name || 'the mock test'}`
      });

      // Clear the selection after 3 seconds
      setTimeout(() => {
        setStudents(prevStudents =>
          prevStudents.map(s =>
            s.id === student.id
              ? { ...s, selectedMockId: '' }
              : s
          )
        );
      }, 3000);

      // Update mock test statistics
      await updateMockTestStats(mockId);

    } catch (error) {
      console.error('Error saving score:', error);
      setAlert({
        type: 'error',
        message: 'Failed to save score. Please try again.'
      });
    }
  };

  // Add new state for expanded menu
  const [expandedMenu, setExpandedMenu] = useState('')

  // Add this function to handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStudent({
          ...newStudent,
          image: file,
          imageUrl: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Add this new state at the top with other states
  const [showStudentDetails, setShowStudentDetails] = useState(false)

  // Add this function to handle card click
  const handleCardClick = (student) => {
    setSelectedStudent(student)
    setShowStudentDetails(true)
  }

  // First, add these state variables at the top with other states
  const [currentBatch, setCurrentBatch] = useState({
    name: '',
    startTime: '',
    endTime: '',
    description: '',
  })

  const [editingBatch, setEditingBatch] = useState(null)
  const [showBatchForm, setShowBatchForm] = useState(false)

  // Add helper function to format time
  const formatTime = (time) => {
    return new Date(`2024-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    })
  }

  // Add helper function to calculate batch progress
  const calculateBatchProgress = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const today = new Date()

    const total = end - start
    const elapsed = today - start

    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)))
  }

  // Add helper function to get batch status color
  const getBatchStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Simplified newBatch state
  const [newBatch, setNewBatch] = useState({
    name: '',
    startTime: '',
    endTime: '',
    daysOfWeek: [],
    trainer: '' // Add trainer field
  })

  // First, add this new state near your other state declarations
  const [selectedBatchDetails, setSelectedBatchDetails] = useState(null)

  // Add state for selected date and selected batch for attendance
  const [attendanceDate, setAttendanceDate] = useState(getTodayDate());
  const [selectedAttendanceBatch, setSelectedAttendanceBatch] = useState('');

  // Add state for managing attendance submission
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [showAttendanceList, setShowAttendanceList] = useState(false);
  const [showAttendanceTable, setShowAttendanceTable] = useState(false);

  // Function to handle attendance submission
  const handleAttendanceSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!selectedBatch || (attendanceFilterType === 'single' && !selectedDate) ||
      (attendanceFilterType === 'range' && (!attendanceDateRange.start || !attendanceDateRange.end))) {
      // setAlertMessage('Please select all required fields');
      // setAlertType('error');
      // setShowAlert(true);
      return;
    }

    try {
      // Get all students from the selected batch
      const filteredStudents = students.filter(student =>
        student.batch?.toString() === selectedBatch?.toString()
      );

      if (filteredStudents.length === 0) {
        // setAlertMessage('No students found in this batch');
        // setAlertType('warning');
        // setShowAlert(true);
        return;
      }

      // Initialize attendance structure for each student
      const studentsWithAttendance = filteredStudents.map(student => ({
        ...student,
        attendance: student.attendance || { class: [], scrum: [] },
        // Add computed attendance for the selected date range
        attendanceInRange: getAttendanceForDateRange(student)
      }));

      setAttendanceStudents(studentsWithAttendance);
      setShowAttendanceTable(true);

    } catch (error) {
      console.error('Error loading attendance:', error);
      // setAlertMessage('Failed to load attendance data');
      // setAlertType('error');
      // setShowAlert(true);
    }
  }

  // Add this helper function to get attendance for date range
  const getAttendanceForDateRange = (student) => {
    if (attendanceFilterType === 'single') {
      return [{
        date: selectedDate,
        present: student.attendance?.class?.find(a => a.date === selectedDate)?.present || false
      }];
    }

    const dates = [];
    const start = new Date(attendanceDateRange.start);
    const end = new Date(attendanceDateRange.end);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      dates.push({
        date: dateStr,
        present: student.attendance?.class?.find(a => a.date === dateStr)?.present || false
      });
    }

    return dates;
  }

  // Add this function if missing
  const markAttendance = async (studentId, present) => {
    try {
      const studentRef = doc(db, 'students', studentId);
      const student = attendanceStudents.find(s => s.id === studentId);

      if (!student) {
        throw new Error('Student not found');
      }

      // Create new attendance record
      const newAttendance = {
        date: selectedDate,
        present: present
      };

      // Update attendance in state first
      const updatedStudents = students.map(s => {
        if (s.id === studentId) {
          const existingAttendance = s.attendance?.class || [];
          const filteredAttendance = existingAttendance.filter(a => a.date !== selectedDate);
          return {
            ...s,
            attendance: {
              ...s.attendance,
              class: [...filteredAttendance, newAttendance].sort((a, b) =>
                new Date(b.date) - new Date(a.date)
              )
            }
          };
        }
        return s;
      });

      // Update both students and attendanceStudents states
      setStudents(updatedStudents);
      setAttendanceStudents(updatedStudents.filter(s =>
        s.batch?.toString() === selectedBatch?.toString()
      ));

      // Then update in Firebase
      await updateDoc(studentRef, {
        attendance: {
          ...student.attendance,
          class: [...(student.attendance?.class || [])
            .filter(a => a.date !== selectedDate),
            newAttendance
          ].sort((a, b) => new Date(b.date) - new Date(a.date))
        }
      });

      // setAlertMessage(`Attendance marked ${present ? 'present' : 'absent'} for ${student.name}`);
      // setAlertType('success');
      // setShowAlert(true);
      // setTimeout(() => setShowAlert(false), 3000);

    } catch (error) {
      console.error('Error marking attendance:', error);
      // setAlertMessage('Failed to mark attendance');
      // setAlertType('error');
      // setShowAlert(true);
      // setTimeout(() => setShowAlert(false), 3000);
    }
  };

  // Add these alert states if missing
  const [showAlert, setShowAlert] = useState(false);

  // Add these new states
  const [newMockTest, setNewMockTest] = useState({
    name: '',
    date: getTodayDate(),
    maxScore: 10,
    description: '',
    batches: []
  });

  const handleCreateMock = async (e) => {
    e.preventDefault();

    try {
      // Validate form
      if (!newMockTest.name) {
        setAlert({
          type: 'error',
          message: 'Please enter a mock test name'
        });
        return;
      }

      if (parseInt(newMockTest.maxScore) !== 10) {
        setAlert({
          type: 'error',
          message: 'Maximum score must be 10'
        });
        return;
      }

      if (newMockTest.batches.length === 0) {
        setAlert({
          type: 'error',
          message: 'Please select at least one batch'
        });
        return;
      }

      const mockData = {
        name: newMockTest.name,
        date: newMockTest.date,
        maxScore: 10,
        description: newMockTest.description || '',
        batches: newMockTest.batches,
        createdAt: new Date().toISOString()
      };

      // Create mock test document
      const docRef = await addDoc(collection(db, 'mockTests'), mockData);
      const mockId = docRef.id;

      // Initialize mock scores for all students in selected batches
      const studentsToUpdate = students.filter(student =>
        newMockTest.batches.includes(student.batch)
      );

      // Create a batch write for better performance
      const batch = writeBatch(db);

      // Update each student's mock scores
      for (const student of studentsToUpdate) {
        const studentRef = doc(db, 'students', student.id);
        const mockScores = student.mockScores || [];

        batch.update(studentRef, {
          mockScores: [...mockScores, {
            mockId: mockId,
            score: null, // Initialize as null until scored
            date: newMockTest.date,
            absent: false,
            status: 'pending'
          }]
        });
      }

      // Commit all the batch operations
      await batch.commit();

      // Update local state
      setMockTests(prevTests => [...prevTests, { id: mockId, ...mockData }]);

      // Update students state with new mock test
      setStudents(prevStudents =>
        prevStudents.map(student => {
          if (newMockTest.batches.includes(student.batch)) {
            return {
              ...student,
              mockScores: [...(student.mockScores || []), {
                mockId: mockId,
                score: null,
                date: newMockTest.date,
                absent: false,
                status: 'pending'
              }]
            };
          }
          return student;
        })
      );

      // Reset form
      setNewMockTest({
        name: '',
        date: getTodayDate(),
        maxScore: 10,
        description: '',
        batches: []
      });

      setAlert({
        type: 'success',
        message: 'Mock test created successfully!'
      });

    } catch (error) {
      console.error('Error creating mock test:', error);
      setAlert({
        type: 'error',
        message: `Failed to create mock test: ${error.message}`
      });
    }
  };

  // Calculate average attendance
  const calculateAverageAttendance = () => {
    const filteredStudents = students.filter(student =>
      !selectedBatch || student.batch?.toString() === selectedBatch
    );

    if (filteredStudents.length === 0) return 0;

    const attendancePercentages = filteredStudents.map(student => {
      const records = student.attendance?.class || [];
      const recordsInRange = records.filter(record =>
        record.date >= dateRange.start && record.date <= dateRange.end
      );
      const totalDays = recordsInRange.length;
      const presentDays = recordsInRange.filter(record => record.present).length;
      return totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    });

    const averageAttendance = attendancePercentages.reduce((a, b) => a + b, 0) / attendancePercentages.length;
    return averageAttendance.toFixed(1);
  };

  // Add this new state for the selected student's attendance details
  const [showAttendanceDetails, setShowAttendanceDetails] = useState(false);

  // Add this new function to handle batch deletion
  const handleDeleteBatch = async (batchId, batchName) => {
    if (!confirm(`Are you sure you want to delete batch "${batchName}"? This will remove the batch from all enrolled students.`)) {
      return;
    }

    try {
      // Create a batch operation
      const batch = writeBatch(db);

      // Delete the batch document
      const batchRef = doc(db, 'batches', batchId);
      batch.delete(batchRef);

      // Get all students in this batch
      const studentsToUpdate = students.filter(
        student => student.batch?.toString() === batchName?.toString()
      );

      // Update each student's batch and attendance records
      for (const student of studentsToUpdate) {
        const studentRef = doc(db, 'students', student.id);
        const updatedAttendance = {
          ...student.attendance,
          class: student.attendance?.class?.filter(record =>
            !batches.find(b => b.id === batchId)?.daysOfWeek
              ?.includes(new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }))
          ) || []
        };

        batch.update(studentRef, {
          batch: '',
          attendance: updatedAttendance
        });
      }

      // Commit all the batch operations
      await batch.commit();

      // Update local state immediately
      setBatches(prevBatches => prevBatches.filter(b => b.id !== batchId));
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.batch?.toString() === batchName?.toString()
            ? {
              ...student,
              batch: '',
              attendance: {
                ...student.attendance,
                class: student.attendance?.class?.filter(record =>
                  !batches.find(b => b.id === batchId)?.daysOfWeek
                    ?.includes(new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }))
                ) || []
              }
            }
            : student
        )
      );

      setAlert({
        type: 'success',
        message: 'Batch deleted successfully'
      });

      // Refresh data in the background to ensure consistency
      fetchBatches();
      fetchStudents();
    } catch (error) {
      console.error('Error deleting batch:', error);
      setAlert({
        type: 'error',
        message: `Failed to delete batch: ${error.message}`
      });
    }
  };

  // Add this new state for showing batch students
  const [selectedBatchForStudents, setSelectedBatchForStudents] = useState(null);

  // Add this new state for student list view type
  const [studentListView, setStudentListView] = useState('grid'); // 'grid' or 'list'

  // Add this after your other state declarations
  const [mockTests, setMockTests] = useState([]);
  const [currentMockTest, setCurrentMockTest] = useState(null);
  const [showMockForm, setShowMockForm] = useState(false);

  // Add fetchMockTests function
  const fetchMockTests = async () => {
    try {
      const mockTestsRef = collection(db, 'mockTests');
      const querySnapshot = await getDocs(mockTestsRef);
      const mockTestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMockTests(mockTestsData);
    } catch (error) {
      console.error('Error fetching mock tests:', error);
    }
  };

  // Add function to initialize default mock tests
  const initializeDefaultMockTests = async () => {
    try {
      const mockTestsRef = collection(db, 'mockTests');
      const querySnapshot = await getDocs(mockTestsRef);
      const existingTests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Check which default levels are missing
      const missingLevels = [];
      for (let level = 1; level <= 10; level++) {
        if (!existingTests.some(test => test.isDefaultLevel && test.level === level)) {
          missingLevels.push(level);
        }
      }

      // Create missing default level tests
      for (const level of missingLevels) {
        const mockData = {
          name: `Level ${level} Mock Test`,
          level: level,
          isDefaultLevel: true,
          maxScore: 10,
          description: `Default mock test for Level ${level}`,
          createdAt: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0]
        };

        await addDoc(mockTestsRef, mockData);
      }

      // Refresh mock tests if any were added
      if (missingLevels.length > 0) {
        await fetchMockTests();
      }
    } catch (error) {
      console.error('Error initializing default mock tests:', error);
    }
  };

  // Update the useEffect to initialize default mock tests
  useEffect(() => {
    const loadMockTests = async () => {
      await initializeDefaultMockTests();
      await fetchMockTests();
    };
    loadMockTests();
  }, []);

  // Add these new states for mock test filtering and sorting
  const [mockSearchTerm, setMockSearchTerm] = useState('');
  const [mockBatchFilter, setMockBatchFilter] = useState('all');
  const [mockSortBy, setMockSortBy] = useState('date-desc');

  // Add these handler functions for mock test management
  const handleEditMock = (mock) => {
    setCurrentMockTest(mock);
    setNewMockTest(mock);
    setCurrentView('mock-create');
  };

  const handleDeleteMock = async (mockId) => {
    if (!window.confirm('Are you sure you want to delete this mock test?')) return;

    try {
      await deleteDoc(doc(db, 'mockTests', mockId));
      setMockTests(mockTests.filter(test => test.id !== mockId));
      // setAlertMessage('Mock test deleted successfully');
      // setAlertType('success');
      // setShowAlert(true);
      // setTimeout(() => setShowAlert(false), 3000);
    } catch (error) {
      console.error('Error deleting mock test:', error);
      // setAlertMessage('Failed to delete mock test');
      // setAlertType('error');
      // setShowAlert(true);
      // setTimeout(() => setShowAlert(false), 3000);
    }
  };

  // First, add a new state for the assign mock view
  const [selectedMockForAssignment, setSelectedMockForAssignment] = useState(null);
  const [mockAssignmentFilter, setMockAssignmentFilter] = useState({ batch: '' });
  const [expandedBatches, setExpandedBatches] = useState({});
  const [showFilteredStudents, setShowFilteredStudents] = useState(false);

  // Add the new Assign Mock view
  {
    currentView === 'mock-assign' && (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/80">
          <div className="p-6 bg-gradient-to-r from-orange-50 to-white border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Assign Mock Test</h2>
            <p className="text-sm text-gray-600 mt-1">Assign scores to students for mock tests</p>
          </div>

          <div className="p-6">
            {/* Filter Section */}
            <div className="mb-6">
              <div className="flex gap-4 items-end">
                {/* Batch Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Batch
                  </label>
                  <select
                    value={mockAssignmentFilter.batch || ''}
                    onChange={(e) => {
                      setMockAssignmentFilter(prev => ({ ...prev, batch: e.target.value }));
                      setShowFilteredStudents(false); // Hide students list when batch changes
                    }}
                    className={`${inputStyle} pr-10`}
                  >
                    <option value="">All Batches</option>
                    {Array.from(new Set(students.map(s => s.batch))).sort().map(batch => (
                      <option key={batch} value={batch}>Batch {batch}</option>
                    ))}
                  </select>
                </div>
                {/* Add Filter Button */}
                <button
                  onClick={() => setShowFilteredStudents(true)}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                    transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Show Students
                </button>
              </div>
            </div>

            {/* Students List with Close Button */}
            {showFilteredStudents && (
              <div className="mt-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Filtered Students</h3>
                    <button
                      onClick={() => setShowFilteredStudents(false)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      {students
                        .filter(student => !mockAssignmentFilter.batch ||
                          student.batch?.toString() === mockAssignmentFilter.batch)
                        .map(student => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-4 bg-gray-50 
                              rounded-lg hover:bg-gray-100 transition-colors duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium">{student.name.charAt(0)}</span>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{student.name}</h4>
                                <p className="text-sm text-gray-600">Roll Number: {student.rollNumber}</p>
                              </div>
                            </div>
                            {/* Mock Test Selection */}
                            <div className="flex items-center gap-3">
                              <select
                                value={student.selectedMockId || ''}
                                onChange={(e) => {
                                  const mockId = e.target.value;
                                  setStudents(prevStudents =>
                                    prevStudents.map(s =>
                                      s.id === student.id
                                        ? { ...s, selectedMockId: mockId }
                                        : s
                                    )
                                  );
                                }}
                                className="px-3 py-2 rounded-lg border border-gray-300 
                                  focus:ring-2 focus:ring-blue-200 focus:border-blue-400 
                                  text-sm bg-white shadow-sm"
                              >
                                <option value="">Select Mock Test</option>
                                {/* Default Level Mocks (1-10) */}
                                <optgroup label="Default Level Tests">
                                  {Array.from({ length: 10 }, (_, i) => i + 1).map(level => {
                                    const defaultTest = mockTests.find(
                                      test => test.isDefaultLevel && test.level === level
                                    );
                                    return (
                                      <option
                                        key={`level-${level}`}
                                        value={defaultTest?.id || `level-${level}`}
                                        disabled={!defaultTest}
                                      >
                                        Level {level} Mock Test
                                      </option>
                                    );
                                  })}
                                </optgroup>
                                {/* Custom Created Mocks */}
                                {mockTests.filter(test => !test.isDefaultLevel).length > 0 && (
                                  <optgroup label="Custom Mock Tests">
                                    {mockTests
                                      .filter(test => !test.isDefaultLevel)
                                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                                      .map(test => (
                                        <option key={test.id} value={test.id}>
                                          {test.name} ({formatDate(test.date)})
                                        </option>
                                      ))}
                                  </optgroup>
                                )}
                              </select>
                              {student.selectedMockId && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    placeholder="Score"
                                    min="0"
                                    max="10" // Ensure max is set to 10
                                    value={student.mockScores?.find(s => s.mockId === student.selectedMockId)?.score || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '') {
                                        // Allow clearing the input
                                        setStudents(prevStudents =>
                                          prevStudents.map(s =>
                                            s.id === student.id
                                              ? {
                                                ...s,
                                                mockScores: [
                                                  ...(s.mockScores || []).filter(ms => ms.mockId !== student.selectedMockId)
                                                ]
                                              }
                                              : s
                                          )
                                        );
                                        return;
                                      }

                                      const score = parseInt(value);

                                      if (isNaN(score) || score < 0 || score > 10) {
                                        setAlert({
                                          type: 'warning',
                                          message: 'Please enter a valid score between 0 and 10'
                                        });
                                        return;
                                      }

                                      setStudents(prevStudents =>
                                        prevStudents.map(s =>
                                          s.id === student.id
                                            ? {
                                              ...s,
                                              mockScores: [
                                                ...(s.mockScores || []).filter(ms => ms.mockId !== student.selectedMockId),
                                                {
                                                  mockId: student.selectedMockId,
                                                  score,
                                                  date: mockTests.find(t => t.id === student.selectedMockId)?.date || new Date().toISOString(),
                                                  absent: false
                                                }
                                              ]
                                            }
                                            : s
                                        )
                                      );
                                    }}
                                    className="w-20 px-3 py-2 rounded-lg border border-gray-300 
                                      focus:ring-2 focus:ring-blue-200 focus:border-blue-400 
                                      text-sm bg-white shadow-sm"
                                  />
                                  <button
                                    onClick={() => handleSaveScore(student)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg 
                                      hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Score
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        // Mark student as absent for this mock test
                                        await updateDoc(doc(db, 'students', student.id), {
                                          mockScores: [
                                            ...(student.mockScores || []).filter(ms => ms.mockId !== student.selectedMockId),
                                            {
                                              mockId: student.selectedMockId,
                                              score: 0,
                                              date: mockTests.find(t => t.id === student.selectedMockId)?.date || new Date().toISOString(),
                                              absent: true
                                            }
                                          ]
                                        });
                                      } catch (error) {
                                        console.error('Error marking student absent:', error);
                                      }
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                  >
                                    Mark Absent
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                      {/* Empty State */}
                      {students.filter(student => !mockAssignmentFilter.batch ||
                        student.batch?.toString() === mockAssignmentFilter.batch).length === 0 && (
                          <div className="text-center py-8">
                            <div className="bg-gray-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 
                            flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                            <p className="text-gray-600">
                              {mockAssignmentFilter.batch
                                ? `No students found in Batch ${mockAssignmentFilter.batch}`
                                : 'No students available'}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Add getMockTestOptions function
  const getMockTestOptions = () => {
    // Create 10 default level tests if they don't exist
    const defaultTests = Array.from({ length: 10 }, (_, i) => ({
      id: `level-${i + 1}`,
      name: `Level ${i + 1} Test`,
      level: i + 1,
      maxScore: 10,
      isDefaultLevel: true
    }));

    // Get custom tests
    const customTests = mockTests.filter(test => !test.isDefaultLevel);

    return {
      defaultTests,
      customTests
    };
  };

  // Function to check if a student has cleared a level
  const hasClearedLevel = (student, level) => {
    if (level === 0) return true; // Level 1 is always enabled

    // Check if the student has passed the previous level
    const previousLevelId = `level-${level}`;
    const score = student.mockScores?.find(s => s.mockId === previousLevelId)?.score;
    return score !== undefined && score >= 6; // Passing score is 6
  };

  // Update the mock test dropdown in filtered students view
  const renderMockTestOptions = (student) => {
    const { defaultTests, customTests } = getMockTestOptions();

    // Determine the highest level cleared by the student
    let highestClearedLevel = 0;
    for (let i = 1; i <= 10; i++) {
      if (hasClearedLevel(student, i)) {
        highestClearedLevel = i;
      } else {
        break;
      }
    }

    return (
      <select
        value={student.selectedMockId || ''}
        onChange={(e) => {
          e.stopPropagation();
          const selected = e.target.value;
          setStudents(prevStudents =>
            prevStudents.map(s =>
              s.id === student.id
                ? { ...s, selectedMockId: selected }
                : s
            )
          );
        }}
        onClick={(e) => e.stopPropagation()}
        className={`${inputStyle} w-full border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-md`}
      >

        <option value="">Select Mock Test</option>
        <optgroup label="Level Tests">
          {defaultTests.map(test => (
            <option key={test.id} value={test.id} disabled={test.level > highestClearedLevel + 1}>
              {test.level <= highestClearedLevel ? '✅' : '🔒'} Level {test.level} Test
            </option>
          ))}
        </optgroup>
        {customTests.length > 0 && (
          <optgroup label="Custom Tests">
            {customTests.map(test => (
              <option key={test.id} value={test.id}>
                📝 {test.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    );
  };

  // Function to handle mock test selection
  const handleMockTestSelection = (testId) => {
    setSelectedMockTests(prevSelected => {
      if (prevSelected.includes(testId)) {
        return prevSelected.filter(id => id !== testId);
      } else {
        return [...prevSelected, testId];
      }
    });
  };

  // Add function to handle bulk deletion
  const handleBulkDeleteMocks = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedMockTests.length} selected mock tests?`)) {
      return;
    }

    try {
      for (const testId of selectedMockTests) {
        await deleteDoc(doc(db, 'mockTests', testId));
      }

      setMockTests(prev => prev.filter(test => !selectedMockTests.includes(test.id)));
      setSelectedMockTests([]);

      setAlert({
        type: 'success',
        message: `Successfully deleted ${selectedMockTests.length} mock tests`
      });
    } catch (error) {
      console.error('Error deleting mock tests:', error);
      setAlert({
        type: 'error',
        message: 'Failed to delete mock tests. Please try again.'
      });
    }
  };

  // Function to get student level
  const getStudentLevel = (student) => {
    const mockScores = student.mockScores || [];
    for (let i = 1; i <= 10; i++) {
      if (mockScores.some(score => score.mockId === `level-${i}` && score.score >= 6)) {
        return `Level ${i}`;
      }
    }
    return 'No Level';
  };

  // Function to mark a student as absent
  const markStudentAbsent = async (studentId) => {
    try {
      const studentRef = doc(db, 'students', studentId);
      const student = students.find(s => s.id === studentId);

      if (!student) {
        throw new Error('Student not found');
      }

      // Update attendance in Firestore
      await updateDoc(studentRef, {
        attendance: {
          ...student.attendance,
          class: [
            ...(student.attendance?.class || []),
            { date: new Date().toISOString(), present: false }
          ]
        }
      });

      // Update local state
      setStudents(prev => prev.map(s =>
        s.id === student.id
          ? { ...s, attendance: { ...s.attendance, class: [...s.attendance.class, { date: new Date().toISOString(), present: false }] } }
          : s
      ));

      // setAlertMessage(`${student.name} has been marked as absent`);
      // setAlertType('success');
      // setShowAlert(true);
      // setTimeout(() => setShowAlert(false), 3000);

      // Refresh data
      await fetchStudents();
    } catch (error) {
      console.error('Error marking student as absent:', error);
      // setAlertMessage('Failed to mark student as absent');
      // setAlertType('error');
      // setShowAlert(true);
      // setTimeout(() => setShowAlert(false), 3000);
    }
  };

  // Add a state to manage selected mock tests
  const [selectedMockTests, setSelectedMockTests] = useState([]);

  // Function to toggle selection of a mock test
  const toggleMockSelection = (testId) => {
    setSelectedMockTests(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  // Function to select or deselect all mock tests
  const toggleSelectAllMocks = () => {
    if (selectedMockTests.length === mockTests.length) {
      setSelectedMockTests([]);
    } else {
      setSelectedMockTests(mockTests.map(test => test.id));
    }
  };

  // Add this function to filter mock tests by batch
  const getFilteredMockTests = () => {
    if (mockBatchFilter === 'all') {
      return mockTests.filter(test => !test.isDefaultLevel);
    }
    return mockTests.filter(test =>
      !test.isDefaultLevel &&
      test.batches?.includes(mockBatchFilter)
    );
  };

  // Helper to create a new mock test
  const createMockTest = async (mockData) => {
    const mockRef = await addDoc(collection(db, 'mockTests'), {
      name: mockData.name,
      description: mockData.description || '',
      date: mockData.date,
      maxScore: 10,
      batches: mockData.batches,
      isDefaultLevel: false,
      type: 'custom',
      status: 'active',
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid,
      topics: mockData.topics || [],
      duration: mockData.duration || null,
      instructions: mockData.instructions || ''
    });
    return mockRef.id;
  };

  // Helper to assign mock test to batches
  const assignMockTestToBatches = async (mockId, batches) => {
    const batch = writeBatch(db);

    batches.forEach(batchId => {
      const assignmentRef = doc(collection(db, `mockTests/${mockId}/assignments`));
      batch.set(assignmentRef, {
        batchId,
        scheduledDate: serverTimestamp(),
        status: 'pending',
        assignedBy: auth.currentUser?.uid,
        assignedAt: serverTimestamp()
      });
    });

    await batch.commit();
  };

  // Helper to record student mock scores
  const recordMockScore = async (studentId, mockId, scoreData) => {
    const scoreRef = doc(collection(db, `students/${studentId}/mockScores`));
    await setDoc(scoreRef, {
      mockId,
      score: scoreData.score,
      date: serverTimestamp(),
      absent: scoreData.absent || false,
      attempts: 1,
      feedback: scoreData.feedback || '',
      submittedBy: auth.currentUser?.uid
    });
  };

  // Helper to update mock test statistics
  const updateMockTestStats = async (mockId) => {
    try {
      const statsRef = doc(collection(db, `mockTests/${mockId}/results`), 'statistics');

      // Get all scores for this test
      const scoresQuery = query(
        collectionGroup(db, 'mockScores'),
        where('mockId', '==', mockId)
      );
      const scoresSnap = await getDocs(scoresQuery);
      const scores = scoresSnap.docs.map(doc => doc.data().score).filter(score => score !== undefined && score !== null);

      // Handle case where there are no scores
      if (scores.length === 0) {
        await setDoc(statsRef, {
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          totalStudents: 0,
          absentCount: scoresSnap.docs.filter(doc => doc.data().absent).length,
          passCount: 0,
          failCount: 0,
          lastUpdated: serverTimestamp()
        });
        return;
      }

      // Calculate stats safely
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      const highest = Math.max(...scores);
      const lowest = Math.min(...scores);

      await setDoc(statsRef, {
        averageScore: average || 0,
        highestScore: highest || 0,
        lowestScore: lowest || 0,
        totalStudents: scores.length,
        absentCount: scoresSnap.docs.filter(doc => doc.data().absent).length,
        passCount: scores.filter(score => score >= 6).length,
        failCount: scores.filter(score => score < 6).length,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating mock test stats:', error);
      // Don't throw the error - we want to continue even if stats update fails
    }
  };

  // Add this function to initialize students collection
  const initializeStudentsCollection = async () => {
    try {
      // Check if students collection exists and has any documents
      const studentsRef = collection(db, 'students');
      const snapshot = await getDocs(studentsRef);

      if (snapshot.empty) {
        console.log('Initializing students collection...');
        // Create the collection by adding a dummy document that we'll delete right away
        const dummyDoc = await addDoc(studentsRef, {
          _initialized: true,
          createdAt: serverTimestamp()
        });
        // Delete the dummy document
        await deleteDoc(doc(db, 'students', dummyDoc.id));
      }
    } catch (error) {
      console.error('Error initializing students collection:', error);
    }
  };

  // Add useEffect to initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeStudentsCollection();
        await fetchStudents();
        await fetchBatches();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  const [scoreboardView, setScoreboardView] = useState('overview');
  const [mockTestFilter, setMockTestFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ... existing code ...
  }, [selectedStudents, selectedMockTests, scoreboardView]);

  // Add alert state
  const [alert, setAlert] = useState({ type: '', message: '' });

  // First, update the getMockTestReport function to handle batch filtering
  const getMockTestReport = (mockId) => {
    if (!mockId) return { testResults: [], stats: { totalStudents: 0, presentStudents: 0, absentStudents: 0, attendancePercentage: 0 } };

    // First filter students by selected batch
    const batchFilteredStudents = students.filter(student =>
      !selectedBatch || student.batch?.toString() === selectedBatch
    );

    // Then get test results for filtered students
    const testResults = batchFilteredStudents
      .map(student => {
        const mockScore = student.mockScores?.find(score => score.mockId === mockId);
        if (!mockScore) {
          // If student hasn't taken the test, consider them absent
          return {
            studentName: student.name,
            score: 0,
            absent: true,
            date: null,
            batch: student.batch
          };
        }
        return {
          studentName: student.name,
          score: mockScore.score,
          absent: mockScore.absent || false,
          date: mockScore.date,
          batch: student.batch
        };
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName)); // Sort by name

    // Calculate statistics
    const stats = {
      totalStudents: batchFilteredStudents.length,
      presentStudents: testResults.filter(r => !r.absent).length,
      absentStudents: testResults.filter(r => r.absent).length,
      attendancePercentage: batchFilteredStudents.length > 0
        ? (testResults.filter(r => !r.absent).length / batchFilteredStudents.length) * 100
        : 0
    };

    return { testResults, stats };
  };

  // Update the batch filter handler
  const handleBatchChange = (e) => {
    const newBatch = e.target.value;
    setSelectedBatch(newBatch);
  };

  // Update the mock test filter handler
  const handleMockChange = (e) => {
    const newMockId = e.target.value;
    setSelectedMock(newMockId);
  };

  // Modify the AttendanceDetailsModal component or create a new one for mock details
  const MockAttendanceDetailsModal = ({ student, onClose }) => {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Mock Test Details: {student.name}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Mock Test History */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Mock Test History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mock Test
                      </th>
                      <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(student.mockScores || [])
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((mock, index) => (
                        <tr key={index} className={mock.mockId === student.mockDetails?.mockId ? 'bg-blue-50' : ''}>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {mock.mockId.startsWith('level-')
                              ? `Level ${mock.mockId.replace('level-', '')} Mock Test`
                              : mock.mockId}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {formatDate(mock.date)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {mock.score > 0 ? (
                              <span className="text-green-600">Present</span>
                            ) : (
                              <span className="text-red-600">Absent</span>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {mock.score > 0 ? (
                              <span className={
                                mock.score >= 8 ? 'text-green-600' :
                                  mock.score >= 5 ? 'text-blue-600' :
                                    'text-yellow-600'
                              }>
                                {mock.score}/10
                              </span>
                            ) : (
                              <span className="text-gray-500">Not Scored</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update the viewStudentReport function to use the new modal when mock details are present
  const viewStudentReport = (student) => {
    setSelectedStudent(student);
    setShowAttendanceDetails(true);
  };

  // ... existing code ...
  {/* Student Report Modal */ }
  {
    showAttendanceDetails && selectedStudent && (
      selectedStudent.mockDetails ? (
        <MockAttendanceDetailsModal
          student={selectedStudent}
          onClose={() => {
            setShowAttendanceDetails(false);
            setSelectedStudent(null);
          }}
        />
      ) : (
        <AttendanceDetailsModal
          student={selectedStudent}
          onClose={() => {
            setShowAttendanceDetails(false);
            setSelectedStudent(null);
          }}
        />
      )
    )
  }
  // ... existing code ...

  // Add this function at the same level as other utility functions
  const getMockAttendance = (student = null) => {
    if (student) {
      // For a specific student
      // Check if student has 'mockScores' array
      const mockRecords = student.mockScores || [];
      if (mockRecords.length === 0) return 0;

      const presentCount = mockRecords.filter(test =>
        test.absent === false &&
        test.score !== undefined &&
        test.score !== null &&
        test.score > 0
      ).length;

      return (presentCount / mockRecords.length) * 100;
    } else {
      // For all students
      let totalTests = 0;
      let totalPresent = 0;

      students.forEach(student => {
        const mockRecords = student.mockScores || [];
        if (mockRecords.length > 0) {
          totalTests += mockRecords.length;
          totalPresent += mockRecords.filter(test =>
            test.absent === false &&
            test.score !== undefined &&
            test.score !== null &&
            test.score > 0
          ).length;
        }
      });

      return totalTests > 0 ? (totalPresent / totalTests) * 100 : 0;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 min-h-screen bg-purple-100 shadow-lg p-4 space-y-2">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Career Sure Academy
          </h1>
        </div>

        {/* Students Section */}
        <div className="space-y-1">
          <button
            onClick={() => setExpandedMenu(expandedMenu === 'students' ? '' : 'students')}
            className={`${sidebarButtonStyle} flex items-center justify-between w-full ${currentView.startsWith('students') ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600'
              }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>Students</span>
            </div>
            <svg
              className={`w-4 h-4 transform transition-transform ${expandedMenu === 'students' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Students Submenu */}
          <div className={`pl-4 space-y-1 ${expandedMenu === 'students' ? 'block' : 'hidden'}`}>
            <button
              onClick={() => {
                setCurrentView('students-view')
                setShowForm(false)
              }}
              className={`${sidebarButtonStyle} text-sm ${currentView === 'students-view' ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600'
                }`}
            >
              View Students
            </button>

            <button
              onClick={() => {
                setCurrentView('students-add')
                setShowForm(true)
              }}
              className={`${sidebarButtonStyle} text-sm ${currentView === 'students-add' ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600'
                }`}
            >
              Add Student
            </button>
          </div>
        </div>

        {/* Batches Section */}
        <div className="space-y-1">
          <button
            onClick={() => setExpandedMenu(expandedMenu === 'batches' ? '' : 'batches')}
            className={`${sidebarButtonStyle} flex items-center justify-between w-full ${currentView.startsWith('batches') ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600'
              }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Batches
            </div>
            <svg
              className={`w-4 h-4 transform transition-transform ${expandedMenu === 'batches' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Batches Submenu */}
          <div className={`pl-4 space-y-1 ${expandedMenu === 'batches' ? 'block' : 'hidden'}`}>
            <button
              onClick={() => setCurrentView('batches-view')}
              className={`${sidebarButtonStyle} text-sm ${currentView === 'batches-view' ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600'
                }`}
            >
              View Batches
            </button>

            <button
              onClick={() => {
                setCurrentView('batches-add')
                setShowBatchForm(true)
              }}
              className={`${sidebarButtonStyle} text-sm ${currentView === 'batches-add' ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600'
                }`}
            >
              Add Batch
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setExpandedMenu(expandedMenu === 'attendance' ? '' : 'attendance')}
            className={`${sidebarButtonStyle} flex items-center justify-between w-full ${currentView.startsWith('attendance') ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600'
              }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Attendance
            </div>
            <svg
              className={`w-4 h-4 transform transition-transform ${expandedMenu === 'attendance' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Attendance Submenu */}
          <div className={`pl-4 space-y-1 ${expandedMenu === 'attendance' ? 'block' : 'hidden'}`}>
            <button
              onClick={() => setCurrentView('students-attendance')}
              className={`${sidebarButtonStyle} text-sm ${currentView === 'students-attendance' ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600'}`}
            >
              Mark Attendance
            </button>
            <button
              onClick={() => setCurrentView('attendance-report')}
              className={`${sidebarButtonStyle} text-sm ${currentView === 'attendance-report' ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600'}`}
            >
              View Attendance
            </button>
          </div>
        </div>

        {/* Add this after the Attendance section, before the closing sidebar div */}
        {/* Mock Tests Section */}
        <div className="space-y-1">
          <button
            onClick={() => setExpandedMenu(expandedMenu === 'mock' ? '' : 'mock')}
            className={`${sidebarButtonStyle} flex items-center justify-between w-full ${currentView.startsWith('mock') ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600'}`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Mock Tests
            </div>
            <svg
              className={`w-4 h-4 transform transition-transform ${expandedMenu === 'mock' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Mock Tests Submenu */}
          {expandedMenu === 'mock' && (
            <div className="pl-10 space-y-1">
              <button
                onClick={() => setCurrentView('mock-create')}
                className={`${sidebarButtonStyle} w-full text-left ${currentView === 'mock-create' ? 'bg-orange-50 text-orange-600' : 'text-gray-600'}`}
              >
                Create Custom Test
              </button>
              <button
                onClick={() => setCurrentView('view-mocks')}
                className={`${sidebarButtonStyle} w-full text-left ${currentView === 'view-mocks' ? 'bg-orange-50 text-orange-600' : 'text-gray-600'}`}
              >
                View Mocks
              </button>
              <button
                onClick={() => setCurrentView('mock-assign')}
                className={`${sidebarButtonStyle} w-full text-left ${currentView === 'mock-assign' ? 'bg-orange-50 text-orange-600' : 'text-gray-600'}`}
              >
                Assign Scores
              </button>
              <button
                onClick={() => setCurrentView('mock-report-attendence')}
                className={`${sidebarButtonStyle} w-full text-left ${currentView === 'mock-report-attendence' ? 'bg-orange-50 text-orange-600' : 'text-gray-600'}`}
              >
                Mock Attendence Report
              </button>
              <button
                onClick={() => setCurrentView('mock-report-score')}
                className={`${sidebarButtonStyle} w-full text-left ${currentView === 'mock-report-score' ? 'bg-orange-50 text-orange-600' : 'text-gray-600'}`}
              >
                Mock Score Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Remove the p-4 class from this div */}
        <div className="h-full">
          {/* Content Area */}
          <div className="w-full">
            {currentView === 'students-view' && (
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Students</h2>
                      <p className="text-gray-600 mt-1">View and manage all students</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-gray-600">Total Students</p>
                        <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                      </div>
                      <button
                        onClick={() => {
                          setCurrentView('students-add');
                          setShowForm(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                          transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Student
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by name or roll number..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300
                            focus:ring-2 focus:ring-blue-200 focus:border-blue-400
                            transition-all duration-200"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Batch</label>
                      <select
                        value={selectedBatch}
                        onChange={handleBatchChange}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="">All Batches</option>
                        {Array.from(new Set(students.map(s => s.batch)))
                          .sort((a, b) => a - b)
                          .map(batch => (
                            <option key={batch} value={batch.toString()}>
                              Batch {batch}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">View Type</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStudentListView('grid')}
                          className={`flex-1 px-4 py-2.5 rounded-lg border ${studentListView === 'grid'
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          Grid View
                        </button>
                        <button
                          onClick={() => setStudentListView('list')}
                          className={`flex-1 px-4 py-2.5 rounded-lg border ${studentListView === 'list'
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          List View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Students List */}
                <div className={`${studentListView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
                  {students
                    .filter(student => {
                      const searchLower = searchTerm.toLowerCase();
                      const matchesSearch = !searchTerm ||
                        student.name?.toLowerCase().includes(searchLower) ||
                        student.rollNumber?.toLowerCase().includes(searchLower);
                      const matchesBatch = !selectedBatch ||
                        student.batch?.toString() === selectedBatch?.toString() ||
                        student.batchId?.toString() === selectedBatch?.toString();
                      return matchesSearch && matchesBatch;
                    })
                    .map(student => (
                      <div
                        key={student.id}
                        className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${cardHoverStyle}`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <div className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                              {student.imageUrl ? (
                                <img
                                  src={student.imageUrl}
                                  alt={student.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                              <p className="text-sm text-gray-600">Roll No: {student.rollNumber}</p>
                              {student.batch && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                                  Batch {student.batch}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingStudent(student);
                                setNewStudent(student);
                                setCurrentView('students-add');
                                setShowForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStudent(student.id);
                              }}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Empty State */}
                {students.filter(student => {
                  const searchLower = searchTerm.toLowerCase();
                  const matchesSearch = !searchTerm ||
                    student.name?.toLowerCase().includes(searchLower) ||
                    student.rollNumber?.toLowerCase().includes(searchLower);
                  const matchesBatch = !selectedBatch ||
                    student.batch?.toString() === selectedBatch?.toString() ||
                    student.batchId?.toString() === selectedBatch?.toString();
                  return matchesSearch && matchesBatch;
                }).length === 0 && (
                    <div className="text-center py-12">
                      <div className="bg-gray-50 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                      <p className="text-gray-600">
                        {searchTerm && selectedBatch
                          ? `No students found matching "${searchTerm}" in Batch ${selectedBatch}`
                          : searchTerm
                            ? `No students found matching "${searchTerm}"`
                            : selectedBatch
                              ? `No students found in Batch ${selectedBatch}`
                              : 'No students available'}
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Add/Edit Student Form */}
            {currentView === 'students-add' && (
              <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
                {/* Form Header */}
                <div className="mb-8 border-b border-gray-100 pb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {editingStudent ? 'Edit Student Details' : 'Add New Student'}
                  </h2>
                  <p className="text-sm">
                    {editingStudent
                      ? 'Update the information for existing student'
                      : 'Fill in the information to register a new student'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Image Upload Section */}
                  <div className="flex justify-center mb-8">
                    <div className="w-40 h-40 relative group">
                      <div className={`
                        w-full h-40 rounded-full border-3 border-dashed
                        flex items-center justify-center overflow-hidden
                        transition-all duration-300 shadow-sm
                        ${newStudent.imageUrl
                          ? 'border-transparent'
                          : 'border-gray-300 group-hover:border-orange-300 bg-gray-50'}
                      `}>
                        {newStudent.imageUrl ? (
                          <img
                            src={newStudent.imageUrl}
                            alt="Student"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2 group-hover:text-orange-400 transition-colors duration-300"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <p className="text-sm text-gray-500 group-hover:text-orange-500 transition-colors duration-300">
                              Upload Photo
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Click to browse</p>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Upload student image"
                      />
                      {newStudent.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setNewStudent({ ...newStudent, image: null, imageUrl: '' })}
                          className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-2
                            hover:bg-red-200 transition-colors duration-300 shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="bg-gray-50 p-6 rounded-xl space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Student Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newStudent.name}
                          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-200 
                            focus:border-orange-400 transition-colors duration-200"
                          placeholder="Enter student's full name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Roll Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newStudent.rollNumber}
                          onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-200 
                            focus:border-orange-400 transition-colors duration-200"
                          placeholder="Enter roll number"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={newStudent.gender}
                          onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-200 
                            focus:border-orange-400 transition-colors duration-200 bg-white"
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="bg-gray-50 p-6 rounded-xl space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Batch <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={newStudent.batch || ''}
                          onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-200 
                            focus:border-orange-400 transition-colors duration-200 bg-white"
                          required
                        >
                          <option value="">Select a batch</option>
                          {batches.map(batch => (
                            <option key={batch.id} value={batch.name}>
                              Batch {batch.name} ({formatTime(batch.startTime)} - {formatTime(batch.endTime)})
                            </option>
                          ))}
                        </select>
                        {batches.length === 0 && (
                          <p className="mt-2 text-sm text-orange-600">
                            No batches available. Please create a batch first.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={newStudent.contactNumber || ''}
                          onChange={(e) => setNewStudent({ ...newStudent, contactNumber: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-200 
                            focus:border-orange-400 transition-colors duration-200"
                          placeholder="Enter contact number"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={newStudent.email || ''}
                          onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-200 
                            focus:border-orange-400 transition-colors duration-200"
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-4 pt-8 border-t border-gray-100">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-lg
                        font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                      {editingStudent ? 'Update Student' : 'Add Student'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('students-view')
                        setShowForm(false)
                        setEditingStudent(null)
                        setNewStudent({
                          name: '',
                          rollNumber: '',
                          batch: '',
                          gender: '',
                          contactNumber: '',
                          email: '',
                          image: null,
                          imageUrl: '',
                          attendance: { scrum: [], class: [] }
                        })
                      }}
                      className="px-6 py-3 rounded-lg border border-gray-200 font-medium text-gray-600
                        hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Add/Edit Batch Form */}

            {currentView === 'batches-add' && (
              <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
                {/* Form Header */}
                <div className="mb-8 border-b border-gray-100 pb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {editingBatch ? 'Edit Batch Details' : 'Create New Batch'}
                  </h2>
                  <p className="text-sm">
                    {editingBatch
                      ? 'Update the information for existing batch'
                      : 'Fill in the details to create a new batch'}
                  </p>
                </div>

                <form onSubmit={handleBatchSubmit} className="space-y-8">
                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="bg-gray-50 p-6 rounded-xl space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Batch Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newBatch.name}
                          onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-200 
                            focus:border-orange-400 transition-colors duration-200"
                          placeholder="Enter batch name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trainer Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newBatch.trainer}
                          onChange={(e) => setNewBatch({ ...newBatch, trainer: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-200 
                            focus:border-orange-400 transition-colors duration-200"
                          placeholder="Enter trainer name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Batch Timing <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={newBatch.startTime}
                              onChange={(e) => setNewBatch({ ...newBatch, startTime: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-200 
                                focus:border-orange-400 transition-colors duration-200"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">End Time</label>
                            <input
                              type="time"
                              value={newBatch.endTime}
                              onChange={(e) => setNewBatch({ ...newBatch, endTime: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-200 
                                focus:border-orange-400 transition-colors duration-200"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="bg-gray-50 p-6 rounded-xl">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Days of Week <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                            <label key={day} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 
                              transition-colors duration-200 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newBatch.daysOfWeek.includes(day)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewBatch({
                                      ...newBatch,
                                      daysOfWeek: [...newBatch.daysOfWeek, day]
                                    });
                                  } else {
                                    setNewBatch({
                                      ...newBatch,
                                      daysOfWeek: newBatch.daysOfWeek.filter(d => d !== day)
                                    });
                                  }
                                }}
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                              />
                              <span className="text-sm text-gray-700">{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add this in the batch form */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={batchStartDate}
                      onChange={(e) => setBatchStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-200 
                        focus:border-orange-400 transition-colors duration-200"
                      required
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-4 pt-8 border-t border-gray-100">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg
                        font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                      {editingBatch ? 'Update Batch' : 'Create Batch'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView('batches-view')
                        setShowBatchForm(false)
                        setEditingBatch(null)
                        setNewBatch({
                          name: '',
                          startTime: '',
                          endTime: '',
                          daysOfWeek: [],
                          trainer: ''
                        })
                      }}
                      className="px-6 py-3 rounded-lg border border-gray-200 font-medium text-gray-600
                        hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Batches View */}
            {currentView === 'batches-view' && (
              <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Batches</h2>
                      <p className="text-gray-600 mt-1">Manage your training batches and schedules</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-gray-600">Total Batches</p>
                        <p className="text-2xl font-bold text-blue-600">{batches.length}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowBatchForm(true);
                          setCurrentView('batches-add');
                          setEditingBatch(null);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                          transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Batch
                      </button>
                    </div>
                  </div>
                </div>

                {/* Batches Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {batches.map(batch => (
                    <div key={batch.id}
                      onClick={() => setSelectedBatchForStudents(batch)}
                      className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden 
                        hover:shadow-md transition-all duration-300 group cursor-pointer"
                    >
                      {/* Batch Header */}
                      <div className="p-6 bg-gradient-to-r from-blue-50/50 to-white border-b border-gray-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                Active
                              </span>
                              <span className="text-sm text-gray-500">
                                Started {new Date(batch.startDate).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Batch {batch.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {batch.startTime} - {batch.endTime}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={() => {
                                setEditingBatch(batch);
                                setNewBatch({
                                  name: batch.name,
                                  startTime: batch.startTime,
                                  endTime: batch.endTime,
                                  daysOfWeek: batch.daysOfWeek,
                                  trainer: batch.trainer
                                });
                                setBatchStartDate(batch.startDate || getTodayDate());
                                setShowBatchForm(true);
                                setCurrentView('batches-add');
                              }}
                              className="p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 
                                rounded-lg hover:bg-blue-50"
                              title="Edit Batch"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBatch(batch.id, batch.name);
                              }}
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors duration-200 
                                rounded-lg hover:bg-red-50"
                              title="Delete Batch"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Batch Details */}
                      <div className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Trainer Info */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-50 rounded-lg">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Trainer</p>
                                <p className="text-sm text-gray-600">{batch.trainer}</p>
                              </div>
                            </div>
                          </div>

                          {/* Schedule */}
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-green-50 rounded-lg">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-sm font-medium text-gray-900">Schedule</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {batch.daysOfWeek.map(day => (
                                <span key={day}
                                  className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium"
                                >
                                  {day}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Students Count */}
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-50 rounded-lg">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Students</p>
                                <p className="text-2xl font-bold text-purple-600">
                                  {students.filter(s => s.batch?.toString() === batch.name?.toString()).length}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State */}
                {batches.length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-gray-50 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Batches Found</h3>
                    <p className="text-gray-600">Create your first batch to get started.</p>
                  </div>
                )}
              </div>
            )}

            {currentView === 'students-attendance' && (
              <div className="space-y-6 mx-auto">
                {/* Attendance Form Card */}
                <div className={`${attendanceCardStyle} p-6`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Attendance Management</h2>
                      <p className="text-sm text-gray-600">Mark and manage student attendance</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date Selection with Navigation Arrows */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Select Date</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const currentDate = new Date(selectedDate);
                            const newDate = new Date(currentDate.setDate(currentDate.getDate() - 1));

                            // Get the batch start date
                            const selectedBatchData = batches.find(b => b.name === selectedBatch);
                            const batchStartDate = selectedBatchData ? new Date(selectedBatchData.startDate) : new Date();

                            // Only allow navigation if new date is not before batch start date
                            if (newDate >= batchStartDate) {
                              setSelectedDate(newDate.toISOString().split('T')[0]);
                            }
                          }}
                          disabled={!selectedBatch || selectedDate <= (batches.find(b => b.name === selectedBatch)?.startDate || selectedDate)}
                          className={`p-2 rounded-lg ${!selectedBatch || selectedDate <= (batches.find(b => b.name === selectedBatch)?.startDate || selectedDate)
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <div className="relative flex-1">
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                              const newDate = new Date(e.target.value);
                              const selectedBatchData = batches.find(b => b.name === selectedBatch);
                              const batchStartDate = selectedBatchData ? new Date(selectedBatchData.startDate) : new Date();

                              // Only allow date selection if it's not before batch start date
                              if (!selectedBatch || newDate >= batchStartDate) {
                                setSelectedDate(e.target.value);
                              }
                            }}
                            min={selectedBatch ? batches.find(b => b.name === selectedBatch)?.startDate : undefined}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300
                              focus:ring-2 focus:ring-blue-200 focus:border-blue-400 
                              transition-all duration-200"
                          />
                        </div>

                        <button
                          onClick={() => {
                            const currentDate = new Date(selectedDate);
                            const newDate = new Date(currentDate.setDate(currentDate.getDate() + 1));

                            // Don't allow navigation beyond today
                            if (newDate <= new Date()) {
                              setSelectedDate(newDate.toISOString().split('T')[0]);
                            }
                          }}
                          disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                          className={`p-2 rounded-lg ${selectedDate >= new Date().toISOString().split('T')[0]
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Show batch start date info if selected */}
                      {selectedBatch && (
                        <p className="text-sm text-gray-500 mt-1">
                          Batch started on {new Date(batches.find(b => b.name === selectedBatch)?.startDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Batch Selection */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Select Batch</label>
                      <select
                        value={selectedBatch}
                        onChange={handleBatchChange}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="">All Batches</option>
                        {Array.from(new Set(students.map(s => s.batch)))
                          .sort((a, b) => a - b)
                          .map(batch => (
                            <option key={batch} value={batch.toString()}>
                              Batch {batch}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleAttendanceSubmit}
                    disabled={!selectedDate || !selectedBatch}
                    className={`mt-6 w-full px-6 py-3 rounded-lg font-medium text-white
                    transition-all duration-300 transform hover:-translate-y-0.5
                    ${(!selectedDate || !selectedBatch)
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg'}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>View Attendance Sheet</span>
                    </div>
                  </button>

                  {/* Attendance Table */}
                  {showAttendanceTable && attendanceStudents.length > 0 && (
                    <div className={attendanceCardStyle}>
                      <div className={attendanceHeaderStyle}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              Attendance Sheet - Batch {selectedBatch}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {new Date(selectedDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {attendanceStudents.length} Students
                            </span>
                            <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                              {attendanceStudents.filter(s =>
                                s.attendance?.class?.find(r => r.date === selectedDate)?.present
                              ).length} Present
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className={attendanceTableStyle}>
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Roll Number
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Mark Attendance
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {attendanceStudents.map(student => {
                              const isPresent = student.attendance?.class?.find(
                                record => record.date === selectedDate
                              )?.present;

                              return (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-200">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 flex-shrink-0">
                                        {student.imageUrl ? (
                                          <img
                                            className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                                            src={student.imageUrl}
                                            alt={student.name}
                                          />
                                        ) : (
                                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                              />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-900">{student.name}</div>
                                        <div className="text-sm text-gray-500">{student.email}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">{student.rollNumber}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => markAttendance(student.id, true)}
                                        className={attendanceButtonStyle(isPresent === true, 'present')}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Present
                                      </button>
                                      <button
                                        onClick={() => markAttendance(student.id, false)}
                                        className={attendanceButtonStyle(isPresent === false, 'absent')}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Absent
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${isPresent === true
                                        ? 'bg-green-100 text-green-800'
                                        : isPresent === false
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-gray-100 text-gray-800'}`}
                                    >
                                      {isPresent === true ? 'Present' : isPresent === false ? 'Absent' : 'Not Marked'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* No Students Message */}
                  {showAttendanceTable && attendanceStudents.length === 0 && (
                    <div className={`${attendanceCardStyle} p-8 text-center`}>
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="bg-gray-50 rounded-full p-4 mb-4">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                        <p className="text-gray-500 max-w-sm">
                          There are no students enrolled in this batch. Add students to the batch to start marking attendance.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentView === 'attendance-report' && (
              <div className="bg-white min-h-screen">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-50 to-gray-50 border-b border-gray-200">
                  <div className="px-8 py-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Attendance Report</h2>
                        <p className="text-base text-gray-600 mt-1">Track and analyze student attendance records</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="px-6 py-3 bg-white rounded-xl shadow-sm border border-blue-100">
                          <p className="text-sm font-medium text-gray-600">Total Students</p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            {students.filter(student => !selectedBatch || student.batch?.toString() === selectedBatch || student.batchId?.toString() === selectedBatch).length}
                          </p>
                        </div>
                        <div className="px-6 py-3 bg-white rounded-xl shadow-sm border border-blue-100">
                          <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            {calculateAverageAttendance()}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Filters Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200/80">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Select Batch</label>
                          <select
                            value={selectedBatch}
                            onChange={handleBatchChange}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm
                              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                          >
                            <option value="">All Batches</option>
                            {Array.from(new Set(students.map(s => s.batch)))
                              .sort((a, b) => a - b)
                              .map(batch => (
                                <option key={batch} value={batch.toString()}>
                                  Batch {batch}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Filter Type</label>
                          <div className="flex gap-4 mt-2">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                value="range"
                                checked={filterType === 'range'}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                              />
                              <span className="ml-2 text-sm text-gray-700">Date Range</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                value="single"
                                checked={filterType === 'single'}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                              />
                              <span className="ml-2 text-sm text-gray-700">Today</span>
                            </label>
                          </div>
                        </div>

                        {filterType === 'range' ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                              <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                                  focus:border-blue-400 text-base bg-white shadow-sm"
                                // Disable the input if a batch is selected
                                disabled={!!selectedBatch}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                              <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                                  focus:border-blue-400 text-base bg-white shadow-sm"
                              />
                            </div>
                          </>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                            <input
                              type="date"
                              value={singleDate}
                              onChange={(e) => setSingleDate(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                                focus:border-blue-400 text-base bg-white shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add new Tabular Report Section */}
                <div className="p-8">
                  {selectedBatch && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-white border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Detailed Attendance Report - Batch {selectedBatch}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {filterType === 'range'
                            ? `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`
                            : new Date(singleDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student
                              </th>
                              {filterType === 'range' ? (
                                <>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Present Days
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Days
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Attendance %
                                  </th>
                                </>
                              ) : (
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                              )}
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Details
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {students
                              .filter(student => !selectedBatch || student.batch?.toString() === selectedBatch || student.batchId?.toString() === selectedBatch)
                              .map((student) => {
                                const attendanceRecords = student.attendance?.class || [];
                                const recordsInRange = filterType === 'range'
                                  ? attendanceRecords.filter(record =>
                                    record.date >= dateRange.start && record.date <= dateRange.end
                                  )
                                  : attendanceRecords.filter(record => record.date === singleDate);

                                const totalDays = recordsInRange.length;
                                const presentDays = recordsInRange.filter(record => record.present).length;
                                const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
                                { console.log(student, "1234567890"); }
                                return (
                                  <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0">
                                          {student.imageUrl ? (
                                            <img
                                              className="h-10 w-10 rounded-full object-cover"
                                              src={student.imageUrl}
                                              alt={student.name}
                                            />
                                          ) : (
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                />
                                              </svg>
                                            </div>
                                          )}
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                          <div className="text-sm text-gray-500">Roll No: {student.rollNumber}</div>
                                        </div>
                                      </div>
                                    </td>

                                    {filterType === 'range' ? (
                                      <>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          {presentDays}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          {totalDays}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${attendancePercentage >= 75 ? 'bg-green-100 text-green-800' :
                                              attendancePercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                              }`}>
                                              {attendancePercentage.toFixed(1)}%
                                            </span>
                                          </div>
                                        </td>
                                      </>
                                    ) : (
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        {recordsInRange[0]?.present ? (
                                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Present
                                          </span>
                                        ) : (
                                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Absent
                                          </span>
                                        )}
                                      </td>
                                    )}

                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <button
                                        onClick={() => {
                                          setSelectedStudent(student);
                                          setShowAttendanceDetails(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-900"                                      >
                                        View Details
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary Footer */}
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div>
                            Total Students: {students.filter(s => s.batch?.toString() === selectedBatch || s.batchId?.toString() === selectedBatch).length}
                          </div>
                          <div>
                            Average Attendance: {calculateAverageAttendance()}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Keep the existing empty state for when no batch is selected */}
                  {!selectedBatch && (
                    <div className="text-center py-12">
                      <div className="bg-gray-50 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Batch</h3>
                      <p className="text-gray-600">Choose a batch to view attendance records.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mock Create View */}
            {currentView === 'mock-create' && (
              <div className="p-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200/80">
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Create Custom Mock Test</h2>
                  </div>

                  <div className="p-6">
                    <form onSubmit={handleCreateMock} className="space-y-6">
                      {/* Mock Test Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mock Test Name
                        </label>
                        <input
                          type="text"
                          value={newMockTest.name}
                          onChange={(e) => setNewMockTest(prev => ({ ...prev, name: e.target.value }))}
                          className={inputStyle}
                          placeholder="Enter a descriptive name for the mock test"
                          required
                        />
                      </div>

                      {/* Batch Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Batches
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Array.from(new Set(students.map(s => s.batch)))
                            .sort((a, b) => a - b)
                            .map(batch => (
                              <div
                                key={batch}
                                className={`relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${newMockTest.batches.includes(batch.toString())
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
                                  }`}
                                onClick={() => {
                                  setNewMockTest(prev => {
                                    const batchStr = batch.toString();
                                    if (prev.batches.includes(batchStr)) {
                                      return {
                                        ...prev,
                                        batches: prev.batches.filter(b => b !== batchStr)
                                      };
                                    } else {
                                      return {
                                        ...prev,
                                        batches: [...prev.batches, batchStr]
                                      };
                                    }
                                  });
                                }}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${newMockTest.batches.includes(batch.toString())
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300'
                                    }`}>
                                    {newMockTest.batches.includes(batch.toString()) && (
                                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                  <span className={`text-sm font-medium ${newMockTest.batches.includes(batch.toString())
                                    ? 'text-blue-700'
                                    : 'text-gray-700'
                                    }`}>
                                    Batch {batch}
                                  </span>
                                </div>
                                <div className="absolute right-3">
                                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                    {students.filter(s => s.batch === batch).length} students
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                        {newMockTest.batches.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600">
                              Selected {newMockTest.batches.length} batch{newMockTest.batches.length !== 1 ? 'es' : ''}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Test Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Test Date
                        </label>
                        <input
                          type="date"
                          value={newMockTest.date}
                          onChange={(e) => setNewMockTest(prev => ({ ...prev, date: e.target.value }))}
                          className={inputStyle}
                          required
                        />
                        <p className="mt-1 text-sm text-gray-500">Select the date when this test will be conducted</p>
                      </div>

                      {/* Maximum Score */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Score
                        </label>
                        <input
                          type="number"
                          value={newMockTest.maxScore}
                          onChange={(e) => setNewMockTest(prev => ({ ...prev, maxScore: e.target.value }))}
                          className={inputStyle}
                          min="10"
                          max="10"
                          required
                          readOnly
                        />
                        <p className="mt-1 text-sm text-gray-500">Maximum score is fixed at 10 marks</p>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Test Description
                        </label>
                        <textarea
                          value={newMockTest.description}
                          onChange={(e) => setNewMockTest(prev => ({ ...prev, description: e.target.value }))}
                          className={`${inputStyle} min-h-[100px]`}
                          placeholder="Provide details about the test format, topics covered, and any special instructions"
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            setNewMockTest({
                              name: '',
                              date: getTodayDate(),
                              maxScore: 10,
                              description: '',
                              batches: []
                            });
                            setCurrentView('mock-list');
                          }}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 
                            transition-colors duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                            transition-colors duration-200 flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Create Mock Test
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Mock Report View */}
            {currentView === 'mock-report-attendence' && (
              <div className="p-6">
                {/* Header Card - Keep existing */}
                <div className={`${cardStyle} mb-6`}>
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Mock Attendence Reports</h2>
                        <p className="text-gray-600 mt-1">Comprehensive analysis of mock attendence</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Keep existing batch filter */}
                        <div className="min-w-[200px]">
                          <select
                            value={selectedBatch}
                            onChange={handleBatchChange}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm
                              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                          >
                            <option value="">All Batches</option>
                            {Array.from(new Set(students.map(s => s.batch)))
                              .sort((a, b) => a - b)
                              .map(batch => (
                                <option key={batch} value={batch.toString()}>
                                  Batch {batch}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="min-w-[200px]">
                          <select
                            value={selectedMock || ''}
                            onChange={handleMockChange}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm
                              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                          >
                            <option value="">Select Mock Test</option>
                            {/* Default Level Mocks (1-10) */}
                            <optgroup label="Default Level Tests">
                              {Array.from({ length: 10 }, (_, i) => i + 1).map(level => {
                                // Use consistent ID format that matches student records
                                const mockId = `level-${level}`;

                                // Find if this test exists in mockTests
                                const defaultTest = mockTests.find(
                                  test => test.isDefaultLevel && test.level === level
                                );

                                return (
                                  <option
                                    key={mockId}
                                    value={mockId} // Always use level-X format
                                    disabled={!defaultTest}
                                  >
                                    Level {level} Mock Test
                                  </option>
                                );
                              })}
                            </optgroup>
                            {/* Custom Created Mocks */}
                            {mockTests.filter(test => !test.isDefaultLevel).length > 0 && (
                              <optgroup label="Custom Mock Tests">
                                {mockTests
                                  .filter(test => !test.isDefaultLevel)
                                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                                  .map(test => (
                                    <option key={test.id} value={test.id}>
                                      {test.name} ({formatDate(test.date)})
                                    </option>
                                  ))}
                              </optgroup>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mock Test Attendance Summary */}
                <div className={`${cardStyle} mb-6`}>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Mock Test Attendance Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600">Present Students</p>
                        <p className="text-2xl font-bold text-green-700">
                          {selectedMock ? (() => {
                            // Filter students by batch if a batch is selected
                            const filteredStudents = students.filter(student =>
                              !selectedBatch || student.batch === selectedBatch || student.batchId === selectedBatch
                            );

                            // Count students who have a score > 0 for this mock
                            return filteredStudents.filter(student => {
                              const mockRecord = student.mockScores?.find(score =>
                                score.mockId === selectedMock
                              );
                              return mockRecord && mockRecord.score > 0;
                            }).length;
                          })() : 0}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-600">Absent Students</p>
                        <p className="text-2xl font-bold text-red-700">
                          {selectedMock ? (() => {
                            // Filter students by batch if a batch is selected
                            const filteredStudents = students.filter(student =>
                              !selectedBatch || student.batch === selectedBatch || student.batchId === selectedBatch
                            );

                            // Count students who have a record but score is 0 or absent is true
                            return filteredStudents.filter(student => {
                              const mockRecord = student.mockScores?.find(score =>
                                score.mockId === selectedMock
                              );
                              return mockRecord && (mockRecord.score === 0 || mockRecord.absent === true);
                            }).length;
                          })() : 0}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600">Attendance Rate</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {selectedMock ? (() => {
                            // Filter students by batch if a batch is selected
                            const filteredStudents = students.filter(student =>
                              !selectedBatch || student.batch === selectedBatch || student.batchId === selectedBatch
                            );

                            // Count total students with any record for this mock
                            const totalStudents = filteredStudents.filter(student =>
                              student.mockScores?.some(score => score.mockId === selectedMock)
                            ).length;

                            // Count present students (score > 0)
                            const presentStudents = filteredStudents.filter(student => {
                              const mockRecord = student.mockScores?.find(score =>
                                score.mockId === selectedMock
                              );
                              return mockRecord && mockRecord.score > 0;
                            }).length;

                            return totalStudents > 0
                              ? `${((presentStudents / totalStudents) * 100).toFixed(1)}%`
                              : '0%';
                          })() : '0%'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Report Table */}
                <div className={`${cardStyle}`}>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Student-wise Report</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student Name
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Mock Status
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Attendance Status
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Score
                            </th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {/* Make sure we're using the filtered students list */}
                          {getFilteredStudents()
                            // Apply batch filter if selectedBatch is set
                            .filter(student => !selectedBatch || student.batch === selectedBatch || student.batchId === selectedBatch)
                            .map(student => {
                              // Find the mock test record for this student
                              const mockRecord = student.mockScores?.find(score =>
                                score.mockId === selectedMock
                              );

                              // Determine attendance status based on score
                              const isPresent = mockRecord && mockRecord.score > 0;
                              const isAbsent = mockRecord && (mockRecord.score === 0 || mockRecord.absent === true);
                              const noRecord = !mockRecord;

                              // Get the score
                              const score = mockRecord?.score || 0;

                              return (
                                <tr key={student.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      {student.imageUrl ? (
                                        <img
                                          src={student.imageUrl}
                                          alt={student.name}
                                          className="h-8 w-8 rounded-full mr-2"
                                        />
                                      ) : (
                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                          <span className="text-gray-500 text-sm">
                                            {student.name.charAt(0)}
                                          </span>
                                        </div>
                                      )}
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                        <div className="text-xs text-gray-500">Batch {student.batch}</div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Mock Status cell */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {noRecord ? (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                        Not Assigned
                                      </span>
                                    ) : (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        Assigned
                                      </span>
                                    )}
                                  </td>

                                  {/* Attendance Status cell */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {isPresent ? (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Present
                                      </span>
                                    ) : isAbsent ? (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                        Absent
                                      </span>
                                    ) : (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                        No Record
                                      </span>
                                    )}
                                  </td>

                                  {/* Score cell */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {score > 0 ? (
                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${score >= 8 ? 'bg-green-100 text-green-800' :
                                        score >= 5 ? 'bg-blue-100 text-blue-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {score}/10
                                      </span>
                                    ) : (
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                        Not Scored
                                      </span>
                                    )}
                                  </td>

                                  {/* Actions cell */}
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                      onClick={() => {
                                        // Create a modified student object with mock-specific attendance info
                                        const studentWithMockDetails = {
                                          ...student,
                                          // Add mock-specific details
                                          mockDetails: {
                                            mockId: selectedMock,
                                            mockName: mockTests.find(m => m.id === selectedMock)?.name ||
                                              (selectedMock?.startsWith('level-') ?
                                                `Level ${selectedMock.replace('level-', '')} Mock Test` :
                                                selectedMock),
                                            score: score,
                                            isPresent: isPresent,
                                            isAbsent: isAbsent,
                                            submittedAt: mockRecord?.submittedAt || null,
                                            submittedBy: mockRecord?.submittedBy || null,
                                            date: mockRecord?.date || null
                                          }
                                        };

                                        // View the student report with mock-specific details
                                        viewStudentReport(studentWithMockDetails);
                                      }}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Keep existing content after this */}
                {/* ... rest of your existing mock report view ... */}
              </div>
            )}

            {/* Assign Mock View */}
            {currentView === 'mock-assign' && (
              <div className="p-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200/80">
                  <div className="p-6 bg-gradient-to-r from-orange-50 to-white border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Assign Mock Test</h2>
                    <p className="text-sm text-gray-600 mt-1">Assign scores to students for mock tests</p>
                  </div>

                  <div className="p-6">
                    {/* Filter Section */}
                    <div className="mb-6">
                      <div className="flex gap-4 items-end">
                        {/* Batch Filter */}
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Batch
                          </label>
                          <select
                            value={mockAssignmentFilter.batch || ''}
                            onChange={(e) => {
                              setMockAssignmentFilter(prev => ({ ...prev, batch: e.target.value }));
                              setShowFilteredStudents(false); // Hide students list when batch changes
                            }}
                            className={`${inputStyle} pr-10`}
                          >
                            <option value="">All Batches</option>
                            {Array.from(new Set(students.map(s => s.batch))).sort().map(batch => (
                              <option key={batch} value={batch}>Batch {batch}</option>
                            ))}
                          </select>
                        </div>
                        {/* Add Filter Button */}
                        <button
                          onClick={() => setShowFilteredStudents(true)}
                          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                            transition-colors duration-200 flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                          Show Students
                        </button>
                      </div>
                    </div>

                    {/* Students List with Close Button */}
                    {showFilteredStudents && (
                      <div className="mt-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Filtered Students</h3>
                            <button
                              onClick={() => setShowFilteredStudents(false)}
                              className="text-gray-500 hover:text-gray-700 p-1"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="p-4">
                            <div className="space-y-4">
                              {students
                                .filter(student => !mockAssignmentFilter.batch ||
                                  student.batch?.toString() === mockAssignmentFilter.batch)
                                .map(student => (
                                  <div
                                    key={student.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 
                                      rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-blue-600 font-medium">{student.name.charAt(0)}</span>
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-gray-900">{student.name}</h4>
                                        <p className="text-sm text-gray-600">Roll Number: {student.rollNumber}</p>
                                      </div>
                                    </div>
                                    {/* Mock Test Selection */}
                                    <div className="flex items-center gap-3">
                                      {renderMockTestOptions(student)}
                                      {student.selectedMockId && (
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            placeholder="Score"
                                            min="0"
                                            max="10" // Set max to 10
                                            value={student.mockScores?.find(s => s.mockId === student.selectedMockId)?.score || ''}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              if (value === '') {
                                                // Allow clearing the input
                                                setStudents(prevStudents =>
                                                  prevStudents.map(s =>
                                                    s.id === student.id
                                                      ? {
                                                        ...s,
                                                        mockScores: [
                                                          ...(s.mockScores || []).filter(ms => ms.mockId !== student.selectedMockId)
                                                        ]
                                                      }
                                                      : s
                                                  )
                                                );
                                                return;
                                              }

                                              const score = parseInt(value);

                                              if (isNaN(score) || score < 0 || score > 10) {
                                                setAlert({
                                                  type: 'warning',
                                                  message: 'Please enter a valid score between 0 and 10'
                                                });
                                                return;
                                              }

                                              setStudents(prevStudents =>
                                                prevStudents.map(s =>
                                                  s.id === student.id
                                                    ? {
                                                      ...s,
                                                      mockScores: [
                                                        ...(s.mockScores || []).filter(ms => ms.mockId !== student.selectedMockId),
                                                        {
                                                          mockId: student.selectedMockId,
                                                          score,
                                                          date: mockTests.find(t => t.id === student.selectedMockId)?.date || new Date().toISOString(),
                                                          absent: false
                                                        }
                                                      ]
                                                    }
                                                    : s
                                                )
                                              );
                                            }}
                                            className="w-20 px-3 py-2 rounded-lg border border-gray-300 
                                              focus:ring-2 focus:ring-blue-200 focus:border-blue-400 
                                              text-sm bg-white shadow-sm"
                                          />
                                          <button
                                            onClick={() => handleSaveScore(student)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg 
                                              hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Save Score
                                          </button>
                                          <button
                                            onClick={async () => {
                                              try {
                                                // Mark student as absent for this mock test
                                                await updateDoc(doc(db, 'students', student.id), {
                                                  mockScores: [
                                                    ...(student.mockScores || []).filter(ms => ms.mockId !== student.selectedMockId),
                                                    {
                                                      mockId: student.selectedMockId,
                                                      score: 0,
                                                      date: mockTests.find(t => t.id === student.selectedMockId)?.date || new Date().toISOString(),
                                                      absent: true
                                                    }
                                                  ]
                                                });
                                              } catch (error) {
                                                console.error('Error marking student absent:', error);
                                              }
                                            }}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                          >
                                            Mark Absent
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}

                              {/* Empty State */}
                              {students.filter(student => !mockAssignmentFilter.batch ||
                                student.batch?.toString() === mockAssignmentFilter.batch).length === 0 && (
                                  <div className="text-center py-8">
                                    <div className="bg-gray-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 
                                    flex items-center justify-center">
                                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                      </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                                    <p className="text-gray-600">
                                      {mockAssignmentFilter.batch
                                        ? `No students found in Batch ${mockAssignmentFilter.batch}`
                                        : 'No students available'}
                                    </p>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* mock attendence */}
            {currentView === 'view-mocks' && (
              <div className="space-y-6 p-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Mock Tests</h2>
                      <p className="text-gray-600 mt-1">View and manage all mock tests</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <div className="px-4 py-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-gray-600">Total Tests</p>
                          <p className="text-2xl font-bold text-blue-600">{mockTests.filter(test => !test.isDefaultLevel).length}</p>
                        </div>
                        <div className="px-4 py-3 bg-green-50 rounded-lg border border-green-100">
                          <p className="text-sm text-gray-600">Completed</p>
                          <p className="text-2xl font-bold text-green-600">
                            {mockTests.filter(test => test.status === 'completed').length}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCurrentView('mock-create')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                          transition-colors duration-200 flex items-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Create New Test
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-4 items-center">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search mock tests..."
                          value={mockSearchTerm}
                          onChange={(e) => setMockSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                            focus:ring-blue-500 focus:border-blue-500 w-64"
                        />
                        <svg
                          className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <select
                        value={mockBatchFilter}
                        onChange={(e) => setMockBatchFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                          focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Batches</option>
                        {Array.from(new Set(mockTests.flatMap(test => test.batches || []))).map(batch => (
                          <option key={batch} value={batch}>Batch {batch}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Sort by:</label>
                      <select
                        value={mockSortBy}
                        onChange={(e) => setMockSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                          focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="date-desc">Date (Newest)</option>
                        <option value="date-asc">Date (Oldest)</option>
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Mock Tests Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Test Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Batches
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredMockTests()
                          .filter(test =>
                            test.name.toLowerCase().includes(mockSearchTerm.toLowerCase()) ||
                            test.description?.toLowerCase().includes(mockSearchTerm.toLowerCase())
                          )
                          .sort((a, b) => {
                            switch (mockSortBy) {
                              case 'date-desc':
                                return new Date(b.date) - new Date(a.date);
                              case 'date-asc':
                                return new Date(a.date) - new Date(b.date);
                              case 'name-asc':
                                return a.name.localeCompare(b.name);
                              case 'name-desc':
                                return b.name.localeCompare(a.name);
                              default:
                                return 0;
                            }
                          })
                          .map((test) => (
                            <tr key={test.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-blue-50">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{test.name}</div>
                                    {test.description && (
                                      <div className="text-sm text-gray-500">{test.description}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{new Date(test.date).toLocaleDateString()}</div>
                                {test.duration && (
                                  <div className="text-sm text-gray-500">Duration: {test.duration} mins</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-wrap gap-1">
                                  {test.batches?.map(batch => (
                                    <span
                                      key={batch}
                                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      Batch {batch}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                  ${test.isDefaultLevel
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {test.isDefaultLevel ? 'Default Level' : 'Custom'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                  ${test.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {test.status === 'completed' ? 'Completed' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleEditMock(test)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMock(test.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}






            {/* Mock Report View */}
            {currentView === 'mock-report-score' && (
              <div className="p-6">
                {/* Header Card */}
                <div className={`${cardStyle} mb-6`}>
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Mock Test Reports</h2>
                        <p className="text-gray-600 mt-1">Comprehensive analysis of mock test performance and student progress</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Batch Filter */}
                        <div className="min-w-[200px]">
                          <select
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm
                              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                          >
                            <option value="">All Batches</option>
                            {Array.from(new Set(students.map(s => s.batch)))
                              .sort((a, b) => a - b)
                              .map(batch => (
                                <option key={batch} value={batch.toString()}>
                                  Batch {batch}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student List Table */}
                <div className={`${cardStyle} overflow-hidden mb-6`}>
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Student Level Progress</h3>
                        <p className="text-sm text-gray-600 mt-1">Track student progress through different levels</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-500"></span>
                          <span className="text-xs text-gray-600">Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                          <span className="text-xs text-gray-600">Current</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                          <span className="text-xs text-gray-600">Locked</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                            Student Info
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Level Status
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                            Progress Overview
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Latest Score
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Next Steps
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students
                          .filter(student => !selectedBatch || student.batch?.toString() === selectedBatch)
                          .map((student) => {
                            // Calculate current level and progress
                            let currentLevel = 1;
                            const levelScores = {};

                            // First, collect all level test scores
                            student.mockScores?.forEach(score => {
                              // Check if the mockId follows the pattern 'level-X'
                              const levelMatch = score.mockId?.match(/^level-(\d+)$/);
                              if (levelMatch) {
                                const level = parseInt(levelMatch[1]);
                                // Keep the highest score if multiple attempts exist
                                if (!levelScores[level] || score.score > levelScores[level]) {
                                  levelScores[level] = score.score;
                                }
                              }
                            });

                            // Then calculate the highest consecutive level completed
                            for (let i = 1; i <= 10; i++) {
                              if (levelScores[i] !== undefined && levelScores[i] >= 6) {
                                currentLevel = i + 1;
                              } else {
                                break;
                              }
                            }
                            currentLevel = Math.min(currentLevel, 10);

                            // Get latest mock test score for current level
                            const latestScore = student.mockScores
                              ?.filter(score => {
                                const levelMatch = score.mockId?.match(/^level-(\d+)$/);
                                return levelMatch && parseInt(levelMatch[1]) === currentLevel - 1;
                              })
                              .sort((a, b) => {
                                const dateA = new Date(a.date);
                                const dateB = new Date(b.date);
                                return dateB - dateA;
                              })[0];

                            // Calculate number of levels completed
                            const completedLevels = Object.entries(levelScores)
                              .filter(([_, score]) => score >= 6)
                              .length;

                            // Debug logging
                            console.log('Student:', student.name);
                            console.log('Level Scores:', levelScores);
                            console.log('Current Level:', currentLevel);
                            console.log('Completed Levels:', completedLevels);

                            return (
                              <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-white shadow-sm">
                                      <span className="text-blue-600 font-semibold">{student.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">{student.name}</div>
                                      <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs text-gray-500 truncate">B-{student.batch}</span>
                                        <span className="text-xs text-gray-500">•</span>
                                        <span className="text-xs text-gray-500 truncate">R-{student.rollNumber}</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex flex-col items-start">
                                    <div className="text-sm font-medium text-gray-900">Level {currentLevel}</div>
                                    <div className="mt-1">
                                      <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded-full ${currentLevel === 10
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {currentLevel === 10 ? 'Max Level' : 'In Progress'}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex flex-col gap-2 max-w-[200px]">
                                    <div className="flex items-center gap-0.5">
                                      {[...Array(10)].map((_, index) => (
                                        <div
                                          key={index}
                                          className={`h-2 w-4 first:rounded-l-full last:rounded-r-full ${index + 1 <= completedLevels
                                            ? 'bg-green-500'
                                            : index + 1 === currentLevel
                                              ? 'bg-blue-500'
                                              : 'bg-gray-200'
                                            }`}
                                        />
                                      ))}
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-medium text-gray-900">
                                        {completedLevels}/10
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {((completedLevels / 10) * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  {latestScore ? (
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-sm font-bold ${latestScore.score >= 8 ? 'text-green-600' :
                                          latestScore.score >= 6 ? 'text-blue-600' :
                                            'text-yellow-600'
                                          }`}>
                                          {latestScore.score}/10
                                        </span>
                                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${latestScore.score >= 8 ? 'bg-green-100 text-green-800' :
                                          latestScore.score >= 6 ? 'bg-blue-100 text-blue-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>
                                          {latestScore.score >= 8 ? 'Excellent' :
                                            latestScore.score >= 6 ? 'Good' : 'Practice'}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1 truncate">
                                        L{currentLevel - 1} • {new Date(latestScore.date).toLocaleDateString()}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-500">No attempts</div>
                                  )}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex flex-col gap-1">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full 
                                      ${currentLevel === 10
                                        ? 'bg-green-100 text-green-800'
                                        : latestScore?.score >= 6
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                      {currentLevel === 10
                                        ? '🎉 Complete'
                                        : latestScore?.score >= 6
                                          ? '✨ Next Level'
                                          : '📚 Practice'
                                      }
                                    </span>
                                    {currentLevel < 10 && (
                                      <span className="text-xs text-gray-500 truncate">
                                        {latestScore?.score >= 6
                                          ? `Go to L${currentLevel}`
                                          : `Master L${currentLevel - 1}`
                                        }
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Scoreboard Section */}
                <div className={`${cardStyle} mb-6`}>
                  <div className="p-6 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Class Scoreboard</h3>
                    <p className="text-sm text-gray-600 mt-1">Top performers and performance distribution</p>
                  </div>

                  {/* Scoreboard Navigation */}
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Scoreboard Navigation">
                      <button
                        onClick={() => setScoreboardView('overview')}
                        className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-medium ${scoreboardView === 'overview'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                      >
                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Overview
                      </button>

                      <button
                        onClick={() => setScoreboardView('top-performers')}
                        className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-medium ${scoreboardView === 'top-performers'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                      >
                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Top Performers
                      </button>

                      <button
                        onClick={() => setScoreboardView('progress')}
                        className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-medium ${scoreboardView === 'progress'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                      >
                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Progress
                      </button>
                    </nav>
                  </div>

                  <div className="p-6">
                    {/* Overview View */}
                    {scoreboardView === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Class Average */}
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-600">Class Average</h4>
                            <div className="p-2 bg-green-50 rounded-full">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </div>
                          </div>
                          <p className="mt-4 text-3xl font-bold text-gray-900">
                            {(students
                              .filter(s => !selectedBatch || s.batch?.toString() === selectedBatch)
                              .reduce((acc, student) => acc + parseFloat(getStudentPerformanceSummary(student).averageScore), 0) /
                              students.filter(s => !selectedBatch || s.batch?.toString() === selectedBatch).length
                            ).toFixed(1)}
                            <span className="text-sm font-normal text-gray-500 ml-1">/10</span>
                          </p>
                        </div>

                        {/* Improvement Rate */}
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-600">Improvement Rate</h4>
                            <div className="p-2 bg-purple-50 rounded-full">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </div>
                          </div>
                          <p className="mt-4 text-3xl font-bold text-gray-900">
                            {((students
                              .filter(s => !selectedBatch || s.batch?.toString() === selectedBatch)
                              .filter(s => {
                                const scores = s.mockScores || [];
                                return scores.length >= 2 &&
                                  scores[scores.length - 1].score > scores[scores.length - 2].score;
                              }).length /
                              students.filter(s => !selectedBatch || s.batch?.toString() === selectedBatch).length
                            ) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Top Performers View */}
                    {scoreboardView === 'top-performers' && (
                      <div className="space-y-6 p-4">
                        {/* Top 3 Performers - Modern Cards */}
                        <div className="grid grid-cols-3 gap-4">
                          {students
                            .filter(s => !selectedBatch || s.batch?.toString() === selectedBatch)
                            .sort((a, b) => parseFloat(getStudentPerformanceSummary(b).averageScore) - parseFloat(getStudentPerformanceSummary(a).averageScore))
                            .slice(0, 3)
                            .map((student, index) => {
                              const performance = getStudentPerformanceSummary(student);
                              const medals = ['bg-gradient-to-r from-yellow-400 to-yellow-300', 'bg-gradient-to-r from-gray-300 to-gray-200', 'bg-gradient-to-r from-orange-400 to-orange-300'];
                              const borders = ['ring-yellow-400', 'ring-gray-300', 'ring-orange-400'];
                              const textColors = ['text-yellow-700', 'text-gray-700', 'text-orange-700'];

                              return (
                                <div key={student.id} className="relative transform transition-all duration-300 hover:scale-105">
                                  <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 ${medals[index]} w-8 h-8 rounded-full flex items-center justify-center shadow-md z-10`}>
                                    <span className="text-white text-sm font-bold">#{index + 1}</span>
                                  </div>
                                  <div className={`bg-white rounded-lg shadow p-4 pt-8 ${index === 0 ? 'border border-yellow-400' : 'border border-gray-100'}`}>
                                    <div className="flex flex-col items-center">
                                      <div className={`w-16 h-16 rounded-full ring-2 ${borders[index]} overflow-hidden mb-3`}>
                                        <img src={student.profileImage || 'https://via.placeholder.com/64'} alt={`${index + 1}st place`} className="w-full h-full object-cover" />
                                      </div>
                                      <h3 className="text-sm font-semibold text-gray-900 text-center mb-0.5">{student.name}</h3>
                                      <p className="text-xs text-gray-500 mb-2">Batch {student.batch}</p>
                                      <div className={`text-xl font-bold ${textColors[index]} mb-2`}>{performance.averageScore}/10</div>
                                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                                        <div className={`${medals[index]} h-1.5 rounded-full`} style={{ width: `${(performance.averageScore / 10) * 100}%` }}></div>
                                      </div>
                                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span>{student.mockScores?.length || 0} tests</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {/* Rest of Top Performers */}
                        <div className="bg-white rounded-lg shadow p-4">
                          <h4 className="text-base font-semibold text-gray-900 mb-4">Other Top Performers</h4>
                          <div className="space-y-2">
                            {students
                              .filter(s => !selectedBatch || s.batch?.toString() === selectedBatch)
                              .sort((a, b) => parseFloat(getStudentPerformanceSummary(b).averageScore) - parseFloat(getStudentPerformanceSummary(a).averageScore))
                              .slice(3, 10)
                              .map((student, index) => {
                                const performance = getStudentPerformanceSummary(student);
                                return (
                                  <div key={student.id} className="flex items-center p-2 rounded hover:bg-gray-50 transition-colors duration-200">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 mr-3">
                                      <span className="text-xs font-semibold text-gray-600">#{index + 4}</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full ring-1 ring-gray-200 overflow-hidden mr-3">
                                      <img src={student.profileImage || 'https://via.placeholder.com/32'} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="text-sm font-medium text-gray-900">{student.name}</h5>
                                      <div className="flex items-center">
                                        <div className="text-xs text-gray-500">Batch {student.batch}</div>
                                        <span className="mx-1 text-gray-300">•</span>
                                        <div className="text-xs text-gray-500">{student.mockScores?.length || 0} tests</div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-semibold text-indigo-600">{performance.averageScore}/10</div>
                                      <div className="w-20 bg-gray-100 rounded-full h-1 mt-1">
                                        <div className="bg-indigo-600 h-1 rounded-full" style={{ width: `${(performance.averageScore / 10) * 100}%` }}></div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    )}



                    {/* Progress View */}
                    {scoreboardView === 'progress' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Monthly Progress */}
                          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4">Monthly Progress</h4>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-3xl font-bold text-gray-900">
                                  {((students
                                    .filter(s => !selectedBatch || s.batch?.toString() === selectedBatch)
                                    .filter(s => {
                                      const scores = s.mockScores || [];
                                      return scores.length >= 2 &&
                                        scores[scores.length - 1].score > scores[scores.length - 2].score;
                                    }).length /
                                    students.filter(s => !selectedBatch || s.batch?.toString() === selectedBatch).length
                                  ) * 100).toFixed(1)}%
                                </p>
                                <p className="text-sm text-gray-500">Students showing improvement</p>
                              </div>
                              <div className="p-3 bg-green-50 rounded-full">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Test Completion */}
                          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4">Test Completion</h4>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-3xl font-bold text-gray-900">
                                  {students
                                    .filter(s => !selectedBatch || s.batch?.toString() === selectedBatch)
                                    .reduce((acc, s) => acc + (s.mockScores?.length || 0), 0)}
                                </p>
                                <p className="text-sm text-gray-500">Total tests completed</p>
                              </div>
                              <div className="p-3 bg-blue-50 rounded-full">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      {
        showStudentDetails && selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-sm backdrop-filter rounded-xl max-w-2xl w-full max-h-[90vh] 
            overflow-y-auto p-6 m-4 shadow-xl border border-gray-200/50">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-800">Student Details</h2>
                <button
                  onClick={() => setShowStudentDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Student Header */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
                    {selectedStudent.imageUrl ? (
                      <img
                        src={selectedStudent.imageUrl}
                        alt={selectedStudent.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{selectedStudent.name}</h3>
                    <p className="text-gray-600">Roll No: {selectedStudent.rollNumber}</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    {selectedStudent.contactNumber && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {selectedStudent.contactNumber}
                      </div>
                    )}
                    {selectedStudent.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {selectedStudent.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingStudent(selectedStudent);
                      setNewStudent(selectedStudent);
                      setCurrentView('students-add');
                      setShowForm(true);
                      setShowStudentDetails(false);
                    }}
                    className="flex-1 text-green-600 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg font-medium"
                  >
                    Edit Student
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStudent(selectedStudent.id);
                      setShowStudentDetails(false);
                    }}
                    className="flex-1 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg font-medium"
                  >
                    Delete Student
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Simplified Batch Students Modal */}
      {
        selectedBatchForStudents && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full m-4 max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-blue-50/50 to-white border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Batch Details
                      </span>
                      <span className="text-sm text-gray-500">
                        Started {new Date(selectedBatchForStudents.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Batch {selectedBatchForStudents.name} Students
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {selectedBatchForStudents.startTime} - {selectedBatchForStudents.endTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="bg-gray-100 rounded-lg p-1 flex items-center">
                      <button
                        onClick={() => setStudentListView('grid')}
                        className={`p-2 rounded-md transition-all duration-200 ${studentListView === 'grid'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                          }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setStudentListView('list')}
                        className={`p-2 rounded-md transition-all duration-200 ${studentListView === 'list'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                          }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedBatchForStudents(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Students List */}
              <div className="overflow-y-auto max-h-[calc(90vh-280px)]">
                <div className="p-6">
                  {/* Search and Filter */}
                  <div className="mb-6 flex gap-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search students..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 
                          focus:ring-blue-100 focus:border-blue-400"
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentView('students-add');
                        setShowForm(true);
                        setSelectedBatchForStudents(null);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                        transition-all duration-300 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Student
                    </button>
                  </div>

                  {/* Students Grid/List */}
                  <div className={studentListView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
                    {console.log("Total students:", students.length, "Selected batch:", selectedBatchForStudents)}
                    {students
                      // Skip batch filtering if no batch is selected
                      .filter(student => {
                        if (!selectedBatchForStudents) return true;

                        // Print student info for debugging
                        console.log("Student:", student.id, student.name,
                          "batch:", student.batch,
                          "batchId:", student.batchId,
                          "batchName:", student.batchName);

                        // Try multiple properties that might contain batch info
                        return (
                          (student.batch && student.batch.toString() === selectedBatchForStudents.toString()) ||
                          (student.batchId && student.batchId.toString() === selectedBatchForStudents.toString()) ||
                          (student.batchName && student.batchName.toString() === selectedBatchForStudents.toString())
                        );
                      })
                      // Then filter by search term if provided
                      .filter(student => {
                        if (!searchTerm) return true;
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          (student.name && student.name.toLowerCase().includes(searchLower)) ||
                          (student.rollNumber && student.rollNumber.toLowerCase().includes(searchLower))
                        );
                      })
                      .map(student => (
                        <div
                          key={student.id}
                          className={`bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 
                            transition-all duration-300 ${studentListView === 'grid'
                              ? 'flex flex-col gap-4'
                              : 'flex items-center gap-4'
                            }`}
                        >
                          {/* Student Image */}
                          <div className={`${studentListView === 'grid'
                            ? 'w-16 h-16'
                            : 'w-12 h-12'
                            } rounded-full overflow-hidden bg-gray-100 flex-shrink-0`}
                          >
                            {student.imageUrl ? (
                              <img
                                src={student.imageUrl}
                                alt={student.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Student Info */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-gray-900">{student.name}</h3>
                              <span className="text-sm text-gray-500">Roll No: {student.rollNumber}</span>
                            </div>

                            {/* Contact Info */}
                            <div className="flex flex-wrap gap-3 mt-2">
                              {student.email && (
                                <a
                                  href={`mailto:${student.email}`}
                                  className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {student.email}
                                </a>
                              )}
                              {student.phone && (
                                <a
                                  href={`tel:${student.phone}`}
                                  className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {student.phone}
                                </a>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingStudent(student);
                                  setNewStudent(student);
                                  setCurrentView('students-add');
                                  setShowForm(true);
                                  setSelectedBatchForStudents(null);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStudent(student.id);
                                }}
                                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}



                    {/* No Results Message */}
                    {students
                      // Filter for batch
                      .filter(student => {
                        if (!selectedBatchForStudents) return true;
                        return (
                          (student.batch && student.batch.toString() === selectedBatchForStudents.toString()) ||
                          (student.batchId && student.batchId.toString() === selectedBatchForStudents.toString()) ||
                          (student.batchName && student.batchName.toString() === selectedBatchForStudents.toString())
                        );
                      })
                      // Filter for search
                      .filter(student => {
                        if (!searchTerm) return true;
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          (student.name && student.name.toLowerCase().includes(searchLower)) ||
                          (student.rollNumber && student.rollNumber.toLowerCase().includes(searchLower))
                        );
                      })
                      .length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
                          <div className="bg-gray-50 rounded-full p-4 mb-4">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
                          <p className="text-gray-500 text-center max-w-sm">
                            {searchTerm && selectedBatchForStudents
                              ? `No students found matching "${searchTerm}" in Batch ${selectedBatchForStudents}`
                              : searchTerm
                                ? `No students found matching "${searchTerm}"`
                                : selectedBatchForStudents
                                  ? `No students found in Batch ${selectedBatchForStudents}`
                                  : 'No students available'}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Alert Component */}
      {showAlert && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`
            rounded-lg shadow-lg p-4 max-w-md transform transition-all duration-300 ease-in-out
            ${type === 'success' ? 'bg-green-50 border border-green-200' :
              type === 'error' ? 'bg-red-50 border border-red-200' :
                type === 'info' ? 'bg-blue-50 border border-blue-200' :
                  'bg-gray-50 border border-gray-200'}
          `}>
            <div className="flex items-center gap-3">
              {type === 'success' ? (
                <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : type === 'error' ? (
                <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div className={`flex-1 ${typeof message === 'string' ? 'font-medium' : ''} ${type === 'success' ? 'text-green-800' :
                type === 'error' ? 'text-red-800' :
                  type === 'info' ? 'text-blue-800' :
                    'text-gray-800'
                }`}>
                {message}
              </div>
              <button
                onClick={onClose}
                className="ml-auto p-1 rounded-full hover:bg-white/50 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {showAttendanceDetails && selectedStudent && (
        selectedStudent.mockDetails ? (
          <MockAttendanceDetailsModal
            student={selectedStudent}
            onClose={() => {
              setShowAttendanceDetails(false);
              setSelectedStudent(null);
            }}
          />
        ) : (
          <AttendanceDetailsModal
            student={selectedStudent}
            onClose={() => {
              setShowAttendanceDetails(false);
              setSelectedStudent(null);
            }}
          />
        )
      )}
      {/* Student Report Modal */}
      {showAttendanceDetails && selectedStudent && (
        selectedStudent.mockDetails ? (
          <MockAttendanceDetailsModal
            student={selectedStudent}
            onClose={() => {
              setShowAttendanceDetails(false);
              setSelectedStudent(null);
            }}
          />
        ) : (
          <AttendanceDetailsModal
            student={selectedStudent}
            onClose={() => {
              setShowAttendanceDetails(false);
              setSelectedStudent(null);
            }}
          />
        )
      )}
    </div>
  )
}

export default App

