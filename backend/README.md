# Career Sure Academy - Email Backend

This is a Node.js backend service for sending emails for the Career Sure Academy dashboard.

## Features

- Sends registration confirmation emails to students when they are assigned to a batch
- Sends batch assignment emails with login credentials to students
- Uses Nodemailer with Gmail for email sending
- Express.js API for easy integration with the frontend
- Automatic retry mechanism for improved reliability
- Detailed error logging for troubleshooting

## Recent Updates

- **Console Log Cleanup**: Removed all `console.log` statements from the codebase for production readiness
- **Retained Error Logging**: Preserved `console.error` statements for critical error reporting
- **Code Optimization**: Improved code structure and removed redundant operations
- **Enhanced Error Handling**: Better error messages and more consistent error format

## Student Email Workflow

### Registration Confirmation

When a new student is added to the system:

1. The admin creates a new student in the admin dashboard
2. If the student has a valid email, the system automatically sends a registration confirmation email
3. The student receives an email confirming their registration is pending

### Batch Assignment

When an admin assigns a batch to a student, the following happens:

1. The admin edits a student in the admin dashboard and assigns them to a batch
2. The frontend detects that a batch is being assigned (from 'unassigned' to a valid batch)
3. The system displays a loading toast to inform the admin that an email is being sent
4. The frontend calls the backend API to send the batch assignment email
5. The backend validates the student data and prepares a professional HTML email with login credentials
6. The email is sent to the student with their batch information and login details
7. The admin receives a confirmation toast that the email was sent successfully

This workflow ensures students are promptly notified when their registration is complete and they are assigned to a batch.

## Setup

1. Navigate to the backend directory:
```
cd backend
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file based on `.env.example`:
```
cp .env.example .env
```

4. Update the `.env` file with your Gmail credentials:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
BACKEND_PORT=5000
```

### Setting up Gmail App Password (Required for Gmail)

For Gmail, you **must** use an "App Password" rather than your regular account password because:
1. Google blocks "less secure apps" by default
2. If you have 2-Step Verification enabled, you can't use your regular password

To set up an App Password:

1. Go to your Google Account settings at https://myaccount.google.com/
2. Make sure you have 2-Step Verification enabled (under Security)
3. Go to "App passwords" (also under Security)
4. Select "Mail" as the app and "Other" as the device (name it "Career Sure Academy")
5. Copy the 16-character password Google gives you and paste it in your .env file

5. Start the server:
```
npm run dev
```

The server will start on port 5000 by default (or the port specified in your .env file).

## API Endpoints

### Send Registration Confirmation Email

- **URL**: `/api/email/send-registration-confirmation`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "studentData": {
      "id": "student-id",
      "name": "Student Name",
      "email": "student@example.com",
      "rollNumber": "ROLL123"
    },
    "batchName": "New Registration"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "messageId": "email-message-id",
    "message": "Registration confirmation email sent to student@example.com"
  }
  ```

### Send Batch Assignment Email

- **URL**: `/api/email/send-batch-assignment`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "studentData": {
      "id": "student-id",
      "name": "Student Name",
      "email": "student@example.com",
      "rollNumber": "ROLL123"
    },
    "batchName": "Batch Name"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "messageId": "email-message-id",
    "message": "Batch assignment email with login credentials sent to student@example.com"
  }
  ```

## Error Handling

The email service includes comprehensive error handling:

- Validates all required input before sending emails
- Provides detailed error logs for troubleshooting
- Returns structured error responses to the frontend
- Includes error codes and context for easier debugging

## Troubleshooting

- If emails are not being sent, check:
  - Make sure you're using an App Password for Gmail (not your regular password)
  - Ensure 2-Step Verification is enabled on your Google account
  - Check the server logs for error messages
  - Try running the test script: `npm run test-email`
  - Verify the student has a valid email address
  - Check your internet connection and firewall settings

## Development Guidelines

1. Keep the code clean and maintainable
2. Use meaningful error messages
3. Use console.error() for critical errors only
4. Avoid using console.log() in production code
5. Follow consistent error response formats
6. Document any changes to the API or email templates 