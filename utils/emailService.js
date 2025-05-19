const nodemailer = require("nodemailer");

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendAppointmentConfirmation = async (appointment, user) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: "Appointment Confirmation",
    html: `
      <h1>Appointment Confirmation</h1>
      <p>Dear ${user.firstName} ${user.lastName},</p>
      <p>Your appointment has been confirmed for:</p>
      <p>Date: ${new Date(appointment.dateTime).toLocaleDateString()}</p>
      <p>Time: ${new Date(appointment.dateTime).toLocaleTimeString()}</p>
      <p>Specialist: ${appointment.specialistCategory}</p>
      <p>Reason: ${appointment.reason}</p>
      <p>Please arrive 10 minutes before your scheduled time.</p>
      <p>If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

const sendAppointmentReminder = async (appointment, user) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: "Appointment Reminder",
    html: `
      <h1>Appointment Reminder</h1>
      <p>Dear ${user.firstName} ${user.lastName},</p>
      <p>This is a reminder for your upcoming appointment:</p>
      <p>Date: ${new Date(appointment.dateTime).toLocaleDateString()}</p>
      <p>Time: ${new Date(appointment.dateTime).toLocaleTimeString()}</p>
      <p>Specialist: ${appointment.specialistCategory}</p>
      <p>Reason: ${appointment.reason}</p>
      <p>Please arrive 10 minutes before your scheduled time.</p>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

const sendAppointmentDayReminder = async (appointment, user) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: "Today's Appointment Reminder",
    html: `
      <h1>Today's Appointment Reminder</h1>
      <p>Dear ${user.firstName} ${user.lastName},</p>
      <p>This is a reminder that you have an appointment today:</p>
      <p>Time: ${new Date(appointment.dateTime).toLocaleTimeString()}</p>
      <p>Specialist: ${appointment.specialistCategory}</p>
      <p>Reason: ${appointment.reason}</p>
      <p>Please arrive 10 minutes before your scheduled time.</p>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

const sendAppointmentCancellation = async (appointment, user) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: "Appointment Cancellation",
    html: `
      <h1>Appointment Cancellation</h1>
      <p>Dear ${user.firstName} ${user.lastName},</p>
      <p>Your appointment has been cancelled:</p>
      <p>Date: ${new Date(appointment.dateTime).toLocaleDateString()}</p>
      <p>Time: ${new Date(appointment.dateTime).toLocaleTimeString()}</p>
      <p>Specialist: ${appointment.specialistCategory}</p>
      <p>Reason for cancellation: ${appointment.cancellationReason}</p>
      <p>If you would like to reschedule, please book a new appointment.</p>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendAppointmentDayReminder,
  sendAppointmentCancellation,
}; 