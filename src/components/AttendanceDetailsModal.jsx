import React, { useState } from 'react';
import PropTypes from 'prop-types';

const AttendanceDetailsModal = ({ student, onClose, onMarkAttendance }) => {
  const [activeTab, setActiveTab] = useState('weekly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

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

  const calculateStats = (records) => {
    const total = records.length;
    const present = records.filter(r => r.present).length;
    const percentage = total > 0 ? (present / total) * 100 : 0;

    return { total, present, absent: total - present, percentage };
  };

  const handleToggleAttendance = async (date, currentPresent) => {
    await onMarkAttendance(student.id, date, !currentPresent);
  };

  const filteredRecords = getFilteredRecords();
  const stats = calculateStats(filteredRecords);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-hidden shadow-xl">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 ring-4 ring-white">
                {student.image ? (
                  <img src={student.image} alt={student.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600 text-xl font-semibold">
                    {student.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                <p className="text-gray-500">Batch: {student.batch}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <button
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'weekly'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('weekly')}
            >
              Weekly
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'monthly'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'overall'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('overall')}
            >
              Overall
            </button>
          </div>

          {activeTab === 'monthly' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mb-4 px-4 py-2 border rounded-lg"
            />
          )}

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Classes</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Present</p>
              <p className="text-2xl font-bold text-green-900">{stats.present}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Absent</p>
              <p className="text-2xl font-bold text-red-900">{stats.absent}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Attendance %</p>
              <p className="text-2xl font-bold text-purple-900">{stats.percentage.toFixed(1)}%</p>
            </div>
          </div>

          <div className="overflow-auto max-h-[400px]">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map(record => (
                  <tr key={record.date}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.present
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {record.present ? 'Present' : 'Absent'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleToggleAttendance(record.date, record.present)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

AttendanceDetailsModal.propTypes = {
  student: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    batch: PropTypes.string.isRequired,
    image: PropTypes.string,
    attendance: PropTypes.shape({
      class: PropTypes.arrayOf(
        PropTypes.shape({
          date: PropTypes.string.isRequired,
          present: PropTypes.bool.isRequired,
        })
      ),
    }),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onMarkAttendance: PropTypes.func.isRequired,
};

export default AttendanceDetailsModal; 