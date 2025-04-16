const emailService = require('./services/emailService');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('\n🔧 TEST ENVIRONMENT:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- EMAIL_USER:', process.env.EMAIL_USER);
console.log('- EMAIL User is configured:', !!process.env.EMAIL_USER);
console.log('- EMAIL_PASS is configured:', !!process.env.EMAIL_PASS);
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'Not configured, using default');

async function testRegistrationEmail() {
  try {
    console.log('\n📧 Testing registration confirmation email...');
    
    const studentData = {
      email: 'jillakanna22001@gmail.com',
      name: 'PAVAN JILLA',
      rollNumber: 'RQZKMP',
      id: 'STUDENT001'
    };
    
    const batchName = 'New Registration';
    
    console.log('📧 TEST DATA - Student:', JSON.stringify(studentData, null, 2));
    console.log('📧 TEST DATA - Batch:', batchName);
    
    console.log('📧 Calling email service...');
    const result = await emailService.sendRegistrationConfirmationEmail(studentData, batchName);
    console.log('✅ TEST RESULT - Registration email sent successfully!');
    console.log('✅ Message ID:', result.messageId);
    console.log('✅ Full result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ TEST ERROR - Failed to send registration email:', error);
    console.error('❌ Error details:', error.stack);
    throw error;
  }
}

async function testBatchAssignmentEmail() {
  try {
    console.log('\n📧 Testing batch assignment email...');
    
    const studentData = {
      email: 'jillakanna22001@gmail.com',
      name: 'PAVAN JILLA',
      rollNumber: 'RQZKMP',
      id: 'STUDENT001'
    };
    
    const batchName = 'Foundation Batch 2024';
    
    console.log('📧 TEST DATA - Student:', JSON.stringify(studentData, null, 2));
    console.log('📧 TEST DATA - Batch:', batchName);
    
    console.log('📧 Calling email service...');
    const result = await emailService.sendBatchAssignmentEmail(studentData, batchName);
    console.log('✅ TEST RESULT - Batch assignment email sent successfully!');
    console.log('✅ Message ID:', result.messageId);
    console.log('✅ Full result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('❌ TEST ERROR - Failed to send batch assignment email:', error);
    console.error('❌ Error details:', error.stack);
    throw error;
  }
}

// Run both tests
(async () => {
  console.log('\n🔍 STARTING EMAIL TESTS');
  console.log('======================');
  
  let registrationTestPassed = false;
  let batchAssignmentTestPassed = false;
  
  try {
    console.log('\n📋 TEST 1: Registration Email');
    console.log('----------------------------');
    await testRegistrationEmail();
    registrationTestPassed = true;
    console.log('✅ Registration email test passed!');
  } catch (error) {
    console.error('❌ Registration email test failed:', error.message);
  }
  
  try {
    console.log('\n📋 TEST 2: Batch Assignment Email');
    console.log('-------------------------------');
    await testBatchAssignmentEmail();
    batchAssignmentTestPassed = true;
    console.log('✅ Batch assignment email test passed!');
  } catch (error) {
    console.error('❌ Batch assignment email test failed:', error.message);
  }
  
  console.log('\n📊 TEST SUMMARY:');
  console.log('---------------');
  console.log('Registration Email Test:', registrationTestPassed ? '✅ PASSED' : '❌ FAILED');
  console.log('Batch Assignment Email Test:', batchAssignmentTestPassed ? '✅ PASSED' : '❌ FAILED');
  
  if (registrationTestPassed && batchAssignmentTestPassed) {
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('\n❌ SOME TESTS FAILED. Please check the logs above for details.');
    process.exit(1); // Exit with error code
  }
})(); 