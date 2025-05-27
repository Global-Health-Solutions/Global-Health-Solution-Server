const nodemailer = require("nodemailer");

// Create reusable transporter object using Gmail service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
});

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error.message);
    return false;
  }
};

const sendAppointmentConfirmation = async (appointment, user) => {
  try {
    // Test email config first
    const isEmailReady = await testEmailConfiguration();
    if (!isEmailReady) {
      console.warn('Email service not configured properly, skipping email send');
      return;
    }

    const isPatient = user._id.toString() === appointment.patient.toString();
    const appointmentDate = new Date(appointment.dateTime);
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: "Appointment Confirmation - Global Health Solutions",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Appointment Confirmation</h1>
          <p>Dear ${user.firstName} ${user.lastName},</p>
          
          ${isPatient ? 
            `<p>Your appointment has been confirmed with our specialist:</p>` :
            `<p>You have a new appointment request:</p>`
          }
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Appointment Details</h3>
            <p><strong>Date:</strong> ${appointmentDate.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointmentDate.toLocaleTimeString()}</p>
            <p><strong>Type:</strong> ${appointment.appointmentType}</p>
            <p><strong>Status:</strong> ${appointment.status}</p>
          </div>
          
          ${isPatient ? 
            `<p>Please arrive 15 minutes early for your appointment. If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>` :
            `<p>Please review the appointment details and confirm or reschedule as needed through your doctor dashboard.</p>`
          }
          
          <p>Thank you for choosing Global Health Solutions!</p>
          <p>Best regards,<br>The Global Health Solutions Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Appointment confirmation email sent to ${user.email}`);
    
  } catch (error) {
    console.error('❌ Error sending appointment confirmation email:', error);
    throw error;
  }
};

const sendAppointmentStatusUpdate = async (appointment, user, newStatus) => {
  try {
    const isEmailReady = await testEmailConfiguration();
    if (!isEmailReady) {
      console.warn('Email service not configured properly, skipping email send');
      return;
    }

    const isPatient = user._id.toString() === appointment.patient.toString();
    const appointmentDate = new Date(appointment.dateTime);
    
    let statusMessage = '';
    let statusColor = '#2563eb';
    
    if (newStatus === 'confirmed') {
      statusMessage = isPatient ? 'Your appointment has been confirmed by the doctor!' : 'You have confirmed this appointment.';
      statusColor = '#16a34a';
    } else if (newStatus === 'cancelled') {
      statusMessage = isPatient ? 'Your appointment has been cancelled.' : 'You have cancelled this appointment.';
      statusColor = '#dc2626';
    }
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: `Appointment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} - Global Health Solutions`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${statusColor};">Appointment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</h1>
          <p>Dear ${user.firstName} ${user.lastName},</p>
          
          <p>${statusMessage}</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Appointment Details</h3>
            <p><strong>Date:</strong> ${appointmentDate.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointmentDate.toLocaleTimeString()}</p>
            <p><strong>Type:</strong> ${appointment.appointmentType}</p>
            <p><strong>Status:</strong> ${newStatus}</p>
          </div>
          
          ${newStatus === 'cancelled' ? 
            `<p>If you would like to reschedule, please book a new appointment through our platform.</p>` :
            `<p>Thank you for using Global Health Solutions!</p>`
          }
          
          <p>Best regards,<br>The Global Health Solutions Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Appointment status update email sent to ${user.email}`);
    
  } catch (error) {
    console.error('❌ Error sending appointment status update email:', error);
    throw error;
  }
};

module.exports = {
  testEmailConfiguration,
  sendAppointmentConfirmation,
  sendAppointmentStatusUpdate,
};
