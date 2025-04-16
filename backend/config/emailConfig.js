const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

console.log('⚙️ EMAIL CONFIG: Loading environment variables...');
dotenv.config();

// Validate environment variables
if (!process.env.EMAIL_USER) {
  console.error('❌ EMAIL CONFIG ERROR: EMAIL_USER environment variable is not set');
  throw new Error('EMAIL_USER environment variable is required');
}

if (!process.env.EMAIL_PASSWORD) {
  console.error('❌ EMAIL CONFIG ERROR: EMAIL_PASSWORD environment variable is not set');
  throw new Error('EMAIL_PASSWORD environment variable is required');
}

console.log('📧 EMAIL CONFIG: Initializing email configuration...');
console.log('📧 EMAIL CONFIG: Using Gmail account:', process.env.EMAIL_USER);

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // avoid issues with self-signed certificates
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ EMAIL CONFIG ERROR: Failed to verify email configuration:', error.message);
    
    // Provide specific guidance based on error
    if (error.code === 'EAUTH') {
      console.error('❌ EMAIL CONFIG ERROR: Authentication failed. Please ensure:');
      console.error('1. You have enabled 2-Step Verification in your Gmail account');
      console.error('2. You have generated an App Password for this application');
      console.error('3. You are using the App Password in EMAIL_PASSWORD, not your regular Gmail password');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ EMAIL CONFIG ERROR: Connection refused. Please check your internet connection');
    }
    
    // Create a dummy transporter for development
    console.log('⚠️ EMAIL CONFIG: Creating dummy transporter for development');
    return nodemailer.createTransport({
      jsonTransport: true
    });
  }
  
  console.log('✅ EMAIL CONFIG: Email configuration verified successfully');
  console.log('📧 EMAIL CONFIG: SMTP connection established');
  console.log('📧 EMAIL CONFIG: Maximum connections:', transporter.options.maxConnections || 'default');
  console.log('📧 EMAIL CONFIG: Maximum messages:', transporter.options.maxMessages || 'default');
});

// Handle SMTP connection errors
transporter.on('error', (err) => {
  console.error('❌ EMAIL CONFIG ERROR: SMTP connection error:', err.message);
  if (err.code) console.error('- Error Code:', err.code);
  if (err.command) console.error('- Error Command:', err.command);
  if (err.response) console.error('- Error Response:', err.response);
});

console.log('⚙️ EMAIL CONFIG: Email configuration complete');
module.exports = transporter; 