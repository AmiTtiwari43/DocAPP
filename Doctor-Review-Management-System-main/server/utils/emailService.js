const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const createTransporter = () => {
  // For development, use Gmail or any SMTP service
  // For production, use services like SendGrid, AWS SES, etc.
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Skip email sending if credentials not configured (development)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 Email would be sent:', { to, subject });
      return { success: true, message: 'Email service not configured (dev mode)' };
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Mediverse" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  appointmentConfirmation: (appointment, doctor, patient) => ({
    subject: 'Appointment Confirmed - Mediverse',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0EA5E9;">Appointment Confirmed</h2>
        <p>Hello ${patient.name},</p>
        <p>Your appointment has been confirmed!</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
          <p><strong>Specialization:</strong> ${doctor.specialization}</p>
          <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${appointment.slot}</p>
          <p><strong>Fee:</strong> ₹${doctor.fees}</p>
        </div>
        <p>We'll send you a reminder 24 hours before your appointment.</p>
        <p>Thank you for choosing Mediverse!</p>
      </div>
    `,
    text: `Appointment confirmed with Dr. ${doctor.name} on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.slot}`,
  }),

  appointmentReminder: (appointment, doctor, patient) => ({
    subject: 'Appointment Reminder - Mediverse',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0EA5E9;">Appointment Reminder</h2>
        <p>Hello ${patient.name},</p>
        <p>This is a reminder about your upcoming appointment:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
          <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${appointment.slot}</p>
        </div>
        <p>Please arrive 10 minutes early.</p>
      </div>
    `,
    text: `Reminder: Appointment with Dr. ${doctor.name} on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.slot}`,
  }),

  reviewRequest: (appointment, doctor, patient) => ({
    subject: 'Share Your Experience - Mediverse',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0EA5E9;">How was your visit?</h2>
        <p>Hello ${patient.name},</p>
        <p>Your appointment with Dr. ${doctor.name} has been completed.</p>
        <p>We'd love to hear about your experience! Please take a moment to leave a review.</p>
        <a href="${process.env.CLIENT_URL}/doctor/${doctor._id}" style="background: #0EA5E9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Leave a Review</a>
      </div>
    `,
    text: `Please review your visit with Dr. ${doctor.name}`,
  }),

  profileVerified: (doctor) => ({
    subject: 'Profile Verified - Mediverse',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Profile Verified!</h2>
        <p>Hello Dr. ${doctor.name},</p>
        <p>Great news! Your profile has been verified and is now visible to patients.</p>
        <p>You can now start receiving appointment requests!</p>
        <a href="${process.env.CLIENT_URL}/dashboard" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">View Dashboard</a>
      </div>
    `,
    text: 'Your profile has been verified!',
  }),
};

module.exports = { sendEmail, emailTemplates };

