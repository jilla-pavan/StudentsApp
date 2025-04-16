const emailService = require('./services/emailService');

async function testBatchAssignmentEmailDirect() {
  try {
    console.log('Testing batch assignment email directly via service...');
    
    const studentData = {
      id: 'STUDENT_22001',        // Student ID used as password
      email: 'jillakanna22001@gmail.com',
      name: 'PAVAN JILLA',
      rollNumber: 'RQZKMP'
    };
    
    const batchName = 'Foundation Batch 2024';
    
    const result = await emailService.sendRegistrationConfirmationEmail(studentData, batchName);
    console.log('Batch assignment email sent successfully!');
    console.log('Message ID:', result.messageId);
    
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Run the test
testBatchAssignmentEmailDirect().then(() => {
  console.log('✅ Direct test completed successfully!');
}).catch(error => {
  console.error('❌ Direct test failed:', error);
}); 