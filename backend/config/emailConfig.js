// Configure nodemailer
const nodemailer = require('nodemailer');

// Load environment variables
require('dotenv').config();

// Check if we have the required environment variables
const isConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

// Set up the transporter
let transporter;

// Only create a real transporter if the email config is set up
if (isConfigured) {
  // Create a transporter based on Gmail (can be changed to any other SMTP service)
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Set sensible defaults for reliability
    pool: true, // Use pooled connections
    maxConnections: 5, // Limit the number of simultaneous connections
    maxMessages: 100, // Limit the number of messages per connection
    rateDelta: 1000, // Defines time between messages in milliseconds
    rateLimit: 5, // Max number of messages in rateDelta timeframe
  });
} else {
  // Create a preview transporter for development
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'dummy@example.com',
      pass: 'dummy',
    },
  });
}

// Export the configured transporter
module.exports = {
  transporter,
  isConfigured,
}; 