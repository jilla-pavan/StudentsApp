require('dotenv').config();
const { sendRegistrationConfirmationEmail } = require('./services/emailService');

async function testEmailService() {
  console.log('🧪 Starting email service test...');
  
  // Check for required environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Missing required environment variables:');
    if (!process.env.EMAIL_USER) console.error('- EMAIL_USER is not set');
    if (!process.env.EMAIL_PASSWORD) console.error('- EMAIL_PASSWORD is not set');
    process.exit(1);
  }

  // Get test email from command line argument or use default
  const testEmail = process.argv[2] || process.env.TEST_EMAIL;
  if (!testEmail) {
    console.error('❌ No test email address provided.');
    console.log('Usage: node test-email.js <email-address>');
    console.log('Or set TEST_EMAIL in your .env file');
    process.exit(1);
  }

  console.log('📧 Test Configuration:');
  console.log('- Using email:', process.env.EMAIL_USER);
  console.log('- Sending to:', testEmail);

  // Prepare test data
  const testData = {
    email: testEmail,
    name: 'Test Student',
    rollNumber: 'TEST001'
  };
  const batchName = 'Test Batch 2024';

  console.log('\n📝 Test Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('Batch:', batchName);

  try {
    console.log('\n🚀 Sending test email...');
    const result = await sendRegistrationConfirmationEmail(testData, batchName);
    
    console.log('\n✅ Test completed successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.code) console.error('Error Code:', error.code);
    if (error.command) console.error('Error Command:', error.command);
    if (error.response) console.error('Error Response:', error.response);
    process.exit(1);
  }
}

// Run the test
testEmailService().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
}); 