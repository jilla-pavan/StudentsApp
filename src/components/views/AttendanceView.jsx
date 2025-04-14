import React, { useState, useEffect } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiCheck, FiX, FiUsers, FiFilter } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const AttendanceView = ({ students, batches, onMarkAttendance }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentsData, setStudentsData] = useState([]);

  // Get the batch start date - moved to top level
  const selectedBatchStartDate = selectedBatch ? 
    batches.find(b => b.id === selectedBatch)?.startDate : 
    null;

  // Subscribe to students updates
  useEffect(() => {
    const q = selectedBatch ? 
      query(
        collection(db, 'students'),
        where('batchId', '==', selectedBatch)
      ) :
      query(collection(db, 'students')); // Remove the filter when no batch is selected

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newStudentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudentsData(newStudentsData);
    }, (error) => {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch student data');
    });

    return () => unsubscribe();
  }, [selectedBatch]);

  const filteredStudents = studentsData;

  const getAttendanceStatus = (student) => {
    return student.attendance?.[selectedDate]?.present;
  };

  // Verify student exists before marking attendance
  const handleMarkAttendance = async (student, present) => {
    if (!student || !student.id) {
      toast.error('Invalid student data');
      return;
    }

    if (loading) return; // Prevent multiple submissions
    setLoading(true);
    
    try {
      const studentRef = doc(db, 'students', student.id);
      await updateDoc(studentRef, {
        [`attendance.${selectedDate}`]: {
          present,
          timestamp: new Date().toISOString()
        }
      });
      // The snapshot listener will automatically update the UI
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(error.message || 'Failed to mark attendance');
      
      if (error.message.includes('Student not found')) {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  // Update selected date when batch changes
  useEffect(() => {
    if (selectedBatch) {
      const batch = batches.find(b => b.id === selectedBatch);
      if (batch?.startDate) {
        const startDate = new Date(batch.startDate);
        const today = new Date();
        // Set selected date to start date if current selection is before start date
        if (new Date(selectedDate) < startDate) {
          setSelectedDate(batch.startDate);
        }
      }
    }
  }, [selectedBatch, batches, selectedDate]);

  // Handle date change with validation
  const handleDateChange = (newDate) => {
    if (!selectedBatch) return;

    const batch = batches.find(b => b.id === selectedBatch);
    if (!batch?.startDate) return;

    const dateToCheck = new Date(newDate);
    const startDate = new Date(batch.startDate);
    const today = new Date();

    // Ensure date is between batch start date and today
    if (dateToCheck >= startDate && dateToCheck <= today) {
      setSelectedDate(newDate);
    } else if (dateToCheck < startDate) {
      setSelectedDate(batch.startDate);
      toast.error('Cannot select date before batch start date');
    } else if (dateToCheck > today) {
      setSelectedDate(today.toISOString().split('T')[0]);
      toast.error('Cannot select future dates');
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          {/* Title Section */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiUsers className="w-6 h-6 text-indigo-600" />
              Attendance
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage student attendance records
            </p>
          </div>

          {/* Stats Cards - Horizontal scroll on mobile */}
          {selectedBatch && (
            <div className="flex sm:grid sm:grid-cols-3 gap-3 overflow-x-auto pb-2 sm:pb-0 -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="bg-emerald-50 rounded-lg p-3 sm:p-4 min-w-[140px] sm:min-w-0">
                <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                  {studentsData.filter(s => s.batchId === selectedBatch && s.attendance?.[selectedDate]?.present).length}
                </div>
                <div className="text-sm text-emerald-700 font-medium">Present</div>
              </div>
              <div className="bg-rose-50 rounded-lg p-3 sm:p-4 min-w-[140px] sm:min-w-0">
                <div className="text-xl sm:text-2xl font-bold text-rose-600">
                  {studentsData.filter(s => s.batchId === selectedBatch && s.attendance?.[selectedDate]?.present === false).length}
                </div>
                <div className="text-sm text-rose-700 font-medium">Absent</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3 sm:p-4 min-w-[140px] sm:min-w-0">
                <div className="text-xl sm:text-2xl font-bold text-indigo-600">
                  {filteredStudents.length}
                </div>
                <div className="text-sm text-indigo-700 font-medium">Total</div>
              </div>
            </div>
          )}
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-0 sm:flex sm:gap-6">
            {/* Batch Selection - Move to top on mobile */}
            <div className="w-full sm:w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <div className="flex items-center gap-2">
                  <FiFilter className="w-4 h-4 text-gray-400" />
                  Select Batch
                </div>
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                disabled={loading}
              >
                <option value="">All Batches</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id}>{batch.name}</option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div className="w-full sm:w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <div className="flex items-center gap-2">
                  <FiCalendar className="w-4 h-4 text-gray-400" />
                  Select Date
                </div>
              </label>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() - 1);
                    handleDateChange(date.toISOString().split('T')[0]);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
                  disabled={loading || !selectedBatch || (selectedBatchStartDate && new Date(selectedDate) <= new Date(selectedBatchStartDate))}
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={selectedBatchStartDate || undefined}
                  max={new Date().toISOString().split('T')[0]}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                  disabled={loading || !selectedBatch}
                />
                <button 
                  onClick={() => {
                    const date = new Date(selectedDate);
                    date.setDate(date.getDate() + 1);
                    handleDateChange(date.toISOString().split('T')[0]);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
                  disabled={loading || !selectedBatch || new Date(selectedDate) >= new Date()}
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Table Card */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                {batches.find(b => b.id === selectedBatch)?.name || 'All Batches'}
              </h2>
              <div className="text-sm text-gray-500">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mark</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 sm:px-6 py-8 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <FiUsers className="w-6 h-6 text-gray-400" />
                        <p>No students found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => {
                    const isPresent = getAttendanceStatus(student);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600">
                              {student.name[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate">{student.name}</div>
                              <div className="text-xs text-gray-500 truncate">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">
                          {student.rollNumber}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleMarkAttendance(student, true)}
                              disabled={loading}
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                isPresent === true
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'hover:bg-emerald-50 text-gray-600 hover:text-emerald-600'
                              }`}
                            >
                              <FiCheck className="w-4 h-4 sm:mr-1.5" />
                              <span className="hidden sm:inline">Present</span>
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(student, false)}
                              disabled={loading}
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                isPresent === false
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'hover:bg-rose-50 text-gray-600 hover:text-rose-600'
                              }`}
                            >
                              <FiX className="w-4 h-4 sm:mr-1.5" />
                              <span className="hidden sm:inline">Absent</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                            isPresent === undefined
                              ? 'bg-gray-100 text-gray-600'
                              : isPresent
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {isPresent === undefined ? 'Not Marked' : isPresent ? 'Present' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

AttendanceView.propTypes = {
  students: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string,
    email: PropTypes.string,
    rollNumber: PropTypes.string,
    batchId: PropTypes.string,
    attendance: PropTypes.object
  })).isRequired,
  batches: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    startDate: PropTypes.string
  })).isRequired,
  onMarkAttendance: PropTypes.func.isRequired
};

export default AttendanceView;