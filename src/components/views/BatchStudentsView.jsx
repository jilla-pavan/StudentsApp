import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import StudentCard from '../StudentCard';

const BatchStudentsView = ({ students, batches, onEditStudent, onDeleteStudent }) => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  
  const batch = batches.find(b => b.id === batchId);
  const batchStudents = students.filter(student => student.batchId === batchId);

  if (!batch) {
    return (
      <div className="text-center py-8">
        <h2 className="text-lg font-semibold text-gray-900">Batch not found</h2>
        <button
          onClick={() => navigate('/batches')}
          className="mt-3 text-blue-600 hover:text-blue-700"
        >
          Return to Batches
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/batches')}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{batch.name}</h1>
            <p className="text-sm text-gray-500">
              {batchStudents.length} Student{batchStudents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {batchStudents.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <h3 className="text-base font-medium text-gray-900">No students in this batch</h3>
          <p className="mt-1 text-sm text-gray-500">Add students to this batch to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batchStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onEdit={() => onEditStudent(student)}
              onDelete={() => onDeleteStudent(student.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchStudentsView;