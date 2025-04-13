import React from 'react';
import StudentCard from '../StudentCard';
import BatchCard from '../BatchCard';
import MockTestCard from '../MockTestCard';

const AppRenders = ({
  students,
  batches,
  filters,
  selectedMockTests,
  getFilteredStudents,
  getFilteredMockTests,
  toggleMockTestSelection,
  handleEditStudent,
  handleDeleteStudent,
  setSelectedStudent,
  setShowAttendanceDetails,
  handleEditBatch,
  handleDeleteBatch,
  handleEditMock,
  handleDeleteMock,
  setSelectedTest,
  setShowAssignScores,
  handleBulkDeleteMocks,
  setShowStudentForm
}) => {
  
  const renderStudentList = () => {
    const filteredStudents = getFilteredStudents(filters);

    return (
      <div className="space-y-6">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.batch && filters.batch !== 'all'
                ? 'No students found in the selected batch'
                : 'Get started by creating a new student.'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowStudentForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Student
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {filters.batch && filters.batch !== 'all' 
                  ? `Students in ${batches.find(b => b.id === filters.batch)?.name}`
                  : 'All Students'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  batch={batches.find(b => b.id === student.batchId)}
                  onEdit={() => handleEditStudent(student)}
                  onDelete={() => handleDeleteStudent(student.id)}
                  onViewAttendance={() => {
                    setSelectedStudent(student);
                    setShowAttendanceDetails(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBatchList = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {batches.map((batch) => (
          <BatchCard
            key={batch.id}
            batch={batch}
            studentsCount={students.filter(s => s.batchId === batch.id).length}
            onEdit={() => handleEditBatch(batch)}
            onDelete={() => handleDeleteBatch(batch.id, batch.name)}
          />
        ))}
      </div>
    );
  };

  const renderMockTestList = () => {
    const filteredTests = getFilteredMockTests({
      ...filters,
      status: filters.mockStatus === 'all' ? undefined : filters.mockStatus
    });

    return (
      <div className="space-y-6">
        {selectedMockTests.length > 0
         && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-purple-700">
                {selectedMockTests.length} test{selectedMockTests.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={handleBulkDeleteMocks}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Selected
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <MockTestCard
              key={test.id}
              test={test}
              onSelect={toggleMockTestSelection}
              isSelected={selectedMockTests.includes(test.id)}
              onEdit={() => handleEditMock(test)}
              onDelete={() => handleDeleteMock(test.id)}
              onAssignScores={() => {
                setSelectedTest(test);
                setShowAssignScores(true);
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderFilters = (onFilterChange) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Batch
            </label>
            <div className="relative">
              <select
                value={filters.batch || 'all'}
                onChange={(e) => onFilterChange({ ...filters, batch: e.target.value })}
                className="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return {
    renderStudentList,
    renderBatchList,
    renderMockTestList,
    renderFilters
  };
};

export default AppRenders; 