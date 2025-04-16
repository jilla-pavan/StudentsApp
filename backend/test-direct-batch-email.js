// Test script for direct call to batch assignment email service
require('dotenv').config();
const emailService = require('./services/emailService');

const testDirectBatchEmail = async () => {
  try {
    // Define test student data
    const studentData = {
      id: "test-student-123",
      name: "Test Student",
      email: "test@example.com",
      rollNumber: "TEST001"
    };
    
    const batchName = "Advanced Java Batch";
    
    // Call the service directly
    const result = await emailService.sendBatchAssignmentEmail(studentData, batchName);
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Execute the test
testDirectBatchEmail()
  .then(result => {
    process.exit(0);
  })
  .catch(error => {
    process.exit(1);
  }); 