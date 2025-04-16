const emailService = require('../services/emailService');

/**
 * Send a registration confirmation email to a student
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response
 */
const sendRegistrationConfirmationEmail = async (req, res) => {
  console.log('\n🔶 EMAIL CONTROLLER: Received registration email request');
  console.log('🔶 EMAIL CONTROLLER: Request headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    console.log('🔶 EMAIL CONTROLLER: Parsing request body...');
    // Debug the body content
    console.log('🔶 EMAIL CONTROLLER: Request body:', JSON.stringify(req.body, null, 2));
    
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
    
    console.log(`🔶 EMAIL CONTROLLER: Processing email for student ${studentData.name} (${studentData.email}) for batch: ${batchName}`);
    
    // Send the email
    console.log('🔶 EMAIL CONTROLLER: Calling email service to send email...');
    try {
      const result = await emailService.sendRegistrationConfirmationEmail(studentData, batchName);
      console.log('✅ EMAIL CONTROLLER: Email sent successfully:', JSON.stringify(result, null, 2));
      
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
      console.log('❌ EMAIL CONTROLLER: Returning structured error response');
      return res.status(500).json(error);
    }
    
    // Otherwise construct a standard error response
    console.log('❌ EMAIL CONTROLLER: Returning generic error response');
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
  console.log('\n🔶 EMAIL CONTROLLER: Received batch assignment email request');
  console.log('🔶 EMAIL CONTROLLER: Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔶 EMAIL CONTROLLER: Request IP:', req.ip);
  console.log('🔶 EMAIL CONTROLLER: Request method:', req.method);
  
  try {
    console.log('🔶 EMAIL CONTROLLER: Parsing request body...');
    console.log('🔶 EMAIL CONTROLLER: Raw request body:', JSON.stringify(req.body, null, 2));
    
    const { studentData, batchName } = req.body;
    console.log('🔶 EMAIL CONTROLLER: Extracted studentData:', JSON.stringify(studentData, null, 2));
    console.log('🔶 EMAIL CONTROLLER: Extracted batchName:', batchName);
    
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
    
    console.log(`🔶 EMAIL CONTROLLER: All validation checks passed for batch assignment email`);
    console.log(`🔶 EMAIL CONTROLLER: Processing batch assignment email for student ${studentData.name} (${studentData.email}) for batch: ${batchName}`);
    
    // Send the batch assignment email using the dedicated function
    console.log('🔶 EMAIL CONTROLLER: Calling email service to send batch assignment email...');
    try {
      const result = await emailService.sendBatchAssignmentEmail(studentData, batchName);
      console.log('✅ EMAIL CONTROLLER: Batch assignment email sent successfully:', JSON.stringify(result, null, 2));
      
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