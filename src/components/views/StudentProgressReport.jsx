import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiPrinter, FiCalendar, FiBook, FiAward, FiTrendingUp, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { BiTime } from 'react-icons/bi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import logo from '../../../public/images/CSA_Logo.png';

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
        // Create a promise to load the image
        const loadImage = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = reject;
                img.src = src;
            });
        };

        // Load and convert the logo to base64
        loadImage(logo).then(logoBase64 => {
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
                                font-family: 'Segoe UI', Arial, sans-serif;
                                line-height: 1.6;
                                margin: 0;
                                padding: 0;
                                color: #1f2937;
                                background-color: #ffffff;
                            }
                            .header {
                                position: relative;
                                background: linear-gradient(135deg, #e65c00 0%, #f47b00 100%);
                                color: white;
                                padding: 20px 16px;
                                text-align: center;
                                margin-bottom: 24px;
                                border-bottom: 5px solid #cc5200;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                            }
                            .logo-container {
                                position: absolute;
                                left: 24px;
                                top: 50%;
                                transform: translateY(-50%);
                                background: white;
                                padding: 8px;
                                border-radius: 8px;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            }
                            .logo {
                                width: 48px;
                                height: 48px;
                                object-fit: contain;
                            }
                            .header-content {
                                flex-grow: 1;
                                text-align: center;
                            }
                            .header h1 {
                                font-size: 24px;
                                margin: 0;
                                margin-bottom: 4px;
                                font-weight: 800;
                                letter-spacing: -0.5px;
                            }
                            .header h2 {
                                font-size: 16px;
                                margin: 0;
                                font-weight: 500;
                                opacity: 0.9;
                            }
                            .watermark {
                                position: fixed;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%) rotate(-45deg);
                                font-size: 72px;
                                color: rgba(230, 92, 0, 0.03);
                                pointer-events: none;
                                z-index: 0;
                                white-space: nowrap;
                            }
                            .container {
                                max-width: 1200px;
                                margin: 0 auto;
                                padding: 0 16px;
                                position: relative;
                                z-index: 1;
                            }
                            .student-info {
                                background: #fff5eb;
                                border: 1px solid #e2e8f0;
                                border-radius: 16px;
                                padding: 16px;
                                margin-bottom: 24px;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                                position: relative;
                                overflow: hidden;
                            }
                            .student-info::before {
                                content: '';
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 4px;
                                background: linear-gradient(to right, #e65c00, #f47b00);
                            }
                            .section-title {
                                color: #e65c00;
                                font-size: 18px;
                                font-weight: 700;
                                margin-bottom: 16px;
                                padding-bottom: 6px;
                                border-bottom: 2px solid #e65c00;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            }
                            .section-title::before {
                                content: '';
                                display: inline-block;
                                width: 4px;
                                height: 20px;
                                background: #e65c00;
                                border-radius: 2px;
                            }
                            .info-grid {
                                display: grid;
                                grid-template-columns: repeat(2, 1fr);
                                gap: 16px;
                            }
                            .info-item {
                                display: flex;
                                justify-content: flex-start;
                                align-items: center;
                                padding: 12px 16px;
                                background: white;
                                border-radius: 8px;
                                border: 1px solid #e5e7eb;
                                transition: transform 0.2s;
                            }
                            .info-item:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                                border-color: #e65c00;
                            }
                            .info-label {
                                color: #6b7280;
                                font-weight: 600;
                                font-size: 14px;
                                width: 100px;
                                flex-shrink: 0;
                            }
                            .info-value {
                                color: #1f2937;
                                font-weight: 600;
                                font-size: 15px;
                                margin-left: 8px;
                            }
                            .info-colon {
                                color: #6b7280;
                                margin: 0 8px;
                            }
                            .performance-grid {
                                display: grid;
                                grid-template-columns: repeat(2, 1fr);
                                gap: 16px;
                                margin-bottom: 24px;
                            }
                            .performance-card {
                                background: white;
                                border: 1px solid #e5e7eb;
                                border-radius: 16px;
                                padding: 16px;
                                position: relative;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                                transition: transform 0.2s;
                            }
                            .performance-card:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
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
                                background-color: #e65c00;
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
                                margin-top: 32px;
                                text-align: center;
                                color: #6b7280;
                                font-size: 12px;
                                border-top: 2px solid #e5e7eb;
                                padding-top: 16px;
                                position: relative;
                            }
                            .footer::before {
                                content: '';
                                position: absolute;
                                top: -2px;
                                left: 50%;
                                transform: translateX(-50%);
                                width: 100px;
                                height: 2px;
                                background: #e65c00;
                            }
                            .footer-brand {
                                color: #e65c00;
                                font-weight: 700;
                                font-size: 14px;
                                margin-bottom: 8px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                            }
                            .footer-brand img {
                                width: 20px;
                                height: 20px;
                                object-fit: contain;
                            }
                            .qr-code {
                                position: absolute;
                                right: 24px;
                                bottom: 24px;
                                width: 64px;
                                height: 64px;
                                background: white;
                                padding: 8px;
                                border-radius: 8px;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            }
                            .logo-container img {
                                width: 60px;
                                height: 60px;
                                object-fit: contain;
                            }
                            .table-section {
                                margin-top: 24px;
                                background: white;
                                border-radius: 16px;
                                border: 1px solid #e2e8f0;
                                overflow: hidden;
                                page-break-inside: avoid;
                            }
                            .table-section .section-title {
                                color: #e65c00;
                                font-size: 20px;
                                font-weight: 700;
                                margin-bottom: 20px;
                                padding: 12px 16px;
                                border-bottom: 1px solid #e2e8f0;
                                background: #fff8f3;
                            }
                            table {
                                width: 100%;
                                border-collapse: collapse;
                            }
                            th {
                                background: #fff5eb;
                                color: #1f2937;
                                font-weight: 600;
                                font-size: 14px;
                                text-align: left;
                                padding: 8px 16px;
                                border-bottom: 1px solid #e2e8f0;
                            }
                            td {
                                padding: 8px 16px;
                                font-size: 12px;
                                border-bottom: 1px solid #e2e8f0;
                            }
                            tr:nth-child(even) {
                                background: #fff8f3;
                            }
                            .present-badge {
                                background: #fff5eb !important;
                                color: #e65c00 !important;
                            }
                            .score-badge {
                                background: #fff5eb !important;
                                color: #e65c00 !important;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="watermark">CAREER SURE ACADEMY</div>
                        <div class="header">
                            <div class="logo-container">
                                <img src="${logoBase64}" alt="Career Sure Academy" class="logo">
                            </div>
                            <div class="header-content">
                                <h1>Career Sure Academy</h1>
                                <h2>Student Progress Report</h2>
                            </div>
                        </div>

                        <div class="container">
                            <div class="student-info">
                                <div class="section-title">Student Information</div>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-label">Full Name</span>
                                        <span class="info-colon">:</span>
                                        <span class="info-value">${student.firstName} ${student.lastName}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Roll Number</span>
                                        <span class="info-colon">:</span>
                                        <span class="info-value">${student.rollNumber}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Batch</span>
                                        <span class="info-colon">:</span>
                                        <span class="info-value">${batch?.name || 'N/A'}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Email</span>
                                        <span class="info-colon">:</span>
                                        <span class="info-value">${student.email}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Contact</span>
                                        <span class="info-colon">:</span>
                                        <span class="info-value">${student.contactNumber || 'N/A'}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Join Date</span>
                                        <span class="info-colon">:</span>
                                        <span class="info-value">${batch?.startDate || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="section-title">Performance Summary</div>
                            <div class="performance-grid">
                                <div class="performance-card">
                                    <div class="card-header">
                                        <div class="icon-container">🏆</div>
                                        <span class="grade-badge">Grade ${getGradeLetter(overallPerformance)}</span>
                                    </div>
                                    <div class="score">${overallPerformance}%</div>
                                    <div class="label">Overall Performance</div>
                                </div>

                                <div class="performance-card">
                                    <div class="card-header">
                                        <div class="icon-container">📅</div>
                                        <span class="grade-badge">Grade ${getGradeLetter(attendancePercentage)}</span>
                                    </div>
                                    <div class="score">${attendancePercentage}%</div>
                                    <div class="label">Attendance Performance</div>
                                </div>

                                <div class="performance-card">
                                    <div class="card-header">
                                        <div class="icon-container">📚</div>
                                        <span class="grade-badge">Grade ${getGradeLetter(mockPerformance.averageScore * 10)}</span>
                                    </div>
                                    <div class="score">${(mockPerformance.averageScore * 10).toFixed(1)}%</div>
                                    <div class="label">Mock Test Performance</div>
                                </div>

                                <div class="performance-card">
                                    <div class="card-header">
                                        <div class="icon-container">📝</div>
                                        <span class="grade-badge">${mockPerformance.averageScore}/10</span>
                                    </div>
                                    <div class="score">${mockPerformance.passedTests}/${mockPerformance.totalTests}</div>
                                    <div class="label">Mock Tests Passed</div>
                                </div>
                            </div>

                            <!-- Attendance History Table -->
                            <div class="table-section">
                                <div class="section-title">Recent Attendance History</div>
                                <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                                    <thead>
                                        <tr style="background: #fff8f3;">
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Date</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Status</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Marked At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${attendanceData.slice(0, 10).map(record => `
                                            <tr>
                                                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                                                    ${new Date(record.date).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                                                    <span style="padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; 
                                                        ${record.present ? 'background: #fff3e6; color: #ff6b00;' : 'background: #fef2f2; color: #991b1b;'}">
                                                        ${record.present ? '✓ Present' : '✗ Absent'}
                                                    </span>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                                                    ${new Date(record.timestamp).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>

                            <!-- Mock Test History Table -->
                            <div class="table-section">
                                <div class="section-title">Mock Test History</div>
                                <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                                    <thead>
                                        <tr style="background: #fff8f3;">
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Test ID</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Date</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Score</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${student.mockScores?.map(score => `
                                            <tr>
                                                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${score.testId}</td>
                                                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                                                    ${score.createdAt ? new Date(score.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    }) : 'N/A'}
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                                                    <span style="padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; 
                                                        background: #fff5eb; color: #e65c00;">
                                                        ${score.score}/10
                                                    </span>
                                                </td>
                                                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                                                    <span style="padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500;
                                                        ${score.score >= 6 
                                                            ? 'background: #fff5eb; color: #e65c00;' 
                                                            : 'background: #fef2f2; color: #991b1b;'}">
                                                        ${score.score >= 6 ? '✓ Passed' : '✗ Failed'}
                                                    </span>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>

                            <div class="footer">
                                <div class="footer-brand">
                                    <img src="${logoBase64}" alt="CSA Logo">
                                    Career Sure Academy - Pathway To Career Success
                                </div>
                                <div>
                                    Generated on ${new Date().toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                                <img src="/qr-code.png" alt="Report QR Code" class="qr-code">
                            </div>
                        </div>
                    </body>
                </html>
            `;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();

            // Wait for images to load before printing
            printWindow.onload = function () {
                setTimeout(() => {
                    printWindow.print();
                    printWindow.onafterprint = function () {
                        printWindow.close();
                    };
                }, 1000); // Increased delay to ensure images are loaded
            };
        }).catch(error => {
            console.error('Error loading logo:', error);
            // Fallback to print without logo if image loading fails
            // ... implement fallback print logic here if needed
        });
    };

    const handleDownloadPDF = () => {
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

        // Header with darker orange
        doc.setFillColor(230, 92, 0); // #e65c00 - darker orange
        
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Career Sure Academy", pageWidth / 2, 10, { align: "center" });
        doc.setFontSize(12);
        doc.text("Student Progress Report", pageWidth / 2, 18, { align: "center" });

        // Student Information Section
        const infoStartY = 35;
        doc.setFillColor(255, 245, 235); // #fff5eb - lighter orange background
        doc.setDrawColor(230, 92, 0); // #e65c00 - darker orange border
        doc.roundedRect(margin, infoStartY, pageWidth - (2 * margin), 45, 2, 2, 'FD');

        // Student Information Title
        doc.setTextColor(230, 92, 0); // #e65c00 - darker orange text
        doc.setFontSize(14);
        doc.text("Student Information", margin + 5, infoStartY + 10);

        // Student Information Grid
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const colWidth = (pageWidth - (2 * margin) - 10) / 2;
        const labelWidth = 25; // Width for labels
        const colonPosition = labelWidth + 2; // Position for colons
        const valuePosition = colonPosition + 5; // Position for values

        // Left column
        const leftLabels = ["Full Name", "Batch", "Contact"];
        const leftValues = [
            `${student.firstName} ${student.lastName}`,
            `${batch?.name || 'N/A'}`,
            `${student.contactNumber || 'N/A'}`
        ];

        // Right column
        const rightLabels = ["Roll Number", "Email", "Join Date"];
        const rightValues = [
            `${student.rollNumber}`,
            `${student.email}`,
            `${batch?.startDate || 'N/A'}`
        ];

        // Function to draw a row with proper spacing
        const drawInfoRow = (label, value, x, y) => {
            doc.setTextColor(107, 114, 128); // Gray for label
            doc.text(label, x, y);
            doc.text(":", x + colonPosition, y);
            doc.setTextColor(31, 41, 55); // Dark for value
            doc.text(value, x + valuePosition, y);
        };

        // Draw left column
        leftLabels.forEach((label, index) => {
            const y = infoStartY + 20 + (index * 12);
            drawInfoRow(label, leftValues[index], margin + 5, y);
        });

        // Draw right column
        rightLabels.forEach((label, index) => {
            const y = infoStartY + 20 + (index * 12);
            drawInfoRow(label, rightValues[index], margin + colWidth + 5, y);
        });

        // Performance Summary Section
        const perfStartY = infoStartY + 60;
        doc.setTextColor(230, 92, 0); // #e65c00 - darker orange text
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Performance Summary", margin + 5, perfStartY);

        // Performance Cards
        const cardStartY = perfStartY + 10;
        const cardWidth = (pageWidth - (2 * margin) - 10) / 2;
        const cardHeight = 40;
        const cardGap = 10;

        // Helper function to draw performance cards
        function drawPerformanceCard({ x, y, grade, value, label }) {
            // Card background
            doc.setFillColor(255, 245, 235); // Lighter orange background
            doc.setDrawColor(230, 92, 0); // Darker orange border
            doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');

            // Grade badge
            doc.setFillColor(230, 92, 0); // Darker orange background for badge
            doc.setTextColor(255, 255, 255);
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

        // Draw performance cards
        drawPerformanceCard({
            x: margin,
            y: cardStartY,
            grade: `Grade ${getGradeLetter(overallPerformance)}`,
            value: `${overallPerformance}%`,
            label: 'Overall Performance'
        });

        drawPerformanceCard({
            x: margin + cardWidth + cardGap,
            y: cardStartY,
            grade: `Grade ${getGradeLetter(attendancePercentage)}`,
            value: `${attendancePercentage}%`,
            label: 'Attendance Performance'
        });

        drawPerformanceCard({
            x: margin,
            y: cardStartY + cardHeight + cardGap,
            grade: `Grade ${getGradeLetter(mockPerformance.averageScore * 10)}`,
            value: `${(mockPerformance.averageScore * 10).toFixed(1)}%`,
            label: 'Mock Test Performance'
        });

        drawPerformanceCard({
            x: margin + cardWidth + cardGap,
            y: cardStartY + cardHeight + cardGap,
            grade: `${mockPerformance.averageScore}/10`,
            value: `${mockPerformance.passedTests}/${mockPerformance.totalTests}`,
            label: 'Mock Tests Passed'
        });

        // Footer
        const footerY = pageHeight - 15;
        doc.setDrawColor(230, 92, 0); // Darker orange line
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        doc.setFontSize(8);
        doc.setTextColor(230, 92, 0); // Darker orange text for brand name
        doc.text(
            'Career Sure Academy - Pathway To Career Success',
            pageWidth / 2,
            footerY,
            { align: 'center' }
        );

        // Add page number
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128); // Gray text
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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FiArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Student Progress Report</h1>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-purple-100 flex items-center justify-center text-lg sm:text-xl font-bold text-purple-600">
                            {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                                {student.firstName} {student.lastName}
                            </h2>
                            <p className="text-sm sm:text-base text-gray-500">{student.email}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <button
                            onClick={handlePrint}
                            className="flex-1 sm:flex-none inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <FiPrinter className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            Print Report
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="flex-1 sm:flex-none inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent rounded-lg text-xs sm:text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                        >
                            <FiDownload className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats - Make cards stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                {/* Overall Performance Card */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg">
                            <FiAward className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                        </div>
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${getGradeColor(overallPerformance)}`}>
                            Grade {getGradeLetter(overallPerformance)}
                        </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{overallPerformance}%</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Overall Performance</p>
                </div>

                {/* Attendance Card */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
                            <FiCalendar className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${getGradeColor(attendancePercentage)}`}>
                            Grade {getGradeLetter(attendancePercentage)}
                        </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{attendancePercentage}%</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Attendance Rate</p>
                </div>

                {/* Mock Test Performance Card */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg">
                            <FiBook className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                        </div>
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${getGradeColor(calculateMockTestPercentage())}`}>
                            Grade {getGradeLetter(calculateMockTestPercentage())}
                        </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{(mockPerformance.averageScore * 10).toFixed(1)}%</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Mock Test Average</p>
                </div>

                {/* Tests Passed Card */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="p-1.5 sm:p-2 bg-yellow-50 rounded-lg">
                            <FiCheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
                        </div>
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-yellow-50 text-yellow-600">
                            {mockPerformance.averageScore.toFixed(1)}/10
                        </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                        {mockPerformance.passedTests}/{mockPerformance.totalTests}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">Tests Passed</p>
                </div>
            </div>

            {/* Detailed Progress - Make tabs scrollable on mobile */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 sm:mb-8">
                <div className="border-b border-gray-200 overflow-x-auto">
                    <nav className="flex -mb-px min-w-full">
                        {['overview', 'attendance', 'mock-tests', 'analytics'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-3 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 ${
                                    activeTab === tab
                                    ? 'border-purple-500 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Update content sections */}
                    {activeTab === 'overview' && (
                        <div className="space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 gap-4 sm:gap-6">
                                {/* Student Details */}
                                <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Student Information</h3>
                                    <div className="space-y-3 sm:space-y-4">
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

                    {/* Update charts for better mobile responsiveness */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-4 sm:space-y-6">
                            {/* Make charts responsive */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Mock Test Progress</h3>
                                <div className="h-60 sm:h-80">
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

                            {/* Make grid layout stack on mobile */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                {/* Attendance Distribution */}
                                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Attendance Distribution</h3>
                                    <div className="h-48 sm:h-64">
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

                                {/* Monthly Attendance */}
                                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Monthly Attendance</h3>
                                    <div className="h-48 sm:h-64">
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentProgressReport; 