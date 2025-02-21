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
  where
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'

// Add these styles at the top of the component
const cardStyle = "transition-all duration-300 hover:shadow-lg bg-white rounded-xl border border-gray-200/80"
const buttonStyle = "transition-all duration-300 transform active:scale-95 font-medium"
const tableHeaderStyle = "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"

// Add this new style constant
const sidebarButtonStyle = "w-full text-left px-4 py-3 rounded-lg transition-all duration-300 hover:bg-gray-100"

// First, add these new style constants at the top with other styles
const cardHoverStyle = "transition-all duration-300 hover:shadow-lg hover:border-blue-200"
const gridCardStyle = `
  bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 
  border border-gray-200/80 hover:border-blue-200 transform hover:-translate-y-1
  backdrop-blur-sm backdrop-filter
`
const searchInputStyle = `
  px-4 py-2.5 border border-gray-200 rounded-lg w-72
  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300
  bg-white/90 backdrop-blur-sm backdrop-filter
`
const selectStyle = `
  px-4 py-2.5 border border-gray-200 rounded-lg
  focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300
  bg-white/90 backdrop-blur-sm backdrop-filter
`

// First, add these style constants at the top
const formInputStyle = `
  w-full px-4 py-3 border border-gray-200 rounded-lg 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent
  transition-all duration-300 bg-white/80 backdrop-blur-sm
  hover:border-blue-200
`

