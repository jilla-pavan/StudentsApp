import React, { useState, useEffect } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiCheck, FiX } from 'react-icons/fi';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Attendance Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Mark and manage student attendance</p>
        </div>
        {selectedBatch && (
          <div className="bg-blue-50 px-3 py-2 rounded-md border border-blue-100">
            <p className="text-xs font-medium text-blue-700">
              Total Present: {studentsData
                .filter(student => student.batchId === selectedBatch && student.attendance?.[selectedDate]?.present)
                .length
              } / {filteredStudents.length}
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Select Date
          </label>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() - 1);
                handleDateChange(date.toISOString().split('T')[0]);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-md text-center text-sm focus:ring-1 focus:ring-purple-100 focus:border-purple-300 transition-all"
              disabled={loading || !selectedBatch}
            />
            <button 
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() + 1);
                const today = new Date();
                if (date <= today) {
                  handleDateChange(date.toISOString().split('T')[0]);
                }
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !selectedBatch || new Date(selectedDate) >= new Date()}
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
          {selectedBatchStartDate && (
            <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block">
              Batch started on {new Date(selectedBatchStartDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Select Batch
          </label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-purple-100 focus:border-purple-300 transition-all"
            disabled={loading}
          >
            <option value="">All Batches</option>
            {batches.map(batch => (
              <option key={batch.id} value={batch.id}>{batch.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">
            Attendance Sheet - {batches.find(b => b.id === selectedBatch)?.name || 'All Batches'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mark Attendance</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No students found for the selected batch
                </td>
              </tr>
            ) : (
              filteredStudents.map(student => {
                const isPresent = getAttendanceStatus(student);
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                          {student.firstName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">{student.firstName}</div>
                          <div className="text-xs text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {student.rollNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkAttendance(student, true)}
                          disabled={loading}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors`}
                        >
                          <span className="flex items-center gap-1">
                            <FiCheck className="w-4 h-4" />
                            Present
                          </span>
                        </button>
                        <button
                          onClick={() => handleMarkAttendance(student, false)}
                          disabled={loading}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors`}
                        >
                          <span className="flex items-center gap-1">
                            <FiX className="w-4 h-4" />
                            Absent
                          </span>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`${
                        isPresent === undefined
                          ? 'text-gray-500'
                          : isPresent
                          ? 'text-green-600'
                          : 'text-red-600'
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