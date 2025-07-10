// services/emailService.js
const nodemailer = require("nodemailer");
require("dotenv").config();

// Create a single transporter instance
let mailTransporter;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  mailTransporter = nodemailer.createTransport({
    service: "gmail", // Or your email service (e.g., Outlook, SMTP host)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log("Email service initialized.");
} else {
  console.warn(
    "EMAIL_USER or EMAIL_PASS not set. Email notifications will be skipped."
  );
}

async function sendEmail({ to, subject, text, html }) {
  if (!mailTransporter) {
    console.log(
      `Email skipped: Transporter not configured for ${to} - ${subject}`
    );
    return; // Don't throw, just skip if not configured
  }

  try {
    const mailDetails = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    };
    await mailTransporter.sendMail(mailDetails);
    console.log(`Email sent successfully to: ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    // You might want to re-throw a custom error here if email failure is critical
  }
}

module.exports = { sendEmail };
