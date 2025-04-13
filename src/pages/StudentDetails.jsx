import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudents } from '../hooks/useStudents';
import { useBatches } from '../hooks/useBatches';
import { FiArrowLeft, FiDownload, FiPrinter, FiCalendar, FiBook, FiAward, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const StudentDetails = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { students } = useStudents();
    const { batches } = useBatches();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        // Find the student by ID
        const foundStudent = students.find(s => s.id === studentId);
        if (foundStudent) {
            setStudent(foundStudent);
        }
        setLoading(false);
    }, [studentId, students]);

    // Calculate attendance percentage
    const calculateAttendancePercentage = (student) => {
        if (!student || !student.attendance) {
            return 0;
        }

        try {
            const attendance = student.attendance || [];
            if (!Array.isArray(attendance)) {
                return 0;
            }

            const totalDays = attendance.length;
            const presentDays = attendance.filter(a => a.present === true).length;
            return totalDays === 0 ? 0 : Math.round((presentDays / totalDays) * 100);
        } catch (error) {
            console.error('Error calculating attendance:', error);
            return 0;
        }
    };

    // Calculate mock attendance percentage
    const calculateMockAttendancePercentage = (student) => {
        if (!student || !student.mockAttendance) {
            return 0;
        }

        try {
            const mockAttendance = Object.values(student.mockAttendance || {});
            if (!mockAttendance.length) {
                return 0;
            }

            const totalMocks = mockAttendance.length;
            const presentMocks = mockAttendance.filter(a => a.status === 'present').length;
            return totalMocks === 0 ? 0 : Math.round((presentMocks / totalMocks) * 100);
        } catch (error) {
            console.error('Error calculating mock attendance:', error);
            return 0;
        }
    };

    // Calculate mock test percentage
    const calculateMockTestPercentage = (student) => {
        if (!student.mockScores || !Array.isArray(student.mockScores)) {
            return 0;
        }
        const totalTests = student.mockScores.length;
        const passedTests = student.mockScores.filter(score => score.score >= 6).length;
        return totalTests === 0 ? 0 : Math.round((passedTests / totalTests) * 100);
    };

    // Get grade based on performance
    const getGrade = (percentage) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C';
        return 'F';
    };

    // Get color based on percentage
    const getColorClass = (percentage) => {
        if (percentage >= 75) return 'bg-green-500';
        if (percentage >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    // Handle download (placeholder)
    const handleDownload = () => {
        alert('Download functionality would be implemented here');
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    const attendancePercentage = calculateAttendancePercentage(student);
    const mockAttendancePercentage = calculateMockAttendancePercentage(student);
    const mockTestPercentage = calculateMockTestPercentage(student);
    const overallPercentage = Math.round((attendancePercentage + mockTestPercentage) / 2);
    const grade = getGrade(overallPercentage);
    const batch = batches.find(b => b.id === student.batchId);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header with back button and actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 print:hidden">
                <div className="flex items-center mb-4 md:mb-0">
                    {/* <button 
                        onClick={() => navigate('/final-report')}
                        className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <FiArrowLeft className="h-5 w-5 text-gray-600" />
                    </button> */}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
                        <p className="text-sm text-gray-500">View detailed information about {student.firstName} {student.lastName}</p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                    >
                        <FiPrinter className="-ml-1 mr-2 h-5 w-5" />
                        Print
                    </button>
                    <button
                        onClick={handleDownload}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                    >
                        <FiDownload className="-ml-1 mr-2 h-5 w-5" />
                        Download
                    </button>
                </div>
            </div>

            {/* Student Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center">
                        <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                            <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center text-3xl font-bold text-purple-600">
                                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-900">{student.firstName} {student.lastName}</h2>
                            <p className="text-sm text-gray-500">{student.email}</p>
                            <div className="mt-2 flex items-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                    {batch ? batch.name : 'No Batch'}
                                </span>
                                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    Grade: {grade}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0 md:ml-6">
                            <div className="flex items-center">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900">{overallPercentage}%</div>
                                    <div className="text-sm text-gray-500">Overall</div>
                                </div>
                                <div className="ml-4 w-24 h-24 relative">
                                    <svg className="w-24 h-24" viewBox="0 0 36 36">
                                        <path
                                            d="M18 2.0845
                                                a 15.9155 15.9155 0 0 1 0 31.831
                                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="#E5E7EB"
                                            strokeWidth="3"
                                        />
                                        <path
                                            d="M18 2.0845
                                                a 15.9155 15.9155 0 0 1 0 31.831
                                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke={getColorClass(overallPercentage).replace('bg-', '#').replace('-500', '')}
                                            strokeWidth="3"
                                            strokeDasharray={`${overallPercentage}, 100`}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm font-medium text-gray-900">{grade}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Tabs */}
                <div className="border-b border-gray-200 print:hidden">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-4 px-6 text-sm font-medium ${
                                activeTab === 'overview'
                                    ? 'border-b-2 border-purple-500 text-purple-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={`py-4 px-6 text-sm font-medium ${
                                activeTab === 'attendance'
                                    ? 'border-b-2 border-purple-500 text-purple-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Attendance
                        </button>
                        <button
                            onClick={() => setActiveTab('mockTests')}
                            className={`py-4 px-6 text-sm font-medium ${
                                activeTab === 'mockTests'
                                    ? 'border-b-2 border-purple-500 text-purple-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Mock Tests
                        </button>
                    </nav>
                </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    {/* Performance Metrics */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                            <p className="text-sm text-gray-500 mt-1">Summary of student's performance</p>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Class Attendance */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <FiCalendar className="h-5 w-5 text-purple-500 mr-2" />
                                        <h4 className="text-sm font-medium text-gray-700">Class Attendance</h4>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-gray-900">{attendancePercentage}%</span>
                                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                                            <div
                                                className={`h-2 rounded-full ${getColorClass(attendancePercentage)}`}
                                                style={{ width: `${attendancePercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {student.attendance?.class?.filter(a => a.status === 'present').length || 0} of {student.attendance?.class?.length || 0} classes attended
                                    </p>
                                </div>

                                {/* Mock Attendance */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <FiBook className="h-5 w-5 text-purple-500 mr-2" />
                                        <h4 className="text-sm font-medium text-gray-700">Mock Attendance</h4>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-gray-900">{mockAttendancePercentage}%</span>
                                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                                            <div
                                                className={`h-2 rounded-full ${getColorClass(mockAttendancePercentage)}`}
                                                style={{ width: `${mockAttendancePercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {student.attendance?.mock?.filter(a => a.status === 'present').length || 0} of {student.attendance?.mock?.length || 0} mocks attended
                                    </p>
                                </div>

                                {/* Mock Test Performance */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center mb-2">
                                        <FiAward className="h-5 w-5 text-purple-500 mr-2" />
                                        <h4 className="text-sm font-medium text-gray-700">Mock Test Performance</h4>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-gray-900">{mockTestPercentage}%</span>
                                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                                            <div
                                                className={`h-2 rounded-full ${getColorClass(mockTestPercentage)}`}
                                                style={{ width: `${mockTestPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {student.mockScores?.filter(score => score.score >= 6).length || 0} of {student.mockScores?.length || 0} tests passed
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="space-y-8">
                    {/* Class Attendance */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Class Attendance</h3>
                            <p className="text-sm text-gray-500 mt-1">Detailed record of class attendance</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {student.attendance && student.attendance.length > 0 ? (
                                        student.attendance.sort((a, b) => new Date(b.date) - new Date(a.date)).map((record, index) => (
                                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(record.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        record.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {record.present ? 'Present' : 'Absent'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                No attendance records found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mock Attendance */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Mock Attendance</h3>
                            <p className="text-sm text-gray-500 mt-1">Detailed record of mock attendance</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mock Level
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {student.mockAttendance && Object.keys(student.mockAttendance).length > 0 ? (
                                        Object.entries(student.mockAttendance).map(([mockLevel, record], index) => (
                                            <tr key={mockLevel} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {mockLevel.replace('mock_', 'Level ')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(record.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {record.status === 'present' ? 'Present' : 'Absent'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                No mock attendance records found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'mockTests' && (
                <div className="space-y-8">
                    {/* Mock Test Performance */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Mock Test Performance</h3>
                            <p className="text-sm text-gray-500 mt-1">Detailed record of mock test scores</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Test
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Score
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {student.mockScores?.length > 0 ? (
                                        student.mockScores.map((score, index) => (
                                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    Mock Test {score.testId}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {score.score}/10
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        score.score >= 6 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {score.score >= 6 ? 'Passed' : 'Failed'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(score.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                                No mock test records found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer with report generation date */}
            <div className="text-center text-sm text-gray-500 mt-8 print:mt-4">
                <p>Report generated on {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
};

export default StudentDetails; 