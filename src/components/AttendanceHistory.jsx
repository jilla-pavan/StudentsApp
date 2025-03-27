import React from 'react';
import PropTypes from 'prop-types';
import { FiCalendar, FiCheck, FiX } from 'react-icons/fi';

const AttendanceHistory = ({ student, attendance, onClose }) => {
  const months = Array.from(new Set(attendance.map(a => 
    new Date(a.date).toLocaleString('default', { month: 'long', year: 'numeric' })
  )));

  const getMonthAttendance = (month) => {
    return attendance.filter(a => 
      new Date(a.date).toLocaleString('default', { month: 'long', year: 'numeric' }) === month
    );
  };

  const calculateAttendancePercentage = (monthAttendance) => {
    const present = monthAttendance.filter(a => a.present).length;
    return Math.round((present / monthAttendance.length) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              {student.firstName?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {student.firstName} {student.lastName}
              </h2>
              <p className="text-sm text-gray-500">Roll Number: {student.rollNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {months.map(month => {
          const monthAttendance = getMonthAttendance(month);
          const percentage = calculateAttendancePercentage(monthAttendance);
          
          return (
            <div key={month} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{month}</h3>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    percentage >= 75 ? 'bg-green-100 text-green-800' :
                    percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {percentage}% Attendance
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthAttendance.map(day => (
                  <div
                    key={day.date}
                    className={`p-3 rounded-lg border ${
                      day.present 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="text-xs text-gray-500">
                      {new Date(day.date).getDate()}
                    </div>
                    {day.present ? (
                      <FiCheck className="w-4 h-4 text-green-600" />
                    ) : (
                      <FiX className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

AttendanceHistory.propTypes = {
  student: PropTypes.shape({
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string,
    rollNumber: PropTypes.string,
  }).isRequired,
  attendance: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.string.isRequired,
    present: PropTypes.bool.isRequired,
  })).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AttendanceHistory; 