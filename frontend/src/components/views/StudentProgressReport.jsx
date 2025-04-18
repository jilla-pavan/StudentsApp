import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiPrinter, FiCalendar, FiBook, FiAward, FiTrendingUp, FiCheckCircle, FiXCircle, FiDollarSign, FiClock } from 'react-icons/fi';
import { BiTime } from 'react-icons/bi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import logo from '../../../public/images/CSA_Logo.png';
import { useAuth } from '../../contexts/AuthContext';

const StudentProgressReport = ({ students, batches }) => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { userType, logout } = useAuth();
    const [student, setStudent] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [selectedAttendanceType, setSelectedAttendanceType] = useState('regular');
    const [attendanceData, setAttendanceData] = useState([
        {
            date: new Date().toISOString(),
            present: false,
            timestamp: new Date().toISOString()
        }
    ]);
    const printRef = useRef();
    const [mockTestFilters, setMockTestFilters] = useState({
        level: 'all',
        status: 'all',
        date: ''
    });
    const [attendanceFilters, setAttendanceFilters] = useState({
        startDate: '',
        endDate: '',
        status: 'all'
    });
    const [mockAttendanceFilters, setMockAttendanceFilters] = useState({
        startDate: '',
        endDate: '',
        status: 'all',
        level: 'all'
    });

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
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
                            <!-- Student Information -->
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

                            <!-- Performance Summary -->
                            <div class="performance-summary" style="margin-bottom: 32px;">
                                <div class="grid grid-cols-3 gap-6">
                                    <!-- Regular Class Attendance Card -->
                                    <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #e5e7eb; position: relative;">
                                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                                            <div style="background: #f0f7ff; padding: 8px; border-radius: 8px;">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 style="font-size: 16px; font-weight: 600; color: #3b82f6;">Class Attendance</h3>
                                                <p style="font-size: 14px; color: #6b7280;">Regular Class Attendance</p>
                                            </div>
                                        </div>
                                        <div style="position: absolute; top: 24px; right: 24px;">
                                            <span style="background: ${attendancePercentage >= 90 ? '#ecfdf5' :
                    attendancePercentage >= 80 ? '#f0f9ff' :
                        attendancePercentage >= 70 ? '#faf5ff' :
                            attendancePercentage >= 60 ? '#fef3c7' :
                                '#fef2f2'}; 
                                                   color: ${attendancePercentage >= 90 ? '#059669' :
                    attendancePercentage >= 80 ? '#0369a1' :
                        attendancePercentage >= 70 ? '#7e22ce' :
                            attendancePercentage >= 60 ? '#d97706' :
                                '#dc2626'}; 
                                                   padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600;">
                                                Grade ${getGradeLetter(attendancePercentage)}
                                            </span>
                                        </div>
                                        <div style="margin-bottom: 16px;">
                                            <div style="display: flex; align-items: baseline; gap: 8px;">
                                                <span style="font-size: 36px; font-weight: 700; color: #1f2937;">${attendancePercentage}%</span>
                                                <span style="font-size: 14px; color: #6b7280;">attendance rate</span>
                                            </div>
                                        </div>
                                        <div style="width: 100%; height: 8px; background: #f3f4f6; border-radius: 9999px; overflow: hidden;">
                                            <div style="width: ${attendancePercentage}%; height: 100%; 
                                                       background: ${attendancePercentage >= 75 ? '#22c55e' :
                    attendancePercentage >= 60 ? '#eab308' :
                        '#ef4444'}; 
                                                       border-radius: 9999px;"></div>
                                        </div>
                                    </div>

                                    <!-- Mock Attendance Card -->
                                    <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #e5e7eb; position: relative;">
                                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                                            <div style="background: #faf5ff; padding: 8px; border-radius: 8px;">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9333ea" stroke-width="2">
                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 style="font-size: 16px; font-weight: 600; color: #9333ea;">Mock Attendance</h3>
                                                <p style="font-size: 14px; color: #6b7280;">Mock Tests</p>
                                            </div>
                                        </div>
                                        <div style="position: absolute; top: 24px; right: 24px;">
                                            <span style="background: ${mockAttendancePercentage >= 90 ? '#ecfdf5' :
                    mockAttendancePercentage >= 80 ? '#f0f9ff' :
                        mockAttendancePercentage >= 70 ? '#faf5ff' :
                            mockAttendancePercentage >= 60 ? '#fef3c7' :
                                '#fef2f2'}; 
                                                   color: ${mockAttendancePercentage >= 90 ? '#059669' :
                    mockAttendancePercentage >= 80 ? '#0369a1' :
                        mockAttendancePercentage >= 70 ? '#7e22ce' :
                            mockAttendancePercentage >= 60 ? '#d97706' :
                                '#dc2626'}; 
                                                   padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600;">
                                                Grade ${getGradeLetter(mockAttendancePercentage)}
                                            </span>
                                        </div>
                                        <div style="margin-bottom: 16px;">
                                            <div style="display: flex; align-items: baseline; gap: 8px;">
                                                <span style="font-size: 36px; font-weight: 700; color: #1f2937;">${mockAttendancePercentage}%</span>
                                                <span style="font-size: 14px; color: #6b7280;">mock attendance</span>
                                            </div>
                                        </div>
                                        <div style="width: 100%; height: 8px; background: #f3f4f6; border-radius: 9999px; overflow: hidden;">
                                            <div style="width: ${mockAttendancePercentage}%; height: 100%; 
                                                       background: ${mockAttendancePercentage >= 75 ? '#22c55e' :
                    mockAttendancePercentage >= 60 ? '#eab308' :
                        '#ef4444'}; 
                                                       border-radius: 9999px;"></div>
                                        </div>
                                    </div>

                                    <!-- Mock Test Score Card -->
                                    <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #e5e7eb; position: relative;">
                                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                                            <div style="background: #f0fdf4; padding: 8px; border-radius: 8px;">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 style="font-size: 16px; font-weight: 600; color: #16a34a;">Mock Test Score</h3>
                                                <p style="font-size: 14px; color: #6b7280;">Average Performance</p>
                                            </div>
                                        </div>
                                        <div style="position: absolute; top: 24px; right: 24px;">
                                            <span style="background: ${mockTestPercentage >= 90 ? '#ecfdf5' :
                    mockTestPercentage >= 80 ? '#f0f9ff' :
                        mockTestPercentage >= 70 ? '#faf5ff' :
                            mockTestPercentage >= 60 ? '#fef3c7' :
                                '#fef2f2'}; 
                                                   color: ${mockTestPercentage >= 90 ? '#059669' :
                    mockTestPercentage >= 80 ? '#0369a1' :
                        mockTestPercentage >= 70 ? '#7e22ce' :
                            mockTestPercentage >= 60 ? '#d97706' :
                                '#dc2626'}; 
                                                   padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600;">
                                                Grade ${getGradeLetter(mockTestPercentage)}
                                            </span>
                                        </div>
                                        <div style="margin-bottom: 16px;">
                                            <div style="display: flex; align-items: baseline; gap: 8px;">
                                                <span style="font-size: 36px; font-weight: 700; color: #1f2937;">${mockTestPercentage}%</span>
                                                <span style="font-size: 14px; color: #6b7280;">average score</span>
                                            </div>
                                        </div>
                                        <div style="width: 100%; height: 8px; background: #f3f4f6; border-radius: 9999px; overflow: hidden;">
                                            <div style="width: ${mockTestPercentage}%; height: 100%; 
                                                      background: ${mockTestPercentage >= 75 ? '#22c55e' :
                    mockTestPercentage >= 60 ? '#eab308' :
                        '#ef4444'}; 
                                                      border-radius: 9999px;"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Attendance History Table -->
                            <div class="table-section">
                                <div class="section-title">Regular Attendance History</div>
                                <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                                    <thead>
                                        <tr style="background: #fff8f3;">
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Date</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Status</th>
                                            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${attendanceData.slice(0, 10).map(record => `
                                            <tr>
                                                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                                                    ${new Date(record.date).toLocaleDateString()}
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
                                                    ${new Date(score.createdAt).toLocaleDateString()}
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
                                    Generated on ${new Date().toLocaleDateString()}
                                </div>
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
                }, 1000);
            };
        }).catch(error => {
            console.error('Error loading logo:', error);
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
            // Determine colors based on percentage value
            const percentage = parseFloat(value);
            let fillColor, textColor;

            // Set colors based on performance
            if (percentage >= 90) {
                fillColor = [236, 253, 245]; // light green bg
                textColor = [5, 150, 105]; // green text
            } else if (percentage >= 80) {
                fillColor = [239, 246, 255]; // light blue bg
                textColor = [3, 105, 161]; // blue text
            } else if (percentage >= 70) {
                fillColor = [250, 245, 255]; // light purple bg
                textColor = [126, 34, 206]; // purple text
            } else if (percentage >= 60) {
                fillColor = [254, 243, 199]; // light yellow bg
                textColor = [217, 119, 6]; // yellow text
            } else {
                fillColor = [254, 242, 242]; // light red bg
                textColor = [220, 38, 38]; // red text
            }

            // Card background
            doc.setFillColor(255, 245, 235); // Lighter orange background
            doc.setDrawColor(230, 92, 0); // Darker orange border
            doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');

            // Grade badge with dynamic color
            doc.setFillColor(...textColor); // Use the text color for badge background
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

            // Progress bar background
            doc.setFillColor(243, 244, 246);
            doc.roundedRect(x + 10, y + cardHeight - 15, cardWidth - 20, 2, 1, 1, 'F');

            // Progress bar fill with dynamic color
            if (!isNaN(percentage)) {
                // Set progress bar color based on performance
                if (percentage >= 75) {
                    doc.setFillColor(34, 197, 94); // green
                } else if (percentage >= 60) {
                    doc.setFillColor(234, 179, 8); // yellow
                } else {
                    doc.setFillColor(239, 68, 68); // red
                }

                const progressWidth = Math.min(percentage, 100) * (cardWidth - 20) / 100;
                if (progressWidth > 0) {
                    doc.roundedRect(x + 10, y + cardHeight - 15, progressWidth, 2, 1, 1, 'F');
                }
            }
        }

        // Draw the performance cards with correct positioning
        drawPerformanceCard({
            x: margin,
            y: cardStartY,
            grade: `Grade ${getGradeLetter(attendancePercentage)}`,
            value: `${attendancePercentage}%`,
            label: 'Regular Attendance'
        });

        drawPerformanceCard({
            x: margin + cardWidth + cardGap,
            y: cardStartY,
            grade: `Grade ${getGradeLetter(mockAttendancePercentage)}`,
            value: `${mockAttendancePercentage}%`,
            label: 'Mock Attendance'
        });

        drawPerformanceCard({
            x: margin,
            y: cardStartY + cardHeight + cardGap,
            grade: `Grade ${getGradeLetter(mockTestPercentage)}`,
            value: `${mockTestPercentage}%`,
            label: 'Mock Test Score'
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

    const calculateAttendancePercentage = () => {
        if (!attendanceData || attendanceData.length === 0) {
            return 0;
        }
        const presentDays = attendanceData.filter(record => record.present).length;
        const totalDays = attendanceData.length;
        return totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    };

    const calculateMockAttendancePercentage = () => {
        if (!student.mockAttendance) {
            return 0;
        }

        let totalMockDays = 0;
        let presentMockDays = 0;

        // Iterate through all mock levels
        Object.values(student.mockAttendance).forEach(levelAttendance => {
            if (Array.isArray(levelAttendance)) {
                levelAttendance.forEach(record => {
                    totalMockDays++;
                    if (record.status === 'present') {
                        presentMockDays++;
                    }
                });
            }
        });

        return totalMockDays > 0 ? Math.round((presentMockDays / totalMockDays) * 100) : 0;
    };

    const calculateMockTestPercentage = () => {
        if (!student.mockScores || !Array.isArray(student.mockScores) || student.mockScores.length === 0) {
            return 0;
        }

        const totalTests = student.mockScores.length;
        const totalScore = student.mockScores.reduce((sum, score) => sum + score.score, 0);
        const averageScore = totalScore / totalTests;

        // Convert to percentage (since scores are out of 10)
        return Math.round((averageScore / 10) * 100);
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
        const progressData = scores.map(score => {
            // Validate and format date properly
            let validDate = score.date;

            // If date is invalid or not provided, use current date
            if (!score.date || isNaN(new Date(score.date).getTime())) {
                validDate = new Date().toISOString().split('T')[0]; // Use today's date in YYYY-MM-DD format
            }

            return {
                testId: score.testId,
                score: score.score,
                date: validDate
            };
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

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

    // Calculate all metrics
    const mockPerformance = calculateMockTestPerformance();
    const attendancePercentage = calculateAttendancePercentage();
    const mockAttendancePercentage = calculateMockAttendancePercentage();
    const mockTestPercentage = calculateMockTestPercentage();

    const calculateOverallPerformance = () => {
        // Convert mock test score to percentage (out of 100)
        const mockTestPercentage = mockPerformance.averageScore * 10 || 0;

        // Get attendance percentage with fallback to 0
        const attendancePercent = attendancePercentage || 0;

        // Calculate cumulative average
        const overall = (mockTestPercentage + attendancePercent) / 2;

        return Math.round(overall) || 0;
    };

    const overallPerformance = calculateOverallPerformance();

    const getStatusColor = (score) => {
        if (score >= 8) return 'bg-green-100 text-green-800 ring-green-600/20';
        if (score >= 6) return 'bg-blue-100 text-blue-800 ring-blue-600/20';
        return 'bg-red-100 text-red-800 ring-red-600/20';
    };

    // Add these helper functions
    const getScoreColor = (score) => {
        if (score >= 8) return 'bg-green-100 text-green-800 ring-green-600/20';
        if (score >= 6) return 'bg-blue-100 text-blue-800 ring-blue-600/20';
        return 'bg-red-100 text-red-800 ring-red-600/20';
    };

    const getScoreLabel = (score) => {
        if (score >= 8) return 'Excellent';
        if (score >= 6) return 'Passed';
        return 'Failed';
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 75) return 'bg-green-500';
        if (percentage >= 50) return 'bg-blue-500';
        return 'bg-red-500';
    };

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
            {/* Fee Payment Check */}
            {student && !student.feePaid && userType === 'student' ? (
                <div className="min-h-[80vh] flex flex-col items-center justify-center">
                    <div className="max-w-xl w-full bg-white rounded-xl shadow-lg border-t-4 border-blue-500 p-8 sm:p-10">
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-blue-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 text-center">Connect with our Sales Team</h2>

                            <div className="w-16 h-1 bg-blue-500 rounded mb-6"></div>

                            <p className="text-lg text-gray-700 mb-6 text-center leading-relaxed">
                                Our sales team is ready to assist you to ensure uninterrupted access.
                            </p>

                            <div className="w-full mb-6 bg-gray-50 rounded-lg p-4 sm:p-5 md:p-6 max-w-xs sm:max-w-sm md:max-w-md mx-auto shadow-sm hover:shadow transition-all duration-300">
                                <div className="flex items-center mb-4 pl-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-medium text-gray-900 pl-1">Sales Team Contact</span>
                                </div>

                                <div className="space-y-3 pl-1">
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span className="text-gray-700 break-all">+91 6301046346</span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span className="text-gray-700 break-all">+91 8919734391</span>
                                    </div>

                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-gray-700 break-all">careersure.info@gmail.com</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
                                <button
                                    onClick={() => logout()}
                                    className="flex-1 py-3 text-white font-medium bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-colors focus:outline-none"
                                >
                                    Return to Login
                                </button>

                                <a
                                    href="mailto:careersure.info@gmail.com"
                                    className="flex-1 py-3 text-blue-600 font-medium bg-white hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors focus:outline-none text-center"
                                >
                                    Contact Sales Team
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                            {userType === 'admin' && (
                                <button
                                    onClick={() => navigate(-1)}
                                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <FiArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            )}
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
                                    {batch && <p className="text-sm sm:text-base text-gray-500"> <span className="font-bold">Batch:</span> {batch?.name || 'N/A'}</p>}
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

                    {/* Quick Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                        {/* Class Attendance Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-md border border-blue-100 p-6 hover:shadow-lg transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <FiCalendar className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-600">Class Attendance</h3>
                                        <p className="text-xs text-blue-500">Regular Class Attendance</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${attendancePercentage >= 75 ? 'bg-green-100 text-green-700' :
                                    attendancePercentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    Grade {getGradeLetter(attendancePercentage)}
                                </span>
                            </div>
                            <div className="mt-2">
                                <div className="flex items-baseline">
                                    <h2 className="text-4xl font-bold text-gray-900">{attendancePercentage}%</h2>
                                    <span className="ml-2 text-sm text-gray-500">attendance rate</span>
                                </div>
                                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${attendancePercentage >= 75 ? 'bg-green-500' :
                                            attendancePercentage >= 60 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}
                                        style={{ width: `${attendancePercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mock Attendance Card */}
                        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-md border border-purple-100 p-6 hover:shadow-lg transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="p-3 bg-purple-100 rounded-xl">
                                        <FiBook className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-purple-600">Mock Attendance</h3>
                                        <p className="text-xs text-purple-500">Mock Tests</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${mockAttendancePercentage >= 75 ? 'bg-green-100 text-green-700' :
                                    mockAttendancePercentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    Grade {getGradeLetter(mockAttendancePercentage)}
                                </span>
                            </div>
                            <div className="mt-2">
                                <div className="flex items-baseline">
                                    <h2 className="text-4xl font-bold text-gray-900">{mockAttendancePercentage}%</h2>
                                    <span className="ml-2 text-sm text-gray-500">mock attendance</span>
                                </div>
                                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${mockAttendancePercentage >= 75 ? 'bg-green-500' :
                                            mockAttendancePercentage >= 60 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}
                                        style={{ width: `${mockAttendancePercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mock Test Score Card */}
                        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-md border border-green-100 p-6 hover:shadow-lg transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="p-3 bg-green-100 rounded-xl">
                                        <FiCheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-green-600">Mock Test Score</h3>
                                        <p className="text-xs text-green-500">Average Performance</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${mockTestPercentage >= 75 ? 'bg-green-100 text-green-700' :
                                    mockTestPercentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    Grade {getGradeLetter(mockTestPercentage)}
                                </span>
                            </div>
                            <div className="mt-2">
                                <div className="flex items-baseline">
                                    <h2 className="text-4xl font-bold text-gray-900">{mockTestPercentage}%</h2>
                                    <span className="ml-2 text-sm text-gray-500">average score</span>
                                </div>
                                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${mockTestPercentage >= 75 ? 'bg-green-500' :
                                            mockTestPercentage >= 60 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}
                                        style={{ width: `${mockTestPercentage}%` }}
                                    />
                                </div>
                            </div>
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
                                        className={`py-3 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === tab
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
                                                    <span className={`text-gray-900 font-medium ${student.batchId === 'unassigned' ? 'text-yellow-600' : ''}`}>
                                                        {student.batchId === 'unassigned'
                                                            ? 'Batch will be assigned soon'
                                                            : (batch?.name || 'N/A')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Roll Number</span>
                                                    <span className={`text-gray-900 font-medium ${student.rollNumber === 'unassigned' ? 'text-blue-600' : ''}`}>
                                                        {student.rollNumber === 'unassigned'
                                                            ? 'Roll Number will be assigned shortly'
                                                            : student.rollNumber}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Contact</span>
                                                    <span className="text-gray-900 font-medium">{student.contactNumber}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Joined Date</span>
                                                    <span className={`text-gray-900 font-medium ${!batch?.startDate || student.batchId === 'unassigned' ? 'text-gray-500 italic' : ''}`}>
                                                        {!batch?.startDate || student.batchId === 'unassigned'
                                                            ? 'Start date will be updated soon'
                                                            : batch.startDate}
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
                                                        tickFormatter={(date) => {
                                                            try {
                                                                const dateObj = new Date(date);
                                                                return !isNaN(dateObj)
                                                                    ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                                    : 'N/A';
                                                            } catch (e) {
                                                                return 'N/A';
                                                            }
                                                        }}
                                                    />
                                                    <YAxis domain={[0, 10]} />
                                                    <Tooltip
                                                        labelFormatter={(date) => {
                                                            try {
                                                                const dateObj = new Date(date);
                                                                return !isNaN(dateObj)
                                                                    ? dateObj.toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric',
                                                                    })
                                                                    : 'N/A';
                                                            } catch (e) {
                                                                return 'N/A';
                                                            }
                                                        }}
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

                            {activeTab === 'attendance' && (
                                <div className="space-y-6">
                                    {/* Attendance Type Filter */}
                                    <div className="flex items-center justify-center space-x-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
                                        <button
                                            onClick={() => setSelectedAttendanceType('regular')}
                                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${selectedAttendanceType === 'regular'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            Regular Attendance
                                        </button>
                                        <button
                                            onClick={() => setSelectedAttendanceType('mock')}
                                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${selectedAttendanceType === 'mock'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            Mock Test Attendance
                                        </button>
                                    </div>

                                    {/* Single Attendance Summary Card */}
                                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                                        <div className="flex items-center space-x-4 mb-6">
                                            <div className="p-3 bg-blue-100 rounded-xl">
                                                <FiCalendar className="w-8 h-8 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900">
                                                    {selectedAttendanceType === 'regular' ? 'Regular Class Attendance' : 'Mock Test Attendance'}
                                                </h3>

                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Show only selected attendance type */}
                                            {selectedAttendanceType === 'regular' ? (
                                                /* Regular Class Attendance */
                                                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100 lg:col-span-2">
                                                    <div className="mb-4">
                                                        <h4 className="text-lg font-semibold text-blue-800">Regular Classes</h4>
                                                        <div className="flex items-baseline mt-2">
                                                            <div className="text-4xl font-bold text-gray-900">{attendancePercentage}%</div>
                                                            <div className="ml-2 text-sm text-gray-500">attendance rate</div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-sm font-medium text-gray-500">Present/Total</span>
                                                                <span className="text-lg font-bold text-blue-600">
                                                                    {attendanceData.filter(record => record.present).length}/{attendanceData.length}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                                <div
                                                                    className="bg-blue-600 h-2.5 rounded-full"
                                                                    style={{ width: `${attendancePercentage}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="pt-2 border-t border-blue-100">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-medium text-gray-500">Absent Days</span>
                                                                <span className="text-lg font-bold text-red-600">
                                                                    {attendanceData.length - attendanceData.filter(record => record.present).length}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Mock Test Attendance */
                                                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100 lg:col-span-2">
                                                    <div className="mb-4">
                                                        <h4 className="text-lg font-semibold text-purple-800">Mock Test Attendance</h4>
                                                        <div className="flex items-baseline mt-2">
                                                            <div className="text-4xl font-bold text-gray-900">{mockAttendancePercentage}%</div>
                                                            <div className="ml-2 text-sm text-gray-500">attendance rate</div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {(() => {
                                                            let totalMockDays = 0;
                                                            let presentMockDays = 0;

                                                            if (student.mockAttendance) {
                                                                Object.values(student.mockAttendance).forEach(levelAttendance => {
                                                                    if (Array.isArray(levelAttendance)) {
                                                                        levelAttendance.forEach(record => {
                                                                            totalMockDays++;
                                                                            if (record.status === 'present') {
                                                                                presentMockDays++;
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }

                                                            return (
                                                                <>
                                                                    <div>
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <span className="text-sm font-medium text-gray-500">Present/Total</span>
                                                                            <span className="text-lg font-bold text-purple-600">
                                                                                {presentMockDays}/{totalMockDays}
                                                                            </span>
                                                                        </div>
                                                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                                            <div
                                                                                className="bg-purple-600 h-2.5 rounded-full"
                                                                                style={{ width: `${mockAttendancePercentage}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="pt-2 border-t border-purple-100">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-sm font-medium text-gray-500">Absent Days</span>
                                                                            <span className="text-lg font-bold text-red-600">
                                                                                {totalMockDays - presentMockDays}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Show only the selected attendance history table */}
                                    {selectedAttendanceType === 'regular' ? (
                                        /* Regular Attendance History Table */
                                        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                                            <div className="p-6 border-b border-gray-200">
                                                <div className="flex flex-col space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900">Regular Attendance History</h3>
                                                            <p className="mt-1 text-sm text-gray-500">Detailed record of daily attendance</p>
                                                        </div>
                                                    </div>

                                                    {/* Filters Section */}
                                                    <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-500">From:</span>
                                                            <input
                                                                type="date"
                                                                value={attendanceFilters.startDate}
                                                                onChange={(e) => setAttendanceFilters(prev => ({
                                                                    ...prev,
                                                                    startDate: e.target.value
                                                                }))}
                                                                className="rounded-md border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-500">To:</span>
                                                            <input
                                                                type="date"
                                                                value={attendanceFilters.endDate}
                                                                onChange={(e) => setAttendanceFilters(prev => ({
                                                                    ...prev,
                                                                    endDate: e.target.value
                                                                }))}
                                                                className="rounded-md border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                                                            />
                                                        </div>
                                                        <select
                                                            value={attendanceFilters.status}
                                                            onChange={(e) => setAttendanceFilters(prev => ({
                                                                ...prev,
                                                                status: e.target.value
                                                            }))}
                                                            className="rounded-md border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                                                        >
                                                            <option value="all">All Status</option>
                                                            <option value="present">Present</option>
                                                            <option value="absent">Absent</option>
                                                        </select>
                                                        <button
                                                            onClick={() => setAttendanceFilters({
                                                                startDate: '',
                                                                endDate: '',
                                                                status: 'all'
                                                            })}
                                                            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                                        >
                                                            Clear Filters
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Date
                                                            </th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Day
                                                            </th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Status
                                                            </th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Time
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {attendanceData
                                                            .filter(record => {
                                                                // Filter by date range
                                                                const recordDate = new Date(record.date);
                                                                const startDate = attendanceFilters.startDate ? new Date(attendanceFilters.startDate) : null;
                                                                const endDate = attendanceFilters.endDate ? new Date(attendanceFilters.endDate) : null;

                                                                const dateInRange = (!startDate || recordDate >= startDate) &&
                                                                    (!endDate || recordDate <= endDate);

                                                                // Filter by status
                                                                const statusMatch = attendanceFilters.status === 'all' ||
                                                                    (attendanceFilters.status === 'present' && record.present) ||
                                                                    (attendanceFilters.status === 'absent' && !record.present);

                                                                return dateInRange && statusMatch;
                                                            })
                                                            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Always sort by date (newest first)
                                                            .map((record, index) => (
                                                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {new Date(record.date).toLocaleDateString()}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.present
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-red-100 text-red-800'
                                                                            }`}>
                                                                            {record.present ? 'Present' : 'Absent'}
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
                                        </div>
                                    ) : (
                                        /* Mock Test Attendance History Table */
                                        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                                            <div className="p-6 border-b border-gray-200">
                                                <div className="flex flex-col space-y-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">Mock Test Attendance History</h3>
                                                        <p className="mt-1 text-sm text-gray-500">Detailed record of mock test attendance</p>
                                                    </div>

                                                    {/* Filters Section */}
                                                    <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-500">From:</span>
                                                            <input
                                                                type="date"
                                                                value={mockAttendanceFilters.startDate}
                                                                onChange={(e) => setMockAttendanceFilters(prev => ({
                                                                    ...prev,
                                                                    startDate: e.target.value
                                                                }))}
                                                                className="rounded-md border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-500">To:</span>
                                                            <input
                                                                type="date"
                                                                value={mockAttendanceFilters.endDate}
                                                                onChange={(e) => setMockAttendanceFilters(prev => ({
                                                                    ...prev,
                                                                    endDate: e.target.value
                                                                }))}
                                                                className="rounded-md border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                                                            />
                                                        </div>
                                                        <select
                                                            value={mockAttendanceFilters.status}
                                                            onChange={(e) => setMockAttendanceFilters(prev => ({
                                                                ...prev,
                                                                status: e.target.value
                                                            }))}
                                                            className="rounded-md border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                                                        >
                                                            <option value="all">All Status</option>
                                                            <option value="present">Present</option>
                                                            <option value="absent">Absent</option>
                                                        </select>
                                                        <select
                                                            value={mockAttendanceFilters.level}
                                                            onChange={(e) => setMockAttendanceFilters(prev => ({
                                                                ...prev,
                                                                level: e.target.value
                                                            }))}
                                                            className="rounded-md border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                                                        >
                                                            <option value="all">All Levels</option>
                                                            {student.mockAttendance &&
                                                                Object.keys(student.mockAttendance)
                                                                    .filter(key => !isNaN(key))
                                                                    .sort((a, b) => Number(a) - Number(b))
                                                                    .map(level => (
                                                                        <option key={level} value={level}>Level {level}</option>
                                                                    ))
                                                            }
                                                        </select>
                                                        <button
                                                            onClick={() => setMockAttendanceFilters({
                                                                startDate: '',
                                                                endDate: '',
                                                                status: 'all',
                                                                level: 'all'
                                                            })}
                                                            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                                        >
                                                            Clear Filters
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Date
                                                            </th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Mock Level
                                                            </th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Status
                                                            </th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Time
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {(() => {
                                                            const mockAttendanceRecords = [];

                                                            if (student.mockAttendance) {
                                                                Object.entries(student.mockAttendance).forEach(([level, records]) => {
                                                                    if (Array.isArray(records)) {
                                                                        records.forEach(record => {
                                                                            mockAttendanceRecords.push({
                                                                                ...record,
                                                                                level
                                                                            });
                                                                        });
                                                                    }
                                                                });
                                                            }

                                                            return mockAttendanceRecords
                                                                .filter(record => {
                                                                    // Filter by date range
                                                                    const recordDate = new Date(record.date);
                                                                    const startDate = mockAttendanceFilters.startDate ? new Date(mockAttendanceFilters.startDate) : null;
                                                                    const endDate = mockAttendanceFilters.endDate ? new Date(mockAttendanceFilters.endDate) : null;

                                                                    const dateInRange = (!startDate || recordDate >= startDate) &&
                                                                        (!endDate || recordDate <= endDate);

                                                                    // Filter by status
                                                                    const statusMatch = mockAttendanceFilters.status === 'all' ||
                                                                        (mockAttendanceFilters.status === 'present' && record.status === 'present') ||
                                                                        (mockAttendanceFilters.status === 'absent' && record.status === 'absent');

                                                                    // Filter by level
                                                                    const levelMatch = mockAttendanceFilters.level === 'all' ||
                                                                        record.level === mockAttendanceFilters.level;

                                                                    return dateInRange && statusMatch && levelMatch;
                                                                })
                                                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                                .map((record, index) => (
                                                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                            {new Date(record.date).toLocaleDateString()}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                                Level {record.level}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.status === 'present'
                                                                                ? 'bg-green-100 text-green-800'
                                                                                : 'bg-red-100 text-red-800'
                                                                                }`}>
                                                                                {record.status === 'present' ? 'Present' : 'Absent'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                            {record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : 'N/A'}
                                                                        </td>
                                                                    </tr>
                                                                ));
                                                        })()}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'mock-tests' && (
                                <div className="space-y-6">
                                    {/* Performance Overview Card */}
                                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg border border-purple-100 p-6 hover:shadow-xl transition-all duration-300">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900">Mock Test Performance</h3>
                                                <p className="text-sm text-gray-500">Overall performance across all mock tests</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(mockTestPercentage)}`}>
                                                    Grade {getGradeLetter(mockTestPercentage)}
                                                </span>
                                                <span className="text-2xl font-bold text-gray-900">{mockTestPercentage}%</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-100 rounded-lg">
                                                        <FiBook className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Total Tests</p>
                                                        <p className="text-xl font-semibold text-gray-900">{student.mockScores?.length || 0}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                        <FiCheckCircle className="w-5 h-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Tests Cleared</p>
                                                        <p className="text-xl font-semibold text-gray-900">
                                                            {student.mockScores?.filter(score => score.score >= 6).length || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-yellow-100 rounded-lg">
                                                        <FiClock className="w-5 h-5 text-yellow-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Current Mock</p>
                                                        <p className="text-xl font-semibold text-gray-900">
                                                            {student.currentMockTest || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <FiTrendingUp className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Highest Score</p>
                                                        <p className="text-xl font-semibold text-gray-900">
                                                            {student.mockScores?.length ?
                                                                Math.max(...student.mockScores.map(score => score.score)) : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                    {/* Mock Test History with Enhanced Filters */}
                                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                                        <div className="p-6 border-b border-gray-200">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div>
                                                    <h3 className="text-xl font-semibold text-gray-900">Test History</h3>
                                                    <p className="mt-1 text-sm text-gray-500">Detailed record of all mock tests attempted</p>
                                                </div>
                                                <div className="flex flex-wrap gap-3">
                                                    <select
                                                        value={mockTestFilters.level}
                                                        onChange={(e) => setMockTestFilters(prev => ({ ...prev, level: e.target.value }))}
                                                        className="rounded-md border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500 hover:border-gray-400 transition-colors"
                                                    >
                                                        <option value="all">All Levels</option>
                                                        {Array.from(new Set(student.mockScores?.map(s => s.testId))).sort().map(level => (
                                                            <option key={level} value={level}>Level {level}</option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        value={mockTestFilters.status}
                                                        onChange={(e) => setMockTestFilters(prev => ({ ...prev, status: e.target.value }))}
                                                        className="rounded-md border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500 hover:border-gray-400 transition-colors"
                                                    >
                                                        <option value="all">All Status</option>
                                                        <option value="cleared">Cleared</option>
                                                        <option value="not_cleared">Not Cleared</option>
                                                    </select>
                                                    <input
                                                        type="date"
                                                        value={mockTestFilters.date}
                                                        onChange={(e) => setMockTestFilters(prev => ({ ...prev, date: e.target.value }))}
                                                        className="rounded-md border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500 hover:border-gray-400 transition-colors"
                                                    />
                                                    <button
                                                        onClick={() => setMockTestFilters({ level: 'all', status: 'all', date: '' })}
                                                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                                    >
                                                        Clear Filters
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Level
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Score
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {student.mockScores
                                                        ?.filter(score => {
                                                            const levelMatch = mockTestFilters.level === 'all' || score.testId.toString() === mockTestFilters.level;
                                                            const statusMatch = mockTestFilters.status === 'all' ||
                                                                (mockTestFilters.status === 'cleared' && score.score >= 6) ||
                                                                (mockTestFilters.status === 'not_cleared' && score.score < 6);
                                                            const dateMatch = !mockTestFilters.date ||
                                                                new Date(score.date).toLocaleDateString() === new Date(mockTestFilters.date).toLocaleDateString();
                                                            return levelMatch && statusMatch && dateMatch;
                                                        })
                                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                        .map((score, index) => (
                                                            <tr key={index}
                                                                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ring-1 ring-purple-600/20">
                                                                        Level {score.testId}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {new Date(score.createdAt).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(score.score)} ring-1`}
                                                                            title={`${getScoreLabel(score.score)} - ${score.score}/10`}>
                                                                            {score.score}/10
                                                                        </span>
                                                                        {score.score === Math.max(...student.mockScores.map(s => s.score)) && (
                                                                            <span className="text-amber-500" title="Highest Score">
                                                                                <FiAward className="w-4 h-4" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${score.score >= 6
                                                                        ? 'bg-green-100 text-green-800 ring-1 ring-green-600/20'
                                                                        : 'bg-red-100 text-red-800 ring-1 ring-red-600/20'
                                                                        }`}>
                                                                        {score.score >= 6 ? (
                                                                            <>
                                                                                <FiCheckCircle className="w-3.5 h-3.5" />
                                                                                Cleared
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <FiXCircle className="w-3.5 h-3.5" />
                                                                                Not Cleared
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
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default StudentProgressReport; 