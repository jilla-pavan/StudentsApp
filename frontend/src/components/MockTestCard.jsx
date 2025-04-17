import React from 'react';
import PropTypes from 'prop-types';
import { FiEdit2, FiTrash2, FiClock, FiUsers, FiCheckCircle, FiAward } from 'react-icons/fi';

const MockTestCard = ({ test, onSelect, isSelected, onEdit, onDelete, onAssignScores }) => {
  const isUpcoming = new Date(test.date) > new Date();
  const formattedDate = new Date(test.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div 
      className={`relative bg-white rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
        isSelected ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-200'
      }`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isUpcoming 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {isUpcoming ? 'Upcoming' : 'Completed'}
              </span>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center text-gray-600">
                <FiClock className="w-4 h-4 mr-2" />
                <span className="text-sm">{formattedDate}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <FiUsers className="w-4 h-4 mr-2" />
                <span className="text-sm">{test.batches?.length || 0} Batches</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <FiCheckCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Passing Marks: {test.passingMarks}/{test.totalMarks}</span>
              </div>
            </div>

            {test.description && (
              <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                {test.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {!isUpcoming && (
              <button
                onClick={() => onAssignScores(test)}
                className="p-2 text-gray-500 hover:text-purple-600 transition-colors rounded-lg hover:bg-purple-50"
                title="Assign Scores"
              >
                <FiAward className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => onEdit(test)}
              className="p-2 text-gray-500 hover:text-purple-600 transition-colors rounded-lg hover:bg-purple-50"
              title="Edit Test"
            >
              <FiEdit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(test.id)}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
              title="Delete Test"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(test.id)}
              className="form-checkbox h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-gray-600">Select for bulk action</span>
          </label>
          
          <div className="text-sm text-gray-500">
            Duration: {test.duration} minutes
          </div>
        </div>
      </div>
    </div>
  );
};

MockTestCard.propTypes = {
  test: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    duration: PropTypes.number.isRequired,
    totalMarks: PropTypes.number.isRequired,
    passingMarks: PropTypes.number.isRequired,
    batches: PropTypes.arrayOf(PropTypes.string),
    description: PropTypes.string,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAssignScores: PropTypes.func.isRequired
};

export default MockTestCard; 