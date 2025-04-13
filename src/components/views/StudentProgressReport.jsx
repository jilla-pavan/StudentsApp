import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiPrinter, FiCalendar, FiBook, FiAward, FiTrendingUp, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { BiTime } from 'react-icons/bi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const StudentProgressReport = ({ students, batches }) => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState([
        {
            date: new Date().toISOString(),
            present: false,
            timestamp: new Date().toISOString()
        }
    ]);
    const printRef = useRef();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            console.log(studentId);
            try {
                const foundStudent = students.find(s => s.id === studentId);
                if (foundStudent) {
                    setStudent(foundStudent);
                    // Transform attendance data from the student document with proper validation
                    const attendance = foundStudent.attendance ? 
                        Object.entries(foundStudent.attendance)
                            .filter(([key]) => {
                                // Ensure we only process valid date entries
                                return key !== 'length' && 
                                       key !== 'mockAttendance' && 
                                       !isNaN(Date.parse(key));
                            })
                            .map(([date, data]) => ({
                                date,
                                present: Boolean(data.present),
                                timestamp: data.timestamp || date
                            }))
                            .sort((a, b) => new Date(b.date) - new Date(a.date)) 
                        : [{
                            date: new Date().toISOString(),
                            present: false,
                            timestamp: new Date().toISOString()
                        }];
                    setAttendanceData(attendance);
                }
            } catch (error) {
                console.error('Error loading student data:', error);
                // Set default attendance data in case of error
                setAttendanceData([{
                    date: new Date().toISOString(),
                    present: false,
                    timestamp: new Date().toISOString()
                }]);
            }
            setLoading(false);
        };

        loadData();
    }, [studentId, students]);

    const handlePrint = () => {
        const printContent = `
            <html>
                <head>
                    <title>Student Progress Report - ${student.firstName} ${student.lastName}</title>
                    <style>
                        @media print {
                            @page {
                                margin: 15mm;
                                size: A4;
                            }
                        }
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            margin: 0;
                            padding: 0;
                            color: #1f2937;
                            background-color: #ffffff;
                        }
                        .header {
                            background: linear-gradient(135deg, #5521b5 0%, #7e3af2 100%);
                            color: white;
                            padding: 32px 24px;
                            text-align: center;
                            margin-bottom: 40px;
                            border-bottom: 5px solid #4c1d95;
                        }
                        .header h1 {
                            font-size: 32px;
                            margin: 0;
                            margin-bottom: 8px;
                            font-weight: 800;
                            letter-spacing: -0.5px;
                        }
                        .header h2 {
                            font-size: 20px;
                            margin: 0;
                            font-weight: 500;
                            opacity: 0.9;
                        }
                        .container {
                            max-width: 1200px;
                            margin: 0 auto;
                            padding: 0 24px;
                        }
                        .student-info {
                            background: #f8fafc;
                            border: 1px solid #e2e8f0;
                            border-radius: 16px;
                            padding: 24px;
                            margin-bottom: 32px;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                        }
                        .section-title {
                            color: #5521b5;
                            font-size: 20px;
                            font-weight: 700;
                            margin-bottom: 20px;
                            padding-bottom: 8px;
                            border-bottom: 2px solid #5521b5;
                        }
                        .info-grid {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 24px;
                        }
                        .info-item {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 12px 16px;
                            background: white;
                            border-radius: 8px;
                            border: 1px solid #e5e7eb;
                        }
                        .info-label {
                            color: #6b7280;
                            font-weight: 600;
                            font-size: 14px;
                        }
                        .info-value {
                            color: #1f2937;
                            font-weight: 600;
                            font-size: 15px;
                        }
                        .performance-grid {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 24px;
                            margin-bottom: 32px;
                        }
                        .performance-card {
                            background: white;
                            border: 1px solid #e5e7eb;
                            border-radius: 16px;
                            padding: 24px;
                            position: relative;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                        }
                        .card-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 20px;
                        }
                        .icon-container {
                            width: 48px;
                            height: 48px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 12px;
                            font-size: 24px;
                        }
                        .grade-badge {
                            padding: 6px 16px;
                            border-radius: 9999px;
                            font-size: 14px;
                            font-weight: 600;
                            background-color: #5521b5;
                            color: white;
                        }
                        .score {
                            font-size: 42px;
                            font-weight: 800;
                            color: #1f2937;
                            margin-bottom: 8px;
                            letter-spacing: -1px;
                        }
                        .label {
                            font-size: 16px;
                            color: #6b7280;
                            font-weight: 500;
                        }
                        .footer {
                            margin-top: 48px;
                            text-align: center;
                            color: #6b7280;
                            font-size: 14px;
                            border-top: 2px solid #e5e7eb;
                            padding-top: 24px;
                        }
                        .footer-brand {
                            color: #5521b5;
                            font-weight: 700;
                            font-size: 16px;
                            margin-bottom: 8px;
                        }
                        .divider {
                            height: 2px;
                            background: linear-gradient(to right, transparent, #e5e7eb, transparent);
                            margin: 32px 0;
                        }
                        /* Additional styles for tables */
                        .table-section {
                            margin-top: 32px;
                            background: white;
                            border-radius: 16px;
                            border: 1px solid #fed7aa;
                            overflow: hidden;
                        }
                        .table-title {
                            padding: 16px 24px;
                            background: #fff7ed;
                            color: #ea580c;
                            font-size: 18px;
                            font-weight: 600;
                            border-bottom: 1px solid #fed7aa;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        th {
                            background: #fff7ed;
                            color: #ea580c;
                            font-weight: 600;
                            font-size: 14px;
                            text-align: left;
                            padding: 12px 24px;
                            border-bottom: 1px solid #fed7aa;
                        }
                        td {
                            padding: 12px 24px;
                            font-size: 14px;
                            border-bottom: 1px solid #fed7aa;
                        }
                        tr:nth-child(even) {
                            background: #fff7ed;
                        }
                        .status-badge {
                            padding: 4px 12px;
                            border-radius: 9999px;
                            font-size: 12px;
                            font-weight: 500;
                        }
                        .status-present {
                            background: #f0fdf4;
                            color: #166534;
                        }
                        .status-absent {
                            background: #fef2f2;
                            color: #991b1b;
                        }
                        .status-passed {
                            background: #f0fdf4;
                            color: #166534;
                        }
                        .status-failed {
                            background: #fef2f2;
                            color: #991b1b;
                        }
                        .score-badge {
                            padding: 4px 12px;
                            border-radius: 9999px;
                            font-size: 12px;
                            font-weight: 500;
                            background: #fff7ed;
                            color: #ea580c;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Career Sure Academy</h1>
                        <h2>Student Progress Report</h2>
                    </div>

                    <div class="container">
                        <div class="student-info">
                            <div class="section-title">Student Information</div>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">Full Name</span>
                                    <span class="info-value">${student.firstName} ${student.lastName}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Roll Number</span>
                                    <span class="info-value">${student.rollNumber}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Batch</span>
                                    <span class="info-value">${batch?.name || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Email</span>
                                    <span class="info-value">${student.email}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Contact</span>
                                    <span class="info-value">${student.contactNumber || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Join Date</span>
                                    <span class="info-value">${batch?.startDate || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div class="section-title">Performance Summary</div>
                        <div class="performance-grid">
                            <div class="performance-card">
                                <div class="card-header">
                                    <div class="icon-container" style="background-color: #ecfdf5;">
                                        🏆
                                    </div>
                                    <span class="grade-badge">Grade ${getGradeLetter(overallPerformance)}</span>
                                </div>
                                <div class="score">${overallPerformance}%</div>
                                <div class="label">Overall Performance</div>
                            </div>

                            <div class="performance-card">
                                <div class="card-header">
                                    <div class="icon-container" style="background-color: #eff6ff;">
                                        📅
                                    </div>
                                    <span class="grade-badge">Grade ${getGradeLetter(attendancePercentage)}</span>
                                </div>
                                <div class="score">${attendancePercentage}%</div>
                                <div class="label">Attendance Performance</div>
                            </div>

                            <div class="performance-card">
                                <div class="card-header">
                                    <div class="icon-container" style="background-color: #f3f0ff;">
                                        📚
                                    </div>
                                    <span class="grade-badge">Grade ${getGradeLetter(mockPerformance.averageScore * 10)}</span>
                                </div>
                                <div class="score">${(mockPerformance.averageScore * 10).toFixed(1)}%</div>
                                <div class="label">Mock Test Performance</div>
                            </div>

                            <div class="performance-card">
                                <div class="card-header">
                                    <div class="icon-container" style="background-color: #fef3c7;">
                                        📝
                                    </div>
                                    <span class="grade-badge">${mockPerformance.averageScore}/10</span>
                                </div>
                                <div class="score">${mockPerformance.passedTests}/${mockPerformance.totalTests}</div>
                                <div class="label">Mock Tests Passed</div>
                            </div>
                        </div>

                        <!-- Recent Attendance List -->
                        <div class="table-section">
                            <div class="table-title">Recent Attendance History</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Marked At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${attendanceData.slice(0, 10).map(record => `
                                        <tr>
                                            <td>${new Date(record.date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</td>
                                            <td>
                                                <span class="status-badge ${record.present ? 'status-present' : 'status-absent'}">
                                                    ${record.present ? '✓ Present' : '✗ Absent'}
                                                </span>
                                            </td>
                                            <td>${new Date(record.timestamp).toLocaleTimeString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <!-- Mock Test List -->
                        <div class="table-section">
                            <div class="table-title">Mock Test History</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Test ID</th>
                                        <th>Date</th>
                                        <th>Score</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${student.mockScores?.map(score => `
                                        <tr>
                                            <td>${score.testId}</td>
                                            <td>${score.createdAt ? new Date(score.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'N/A'}</td>
                                            <td>
                                                <span class="score-badge">
                                                    ${score.score}/10
                                                </span>
                                            </td>
                                            <td>
                                                <span class="status-badge ${score.score >= 6 ? 'status-passed' : 'status-failed'}">
                                                    ${score.score >= 6 ? '✓ Passed' : '✗ Failed'}
                                                </span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div class="footer">
                            <div class="footer-brand">Career Sure Academy - Pathway To Career Success</div>
                            <div>
                                Generated on ${new Date().toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();

        printWindow.onload = function () {
            printWindow.print();
            printWindow.onafterprint = function () {
                printWindow.close();
            };
        };
    };

    const handleDownloadPDF = () => {
        // Initialize PDF with better quality settings
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;

        // Add white background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Header with academy name
        doc.setFillColor(79, 70, 229); // indigo-600
        doc.rect(0, 0, pageWidth, 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Career Sure Academy", pageWidth / 2, 10, { align: "center" });
        doc.setFontSize(12);
        doc.text("Student Progress Report", pageWidth / 2, 18, { align: "center" });

        // Student Information Section
        const infoStartY = 35;
        doc.setFillColor(249, 250, 251); // bg-gray-50
        doc.setDrawColor(229, 231, 235); // border-gray-200
        doc.roundedRect(margin, infoStartY, pageWidth - (2 * margin), 45, 2, 2, 'FD');

        // Student Information Title
        doc.setTextColor(79, 70, 229); // indigo-600
        doc.setFontSize(14);
        doc.text("Student Information", margin + 5, infoStartY + 10);

        // Student Information Grid (2x3)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const colWidth = (pageWidth - (2 * margin) - 10) / 2;
        const rowHeight = 12;

        // Labels (left column)
        doc.setTextColor(107, 114, 128); // text-gray-500
        doc.text("Full Name:", margin + 5, infoStartY + 20);
        doc.text("Batch:", margin + 5, infoStartY + 32);
        doc.text("Contact:", margin + 5, infoStartY + 44);

        // Values (left column)
        doc.setTextColor(31, 41, 55); // text-gray-900
        doc.text(`: ${student.firstName} ${student.lastName}`, margin + 25, infoStartY + 20);
        doc.text(`: ${batch?.name || '78'}`, margin + 25, infoStartY + 32);
        doc.text(`: ${student.contactNumber || '1234567890'}`, margin + 25, infoStartY + 44);

        // Labels (right column)
        doc.setTextColor(107, 114, 128);
        doc.text("Roll Number:", margin + colWidth + 5, infoStartY + 20);
        doc.text("Email:", margin + colWidth + 5, infoStartY + 32);
        doc.text("Join Date:", margin + colWidth + 5, infoStartY + 44);

        // Values (right column)
        doc.setTextColor(31, 41, 55);
        doc.text(`: ${student.rollNumber || '1'}`, margin + colWidth + 30, infoStartY + 20);
        doc.text(`: ${student.email || 'karna@gmail.com'}`, margin + colWidth + 30, infoStartY + 32);
        doc.text(`: ${batch?.startDate || '2025-04-13'}`, margin + colWidth + 30, infoStartY + 44);

        // Performance Summary Section
        const perfStartY = infoStartY + 60;
        doc.setTextColor(79, 70, 229);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Performance Summary", margin + 5, perfStartY);

        // Performance Cards (2x2 grid)
        const cardStartY = perfStartY + 10;
        const cardWidth = (pageWidth - (2 * margin) - 10) / 2;
        const cardHeight = 40;
        const cardGap = 10;

        // Helper function to draw performance cards
        function drawPerformanceCard({ x, y, icon, grade, value, label, bgColor }) {
            // Card background
            doc.setFillColor(...bgColor);
            doc.setDrawColor(229, 231, 235);
            doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');

            // Grade badge
            doc.setFillColor(255, 255, 255);
            doc.setTextColor(79, 70, 229);
            doc.setFontSize(10);
            doc.roundedRect(x + cardWidth - 35, y + 5, 30, 7, 2, 2, 'F');
            doc.text(grade, x + cardWidth - 32, y + 10);

            // Value
            doc.setTextColor(31, 41, 55);
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text(value, x + 10, y + 25);

            // Label
            doc.setTextColor(107, 114, 128);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(label, x + 10, y + 35);
        }

        // Draw performance cards with subtle background colors
        drawPerformanceCard({
            x: margin,
            y: cardStartY,
            grade: 'Grade A+',
            value: '95%',
            label: 'Overall Performance',
            bgColor: [236, 253, 245] // bg-green-50
        });

        drawPerformanceCard({
            x: margin + cardWidth + cardGap,
            y: cardStartY,
            grade: 'Grade A+',
            value: '100%',
            label: 'Attendance Performance',
            bgColor: [239, 246, 255] // bg-blue-50
        });

        drawPerformanceCard({
            x: margin,
            y: cardStartY + cardHeight + cardGap,
            grade: 'Grade A+',
            value: '90.0%',
            label: 'Mock Test Performance',
            bgColor: [243, 232, 255] // bg-purple-50
        });

        drawPerformanceCard({
            x: margin + cardWidth + cardGap,
            y: cardStartY + cardHeight + cardGap,
            grade: '9/10',
            value: '3/3',
            label: 'Mock Tests Passed',
            bgColor: [254, 243, 199] // bg-yellow-50
        });

        // Footer
        const footerY = pageHeight - 15;
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(
            'Career Sure Academy - Pathway To Career Success',
            pageWidth / 2,
            footerY,
            { align: 'center' }
        );

        // Add page number
        doc.setFontSize(8);
        doc.text(`Page 1 of 1`, pageWidth - margin, footerY, { align: 'right' });

        // Add generation timestamp
        const timestamp = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text(`Generated on: ${timestamp}`, margin, footerY);

        // Save with professional filename
        const filename = `CSA_${student.rollNumber}_${student.lastName}_ProgressReport.pdf`;
        doc.save(filename);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Student not found</h2>
                <button
                    onClick={() => navigate('/students')}
                    className="mt-4 text-purple-600 hover:text-purple-700"
                >
                    Return to Students List
                </button>
            </div>
        );
    }

    const batch = batches.find(b => b.id === student.batchId);

    // Calculate various metrics
    const calculateAttendancePercentage = () => {
        if (!attendanceData || attendanceData.length === 0) {
            return 0;
        }
        const presentDays = attendanceData.filter(record => record.present).length;
        const totalDays = attendanceData.length;
        return totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    };

    const calculateMockTestPerformance = () => {
        if (!student.mockScores || !Array.isArray(student.mockScores) || student.mockScores.length === 0) {
            return {
                averageScore: 0,
                totalTests: 0,
                passedTests: 0,
                highestScore: 0,
                progressData: []
            };
        }

        const scores = student.mockScores;
        const totalTests = scores.length;
        const passedTests = scores.filter(score => score.score >= 6).length;
        const highestScore = Math.max(...scores.map(score => score.score));
        const averageScore = totalTests > 0 ? 
            scores.reduce((acc, curr) => acc + curr.score, 0) / totalTests : 
            0;

        // Prepare data for progress chart
        const progressData = scores.map(score => ({
            testId: score.testId,
            score: score.score,
            date: score.date
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            averageScore,
            totalTests,
            passedTests,
            highestScore,
            progressData
        };
    };

    const getGradeColor = (percentage) => {
        if (percentage >= 90) return 'text-green-600 bg-green-50';
        if (percentage >= 80) return 'text-blue-600 bg-blue-50';
        if (percentage >= 70) return 'text-purple-600 bg-purple-50';
        if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const attendancePercentage = calculateAttendancePercentage();
    const mockPerformance = calculateMockTestPerformance();
    const calculateOverallPerformance = () => {
        // Convert mock test score to percentage (out of 100)
        const mockTestPercentage = mockPerformance.averageScore * 10 || 0; // Add fallback to 0
        
        // Get attendance percentage with fallback to 0
        const attendancePercent = attendancePercentage || 0;
        
        // Calculate cumulative average
        const overall = (mockTestPercentage + attendancePercent) / 2;
        
        return Math.round(overall) || 0; // Add fallback to 0 if NaN
    };

    const overallPerformance = calculateOverallPerformance();

    const getGradeLetter = (percentage) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C';
        return 'F';
    };

    const getMonthlyAttendance = (attendanceData) => {
        const monthlyData = attendanceData.reduce((acc, record) => {
            const date = new Date(record.date);
            const month = date.toLocaleString('en-US', { month: 'short' });

            if (!acc[month]) {
                acc[month] = { present: 0, absent: 0, month };
            }

            if (record.present) {
                acc[month].present += 1;
            } else {
                acc[month].absent += 1;
            }

            return acc;
        }, {});

        return Object.values(monthlyData);
    };

    const calculateMockTestPercentage = () => {
        if (!mockPerformance || typeof mockPerformance.averageScore !== 'number') {
            return 0;
        }
        // Convert mock test score to percentage (out of 100)
        return Math.round(mockPerformance.averageScore * 10);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FiArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Student Progress Report</h1>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center text-xl font-bold text-purple-600">
                            {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900">
                                {student.firstName} {student.lastName}
                            </h2>
                            <p className="text-gray-500">{student.email}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <FiPrinter className="w-4 h-4 mr-2" />
                            Print Full Report
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                        >
                            <FiDownload className="w-4 h-4 mr-2" />
                            Final Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Overall Performance Card - First */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <FiAward className="w-6 h-6 text-green-600" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(overallPerformance)}`}>
                            Grade {getGradeLetter(overallPerformance)}
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">{overallPerformance}%</h3>
                    <p className="text-gray-500 text-sm">Overall Performance</p>
                </div>

                {/* Attendance Performance Card - Second */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <FiCalendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(attendancePercentage)}`}>
                            Grade {getGradeLetter(attendancePercentage)}
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">{attendancePercentage}%</h3>
                    <p className="text-gray-500 text-sm">Attendance Performance</p>
                </div>

                {/* Mock Test Performance Card - Third */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <FiBook className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(mockPerformance.averageScore * 10)}`}>
                            Grade {getGradeLetter(mockPerformance.averageScore * 10)}
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">{(mockPerformance.averageScore * 10).toFixed(1)}%</h3>
                    <p className="text-gray-500 text-sm">Mock Test Performance</p>
                </div>

                {/* Tests Passed Card - Fourth */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <FiBook className="w-6 h-6 text-yellow-600" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(mockPerformance.averageScore * 10)}`}>
                            {mockPerformance.averageScore}/10
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                        {mockPerformance.passedTests}/{mockPerformance.totalTests}
                    </h3>
                    <p className="text-gray-500 text-sm">Mock Tests Passed</p>
                </div>
            </div>

            {/* Detailed Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        {['overview', 'attendance', 'mock-tests', 'analytics'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-6 text-sm font-medium border-b-2 ${activeTab === tab
                                    ? 'border-purple-500 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Student Details */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Batch</span>
                                            <span className="text-gray-900 font-medium">{batch?.name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Roll Number</span>
                                            <span className="text-gray-900 font-medium">{student.rollNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Contact</span>
                                            <span className="text-gray-900 font-medium">{student.contactNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Joined Date</span>
                                            <span className="text-gray-900 font-medium">
                                                {batch.startDate}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance Summary</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-500">Total Classes</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {attendanceData.length || 0}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <p className="text-sm text-green-600">Present Days</p>
                                            <p className="text-2xl font-bold text-green-700">
                                                {attendanceData.filter(record => record.present).length || 0}
                                            </p>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-lg">
                                            <p className="text-sm text-red-600">Absent Days</p>
                                            <p className="text-2xl font-bold text-red-700">
                                                {attendanceData.filter(record => !record.present).length || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {attendanceData.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marked At</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {attendanceData.map((record, index) => (
                                                    <tr key={index} className={record.present ? 'bg-green-50' : 'bg-red-50'}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {new Date(record.date).toLocaleDateString('en-US', {
                                                                weekday: 'long',
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                record.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {record.present ? (
                                                                    <>
                                                                        <FiCheckCircle className="w-4 h-4 mr-1" />
                                                                        Present
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FiXCircle className="w-4 h-4 mr-1" />
                                                                        Absent
                                                                    </>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(record.timestamp).toLocaleTimeString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No attendance records available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'mock-tests' && (
                        <div className="space-y-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {student.mockScores?.map((score, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {score.testId}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {score.createdAt ? new Date(score.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    }) : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(score.score * 10)}`}>
                                                        {score.score}/10
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${score.score >= 6 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {score.score >= 6 ? (
                                                            <>
                                                                <FiCheckCircle className="w-4 h-4 mr-1" />
                                                                Passed
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FiXCircle className="w-4 h-4 mr-1" />
                                                                Failed
                                                            </>
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            {/* Performance Overview Card */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Mock Test Performance */}
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-purple-600">Mock Test Performance</p>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(mockPerformance.averageScore * 10)}`}>
                                                {getGradeLetter(mockPerformance.averageScore * 10)}
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold text-purple-700 mt-2">{(mockPerformance.averageScore * 10).toFixed(1)}%</p>
                                        <p className="text-sm text-purple-600 mt-1">
                                            Average Score: {mockPerformance.averageScore}/10
                                        </p>
                                    </div>

                                    {/* Attendance Performance */}
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-blue-600">Attendance Performance</p>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(attendancePercentage)}`}>
                                                {getGradeLetter(attendancePercentage)}
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold text-blue-700 mt-2">{attendancePercentage}%</p>
                                        <p className="text-sm text-blue-600 mt-1">
                                            {attendanceData.filter(record => record.present).length} of {attendanceData.length} days
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Mock Test Progress Chart */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mock Test Progress</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={mockPerformance.progressData}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            />
                                            <YAxis domain={[0, 10]} />
                                            <Tooltip
                                                labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="score"
                                                name="Test Score"
                                                stroke="#8b5cf6"
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Attendance Analysis */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Attendance Distribution Pie Chart */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Distribution</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        {
                                                            name: 'Present',
                                                            value: attendanceData.filter(record => record.present).length
                                                        },
                                                        {
                                                            name: 'Absent',
                                                            value: attendanceData.filter(record => !record.present).length
                                                        }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#22c55e" />
                                                    <Cell fill="#ef4444" />
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Monthly Attendance Bar Chart */}
                                <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Attendance</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={getMonthlyAttendance(attendanceData)}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar name="Present Days" dataKey="present" fill="#22c55e" />
                                                <Bar name="Absent Days" dataKey="absent" fill="#ef4444" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Insights */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center text-sm">
                                        <FiTrendingUp className={`w-4 h-4 mr-2 ${mockPerformance.averageScore >= 7 ? 'text-green-500' : 'text-yellow-500'
                                            }`} />
                                        <span>
                                            Average mock test score is{' '}
                                            <span className="font-medium">
                                                {mockPerformance.averageScore}/10
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <FiCalendar className={`w-4 h-4 mr-2 ${attendancePercentage >= 80 ? 'text-green-500' : 'text-yellow-500'
                                            }`} />
                                        <span>
                                            Attendance rate is{' '}
                                            <span className="font-medium">
                                                {attendancePercentage}%
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <FiAward className={`w-4 h-4 mr-2 ${overallPerformance >= 80 ? 'text-green-500' : 'text-yellow-500'
                                            }`} />
                                        <span>
                                            Overall performance grade is{' '}
                                            <span className="font-medium">
                                                {getGradeLetter(overallPerformance)}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentProgressReport; 