import { useState } from 'react'
import './App.css'

// Add these styles at the top of the component
const cardStyle = "transition-all duration-300 hover:shadow-lg"
const buttonStyle = "transition-all duration-300 transform hover:scale-105"
const tableHeaderStyle = "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"

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

  // Add batch management
  const [batches, setBatches] = useState([
    { id: 1, name: 'Morning Batch', timing: '9:00 AM - 12:00 PM' },
    { id: 2, name: 'Afternoon Batch', timing: '2:00 PM - 5:00 PM' },
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

  const [newStudent, setNewStudent] = useState({
    name: '',
    rollNumber: '',
    batchId: batches[0].id, // Set default batch
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

  // Update attendance tracking functions
  const toggleAttendance = (studentId) => {
    setStudents(students.map(student => {
      if (student.id === studentId) {
        const newAttendance = !getAttendanceForDate(student, selectedDate, attendanceType)
        return {
          ...student,
          attendance: {
            ...student.attendance,
            [attendanceType]: [
              ...(student.attendance[attendanceType] || []).filter(
                record => record.date !== selectedDate
              ),
              { date: selectedDate, present: newAttendance }
            ].sort((a, b) => new Date(b.date) - new Date(a.date))
          }
        }
      }
      return student
    }))
  }

  const updateMockScore = (studentId, newScore) => {
    const today = getTodayDate()

    setStudents(students.map(student => {
      if (student.id === studentId) {
        const parsedScore = parseInt(newScore)
        return {
          ...student,
          mockScores: student.mockScores.map(score =>
            score.mockId === selectedMock ? { ...score, score: parsedScore } : score
          ),
          attendanceHistory: [
            ...(student.attendanceHistory || []).filter(
              record => record.date !== today
            ),
            { date: today, present: parsedScore > 0 }
          ].sort((a, b) => new Date(b.date) - new Date(a.date))
        }
      }
      return student
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (selectedStudent) {
      // Update existing student
      setStudents(students.map(student =>
        student.id === selectedStudent.id
          ? { ...selectedStudent, ...newStudent }
          : student
      ))
    } else {
      // Add new student
      setStudents([
        ...students,
        {
          id: Date.now(),
          ...newStudent
        }
      ])
    }

    // Reset form
    setNewStudent({
      name: '',
      rollNumber: '',
      batchId: batches[0].id,
      attendance: {
        scrum: [],
        class: []
      },
      mockScores: []
    })
    setSelectedStudent(null)
    setShowForm(false)
  }

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

  // Add function to delete student
  const handleDeleteStudent = (studentId) => {
    if (confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(student => student.id !== studentId))
    }
  }

  // Add function to get unique classes
  const getUniqueClasses = () => {
    const classes = new Set(students.map(student => student.class))
    return ['all', ...Array.from(classes)]
  }

  // Add function to filter students
  const getFilteredStudents = () => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
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
  const [selectedBatch, setSelectedBatch] = useState(batches[0].id)

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with View Toggle */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2 font-sans">
              Career Sure Academy
            </h1>
            <p className="text-gray-600">Manage your students' attendance and performance</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white rounded-lg shadow-md p-1">
              <button
                onClick={() => setCurrentView('students')}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${currentView === 'students'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Students
              </button>
              <button
                onClick={() => setCurrentView('attendance')}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${currentView === 'attendance'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Attendance
              </button>
              <button
                onClick={() => setCurrentView('mock')}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${currentView === 'mock'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                Mock Tests
              </button>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`${buttonStyle} bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 
                shadow-md hover:shadow-xl flex items-center gap-2`}
            >
              {showForm ? 'Cancel' : 'Add Student'}
            </button>
          </div>
        </div>

        {/* Batch Selection */}
        <div className={`${cardStyle} bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100`}>
          <div className="flex items-center justify-between">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg"
            >
              {batches.map(batch => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} ({batch.timing})
                </option>
              ))}
            </select>
            {currentView === 'attendance' && (
              <select
                value={attendanceType}
                onChange={(e) => setAttendanceType(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg"
              >
                <option value="scrum">Scrum Call</option>
                <option value="class">Class</option>
              </select>
            )}
          </div>
        </div>

        {/* Student Form */}
        {showForm && (
          <div className={`${cardStyle} bg-white rounded-xl shadow-md p-8 mb-8 border border-gray-100`}>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 
                      focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    value={newStudent.rollNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 
                      focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch *
                  </label>
                  <select
                    value={newStudent.batchId}
                    onChange={(e) => setNewStudent({ ...newStudent, batchId: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 
                      focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    required
                  >
                    {batches.map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name} ({batch.timing})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={newStudent.contactNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, contactNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 
                      focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 
                      focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Contact
                  </label>
                  <input
                    type="tel"
                    value={newStudent.parentContact}
                    onChange={(e) => setNewStudent({ ...newStudent, parentContact: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 
                      focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={newStudent.address}
                  onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 
                    focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  rows="3"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className={`${buttonStyle} flex-1 bg-green-600 text-white px-6 py-3 rounded-lg 
                    hover:bg-green-700 shadow-md hover:shadow-xl`}
                >
                  {editingStudent ? 'Update Student' : 'Add Student'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingStudent(null)
                    setNewStudent({
                      name: '',
                      rollNumber: '',
                      batchId: batches[0].id,
                      attendance: {
                        scrum: [],
                        class: []
                      },
                      mockScores: []
                    })
                  }}
                  className={`${buttonStyle} px-6 py-3 rounded-lg border border-gray-200 
                    hover:bg-gray-50 shadow-md hover:shadow-xl`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Students View */}
        {currentView === 'students' && (
          <>
            {/* Search and Filter */}
            <div className={`${cardStyle} bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <input
                    type="text"
                    placeholder="Search by name or roll number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg w-64"
                  />
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg"
                  >
                    {getUniqueClasses().map(cls => (
                      <option key={cls} value={cls}>
                        {cls === 'all' ? 'All Classes' : `Class ${cls}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className={`${cardStyle} bg-white rounded-xl shadow-md p-6 border border-gray-100`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 rounded-lg">
                      <th className={tableHeaderStyle}>Roll No.</th>
                      <th className={tableHeaderStyle}>Name</th>
                      <th className={tableHeaderStyle}>Class</th>
                      <th className={tableHeaderStyle}>Section</th>
                      <th className={tableHeaderStyle}>Contact</th>
                      <th className={tableHeaderStyle}>Parent Info</th>
                      <th className={tableHeaderStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {getFilteredStudents().map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-4 py-4 font-medium">{student.rollNumber}</td>
                        <td className="px-4 py-4">{student.name}</td>
                        <td className="px-4 py-4">Class {student.class}</td>
                        <td className="px-4 py-4">{student.section}</td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <div>{student.contactNumber}</div>
                            <div className="text-gray-500">{student.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <div>{student.parentName}</div>
                            <div className="text-gray-500">{student.parentContact}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewStudentReport(student)}
                              className={`${buttonStyle} text-blue-600 hover:text-blue-800 px-3 py-1 
                                rounded-lg border border-blue-200 hover:bg-blue-50`}
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditStudent(student)}
                              className={`${buttonStyle} text-green-600 hover:text-green-800 px-3 py-1 
                                rounded-lg border border-green-200 hover:bg-green-50`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className={`${buttonStyle} text-red-600 hover:text-red-800 px-3 py-1 
                                rounded-lg border border-red-200 hover:bg-red-50`}
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

            {/* Student Details Modal */}
            {selectedStudent && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">
                        Student Report: {selectedStudent.name}
                      </h2>
                      <button
                        onClick={() => setSelectedStudent(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Student Info */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-2">Basic Info</h3>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-gray-500">Roll Number:</span> {selectedStudent.rollNumber}</p>
                          <p><span className="text-gray-500">Class:</span> {selectedStudent.class}</p>
                        </div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-medium text-blue-700 mb-2">Test Performance</h3>
                        <p className="text-2xl font-bold text-blue-600">
                          {calculateAverageScore(selectedStudent.mockScores)}%
                        </p>
                        <p className="text-sm text-blue-600">Average Score</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="font-medium text-green-700 mb-2">Attendance</h3>
                        <p className="text-2xl font-bold text-green-600">
                          {calculateAttendancePercentage(selectedStudent.attendance, 'class')}%
                        </p>
                        <p className="text-sm text-green-600">Class Attendance</p>
                      </div>
                    </div>

                    {/* Mock Test History */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Mock Test History</h3>
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Test</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Score</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Performance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {getFormattedMockHistory(selectedStudent).map((score, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2">{score.formattedDate}</td>
                                <td className="px-4 py-2">{score.testName}</td>
                                <td className="px-4 py-2">
                                  <div className="space-y-2">
                                    {getStudentMockScore(selectedStudent, score.mockId) === 'Absent' ? (
                                      <div>
                                        <span className="text-red-600 text-sm font-medium">Absent</span>
                                        <span className="text-xs text-gray-500 ml-2">(0/{score.maxScore})</span>
                                      </div>
                                    ) : (
                                      <span className="font-medium">
                                        {getStudentMockScore(selectedStudent, score.mockId)}/{score.maxScore}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className={`px-2 py-1 rounded-full text-xs inline-block ${
                                    (getStudentMockScore(selectedStudent, score.mockId) / score.maxScore) >= 0.75
                                      ? 'bg-green-100 text-green-800'
                                      : (getStudentMockScore(selectedStudent, score.mockId) / score.maxScore) >= 0.5
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}>
                                    {((getStudentMockScore(selectedStudent, score.mockId) / score.maxScore) * 100).toFixed(1)}%
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Attendance History */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance History</h3>
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {getFormattedAttendanceHistory(selectedStudent).map((record, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2">{record.formattedDate}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    record.present
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {record.present ? 'Present' : 'Absent'}
                                  </span>
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
            )}
          </>
        )}

        {/* Attendance View */}
        {currentView === 'attendance' && (
          <>
            {/* Date Selection */}
            <div className={`${cardStyle} bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Select Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={getTodayDate()}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Date Range:</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    max={getTodayDate()}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    max={getTodayDate()}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Bulk Attendance Actions */}
            <div className={`${cardStyle} bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Bulk Attendance</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setAttendanceType('scrum')
                      markBulkAttendance(true)
                    }}
                    disabled={selectedStudents.length === 0}
                    className={`${buttonStyle} px-4 py-2 rounded-lg ${
                      selectedStudents.length === 0
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    Mark Scrum Present
                  </button>
                  <button
                    onClick={() => {
                      setAttendanceType('scrum')
                      markBulkAttendance(false)
                    }}
                    disabled={selectedStudents.length === 0}
                    className={`${buttonStyle} px-4 py-2 rounded-lg ${
                      selectedStudents.length === 0
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    Mark Scrum Absent
                  </button>
                  <button
                    onClick={() => {
                      setAttendanceType('class')
                      markBulkAttendance(true)
                    }}
                    disabled={selectedStudents.length === 0}
                    className={`${buttonStyle} px-4 py-2 rounded-lg ${
                      selectedStudents.length === 0
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    Mark Class Present
                  </button>
                  <button
                    onClick={() => {
                      setAttendanceType('class')
                      markBulkAttendance(false)
                    }}
                    disabled={selectedStudents.length === 0}
                    className={`${buttonStyle} px-4 py-2 rounded-lg ${
                      selectedStudents.length === 0
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    Mark Class Absent
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className={`${cardStyle} bg-white rounded-xl shadow-md p-6 border border-gray-100`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 rounded-lg">
                      <th className={tableHeaderStyle}>
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={selectedStudents.length === students.length}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                      </th>
                      <th className={tableHeaderStyle}>Name</th>
                      <th className={tableHeaderStyle}>Roll No.</th>
                      <th className={tableHeaderStyle}>Date</th>
                      <th className={tableHeaderStyle}>Scrum Call</th>
                      <th className={tableHeaderStyle}>Class</th>
                      <th className={tableHeaderStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-900">{student.name}</td>
                        <td className="px-4 py-4 text-gray-600">{student.rollNumber}</td>
                        <td className="px-4 py-4 text-gray-600">{formatDate(selectedDate)}</td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => {
                              setAttendanceType('scrum')
                              toggleAttendance(student.id)
                            }}
                            className={`${buttonStyle} px-4 py-2 rounded-full text-sm font-medium ${
                              getAttendanceForDate(student, selectedDate, 'scrum')
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {getAttendanceForDate(student, selectedDate, 'scrum') ? 'Present' : 'Absent'}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => {
                              setAttendanceType('class')
                              toggleAttendance(student.id)
                            }}
                            className={`${buttonStyle} px-4 py-2 rounded-full text-sm font-medium ${
                              getAttendanceForDate(student, selectedDate, 'class')
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {getAttendanceForDate(student, selectedDate, 'class') ? 'Present' : 'Absent'}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => viewStudentReport(student)}
                            className={`${buttonStyle} text-blue-600 hover:text-blue-800 px-4 py-2 
                              rounded-lg border border-blue-200 hover:bg-blue-50`}
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add a summary section below the table */}
            <div className="mt-6 grid grid-cols-3 gap-6">
              <div className={`${cardStyle} bg-white rounded-xl shadow-md p-6 border border-gray-100`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Attendance</h3>
                <div className="bg-green-50 p-6 rounded-lg">
                  <p className="text-4xl font-bold text-green-600">
                    {((students.filter(s => getAttendanceForDate(s, getTodayDate())).length / students.length) * 100).toFixed(1)}
                  </p>
                  <p className="text-sm text-green-800 mt-1">Present Today</p>
                </div>
              </div>
              <div className={`${cardStyle} bg-white rounded-xl shadow-md p-6 border border-gray-100`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Selected Range</h3>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <p className="text-4xl font-bold text-blue-600">
                    {(students.reduce((acc, student) => 
                      acc + parseFloat(calculateAttendanceForRange(student.attendanceHistory, dateRange.start, dateRange.end)), 0
                    ) / students.length).toFixed(1)}%
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    Average ({formatDate(dateRange.start)} - {formatDate(dateRange.end)})
                  </p>
                </div>
              </div>
              <div className={`${cardStyle} bg-white rounded-xl shadow-md p-6 border border-gray-100`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Attendance</h3>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <p className="text-4xl font-bold text-purple-600">
                    {(students.reduce((acc, student) => 
                      acc + parseFloat(calculateAttendancePercentage(student.attendance, 'class')), 0
                    ) / students.length).toFixed(1)}%
                  </p>
                  <p className="text-sm text-purple-800 mt-1">All Time Average</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mock Tests View */}
        {currentView === 'mock' && (
          <>
            {/* Mock Test Management */}
            <div className={`${cardStyle} bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Mock Test Management</h3>
                <button
                  onClick={() => setShowMockForm(!showMockForm)}
                  className={`${buttonStyle} bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700`}
                >
                  {showMockForm ? 'Cancel' : 'Add Mock Test'}
                </button>
              </div>

              {/* Mock Test Management Feedback */}
              {feedback.message && (
                <div className={`mb-4 p-3 rounded-lg ${
                  feedback.type === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {feedback.message}
                </div>
              )}

              {showMockForm && (
                <form onSubmit={(e) => {
                  e.preventDefault()
                  try {
                    if (validateMockTest()) {
                      handleMockSubmit(e)
                      setFeedback({ 
                        message: `Test ${editingMock ? 'updated' : 'added'} successfully!`, 
                        type: 'success' 
                      })
                      setTimeout(() => setFeedback({ message: '', type: '' }), 3000)
                    }
                  } catch (error) {
                    setFeedback({ 
                      message: 'An error occurred. Please try again.', 
                      type: 'error' 
                    })
                  }
                }} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Test Name *
                      </label>
                      <input
                        type="text"
                        value={newMock.name}
                        onChange={(e) => setNewMock({ ...newMock, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Score *
                      </label>
                      <input
                        type="number"
                        value={newMock.maxScore}
                        onChange={(e) => setNewMock({ ...newMock, maxScore: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Test Date *
                      </label>
                      <input
                        type="date"
                        value={newMock.date}
                        onChange={(e) => setNewMock({ ...newMock, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        min={getTodayDate()}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className={`${buttonStyle} bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700`}
                    >
                      {editingMock ? 'Update Test' : 'Add Test'}
                    </button>
                  </div>
                </form>
              )}

              {/* Mock Tests List */}
              <div className="mt-4">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={tableHeaderStyle}>Test Name</th>
                      <th className={tableHeaderStyle}>Max Score</th>
                      <th className={tableHeaderStyle}>Date</th>
                      <th className={tableHeaderStyle}>Status</th>
                      <th className={tableHeaderStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mockTests.map(test => (
                      <tr key={test.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{test.name}</td>
                        <td className="px-4 py-3">{test.maxScore}</td>
                        <td className="px-4 py-3">{formatDate(test.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            test.date === getTodayDate()
                              ? 'bg-green-100 text-green-800'
                              : test.date < getTodayDate()
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {getMockTestStatus(test)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditMock(test)}
                              className={`${buttonStyle} text-blue-600 hover:text-blue-800 px-3 py-1 
                                rounded-lg border border-blue-200 hover:bg-blue-50`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMock(test.id)}
                              className={`${buttonStyle} text-red-600 hover:text-red-800 px-3 py-1 
                                rounded-lg border border-red-200 hover:bg-red-50`}
                              disabled={test.date < getTodayDate()}
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

            {/* Test Schedule Overview */}
            <div className={`${cardStyle} bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100`}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Tests</h3>
              <div className="grid grid-cols-4 gap-4">
                {mockTests
                  .filter(test => new Date(test.date) >= new Date(getTodayDate()))
                  .map(test => (
                    <div
                      key={test.id}
                      className={`p-4 rounded-lg ${test.date === getTodayDate()
                          ? 'bg-blue-50 border-2 border-blue-200'
                          : 'bg-gray-50'
                        }`}
                    >
                      <h4 className="font-medium text-gray-800">{test.name}</h4>
                      <p className="text-sm text-gray-600">{formatDate(test.date)}</p>
                      <p className="text-sm text-gray-600">Max Score: {test.maxScore}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Bulk Mock Score Actions */}
            <div className={`${cardStyle} bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Bulk Score Update</h3>
                <div className="flex items-center gap-4">
                  <select
                    value={selectedMock}
                    onChange={(e) => setSelectedMock(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    {mockTests
                      .filter(test => test.date === getTodayDate())
                      .map(test => (
                        <option key={test.id} value={test.id}>
                          {test.name} (Max: {test.maxScore})
                        </option>
                      ))}
                  </select>
                  {mockTests.find(t => t.id === selectedMock)?.date === getTodayDate() ? (
                    <>
                      <input
                        type="number"
                        value={bulkMockScore}
                        onChange={(e) => setBulkMockScore(e.target.value)}
                        placeholder="Enter score"
                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg"
                        min="0"
                        max={mockTests.find(t => t.id === selectedMock).maxScore}
                      />
                      <button
                        onClick={updateBulkMockScore}
                        disabled={selectedStudents.length === 0 || !bulkMockScore}
                        className={`${buttonStyle} px-4 py-2 rounded-lg ${selectedStudents.length === 0 || !bulkMockScore
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                      >
                        Update Scores
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-500">No tests scheduled for today</span>
                  )}
                </div>
              </div>
            </div>

            {/* Mock Tests Table */}
            <div className={`${cardStyle} bg-white rounded-xl shadow-md p-6 border border-gray-100`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 rounded-lg">
                      <th className={tableHeaderStyle}>
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={selectedStudents.length === students.length}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                      </th>
                      <th className={tableHeaderStyle}>Name</th>
                      {mockTests.map(test => (
                        <th key={test.id} className={tableHeaderStyle}>
                          {test.name}
                          <div className="text-xs font-normal mt-1">
                            {getMockTestStatus(test)}
                          </div>
                        </th>
                      ))}
                      <th className={tableHeaderStyle}>Average</th>
                      <th className={tableHeaderStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-900">{student.name}</td>
                        {mockTests.map(test => (
                          <td key={test.id} className="px-4 py-4">
                            <div className="space-y-2">
                              {getStudentMockScore(student, test.id) === 'Absent' ? (
                                <div>
                                  <span className="text-red-600 text-sm font-medium">Absent</span>
                                  <span className="text-xs text-gray-500 ml-2">(0/{test.maxScore})</span>
                                </div>
                              ) : (
                                <span className="font-medium">
                                  {getStudentMockScore(student, test.id)}/{test.maxScore}
                                </span>
                              )}
                            </div>
                          </td>
                        ))}
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-medium">{calculateAverageScore(student.mockScores)}%</div>
                            <div className="text-xs text-gray-500">
                              {student.mockScores.filter(score => score.absent).length} absents
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditStudent(student)}
                              className={`${buttonStyle} text-blue-600 hover:text-blue-800 px-4 py-2 
                                rounded-lg border border-blue-200 hover:bg-blue-50`}
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App