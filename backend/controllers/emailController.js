const emailService = require('../services/emailService');

/**
 * Send a registration confirmation email to a student
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response
 */
const sendRegistrationConfirmationEmail = async (req, res) => {
  try {
    const { studentData, batchName } = req.body;
    
    // Validate request
    if (!studentData) {
      console.error('❌ EMAIL CONTROLLER ERROR: Missing studentData in request');
      return res.status(400).json({
        success: false,
        message: 'Missing required data: studentData'
      });
    }
    
    if (!batchName) {
      console.error('❌ EMAIL CONTROLLER ERROR: Missing batchName in request');
      return res.status(400).json({
        success: false,
        message: 'Missing required data: batchName'
      });
    }
    
    // Validate student has required fields
    if (!studentData.email) {
      console.error('❌ EMAIL CONTROLLER ERROR: Student data missing email:', JSON.stringify(studentData, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Student email is required'
      });
    }
    
    if (!studentData.name) {
      console.error('❌ EMAIL CONTROLLER ERROR: Student data missing name:', JSON.stringify(studentData, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Student name is required'
      });
    }
    
    // Send the email
    try {
      const result = await emailService.sendRegistrationConfirmationEmail(studentData, batchName);
      
      return res.status(200).json({
        success: true,
        messageId: result.messageId,
        message: `Registration confirmation email sent to ${studentData.email}`
      });
    } catch (serviceError) {
      console.error('❌ EMAIL CONTROLLER ERROR: Email service error:', serviceError);
      throw serviceError;
    }
  } catch (error) {
    console.error('❌ EMAIL CONTROLLER ERROR: Unexpected error:', error);
    if (error.stack) {
      console.error('❌ ERROR STACK:', error.stack);
    }
    
    // Check if the error is already a structured object
    if (error && error.success === false) {
      return res.status(500).json(error);
    }
    
    // Otherwise construct a standard error response
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send email',
      error: {
        code: error.code || 'UNKNOWN',
        message: error.message || 'Unknown error'
      }
    });
  }
};

/**
 * Send a batch assignment email with login credentials to a student 
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response
 */
const sendBatchAssignmentEmail = async (req, res) => {
  try {
    const { studentData, batchName } = req.body;
    
    // Validate request
    if (!studentData) {
      console.error('❌ EMAIL CONTROLLER ERROR: Missing studentData in request');
      return res.status(400).json({
        success: false,
        message: 'Missing required data: studentData'
      });
    }
    
    if (!batchName) {
      console.error('❌ EMAIL CONTROLLER ERROR: Missing batchName in request');
      return res.status(400).json({
        success: false,
        message: 'Missing required data: batchName'
      });
    }
    
    // Validate student has required fields
    if (!studentData.email) {
      console.error('❌ EMAIL CONTROLLER ERROR: Student data missing email:', JSON.stringify(studentData, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Student email is required'
      });
    }
    
    if (!studentData.name) {
      console.error('❌ EMAIL CONTROLLER ERROR: Student data missing name:', JSON.stringify(studentData, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Student name is required'
      });
    }
    
    if (!studentData.id) {
      console.error('❌ EMAIL CONTROLLER ERROR: Student data missing ID:', JSON.stringify(studentData, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Student ID is required for login credentials'
      });
    }
    
    if (!studentData.rollNumber) {
      console.error('❌ EMAIL CONTROLLER ERROR: Student data missing roll number:', JSON.stringify(studentData, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Student roll number is required'
      });
    }
    
    // Send the batch assignment email using the dedicated function
    try {
      const result = await emailService.sendBatchAssignmentEmail(studentData, batchName);
      
      return res.status(200).json({
        success: true,
        messageId: result.messageId,
        message: `Batch assignment email with login credentials sent to ${studentData.email}`
      });
    } catch (serviceError) {
      console.error('❌ EMAIL CONTROLLER ERROR: Email service error:', serviceError);
      console.error('❌ EMAIL CONTROLLER ERROR: Email service error details:', serviceError.stack);
      throw serviceError;
    }
  } catch (error) {
    console.error('❌ EMAIL CONTROLLER ERROR: Unexpected error:', error);
    if (error.stack) {
      console.error('❌ ERROR STACK:', error.stack);
    }
    
    // Standard error response
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send batch assignment email',
      error: {
        code: error.code || 'UNKNOWN',
        message: error.message || 'Unknown error'
      }
    });
  }
};

module.exports = {
  sendRegistrationConfirmationEmail,
  sendBatchAssignmentEmail
}; 