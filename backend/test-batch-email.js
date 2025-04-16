// Test script for batch assignment email API
const axios = require('axios');

const testBatchAssignmentEmail = async () => {
  try {
    // Define test student data
    const testData = {
      studentData: {
        id: "test-student-123",
        name: "Test Student",
        email: "test@example.com",
        rollNumber: "TEST001"
      },
      batchName: "Advanced Java Batch"
    };

    // Call the API
    const response = await axios.post(
      'http://localhost:5000/api/email/send-batch-assignment',
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        error: error.response.data
      };
    }
    return {
      success: false,
      error: error.message
    };
  }
};

// Execute the test
testBatchAssignmentEmail()
  .then(result => {
    process.exit(0);
  })
  .catch(error => {
    process.exit(1);
  }); 