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
    // Extract data from request
    const { studentData, batchName } = req.body;

    // Input validation
    if (!studentData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student data is required' 
      });
    }

    if (!studentData.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student email is required' 
      });
    }

    if (!studentData.name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student name is required' 
      });
    }

    // Send the registration confirmation email
    const result = await emailService.sendRegistrationEmail(studentData, batchName);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Registration confirmation email sent successfully',
      messageId: result.messageId,
      previewUrl: result.previewUrl
    });
  } catch (error) {
    // Return structured error response
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send registration confirmation email'
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
    // Extract data from request
    const { studentData, batchName } = req.body;

    // Input validation
    if (!studentData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student data is required' 
      });
    }

    if (!studentData.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student email is required' 
      });
    }

    if (!studentData.name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student name is required' 
      });
    }

    if (!studentData.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required for login credentials' 
      });
    }

    if (!studentData.rollNumber || studentData.rollNumber === 'unassigned') {
      return res.status(400).json({ 
        success: false, 
        message: 'Student roll number is required for batch assignment' 
      });
    }

    if (!batchName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Batch name is required' 
      });
    }

    // Ensure the batch name is not "New Registration"
    if (batchName === "New Registration") {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid batch name for assignment email' 
      });
    }

    // Send the batch assignment email
    const result = await emailService.sendBatchAssignmentEmail(studentData, batchName);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Batch assignment email sent successfully',
      messageId: result.messageId,
      previewUrl: result.previewUrl
    });
  } catch (error) {
    // Return structured error response
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send batch assignment email'
    });
  }
};

module.exports = {
  sendRegistrationConfirmationEmail,
  sendBatchAssignmentEmail
}; 