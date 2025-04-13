import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const FinalReportView = ({ renderFilters, students, batches, filters, onFilterChange }) => {
    const navigate = useNavigate();

    // Create a batch lookup map for better performance
    const batchMap = React.useMemo(() => {
        return batches.reduce((acc, batch) => {
            acc[batch.id] = batch.name;
            return acc;
        }, {});
    }, [batches]);

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
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleCardClick = (studentId) => {
        navigate(`/student/${studentId}`);
    };

    return (
        <div className="space-y-6">
            {renderFinalReportFilters()}

            {/* Progress Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map(student => {
                    const attendancePercentage = calculateAttendancePercentage(student);
                    const mockTestPercentage = calculateMockTestPercentage(student);
                    const batchName = batchMap[student.batchId] || 'No Batch';

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
                        <div 
                            key={student.id} 
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
                            onClick={() => handleCardClick(student.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleCardClick(student.id);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`View detailed report for ${student.firstName} ${student.lastName}`}
                        >
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

                            {/* Summary Metrics */}
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-medium text-gray-700">Overall Performance</span>
                                    <span className="text-sm font-semibold text-gray-900">{overallPercentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${overallPercentage >= 75 ? 'bg-green-500' :
                                                overallPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${overallPercentage}%` }}
                                    />
                                </div>
                                <p className="mt-4 text-sm text-gray-500 text-center">
                                    Click to view detailed report
                                </p>
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

// Add PropTypes validation
FinalReportView.propTypes = {
    renderFilters: PropTypes.func,
    students: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        batchId: PropTypes.string.isRequired,
        attendance: PropTypes.shape({
            class: PropTypes.arrayOf(PropTypes.shape({
                status: PropTypes.string.isRequired
            })),
            mock: PropTypes.arrayOf(PropTypes.shape({
                status: PropTypes.string.isRequired
            }))
        }),
        mockScores: PropTypes.arrayOf(PropTypes.shape({
            score: PropTypes.number.isRequired
        }))
    })).isRequired,
    batches: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
    })).isRequired,
    filters: PropTypes.shape({
        batch: PropTypes.string
    }).isRequired,
    onFilterChange: PropTypes.func.isRequired
};

export default FinalReportView;