require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  try {
    console.log('🧪 Testing email configuration...');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log('✅ Email service is ready');
    
    // Send a test email
    const testMailOptions = {
      from: process.env.SMTP_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: 'Test Email - Global Health Solutions',
      html: `
        <h1>Email Test Successful!</h1>
        <p>This is a test email to verify the notification system is working.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    };

    await transporter.sendMail(testMailOptions);
    console.log('✅ Test email sent successfully!');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

testEmail();
