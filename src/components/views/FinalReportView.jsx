import React from 'react';

const FinalReportView = ({ renderFilters, students, batches, filters, onFilterChange }) => {
    const calculateAttendancePercentage = (student) => {
      if (!student.attendance?.class || !Array.isArray(student.attendance.class)) {
        return 0;
      }
      const totalDays = student.attendance.class.length;
      const presentDays = student.attendance.class.filter(a => a.status === 'present').length;
      return totalDays === 0 ? 0 : Math.round((presentDays / totalDays) * 100);
    };
  
    const calculateMockTestPercentage = (student) => {
      if (!student.mockScores || !Array.isArray(student.mockScores)) {
        return 0;
      }
      const totalTests = student.mockScores.length;
      const passedTests = student.mockScores.filter(score => score.score >= 6).length;
      return totalTests === 0 ? 0 : Math.round((passedTests / totalTests) * 100);
    };
  
    // Filter students based on selected batch
    const filteredStudents = filters.batch && filters.batch !== 'all'
      ? students.filter(student => student.batchId === filters.batch)
      : students;
  
    // Custom filter component for Final Report
    const renderFinalReportFilters = () => {
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };
  
    return (
      <div className="space-y-6">
        {renderFinalReportFilters()}
        
        {/* Progress Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(student => {
            const attendancePercentage = calculateAttendancePercentage(student);
            const mockTestPercentage = calculateMockTestPercentage(student);
            const batchName = batches.find(b => b.id === student.batchId)?.name || 'No Batch';
            
            // Calculate the overall grade
            const overallPercentage = Math.round((attendancePercentage + mockTestPercentage) / 2);
            let grade;
            if (overallPercentage >= 90) grade = 'A+';
            else if (overallPercentage >= 80) grade = 'A';
            else if (overallPercentage >= 70) grade = 'B+';
            else if (overallPercentage >= 60) grade = 'B';
            else if (overallPercentage >= 50) grade = 'C';
            else grade = 'F';
  
            return (
              <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Student Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{student.email}</p>
                      <p className="text-sm text-gray-500 mt-1">Batch: {batchName}</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-50">
                      <span className="text-xl font-bold text-purple-700">{grade}</span>
                    </div>
                  </div>
                </div>
  
                {/* Progress Metrics */}
                <div className="p-6 space-y-6">
                  {/* Attendance Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Attendance</span>
                      <span className="text-sm font-semibold text-gray-900">{attendancePercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          attendancePercentage >= 75 ? 'bg-green-500' : 
                          attendancePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${attendancePercentage}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {student.attendance?.class?.filter(a => a.status === 'present').length || 0} days present out of {student.attendance?.class?.length || 0}
                    </p>
                  </div>
  
                  {/* Mock Tests Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Mock Tests</span>
                      <span className="text-sm font-semibold text-gray-900">{mockTestPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          mockTestPercentage >= 75 ? 'bg-green-500' : 
                          mockTestPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${mockTestPercentage}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {student.mockScores?.filter(score => score.score >= 6).length || 0} tests passed out of {student.mockScores?.length || 0}
                    </p>
                  </div>
  
                  {/* Mock Test Details */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Mock Test History</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {student.mockScores?.map((score, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{score.testId}</span>
                          <span className={`font-medium ${score.score >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                            {score.score}/10
                          </span>
                        </div>
                      ))}
                      {(!student.mockScores || student.mockScores.length === 0) && (
                        <p className="text-sm text-gray-500">No mock tests taken yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
  
        {/* No Students Message */}
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.batch && filters.batch !== 'all' 
                  ? 'No students found in the selected batch' 
                  : 'No students found in any batch'}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default FinalReportView;