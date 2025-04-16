import React from 'react';
import PropTypes from 'prop-types';
import { FiEdit2, FiTrash2, FiUser, FiMail, FiPhone, FiHash, FiDollarSign } from 'react-icons/fi';
import { BiMale, BiFemale } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';

const StudentCard = ({ student, onEdit, onDelete, onToggleFeeStatus }) => {
  const navigate = useNavigate();
  const fullName = student.name || 'No Name';

  const handleCardClick = (e) => {
    // Don't navigate if clicking on action buttons
    if (e.target.closest('button')) return;
    navigate(`/student/${student.id}`);
  };

  // Calculate attendance percentage
  const calculateAttendancePercentage = () => {
    if (!student.attendance || Object.keys(student.attendance).length === 0) return 0;
    const records = Object.values(student.attendance).filter(record => typeof record === 'object');
    const presentDays = records.filter(record => record.present).length;
    return Math.round((presentDays / records.length) * 100) || 0;
  };

  // Calculate mock attendance percentage
  const calculateMockAttendancePercentage = () => {
    if (!student.mockAttendance) return 0;
    let totalMockDays = 0;
    let presentMockDays = 0;

    Object.values(student.mockAttendance).forEach(levelAttendance => {
      if (Array.isArray(levelAttendance)) {
        levelAttendance.forEach(record => {
          totalMockDays++;
          if (record.status === 'present') {
            presentMockDays++;
          }
        });
      }
    });

    return totalMockDays > 0 ? Math.round((presentMockDays / totalMockDays) * 100) : 0;
  };

  // Calculate mock test score percentage
  const calculateMockTestPercentage = () => {
    if (!student.mockScores || !Array.isArray(student.mockScores) || student.mockScores.length === 0) {
      return 0;
    }
    const totalScore = student.mockScores.reduce((sum, score) => sum + score.score, 0);
    return Math.round((totalScore / (student.mockScores.length * 10)) * 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const regularAttendance = calculateAttendancePercentage();
  const mockAttendance = calculateMockAttendancePercentage();
  const mockTestScore = calculateMockTestPercentage();

  // Default to true if feePaid is undefined (for backward compatibility)
  const feePaid = student.feePaid !== undefined ? student.feePaid : true;

  return (
    <div
      className={`group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border-2 ${feePaid ? 'border-gray-100 hover:border-purple-100' : 'border-red-100 hover:border-red-200'
        } cursor-pointer relative`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e);
        }
      }}
    >
      {/* Fee Status Badge */}
      <div className={`absolute top-0 right-0 mt-2 mr-2 px-2 py-1 text-xs font-semibold rounded-full z-10 flex items-center gap-1
        ${feePaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        <FiDollarSign className="w-3 h-3" />
        {feePaid ? 'Fees Paid' : 'Fees Due'}
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${student.gender?.toLowerCase() === 'male' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  student.gender?.toLowerCase() === 'female' ? 'bg-pink-50 text-pink-600 border-pink-200' :
                    'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                {student.image ? (
                  <img src={student.image} alt={fullName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <FiUser className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                  {fullName}
                </h3>
                <div className="flex items-center mt-0.5 space-x-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1
                    ${student.gender?.toLowerCase() === 'male' ? 'bg-blue-50 text-blue-700' :
                      student.gender?.toLowerCase() === 'female' ? 'bg-pink-50 text-pink-700' :
                        'bg-gray-50 text-gray-700'}`}>
                    {student.gender?.toLowerCase() === 'male' ? <BiMale /> : <BiFemale />}
                    {student.gender || 'N/A'}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-50 text-purple-700">
                    Roll: {student.rollNumber || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2">
              <div className="flex items-center p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                <FiMail className="w-4 h-4 text-gray-500" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <p className="text-xs text-gray-800">{student.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                <FiPhone className="w-4 h-4 text-gray-500" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-500">Contact</p>
                  <p className="text-xs text-gray-800">{student.contactNumber || 'N/A'}</p>
                </div>
              </div>

              {/* Progress Bars Section */}
              <div className="space-y-2 mt-2">
                {/* Regular Attendance Progress */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Regular Attendance</span>
                  <span className="text-xs font-medium text-gray-700">{regularAttendance}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${getProgressColor(regularAttendance)} transition-all duration-300`}
                    style={{ width: `${regularAttendance}%` }}
                  />
                </div>

                {/* Mock Attendance Progress */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Mock Attendance</span>
                  <span className="text-xs font-medium text-gray-700">{mockAttendance}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${getProgressColor(mockAttendance)} transition-all duration-300`}
                    style={{ width: `${mockAttendance}%` }}
                  />
                </div>

                {/* Mock Test Score Progress */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Mock Test Score</span>
                  <span className="text-xs font-medium text-gray-700">{mockTestScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${getProgressColor(mockTestScore)} transition-all duration-300`}
                    style={{ width: `${mockTestScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2 opacity-70 sm:opacity-100 group-hover:opacity-100 transition-all duration-200">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(student);
          }}
          className="px-3 py-1.5 text-xs font-medium text-purple-700 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors flex items-center gap-1.5"
        >
          <FiEdit2 className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(student.id);
          }}
          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors flex items-center gap-1.5"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
};

StudentCard.propTypes = {
  student: PropTypes.shape({
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    contactNumber: PropTypes.string,
    rollNumber: PropTypes.string,
    batchId: PropTypes.string,
    gender: PropTypes.string,
    image: PropTypes.string,
    attendance: PropTypes.object,
    mockAttendance: PropTypes.object,
    mockScores: PropTypes.array,
    feePaid: PropTypes.bool
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleFeeStatus: PropTypes.func.isRequired
};

export default StudentCard;