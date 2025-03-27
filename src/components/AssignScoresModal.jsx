import React, { useState } from 'react';
import PropTypes from 'prop-types';

const AssignScoresModal = ({ test, students, onClose, onSave }) => {
  const [scores, setScores] = useState({});
  const [search, setSearch] = useState('');

  // Initialize scores with existing scores if any
  React.useEffect(() => {
    const initialScores = {};
    students.forEach(student => {
      const existingScore = student.mockScores?.find(s => s.testId === test.id);
      initialScores[student.id] = existingScore ? existingScore.score.toString() : '';
    });
    setScores(initialScores);
  }, [students, test]);

  const handleScoreChange = (studentId, value) => {
    // Only allow numbers and empty string
    if (value === '' || /^\d+$/.test(value)) {
      setScores(prev => ({
        ...prev,
        [studentId]: value
      }));
    }
  };

  const handleSave = () => {
    // Validate scores
    const validScores = {};
    let hasError = false;

    Object.entries(scores).forEach(([studentId, score]) => {
      if (score === '') return; // Skip empty scores
      
      const numScore = parseInt(score);
      if (isNaN(numScore) || numScore < 0 || numScore > test.totalMarks) {
        hasError = true;
        return;
      }
      validScores[studentId] = numScore;
    });

    if (hasError) {
      alert(`Scores must be between 0 and ${test.totalMarks}`);
      return;
    }

    onSave(validScores);
    onClose();
  };

  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(search.toLowerCase()) ||
    student.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Assign Scores - {test.title}
        </h2>
        <p className="text-sm text-gray-500">
          Total Marks: {test.totalMarks} | Passing Marks: {test.passingMarks}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Students List */}
      <div className="max-h-[400px] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map(student => {
              const score = scores[student.id] || '';
              const numScore = parseInt(score);
              const isValid = score === '' || (!isNaN(numScore) && numScore >= 0 && numScore <= test.totalMarks);
              const isPassing = !isNaN(numScore) && numScore >= test.passingMarks;

              return (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {student.firstName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={score}
                      onChange={(e) => handleScoreChange(student.id, e.target.value)}
                      placeholder="Enter score"
                      className={`w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        !isValid ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {score && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isPassing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isPassing ? 'Pass' : 'Fail'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Save Scores
        </button>
      </div>
    </div>
  );
};

AssignScoresModal.propTypes = {
  test: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    totalMarks: PropTypes.number.isRequired,
    passingMarks: PropTypes.number.isRequired,
  }).isRequired,
  students: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      mockScores: PropTypes.arrayOf(
        PropTypes.shape({
          testId: PropTypes.string.isRequired,
          score: PropTypes.number.isRequired,
        })
      ),
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default AssignScoresModal; 