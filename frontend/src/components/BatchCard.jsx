import React from 'react';
import PropTypes from 'prop-types';
import { FiEdit2, FiTrash2, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const BatchCard = ({ batch, onEdit, onDelete, studentsCount = 0 }) => {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    navigate(`/batch/${batch.id}/students`);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border-2 border-gray-100 hover:border-purple-100 cursor-pointer overflow-hidden"
      onClick={handleCardClick}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              Active
            </span>
            <h3 className="text-base font-semibold text-gray-800">
              {batch.name}
            </h3>
          </div>
          <div className="flex space-x-1.5">
            <button
              onClick={() => onEdit(batch)}
              className="p-1.5 text-gray-500 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-all duration-200 border border-transparent hover:border-blue-100"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(batch.id)}
              className="p-1.5 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-all duration-200 border border-transparent hover:border-red-100"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-700 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">
              <FiUsers className="w-4 h-4 mr-1.5 text-blue-600" />
              <span className="text-sm font-medium">{studentsCount} Students</span>
            </div>
            <div className="text-sm text-gray-700 font-medium bg-purple-50 px-3 py-1.5 rounded-md text-purple-700 border border-purple-100">
              {batch.timing || '09:00 - 11:00'}
            </div>
          </div>

          <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
            Started on <span className="font-medium text-gray-800">{new Date(batch.startDate).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(batch.schedule || ['Monday', 'Wednesday', 'Friday', 'Tuesday', 'Thursday', 'Saturday']).map((day) => (
              <span
                key={day}
                className="px-2 py-1 text-xs font-medium rounded-md bg-gray-50 text-gray-700 border border-gray-200"
              >
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

BatchCard.propTypes = {
  batch: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    startDate: PropTypes.string.isRequired,
    timing: PropTypes.string,
    schedule: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  studentsCount: PropTypes.number
};

export default BatchCard;