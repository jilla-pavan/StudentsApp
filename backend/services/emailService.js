const transporter = require("../config/emailConfig");

/**
 * Sends a registration confirmation email to a student
 * @param {Object} studentData - The student's information
 * @param {string} studentData.email - The student's email address
 * @param {string} studentData.name - The student's full name
 * @param {string} studentData.rollNumber - The student's roll number
 * @param {string} batchName - The name of the batch or "New Registration" for new users
 * @returns {Promise<Object>} - A promise that resolves with the email sending result
 * @throws {Error} - If email sending fails
 */
async function sendRegistrationConfirmationEmail(studentData, batchName) {
  // Input validation
  if (!studentData || typeof studentData !== "object") {
    throw new Error("Invalid student data provided");
  }

  if (!studentData.email || !studentData.name || !studentData.rollNumber) {
    throw new Error("Missing required student information");
  }

  if (!batchName || typeof batchName !== "string") {
    throw new Error("Invalid batch name provided");
  }

  // For registration confirmation, we always use the new registration template
  const emailSubject =
    "Welcome To Career Sure Academy! Your Registration is Pending Review";

  // Email template for new registrations
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #f5c242; margin-bottom: 5px; font-size: 28px;">Welcome To Career Sure Academy!</h1>
        <h2 style="color: #3498db; margin-top: 0; font-size: 20px;">Your Registration is Pending Review</h2>
      </div>
      
      <p style="font-size: 16px;"><strong>Dear ${studentData.name},</strong></p>
      
      <p style="font-size: 16px;">Thank you for registering with Career Sure Academy! 🎓 Your registration has been received and is pending review by our administrators.</p>
      
      <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #3498db;">
        <h3 style="color: #34495e; margin-top: 0; font-size: 18px;">Your Registration Information:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 40%;">Name:</td>
            <td style="padding: 8px 0;">${studentData.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Email:</td>
            <td style="padding: 8px 0;">${studentData.email}</td>
          </tr>
        </table>
      </div>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #34495e; margin-top: 0; font-size: 18px;">Next Steps:</h3>
        <ol style="margin-left: 20px; padding-left: 0;">
          <li style="margin-bottom: 10px;"><strong>Review:</strong> Our administrators will review your registration.</li>
          <li style="margin-bottom: 10px;"><strong>Batch Assignment:</strong> You will be assigned to an appropriate batch based on your requirements.</li>
          <li style="margin-bottom: 10px;"><strong>Login Credentials:</strong> You will receive your login credentials within 24 hours to the email address you provided.</li>
          <li style="margin-bottom: 10px;"><strong>Begin Learning:</strong> Once your credentials arrive, you can log in and start your learning journey!</li>
        </ol>
      </div>

      <div style="background-color: #eaf7ed; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #27ae60;">
        <h3 style="color: #27ae60; margin-top: 0; font-size: 18px;">What to Expect:</h3>
        <p style="margin-top: 10px;">Please be patient while we process your registration. No action is required from your end at this time. We typically process registrations within 24 hours.</p>
        
        <p style="margin-top: 15px; color: #27ae60; font-style: italic; font-size: 14px;">
          📝 <strong>About Your Login Credentials:</strong> Once you are assigned to a batch, you will receive 
          another email with your login credentials. Use your credentials to log into your account.
        </p>
      </div>
      
      <p style="font-size: 16px;">If you have any urgent questions or concerns, please feel free to contact our support team at <a href="mailto:careersureacademypayment@gmail.com" style="color: #3498db; text-decoration: none;">careersureacademypayment@gmail.com</a>.</p>
      <p> Contact us at +91 63010 46346 </p> 
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 14px;">
        <p style="margin-bottom: 5px;">Best regards,</p>
        <p style="margin-top: 0; font-weight: bold;">Career Sure Academy Team</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: studentData.email,
    subject: emailSubject,
    html: emailContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(
      "❌ EMAIL SERVICE ERROR: Failed to send email:",
      error.message
    );

    // Log detailed error information
    if (error.code) console.error("- Error Code:", error.code);
    if (error.command) console.error("- Error Command:", error.command);
    if (error.response) console.error("- Error Response:", error.response);

    // Provide specific error messages based on error type
    if (error.code === "EAUTH") {
      throw new Error(
        "Email authentication failed. Please check your email credentials."
      );
    } else if (error.code === "ECONNREFUSED") {
      throw new Error(
        "Could not connect to the email server. Please check your internet connection."
      );
    } else if (error.code === "ESOCKET") {
      throw new Error(
        "Socket error occurred while sending email. Please try again later."
      );
    }

    throw new Error("Failed to send email. Please try again later.");
  }
}

