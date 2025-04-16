const axios = require('axios');

async function testBatchAssignmentEmail() {
  try {
    console.log('Testing batch assignment email API...');
    
    const studentData = {
      id: 'STUDENT_22001',        // Student ID used as password
      email: 'jillakanna22001@gmail.com',
      name: 'PAVAN JILLA',
      rollNumber: 'RQZKMP'
    };
    
    const batchName = 'Foundation Batch 2024';
    
    const response = await axios.post('http://localhost:5000/api/email/send-batch-assignment', {
      studentData,
      batchName
    });
    
    console.log('API Response:', response.data);
    console.log('Batch assignment email sent successfully!');
    return response.data;
  } catch (error) {
    console.error('Error calling API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Run the test
testBatchAssignmentEmail().then(() => {
  console.log('✅ Test completed successfully!');
}).catch(error => {
  console.error('❌ Test failed:', error);
}); 