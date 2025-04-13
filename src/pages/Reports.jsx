import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudents } from '../hooks/useStudents';
import { useBatches } from '../hooks/useBatches';
import { FiDownload, FiPrinter, FiFilter, FiX, FiSearch } from 'react-icons/fi';

const Reports = () => {
    const navigate = useNavigate();
    const { students } = useStudents();
    const { batches } = useBatches();
    const [filters, setFilters] = useState({
        batch: 'all',
        search: '',
        sortBy: 'name',
        sortOrder: 'asc'
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    // Calculate metrics for each student
    const studentMetrics = useMemo(() => {
        return students.map(student => {
            // Calculate attendance percentage
            const classAttendance = student.attendance?.class || [];
            const totalClassDays = classAttendance.length;
            const presentClassDays = classAttendance.filter(a => a.status === 'present').length;
            const classAttendancePercentage = totalClassDays === 0 ? 0 : Math.round((presentClassDays / totalClassDays) * 100);

            // Calculate mock attendance percentage
            const mockAttendance = student.attendance?.mock || [];
            const totalMockDays = mockAttendance.length;
            const presentMockDays = mockAttendance.filter(a => a.status === 'present').length;
            const mockAttendancePercentage = totalMockDays === 0 ? 0 : Math.round((presentMockDays / totalMockDays) * 100);

            // Calculate mock test percentage
            const mockScores = student.mockScores || [];
            const totalTests = mockScores.length;
            const passedTests = mockScores.filter(score => score.score >= 6).length;
            const mockTestPercentage = totalTests === 0 ? 0 : Math.round((passedTests / totalTests) * 100);

            // Calculate overall performance
            const overallPercentage = Math.round((classAttendancePercentage + mockTestPercentage) / 2);
            
            // Determine grade
            let grade;
            if (overallPercentage >= 90) grade = 'A+';
            else if (overallPercentage >= 80) grade = 'A';
            else if (overallPercentage >= 70) grade = 'B+';
            else if (overallPercentage >= 60) grade = 'B';
            else if (overallPercentage >= 50) grade = 'C';
            else grade = 'F';

            return {
                ...student,
                metrics: {
                    classAttendancePercentage,
                    mockAttendancePercentage,
                    mockTestPercentage,
                    overallPercentage,
                    grade,
                    totalClassDays,
                    presentClassDays,
                    totalMockDays,
                    presentMockDays,
                    totalTests,
                    passedTests
                }
            };
        });
    }, [students]);

    // Filter and sort students
    const filteredAndSortedStudents = useMemo(() => {
        let result = [...studentMetrics];

        // Apply batch filter
        if (filters.batch && filters.batch !== 'all') {
            result = result.filter(student => student.batchId === filters.batch);
        }

        // Apply search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            result = result.filter(student => 
                student.firstName.toLowerCase().includes(searchTerm) || 
                student.lastName.toLowerCase().includes(searchTerm) ||
                student.email.toLowerCase().includes(searchTerm)
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;
            
            switch (filters.sortBy) {
                case 'name':
                    comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
                    break;
                case 'classAttendance':
                    comparison = a.metrics.classAttendancePercentage - b.metrics.classAttendancePercentage;
                    break;
                case 'mockAttendance':
                    comparison = a.metrics.mockAttendancePercentage - b.metrics.mockAttendancePercentage;
                    break;
                case 'mockTest':
                    comparison = a.metrics.mockTestPercentage - b.metrics.mockTestPercentage;
                    break;
                case 'overall':
                    comparison = a.metrics.overallPercentage - b.metrics.overallPercentage;
                    break;
                default:
                    comparison = 0;
            }
            
            return filters.sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [studentMetrics, filters]);

    // Calculate batch statistics
    const batchStats = useMemo(() => {
        const stats = {};
        
        batches.forEach(batch => {
            const batchStudents = studentMetrics.filter(student => student.batchId === batch.id);
            
            if (batchStudents.length > 0) {
                const avgClassAttendance = batchStudents.reduce((sum, student) => sum + student.metrics.classAttendancePercentage, 0) / batchStudents.length;
                const avgMockAttendance = batchStudents.reduce((sum, student) => sum + student.metrics.mockAttendancePercentage, 0) / batchStudents.length;
                const avgMockTest = batchStudents.reduce((sum, student) => sum + student.metrics.mockTestPercentage, 0) / batchStudents.length;
                const avgOverall = batchStudents.reduce((sum, student) => sum + student.metrics.overallPercentage, 0) / batchStudents.length;
                
                stats[batch.id] = {
                    name: batch.name,
                    studentCount: batchStudents.length,
                    avgClassAttendance: Math.round(avgClassAttendance),
                    avgMockAttendance: Math.round(avgMockAttendance),
                    avgMockTest: Math.round(avgMockTest),
                    avgOverall: Math.round(avgOverall)
                };
            }
        });
        
        return stats;
    }, [studentMetrics, batches]);

    // Calculate overall statistics
    const overallStats = useMemo(() => {
        if (studentMetrics.length === 0) return null;
        
        const avgClassAttendance = studentMetrics.reduce((sum, student) => sum + student.metrics.classAttendancePercentage, 0) / studentMetrics.length;
        const avgMockAttendance = studentMetrics.reduce((sum, student) => sum + student.metrics.mockAttendancePercentage, 0) / studentMetrics.length;
        const avgMockTest = studentMetrics.reduce((sum, student) => sum + student.metrics.mockTestPercentage, 0) / studentMetrics.length;
        const avgOverall = studentMetrics.reduce((sum, student) => sum + student.metrics.overallPercentage, 0) / studentMetrics.length;
        
        return {
            studentCount: studentMetrics.length,
            avgClassAttendance: Math.round(avgClassAttendance),
            avgMockAttendance: Math.round(avgMockAttendance),
            avgMockTest: Math.round(avgMockTest),
            avgOverall: Math.round(avgOverall)
        };
    }, [studentMetrics]);

    // If a student is selected, navigate to their details page
    useEffect(() => {
        if (selectedStudentId) {
            navigate(`/student/${selectedStudentId}`);
        }
    }, [selectedStudentId, navigate]);

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleStudentClick = (studentId) => {
        setSelectedStudentId(studentId);
    };

    const handlePrintReport = () => {
        window.print();
    };

    const handleDownloadReport = () => {
        // This is a placeholder for actual download functionality
        // In a real implementation, you would generate a PDF or other document
        alert('Download functionality would be implemented here');
    };

    return (
        <div className="space-y-6 print:p-0">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Reports</h1>
                    <p className="mt-1 text-sm text-gray-500">Comprehensive overview of student performance</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handlePrintReport}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                    >
                        <FiPrinter className="-ml-1 mr-2 h-5 w-5" />
                        Print Report
                    </button>
                    <button
                        onClick={handleDownloadReport}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                    >
                        <FiDownload className="-ml-1 mr-2 h-5 w-5" />
                        Download
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                    >
                        <FiFilter className="-ml-1 mr-2 h-5 w-5" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 print:hidden">
                    <div className="flex flex-wrap gap-6">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Batch
                            </label>
                            <div className="relative">
                                <select
                                    value={filters.batch || 'all'}
                                    onChange={(e) => handleFilterChange({ batch: e.target.value })}
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
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiSearch className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange({ search: e.target.value })}
                                    placeholder="Search by name or email"
                                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                {filters.search && (
                                    <button
                                        onClick={() => handleFilterChange({ search: '' })}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        <FiX className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sort By
                            </label>
                            <div className="relative">
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                                    className="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="name">Name</option>
                                    <option value="classAttendance">Class Attendance</option>
                                    <option value="mockAttendance">Mock Attendance</option>
                                    <option value="mockTest">Mock Test Performance</option>
                                    <option value="overall">Overall Performance</option>
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
                                Sort Order
                            </label>
                            <div className="relative">
                                <select
                                    value={filters.sortOrder}
                                    onChange={(e) => handleFilterChange({ sortOrder: e.target.value })}
                                    className="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="asc">Ascending</option>
                                    <option value="desc">Descending</option>
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
            )}

            {/* Overall Statistics */}
            {overallStats && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-0">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Overall Statistics</h3>
                        <p className="text-sm text-gray-500 mt-1">Summary of all students' performance</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-500">Total Students</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{overallStats.studentCount}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-500">Avg. Class Attendance</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{overallStats.avgClassAttendance}%</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                        className={`h-2 rounded-full ${overallStats.avgClassAttendance >= 75 ? 'bg-green-500' :
                                                overallStats.avgClassAttendance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${overallStats.avgClassAttendance}%` }}
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-500">Avg. Mock Attendance</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{overallStats.avgMockAttendance}%</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                        className={`h-2 rounded-full ${overallStats.avgMockAttendance >= 75 ? 'bg-green-500' :
                                                overallStats.avgMockAttendance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${overallStats.avgMockAttendance}%` }}
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-500">Avg. Mock Test</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{overallStats.avgMockTest}%</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                        className={`h-2 rounded-full ${overallStats.avgMockTest >= 75 ? 'bg-green-500' :
                                                overallStats.avgMockTest >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${overallStats.avgMockTest}%` }}
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-gray-500">Avg. Overall</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{overallStats.avgOverall}%</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                        className={`h-2 rounded-full ${overallStats.avgOverall >= 75 ? 'bg-green-500' :
                                                overallStats.avgOverall >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${overallStats.avgOverall}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Statistics */}
            {Object.keys(batchStats).length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-0">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Batch Statistics</h3>
                        <p className="text-sm text-gray-500 mt-1">Performance metrics by batch</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Batch
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Students
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Class Attendance
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mock Attendance
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mock Test
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Overall
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {Object.entries(batchStats).map(([batchId, stats], index) => (
                                    <tr key={batchId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {stats.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {stats.studentCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-sm text-gray-900 mr-2">{stats.avgClassAttendance}%</span>
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${stats.avgClassAttendance >= 75 ? 'bg-green-500' :
                                                                stats.avgClassAttendance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${stats.avgClassAttendance}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-sm text-gray-900 mr-2">{stats.avgMockAttendance}%</span>
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${stats.avgMockAttendance >= 75 ? 'bg-green-500' :
                                                                stats.avgMockAttendance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${stats.avgMockAttendance}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-sm text-gray-900 mr-2">{stats.avgMockTest}%</span>
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${stats.avgMockTest >= 75 ? 'bg-green-500' :
                                                                stats.avgMockTest >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${stats.avgMockTest}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-sm text-gray-900 mr-2">{stats.avgOverall}%</span>
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${stats.avgOverall >= 75 ? 'bg-green-500' :
                                                                stats.avgOverall >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${stats.avgOverall}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Student List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-0">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Student Performance</h3>
                    <p className="text-sm text-gray-500 mt-1">Detailed metrics for each student</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Batch
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Class Attendance
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mock Attendance
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mock Test
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Overall
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Grade
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAndSortedStudents.map((student, index) => {
                                const batchName = batches.find(b => b.id === student.batchId)?.name || 'No Batch';
                                return (
                                    <tr 
                                        key={student.id} 
                                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-purple-50 transition-colors`}
                                        onClick={() => handleStudentClick(student.id)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 font-semibold">
                                                    {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {student.firstName} {student.lastName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {student.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {batchName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-sm text-gray-900 mr-2">{student.metrics.classAttendancePercentage}%</span>
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${student.metrics.classAttendancePercentage >= 75 ? 'bg-green-500' :
                                                                student.metrics.classAttendancePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${student.metrics.classAttendancePercentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {student.metrics.presentClassDays}/{student.metrics.totalClassDays} days
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-sm text-gray-900 mr-2">{student.metrics.mockAttendancePercentage}%</span>
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${student.metrics.mockAttendancePercentage >= 75 ? 'bg-green-500' :
                                                                student.metrics.mockAttendancePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${student.metrics.mockAttendancePercentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {student.metrics.presentMockDays}/{student.metrics.totalMockDays} mocks
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-sm text-gray-900 mr-2">{student.metrics.mockTestPercentage}%</span>
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${student.metrics.mockTestPercentage >= 75 ? 'bg-green-500' :
                                                                student.metrics.mockTestPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${student.metrics.mockTestPercentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {student.metrics.passedTests}/{student.metrics.totalTests} passed
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-sm text-gray-900 mr-2">{student.metrics.overallPercentage}%</span>
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${student.metrics.overallPercentage >= 75 ? 'bg-green-500' :
                                                                student.metrics.overallPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${student.metrics.overallPercentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                student.metrics.grade === 'A+' || student.metrics.grade === 'A' ? 'bg-green-100 text-green-800' :
                                                student.metrics.grade === 'B+' || student.metrics.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                                student.metrics.grade === 'C' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {student.metrics.grade}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredAndSortedStudents.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        No students found matching the current filters
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer with report generation date */}
            <div className="text-center text-sm text-gray-500 mt-8 print:mt-4">
                <p>Report generated on {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
};

export default Reports; 