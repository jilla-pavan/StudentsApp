const nodemailer = require('nodemailer');
const { generateRegistrationEmailContent, generateBatchAssignmentEmailContent } = require('../templates/emailTemplates');
const config = require('../config/emailConfig');

// Use the configured transporter from the emailConfig file
const transporter = config.transporter;

/**
 * Sends a registration confirmation email to a student
 * @param {Object} studentData - The student's information
 * @param {string} studentData.email - The student's email address
 * @param {string} studentData.name - The student's full name
 * @param {string} studentData.rollNumber - The student's roll number
 * @param {string} batchName - The name of the batch or "New Registration" for new users
 * @returns {Promise<Object>} - A promise that resolves with the email sending result
 * @throws {Error} - If email sending fails
 */
async function sendRegistrationConfirmationEmail(studentData, batchName) {
  // Input validation
  if (!studentData || typeof studentData !== "object") {
    throw new Error("Invalid student data provided");
  }

  if (!studentData.email || !studentData.name || !studentData.rollNumber) {
    throw new Error("Missing required student information");
  }

  if (!batchName || typeof batchName !== "string") {
    throw new Error("Invalid batch name provided");
  }

  try {
    // Generate a temporary password for the student
    const passwordBase = studentData.rollNumber || studentData.id?.slice(-6);
    const tempPassword = `CSA-${passwordBase}-${new Date().getFullYear()}`;

    // Generate the email content using the template
    const { html, text, subject } = generateRegistrationEmailContent(studentData, tempPassword);

    // Set up email data
    const mailOptions = {
      from: `"Career Sure Academy" <${process.env.EMAIL_USER}>`,
      to: studentData.email,
      subject,
      text,
      html
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    return {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
      studentEmail: studentData.email
    };
  } catch (error) {
    throw new Error(`Failed to send registration email: ${error.message}`);
  }
}

/**
 * Sends a batch assignment email with login credentials to a student
 * @param {Object} studentData - The student's information
 * @param {string} studentData.email - The student's email address
 * @param {string} studentData.name - The student's full name
 * @param {string} studentData.rollNumber - The student's roll number
 * @param {string} studentData.id - The student's ID to use as password
 * @param {string} batchName - The name of the batch assigned to the student
 * @returns {Promise<Object>} - A promise that resolves with the email sending result
 * @throws {Error} - If email sending fails
 */
async function sendBatchAssignmentEmail(studentData, batchName) {
  // Input validation
  if (!studentData || typeof studentData !== "object") {
    throw new Error("Invalid student data provided");
  }

  if (!studentData.email || !studentData.name || !studentData.rollNumber) {
    throw new Error("Missing required student information");
  }

  if (!studentData.id) {
    throw new Error("Student ID is required for login credentials");
  }

  if (!batchName || typeof batchName !== "string") {
    throw new Error("Invalid batch name provided");
  }

  try {
    // Generate a password based on student ID and roll number
    const passwordBase = studentData.rollNumber || studentData.id?.slice(-6);
    const password = `CSA-${passwordBase}-${new Date().getFullYear()}`;

    // Generate the email content using the template
    const { html, text, subject } = generateBatchAssignmentEmailContent(
      studentData, 
      batchName, 
      password,
      studentData.email,
      process.env.PLATFORM_URL || 'https://careersureacademy.com/dashboard'
    );

    // Set up email data
    const mailOptions = {
      from: `"Career Sure Academy" <${process.env.EMAIL_USER}>`,
      to: studentData.email,
      subject,
      text,
      html
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    return {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
      studentEmail: studentData.email
    };
  } catch (error) {
    throw new Error(`Failed to send batch assignment email: ${error.message}`);
  }
}

module.exports = {
  sendRegistrationConfirmationEmail,
  sendBatchAssignmentEmail,
};
