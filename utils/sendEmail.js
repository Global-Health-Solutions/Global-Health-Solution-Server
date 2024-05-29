// utils/sendEmail.js

const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `Your Name <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;



// const nodemailer = require('nodemailer');

// const sendEmail = async ({ to, subject, text, html }) => {
//   const transporter = nodemailer.createTransport({
//     host: 'mail.smtp2go.com',
//     port: 587,
//     auth: {
//       user: process.env.SMTP2GO_USER,
//       pass: process.env.SMTP2GO_PASS,
//     },
//   });

//   const mailOptions = {
//     from: `Your Name <${process.env.SMTP2GO_USER}>`,
//     to,
//     subject,
//     text,
//     html,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log('Email sent successfully');
//   } catch (error) {
//     console.error('Error sending email:', error);
//     throw new Error('Email sending failed');
//   }
// };

// module.exports = sendEmail;
