const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Direct test of email templates
async function testEmailTemplates() {
  console.log('Starting direct email template test...');
  
  // Create test account if no credentials provided
  const testAccount = !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD ? 
    await nodemailer.createTestAccount() : null;
  
  const transporter = testAccount ?
    nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    }) :
    nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

  const studentData = {
    name: 'PAVAN JILLA',
    email: 'jillakanna22001@gmail.com',
    rollNumber: 'RQZKMP',
  };

  // BATCH ASSIGNMENT EMAIL TEMPLATE
  const batchEmailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Career Sure Academy</h2>
      <h3 style="color: #3498db;">Your Batch Assignment and Login Credentials</h3>
      
      <p>Dear ${studentData.name},</p>
      
      <p>We are pleased to inform you that your registration has been completed and you have been assigned to a batch.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #34495e; margin-top: 0;">Your Registration Details:</h3>
        <p><strong>Name:</strong> ${studentData.name}</p>
        <p><strong>Roll Number:</strong> ${studentData.rollNumber}</p>
        <p><strong>Batch:</strong> Foundation Batch 2024</p>
      </div>

      <div style="background-color: #e8f4fc; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #3498db;">
        <h3 style="color: #2980b9; margin-top: 0;">Your Login Credentials:</h3>
        <p>You can now log in to your account using your email address and the password you set during registration.</p>
      </div>
      
      <div style="margin: 20px 0; text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
           style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Login to Your Account
        </a>
      </div>

      <p>After logging in, you will have access to your progress card and all course materials.</p>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>Career Sure Academy Team</p>
    </div>
  `;

  // Send batch assignment email
  try {
    console.log("Sending batch assignment email template...");
    const info = await transporter.sendMail({
      from: `"Career Sure Academy" <${process.env.EMAIL_USER || testAccount.user}>`,
      to: process.env.EMAIL_USER || testAccount.user,
      subject: "Career Sure Academy: Your Batch Assignment and Login Credentials",
      html: batchEmailContent,
    });

    console.log("Batch assignment email sent: %s", info.messageId);
    
    // Show ethereal URL if using test account
    if (testAccount) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    
    console.log('✅ Batch assignment email test successful!');
  } catch (error) {
    console.error('❌ Batch assignment email test failed with error:', error);
  }
}

testEmailTemplates(); 