const formLabelStyle = "block text-sm font-medium text-gray-700 mb-2"

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
  const [mockTests, setMockTests] = useState([
    { id: 1, name: 'Unit Test 1', maxScore: 50, date: '2024-03-15' },
    { id: 2, name: 'Mid Term', maxScore: 100, date: '2024-04-01' },
    { id: 3, name: 'Unit Test 2', maxScore: 50, date: '2024-04-15' },
    { id: 4, name: 'Final Term', maxScore: 100, date: '2024-05-01' }
  ])

  // Update the batches state with more detailed dummy data
  const [batches, setBatches] = useState([
    {
      id: 1,
      name: 'Morning Batch',
      startTime: '09:00',
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
        scrum: [], // Array of scrum call attendance
        class: [], // Array of class attendance
      },
      mockScores: [
        { mockId: 1, score: 45, date: getLast7Days()[0] },
        { mockId: 2, score: 82, date: getLast7Days()[1] }
      ]
    },
    { id: 2, name: 'Jane Smith', attendance: false, mockScores: [] },
    { id: 3, name: 'Mike Johnson', attendance: true, mockScores: [] },
  ])

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
    },
    mockScores: []
  })

  const [showForm, setShowForm] = useState(false)

  const [selectedStudent, setSelectedStudent] = useState(null)

  // Add new state for selected students
  const [selectedStudents, setSelectedStudents] = useState([])
  const [bulkAction, setBulkAction] = useState(false)
  const [bulkScore, setBulkScore] = useState('')

  // Add state for mock test selection
  const [selectedMock, setSelectedMock] = useState(mockTests[0].id)
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
      const querySnapshot = await getDocs(collection(db, 'students'));
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
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

  // Update handleSubmit for students
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = newStudent.imageUrl;

      if (newStudent.image) {
        const storageRef = ref(storage, `student-images/${Date.now()}-${newStudent.image.name}`);
        await uploadBytes(storageRef, newStudent.image);
        imageUrl = await getDownloadURL(storageRef);
      }

      const studentData = {
        ...newStudent,
        imageUrl,
        gender: newStudent.gender, // Make sure gender is included
        createdAt: new Date().toISOString()
      };

      if (selectedStudent) {
        const studentRef = doc(db, 'students', selectedStudent.id);
        await updateDoc(studentRef, studentData);
      } else {
        await addDoc(collection(db, 'students'), studentData);
      }

      await fetchStudents();

      setNewStudent({
        name: '',
        rollNumber: '',
        batch: '',
        gender: '', // Reset gender
        image: null,
        imageUrl: '',
        attendance: {
          scrum: [],
          class: []
        },
        mockScores: []
      });
      setSelectedStudent(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  // Update handleBatchSubmit
  const handleBatchSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingBatch) {
        // Update existing batch
        const batchRef = doc(db, 'batches', editingBatch.id);
        await updateDoc(batchRef, {
          name: newBatch.name,
          startTime: newBatch.startTime,
          endTime: newBatch.endTime,
          daysOfWeek: newBatch.daysOfWeek,
          trainer: newBatch.trainer
        });

        // Update all students with this batch
        const studentsToUpdate = students.filter(
          student => student.batch?.toString() === editingBatch.name?.toString()
        );

        for (const student of studentsToUpdate) {
          const studentRef = doc(db, 'students', student.id);
          await updateDoc(studentRef, { batch: newBatch.name });
        }

        alert('Batch updated successfully!');
      } else {
        // Create new batch
        await addDoc(collection(db, 'batches'), {
          ...newBatch,
          createdAt: new Date().toISOString()
        });
        alert('New batch created successfully!');
      }

      // Reset form and state
      setNewBatch({
        name: '',
        startTime: '',
        endTime: '',
        daysOfWeek: [],
        trainer: ''
      });
      setEditingBatch(null);
      setShowBatchForm(false);
      setCurrentView('batches-view');

      // Refresh data
      fetchBatches();
      fetchStudents();
    } catch (error) {
      console.error('Error saving batch:', error);
      alert('Failed to save batch. Please try again.');
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

  const viewStudentReport = (student) => {
    setSelectedStudent(student)
  }

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
    return students.filter(student => student.batchId === selectedBatch)
  }

  // Add new state for mock test form
  const [showMockForm, setShowMockForm] = useState(false)
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
  const handleScoreChange = (student, testId, value) => {
    const test = mockTests.find(t => t.id === testId)
    const isAbsent = value === 'absent'
    const score = isAbsent ? 0 : parseInt(value)

    if (!isAbsent && (isNaN(score) || score < 0 || score > test.maxScore)) {
      return
    }

    const updatedMockScores = [
      ...(student.mockScores || []).filter(s => s.mockId !== testId),
      {
        mockId: testId,
        score: score,
        date: test.date,
        absent: isAbsent
      }
    ]

    setStudents(students.map(s =>
      s.id === student.id
        ? { ...s, mockScores: updatedMockScores }
        : s
    ))
  }

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

  // Function to handle attendance submission
  const handleAttendanceSubmit = () => {
    // Filter students based on selected batch and date
    const studentsInBatch = students.filter(student => student.batch === selectedAttendanceBatch);
    setAttendanceStudents(studentsInBatch);
    setShowAttendanceList(true); // Show the attendance list
  };

  // Function to mark attendance
  const markAttendance = (studentId, status) => {
    console.log(`Student ID: ${studentId}, Attendance: ${status}`);
    // Implement logic to save attendance status (e.g., update state, send to server, etc.)
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 min-h-screen bg-white shadow-lg p-4 space-y-2">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Career Sure Academy
          </h1>
        </div>

        {/* Students Section */}
        <div className="space-y-1">
          <button
            onClick={() => setExpandedMenu(expandedMenu === 'students' ? '' : 'students')}
            className={`${sidebarButtonStyle} flex items-center justify-between w-full ${currentView.startsWith('students') ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'
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
              className={`${sidebarButtonStyle} text-sm ${currentView === 'students-view' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'
                }`}
            >
              View Students
            </button>

            <button
              onClick={() => {
                setCurrentView('students-add')
                setShowForm(true)
              }}
              className={`${sidebarButtonStyle} text-sm ${currentView === 'students-add' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'
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
            className={`${sidebarButtonStyle} flex items-center justify-between w-full ${currentView.startsWith('batches') ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'
              }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
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
              className={`${sidebarButtonStyle} text-sm ${currentView === 'batches-view' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'
                }`}
            >
              View Batches
            </button>

            <button
              onClick={() => {
                setCurrentView('batches-add')
                setShowBatchForm(true)
              }}
              className={`${sidebarButtonStyle} text-sm ${currentView === 'batches-add' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'
                }`}
            >
              Add Batch
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setExpandedMenu(expandedMenu === 'attendance' ? '' : 'attendance')}
            className={`${sidebarButtonStyle} flex items-center justify-between w-full ${currentView.startsWith('attendance') ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'
              }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
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
              className={`${sidebarButtonStyle} text-sm ${currentView === 'students-attendance' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'
                }`}
            >
              Students Attendance
            </button>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('mock')}
          className={`${sidebarButtonStyle} ${currentView === 'mock' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600'
            }`}
        >
          Mock Tests
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="h-full p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {currentView === 'students-view' && 'View Students'}
                {currentView === 'students-add' && 'Add New Student'}
                {currentView === 'attendance' && 'Attendance Management'}
                {currentView === 'mock' && 'Mock Tests'}
                {currentView === 'batches-view' && 'View Batches'}
                {currentView === 'batches-add' && 'Create New Batch'}
              </h2>
              <p className="text-sm">
                {currentView === 'students-view' && 'View and manage existing students'}
                {currentView === 'attendance' && 'Track and manage student attendance'}
                {currentView === 'mock' && 'Manage mock tests and scores'}
                {currentView === 'batches-view' && 'View and manage all batches'}
                {currentView === 'batches-add' && 'Create and configure new batch'}
              </p>
            </div>
            {currentView === 'batches-view' && (
              <button
                onClick={() => {
                  setCurrentView('batches-add')
                  setShowBatchForm(true)
                }}
                className={`${buttonStyle} bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 
                  shadow-md hover:shadow-xl flex items-center gap-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Batch
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="w-full">
            {currentView === 'students-view' && (
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                {/* Search and Filter Section */}
                <div className="mb-6 bg-white/80 backdrop-blur-sm backdrop-filter rounded-xl shadow-sm p-5 border border-gray-200/80">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="text"
                        placeholder="Search by name or roll number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={searchInputStyle}
                      />
                      <select
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        className={selectStyle}
                      >
                        <option value="">All Batches</option>
                        {[...new Set(students.map(s => s.batch))]
                          .filter(Boolean)
                          .sort((a, b) => a - b)
                          .map(batchNum => (
                            <option key={batchNum} value={batchNum}>
                              Batch {batchNum} ({students.filter(s => s.batch?.toString() === batchNum?.toString()).length} students)
                            </option>
                          ))}
                      </select>
                    </div>
                    {selectedBatch ? (
                      <div className="px-4 py-2 bg-blue-50 rounded-lg text-blue-700 font-medium">
                        Showing {students.filter(s => s.batch?.toString() === selectedBatch).length} students from Batch {selectedBatch}
                      </div>
                    ) : (
                      <div className="px-4 py-2 bg-blue-50 rounded-lg text-blue-700 font-medium">
                        Showing all {students.length} students
                      </div>
                    )}
                  </div>
                </div>

                {/* Filtered Students Grid */}
                <div className="mb-6">
                  <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-6 rounded-xl border border-blue-100/50 backdrop-blur-sm backdrop-filter">
                    <h3 className="text-lg font-medium text-blue-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {selectedBatch ? `Batch ${selectedBatch} Students` : 'All Students'}
                    </h3>
                    <div className="space-y-4">
                      {students
                        .filter(student => {
                          const searchLower = searchTerm.toLowerCase();
                          const matchesSearch = !searchTerm ||
                            student.name?.toLowerCase().includes(searchLower) ||
                            student.rollNumber?.toLowerCase().includes(searchLower);
                          const matchesBatch = !selectedBatch || student.batch?.toString() === selectedBatch;
                          return matchesSearch && matchesBatch;
                        })
                        .map(student => (
                          <div
                            key={student.id}
                            onClick={() => handleCardClick(student)}
                            className={`${cardHoverStyle} bg-white p-4 rounded-xl border border-gray-200/80 flex items-center gap-4 cursor-pointer`}
                          >
                            {/* Student Image */}
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 ring-2 ring-offset-2 ring-transparent group-hover:ring-blue-500 transition-all duration-300">
                              {student.imageUrl ? (
                                <img
                                  src={student.imageUrl}
                                  alt={student.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Student Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-lg font-semibold text-gray-900 truncate">{student.name}</h4>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                                  Batch {student.batch}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  Roll No: {student.rollNumber}
                                </span>
                                {student.email && (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {student.email}
                                  </span>
                                )}
                                {student.contactNumber && (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {student.contactNumber}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingStudent(student);
                                  setNewStudent(student);
                                  setCurrentView('students-add');
                                  setShowForm(true);
                                }}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors duration-300"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStudent(student.id);
                                }}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-300"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}

                      {/* No Results Message */}
                      {students.filter(student => {
                        const searchLower = searchTerm.toLowerCase();
                        const matchesSearch = !searchTerm ||
                          student.name?.toLowerCase().includes(searchLower) ||
                          student.rollNumber?.toLowerCase().includes(searchLower);
                        const matchesBatch = !selectedBatch || student.batch?.toString() === selectedBatch;
                        return matchesSearch && matchesBatch;
                      }).length === 0 && (
                          <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
                            <div className="bg-gray-50 rounded-full p-4 mb-4">
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
                            <p className="text-gray-500 text-center max-w-sm">
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
                  </div>
                </div>
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
                          : 'border-gray-300 group-hover:border-blue-300 bg-gray-50'}
                      `}>
                        {newStudent.imageUrl ? (
                          <img
                            src={newStudent.imageUrl}
                            alt="Student"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2 group-hover:text-blue-400 transition-colors duration-300"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <p className="text-sm text-gray-500 group-hover:text-blue-500 transition-colors duration-300">
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
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                            focus:border-blue-400 transition-colors duration-200"
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
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                            focus:border-blue-400 transition-colors duration-200"
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
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                            focus:border-blue-400 transition-colors duration-200 bg-white"
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
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                            focus:border-blue-400 transition-colors duration-200 bg-white"
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
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                            focus:border-blue-400 transition-colors duration-200"
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
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                            focus:border-blue-400 transition-colors duration-200"
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
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg
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
                          attendance: { scrum: [], class: [] },
                          mockScores: []
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
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                            focus:border-blue-400 transition-colors duration-200"
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
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                            focus:border-blue-400 transition-colors duration-200"
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
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                                focus:border-blue-400 transition-colors duration-200"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">End Time</label>
                            <input
                              type="time"
                              value={newBatch.endTime}
                              onChange={(e) => setNewBatch({ ...newBatch, endTime: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                                focus:border-blue-400 transition-colors duration-200"
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
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
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
              <div className="space-y-6">
                {/* Batches Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {batches.map(batch => {
                    const batchStudents = students.filter(
                      student => student.batch?.toString() === batch.name?.toString()
                    );

                    return (
                      <div
                        key={batch.id}
                        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 
                          border border-gray-100 overflow-hidden"
                      >
                        {/* Batch Header */}
                        <div className="p-6 border-b border-gray-50">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-800">
                                Batch {batch.name}
                              </h3>
                              <p className="text-gray-500 mt-1">
                                {formatTime(batch.startTime)} - {formatTime(batch.endTime)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                                {batchStudents.length} Students
                              </span>
                            </div>
                          </div>

                          {/* Trainer Info */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Trainer</p>
                              <p className="font-medium text-gray-800">{batch.trainer}</p>
                            </div>
                          </div>

                          {/* Schedule Days */}
                          <div className="flex flex-wrap gap-2">
                            {batch.daysOfWeek.map(day => (
                              <span
                                key={day}
                                className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-sm 
                                  border border-gray-100 hover:border-blue-100 hover:bg-blue-50 
                                  hover:text-blue-600 transition-all duration-300"
                              >
                                {day.slice(0, 3)}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* View Students button */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                          <button
                            onClick={() => setSelectedBatchDetails(batch)}
                            className="w-full py-2 px-4 bg-white text-blue-600 rounded-lg border border-blue-100
                              hover:bg-blue-50 hover:border-blue-200 transition-all duration-300 flex items-center 
                              justify-center gap-2 group/btn"
                          >
                            <span>View Students</span>
                            <svg
                              className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform duration-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty State */}
                  {batches.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 bg-white 
                      rounded-xl border border-gray-100">
                      <div className="bg-gray-50 rounded-full p-4 mb-4">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No batches found</h3>
                      <p className="text-gray-500 text-center max-w-sm mb-4">
                        Get started by creating your first batch
                      </p>
                      <button
                        onClick={() => {
                          setCurrentView('batches-add');
                          setShowBatchForm(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                        transition-colors duration-300"
                      >
                        Create New Batch
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}





            {currentView === 'students-attendance' && (< div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Attendance Management</h2>

              {/* Date Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                    focus:border-blue-400 transition-colors duration-200"
                />
              </div>

              {/* Batch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Batch</label>
                <select
                  value={selectedAttendanceBatch}
                  onChange={(e) => setSelectedAttendanceBatch(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 
                    focus:border-blue-400 transition-colors duration-200 bg-white"
                >
                  <option value="">Select a batch</option>
                  {batches.map(batch => (
                    <option key={batch.id} value={batch.name}>
                      Batch {batch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleAttendanceSubmit}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                Submit
              </button>
            </div>)}

            {/* Show attendance list if available */}
            {showAttendanceList && (
              <div className="mt-6 bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceStudents.map(student => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex space-x-4">
                            <button
                              onClick={() => {
                                // Handle marking as present
                                console.log(`Student: ${student.name}, Attendance: Present`);
                              }}
                              className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 transition-colors duration-300"
                            >
                              Present
                            </button>
                            <button
                              onClick={() => {
                                // Handle marking as absent
                                console.log(`Student: ${student.name}, Attendance: Absent`);
                              }}
                              className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition-colors duration-300"
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
        selectedBatchDetails && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-800">
                      Batch {selectedBatchDetails.name} Students
                    </h2>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                      {students.filter(s => s.batch?.toString() === selectedBatchDetails.name?.toString()).length} Students
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedBatchDetails(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Students List */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-4">
                  {students
                    .filter(student => student.batch?.toString() === selectedBatchDetails.name?.toString())
                    .map(student => (
                      <div
                        key={student.id}
                        className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Student Image */}
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
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
                            <div>
                              <h4 className="font-medium text-gray-900">{student.name}</h4>
                              <p className="text-sm text-gray-600">Roll No: {student.rollNumber}</p>
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="flex items-center gap-6">
                            {student.email && (
                              <a
                                href={`mailto:${student.email}`}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                                {student.email}
                              </a>
                            )}
                            {student.contactNumber && (
                              <a
                                href={`tel:${student.contactNumber}`}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                  />
                                </svg>
                                {student.contactNumber}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* Empty State */}
                  {students.filter(s => s.batch?.toString() === selectedBatchDetails.name?.toString()).length === 0 && (
                    <div className="text-center py-8">
                      <div className="bg-gray-50 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-gray-500 font-medium">No students enrolled</h3>
                      <p className="text-gray-400 text-sm mt-1">This batch doesn't have any students yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}

export default App