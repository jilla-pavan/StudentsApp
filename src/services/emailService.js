/**
 * Email Utility Service
 * This service connects to our Node.js backend for sending emails
 */

// API URL for our Node.js backend
const API_URL = 'http://localhost:5000/api';

// Custom notification messages for better UX
export const EMAIL_NOTIFICATIONS = {
  BATCH_ASSIGNMENT: {
    SENDING: "Sending batch assignment email with login credentials...",
    SUCCESS: "Login credentials sent successfully to student's email!",
    ERROR: "Failed to send login credentials. Please try again.",
  },
  REGISTRATION: {
    SENDING: "Sending registration confirmation email...",
    SUCCESS: "Registration confirmation email sent successfully!",
    ERROR: "Failed to send registration email. Please try again.",
  }
};

/**
 * Sends a registration confirmation email to a student
 * This will call our Node.js backend API
 * 
 * @param {Object} student - The student object with information
 * @param {String} batchName - The name of the batch (should be "New Registration")
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendRegistrationConfirmationEmail = async (student, batchName) => {
  try {
    // Validate input data
    if (!student) {
      throw new Error('Student information is missing');
    }
    
    if (!student.email) {
      throw new Error('Student email is required');
    }
    
    if (!student.name) {
      throw new Error('Student name is required');
    }
    
    // For registration, we should always use "New Registration" as the batch name
    const registrationBatchName = "New Registration";
    
    // Ensure student has a roll number (use ID if not assigned)
    if (!student.rollNumber || student.rollNumber === 'unassigned') {
      student = {
        ...student,
        rollNumber: student.id ? student.id.slice(-6).toUpperCase() : 'PENDING'
      };
    }

    // Call the Node.js backend API to send the email
    const response = await fetch(`${API_URL}/email/send-registration-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentData: student,
        batchName: registrationBatchName,
      }),
    }).catch(error => {
      throw new Error('Network error while connecting to email server');
    });

    if (!response) {
      throw new Error('Failed to connect to email server');
    }
    
    const data = await response.json().catch(error => {
      throw new Error('Received invalid response from email server');
    });
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email');
    }

    return {
      ...data,
      studentEmail: student.email,
      studentName: student.name
    };
  } catch (error) {
    // Throw a more user-friendly error
    throw new Error('Failed to send registration confirmation email. Please check logs for details.');
  }
};

/**
 * Checks if a student's batch has been changed from 'unassigned' to a real batch
 * 
 * @param {Object} oldStudent - Previous student data
 * @param {Object} newStudent - Updated student data
 * @returns {Boolean} - True if batch was just assigned
 */
export const isBatchAssigned = (oldStudent, newStudent) => {
  const result = (
    oldStudent && 
    newStudent && 
    (oldStudent.batchId === 'unassigned' || !oldStudent.batchId) && 
    newStudent.batchId && 
    newStudent.batchId !== 'unassigned'
  );
  
  return result;
};

/**
 * Validates if an email address is properly formatted
 * 
 * @param {String} email - Email address to validate
 * @returns {Boolean} - True if email is valid
 */
export const isValidEmail = (email) => {
  if (!email) {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  return isValid;
};

/**
 * Sends a batch assignment email with login credentials to a student
 * This will call our Node.js backend API using the dedicated batch assignment endpoint
 * 
 * @param {Object} student - The student object with information (must include ID for password)
 * @param {String} batchName - The name of the batch
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendBatchAssignmentEmail = async (student, batchName) => {
  try {
    // Validate input data
    if (!student) {
      throw new Error('Student information is missing');
    }
    
    if (!student.email) {
      throw new Error('Student email is required');
    }
    
    if (!student.name) {
      throw new Error('Student name is required');
    }
    
    if (!student.id) {
      throw new Error('Student ID is required for login credentials');
    }
    
    if (!student.rollNumber || student.rollNumber === 'unassigned') {
      throw new Error('Student roll number is required for batch assignment');
    }
    
    if (!batchName) {
      throw new Error('Batch name is required');
    }

    // Ensure the batch name is not "New Registration"
    if (batchName === "New Registration") {
      throw new Error('Invalid batch name for assignment email');
    }

    let response;
    try {
      response = await fetch(`${API_URL}/email/send-batch-assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentData: student,
          batchName: batchName,
        }),
      });
    } catch (error) {
      throw new Error('Network error while connecting to email server');
    }

    if (!response) {
      throw new Error('Failed to connect to email server');
    }
    
    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error('Received invalid response from email server');
    }
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email');
    }

    return {
      ...data,
      studentEmail: student.email,
      studentName: student.name
    };
  } catch (error) {
    throw new Error(`Failed to send batch assignment email: ${error.message}`);
  }
}; 