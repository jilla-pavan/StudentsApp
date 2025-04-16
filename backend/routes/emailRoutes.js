const express = require('express');
const emailController = require('../controllers/emailController');

const router = express.Router();

// Route to send registration confirmation email
router.post('/send-registration-confirmation', emailController.sendRegistrationConfirmationEmail);

// Route to send batch assignment email with login credentials
router.post('/send-batch-assignment', emailController.sendBatchAssignmentEmail);

module.exports = router; 