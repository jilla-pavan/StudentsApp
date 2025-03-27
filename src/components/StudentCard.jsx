import React from 'react';
import PropTypes from 'prop-types';
import { FiEdit2, FiTrash2, FiUser, FiMail, FiPhone, FiHash } from 'react-icons/fi';
import { BiMale, BiFemale } from 'react-icons/bi';

const StudentCard = ({ student, onEdit, onDelete }) => {
  const fullName = student.name || 'No Name';
  
  return (
    <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-purple-100">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                student.gender?.toLowerCase() === 'male' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
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
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button
          onClick={() => onEdit(student)}
          className="px-3 py-1.5 text-xs font-medium text-purple-700 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors flex items-center gap-1.5"
        >
          <FiEdit2 className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={() => onDelete(student.id)}
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
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string,
    email: PropTypes.string,
    contactNumber: PropTypes.string.isRequired,
    rollNumber: PropTypes.string.isRequired,
    batchId: PropTypes.string.isRequired,
    gender: PropTypes.string.isRequired,
    image: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default StudentCard;