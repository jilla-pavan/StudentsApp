import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';

const MockTestsView = ({ renderMockTestList, students, filters, batches, onFilterChange, onAssignScores, updateStudent }) => {
    const [scores, setScores] = useState({});
    const [studentMockLevels, setStudentMockLevels] = useState({});
    const [mockAttendance, setMockAttendance] = useState({});
    const mockLevels = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Level ${i + 1}` }));
  
    // Initialize student levels and attendance based on their highest passed level
    useEffect(() => {
      const initialLevels = {};
      const initialAttendance = {};
      students.forEach(student => {
        if (student.mockScores && Array.isArray(student.mockScores)) {
          // Get all passed levels
          const passedLevels = student.mockScores
            .filter(score => score.score >= 6)
            .map(score => parseInt(score.testId.split('_')[1]));
          
          // If they have passed levels, set them to the next level
          // If not, start them at level 1
          const highestPassedLevel = Math.max(...passedLevels, 0);
          const nextLevel = Math.min(highestPassedLevel + 1, 10);
          initialLevels[student.id] = nextLevel.toString();
  
          // Initialize attendance from existing data
          initialAttendance[student.id] = {};
          if (student.mockAttendance) {
            // Convert old format to new array format if needed
            Object.entries(student.mockAttendance).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                initialAttendance[student.id][key] = value;
              } else {
                initialAttendance[student.id][key] = [value];
              }
            });
          }
        } else {
          // Start at level 1 if no scores
          initialLevels[student.id] = "1";
          initialAttendance[student.id] = {};
        }
      });
      setStudentMockLevels(initialLevels);
      setMockAttendance(initialAttendance);
    }, [students]);
  
    // Filter students based on selected batch
    const filteredStudents = filters.batch && filters.batch !== 'all'
      ? students.filter(student => student.batchId === filters.batch)
      : students;
  
    const handleScoreChange = (studentId, value) => {
      // Only allow numbers between 0 and 10
      if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 10)) {
        setScores(prev => ({
          ...prev,
          [studentId]: value
        }));
      }
    };
  
    const handleMockLevelChange = (studentId, level) => {
      setStudentMockLevels(prev => ({
        ...prev,
        [studentId]: level
      }));
      // Clear previous score when changing level
      setScores(prev => ({
        ...prev,
        [studentId]: ''
      }));
    };
  
    const handleAttendanceChange = async (studentId, mockLevel, isPresent) => {
      try {
        const currentDate = new Date().toISOString();
        const newAttendanceRecord = {
          status: isPresent ? 'present' : 'absent',
          date: currentDate
        };

        // Get existing attendance records for this mock level
        const existingAttendance = mockAttendance[studentId]?.[`mock_${mockLevel}`] || [];
        
        // Add new record to the array
        const updatedAttendance = {
          ...mockAttendance[studentId],
          [`mock_${mockLevel}`]: [...existingAttendance, newAttendanceRecord]
        };

        // Update local state
        setMockAttendance(prev => ({
          ...prev,
          [studentId]: updatedAttendance
        }));

        // Update student in database
        await updateStudent(studentId, {
          mockAttendance: updatedAttendance
        });

        toast.success(`Attendance marked as ${isPresent ? 'present' : 'absent'} for Level ${mockLevel}`);
      } catch (error) {
        console.error('Error marking attendance:', error);
        toast.error('Failed to mark attendance');
      }
    };
  
    const handleSaveScore = async (studentId) => {
      try {
        const mockLevel = studentMockLevels[studentId];
        const score = scores[studentId];
  
        if (!mockLevel || !score) {
          toast.error('Please select a mock level and enter a score');
          return;
        }
  
        if (parseInt(score) > 10) {
          toast.error('Score cannot be greater than 10');
          return;
        }
  
        // Check if attendance is marked
        const attendance = mockAttendance[studentId]?.[`mock_${mockLevel}`];
        if (!attendance) {
          toast.error('Please mark attendance before entering score');
          return;
        }
  
        const mockTest = {
          id: `mock_${mockLevel}`,
          title: `Mock Test Level ${mockLevel}`,
          totalMarks: 10,
          passingMarks: 6
        };
  
        const scoreData = {
          [studentId]: score
        };
  
        await onAssignScores(scoreData, mockTest);
        
        // Clear the score after saving
        setScores(prev => ({
          ...prev,
          [studentId]: ''
        }));
  
        // If student passed this level, automatically set them to the next level
        if (parseInt(score) >= 6) {
          const nextLevel = Math.min(parseInt(mockLevel) + 1, 10);
          setStudentMockLevels(prev => ({
            ...prev,
            [studentId]: nextLevel.toString()
          }));
        }
      } catch (error) {
        console.error('Error saving score:', error);
        toast.error('Failed to save score');
      }
    };
  
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mock Tests</h1>
            <p className="mt-1 text-sm text-gray-500">Manage and track student mock test performance</p>
          </div>
        </div>
  
        {/* Batch Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Filter by Batch
              </label>
              <div className="relative">
                <select
                  value={filters.batch}
                  onChange={(e) => onFilterChange({ ...filters, batch: e.target.value })}
                  className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
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
  
        {/* Students List */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {filters.batch && filters.batch !== 'all' 
                      ? `Students in ${batches.find(b => b.id === filters.batch)?.name}`
                      : 'All Students'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            </div>
  
            <div className="divide-y divide-gray-200">
              {filteredStudents.map(student => {
                const selectedMockLevel = studentMockLevels[student.id];
                const mockScore = selectedMockLevel ? 
                  student.mockScores?.find(s => s.testId === `mock_${selectedMockLevel}`) : 
                  null;
                
                // Get all passed levels for this student
                const passedLevels = student.mockScores
                  ?.filter(s => s.score >= 6)
                  .map(s => parseInt(s.testId.split('_')[1]))
                  .sort((a, b) => a - b) || [];
  
                // Get attendance status for current level
                const currentAttendance = mockAttendance[student.id]?.[`mock_${selectedMockLevel}`];
                
                return (
                  <div key={student.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{student.firstName}</h3>
                      <p className="text-sm text-gray-500">{student.email}</p>
                      <div className="mt-1">
                        <span className="text-xs text-gray-500">
                          Passed Levels: {passedLevels.length > 0 ? passedLevels.join(', ') : 'None'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:space-x-3 w-full md:w-auto">
                      {/* Mock Level Display */}
                      <div className="w-full md:flex-1 md:min-w-[150px]">
                        <select
                          value={studentMockLevels[student.id] || '1'}
                          onChange={(e) => handleMockLevelChange(student.id, e.target.value)}
                          className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          {mockLevels.map((level) => (
                            <option 
                              key={level.id} 
                              value={level.id}
                              disabled={level.id > (Math.max(...passedLevels, 0) + 1)}
                            >
                              {level.name}
                            </option>
                          ))}
                        </select>
                      </div>
  
                      {/* Attendance Buttons */}
                      <div className="flex items-center space-x-2 w-full md:w-auto">
                        <button
                          onClick={() => handleAttendanceChange(student.id, selectedMockLevel, true)}
                          className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-sm font-medium ${
                            currentAttendance?.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.id, selectedMockLevel, false)}
                          className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-sm font-medium ${
                            currentAttendance?.status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
  
                      {/* Attendance History */}
                      {mockAttendance[student.id]?.[`mock_${selectedMockLevel}`]?.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          <div className="font-medium mb-1">Attendance History:</div>
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {mockAttendance[student.id][`mock_${selectedMockLevel}`]
                              .sort((a, b) => new Date(b.date) - new Date(a.date))
                              .map((record, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <span>{new Date(record.date).toLocaleDateString()}</span>
                                  <span className={`px-2 py-0.5 rounded ${
                                    record.status === 'present' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {record.status}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
  
                      {/* Score Input */}
                      <div className="flex items-center space-x-2 w-full md:w-auto">
                        <input
                          type="text"
                          value={scores[student.id] || ''}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          placeholder={mockScore ? `Current: ${mockScore.score}` : "Enter score"}
                          className="w-16 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          disabled={!currentAttendance}
                        />
                        <span className="text-sm text-gray-500">/10</span>
                        
                        <button
                          onClick={() => handleSaveScore(student.id)}
                          disabled={!scores[student.id] || !currentAttendance}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Save
                        </button>
                      </div>
  
                      {/* Current Score Display */}
                      {mockScore && (
                        <span className={`text-sm ${mockScore.score >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                          Current: {mockScore.score}/10
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
  
        {/* Mock Tests List */}
        {renderMockTestList()}
      </div>
    );
  };

  MockTestsView.propTypes = {
    renderMockTestList: PropTypes.func.isRequired,
    students: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string,
      email: PropTypes.string,
      contactNumber: PropTypes.string,
      batchId: PropTypes.string,
      rollNumber: PropTypes.string,
      gender: PropTypes.string,
      mockScores: PropTypes.array,
      mockAttendance: PropTypes.object
    })).isRequired,
    filters: PropTypes.shape({
      batch: PropTypes.string,
      search: PropTypes.string
    }).isRequired,
    batches: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })).isRequired,
    onFilterChange: PropTypes.func.isRequired,
    onAssignScores: PropTypes.func.isRequired,
    updateStudent: PropTypes.func.isRequired
  };

  export default MockTestsView;