import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiSearch } from 'react-icons/fi';
import Modal from '../common/Modal';
import AssignScoresModal from '../AssignScoresModal';

const MockTestsView = ({ 
  renderMockTestList, 
  students, 
  filters, 
  batches,
  onFilterChange,
  onAssignScores 
}) => {
  const [showAssignScores, setShowAssignScores] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  // Get filtered students based on selected batch
  const filteredStudents = students.filter(student => 
    filters.batch && filters.batch !== 'all' ? student.batchId === filters.batch : false
  );

  const handleAssignClick = (test) => {
    setSelectedTest(test);
    setShowAssignScores(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mock Tests</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and track student mock test performance</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Batch
            </label>
            <div className="relative">
              <select
                value={filters.batch}
                onChange={(e) => onFilterChange({ ...filters, batch: e.target.value })}
                className="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <div className="relative">
              <select
                value={filters.mockStatus}
                onChange={(e) => onFilterChange({ ...filters, mockStatus: e.target.value })}
                className="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Tests
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                placeholder="Search by test title..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Tests List */}
      {renderMockTestList()}

      {/* Students List when batch is selected */}
      {filters.batch && filters.batch !== 'all' && (
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Students in {batches.find(b => b.id === filters.batch)?.name}
              </h2>
                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredStudents.map(student => (
                <div key={student.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{student.firstName}</h3>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {student.mockScores?.length > 0 ? (
                      student.mockScores.map(score => (
                        <div key={score.testId} className="text-sm">
                          <span className="font-medium">Score: </span>
                          <span className={score.score >= score.passingMarks ? 'text-green-600' : 'text-red-600'}>
                            {score.score}/{score.totalMarks}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No scores yet</span>
                    )}
                  </div>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No students found in this batch
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Scores Modal */}
      {showAssignScores && selectedTest && (
        <Modal
          isOpen={showAssignScores}
          onClose={() => {
            setShowAssignScores(false);
            setSelectedTest(null);
          }}
        >
          <AssignScoresModal
            test={selectedTest}
            students={filteredStudents}
            batches={batches}
            onClose={() => {
              setShowAssignScores(false);
              setSelectedTest(null);
            }}
            onSave={(scores) => {
              onAssignScores(selectedTest, scores);
              setShowAssignScores(false);
              setSelectedTest(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
};

MockTestsView.propTypes = {
  renderMockTestList: PropTypes.func.isRequired,
  students: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      batchId: PropTypes.string,
      mockScores: PropTypes.arrayOf(
        PropTypes.shape({
          testId: PropTypes.string.isRequired,
          score: PropTypes.number.isRequired,
          totalMarks: PropTypes.number.isRequired,
          passingMarks: PropTypes.number.isRequired,
        })
      ),
    })
  ).isRequired,
  filters: PropTypes.shape({
    batch: PropTypes.string,
    search: PropTypes.string,
    mockStatus: PropTypes.string,
  }).isRequired,
  batches: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onAssignScores: PropTypes.func.isRequired,
};

export default MockTestsView; 