/**
 * Sends a batch assignment email with login credentials to a student
 * @param {Object} studentData - The student's information
 * @param {string} studentData.email - The student's email address
 * @param {string} studentData.name - The student's full name
 * @param {string} studentData.rollNumber - The student's roll number
 * @param {string} studentData.id - The student's ID to use as password
 * @param {string} batchName - The name of the batch assigned to the student
 * @returns {Promise<Object>} - A promise that resolves with the email sending result
 * @throws {Error} - If email sending fails
 */
async function sendBatchAssignmentEmail(studentData, batchName) {
  // Input validation
  if (!studentData || typeof studentData !== "object") {
    throw new Error("Invalid student data provided");
  }

  if (!studentData.email || !studentData.name || !studentData.rollNumber) {
    throw new Error("Missing required student information");
  }

  if (!studentData.id) {
    throw new Error("Student ID is required for login credentials");
  }

  if (!batchName || typeof batchName !== "string") {
    throw new Error("Invalid batch name provided");
  }

  // For batch assignment, we always use the batch assignment template
  const emailSubject =
    "Career Sure Academy: Your Batch Assignment and Login Credentials";

  // Email template for batch assignments with login credentials
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #f5c242; margin-bottom: 5px; font-size: 28px;">Career Sure Academy</h1>
        <h2 style="color: #3498db; margin-top: 0; font-size: 20px;">Your Batch Assignment and Login Credentials</h2>
      </div>
      
      <p style="font-size: 16px;"><strong>Dear ${studentData.name},</strong></p>
      
      <p style="font-size: 16px;">Congratulations! 🎉 Your registration has been approved and you have been assigned to a batch. Welcome to the Career Sure Academy family!</p>
      
      <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #3498db;">
        <h3 style="color: #34495e; margin-top: 0; font-size: 18px;">Your Registration Details:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 40%;">Name:</td>
            <td style="padding: 8px 0;">${studentData.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Roll Number:</td>
            <td style="padding: 8px 0;">${studentData.rollNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Batch:</td>
            <td style="padding: 8px 0;">${batchName}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #e8f4fc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #2980b9;">
        <h3 style="color: #2980b9; margin-top: 0; font-size: 18px;">Your Login Credentials:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 40%;">Email:</td>
            <td style="padding: 8px 0;">${studentData.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Password:</td>
            <td style="padding: 8px 0;">${studentData.id}</td>
          </tr>
        </table>
      </div>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" 
           style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold; box-shadow: 0 3px 6px rgba(0,0,0,0.1);">
          Login to Your Account
        </a>
      </div>

      <p style="font-size: 16px;">After logging in, you will have access to your dashboard</p>
      
      <p style="font-size: 16px;">If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:careersureacademypayment@gmail.com" style="color: #3498db; text-decoration: none;">careersureacademypayment@gmail.com</a>.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 14px;">
        <p style="margin-bottom: 5px;">Best regards,</p>
        <p style="margin-top: 0; font-weight: bold;">Career Sure Academy Team</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: studentData.email,
    subject: emailSubject,
    html: emailContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(
      "❌ EMAIL SERVICE ERROR: Failed to send batch assignment email:",
      error.message
    );

    // Log detailed error information
    if (error.code) console.error("- Error Code:", error.code);
    if (error.command) console.error("- Error Command:", error.command);
    if (error.response) console.error("- Error Response:", error.response);

    // Provide specific error messages based on error type
    if (error.code === "EAUTH") {
      throw new Error(
        "Email authentication failed. Please check your email credentials."
      );
    } else if (error.code === "ECONNREFUSED") {
      throw new Error(
        "Could not connect to the email server. Please check your internet connection."
      );
    } else if (error.code === "ESOCKET") {
      throw new Error(
        "Socket error occurred while sending email. Please try again later."
      );
    }

    throw new Error("Failed to send batch assignment email. Please try again later.");
  }
}

module.exports = {
  sendRegistrationConfirmationEmail,
  sendBatchAssignmentEmail,
};
