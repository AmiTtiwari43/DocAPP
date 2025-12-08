const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const emailService = require('../utils/emailService');

// Get UPI payment details (QR code)
exports.getUPIPaymentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId')
      .populate('patientId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.patientId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Create pending payment record
    const payment = new Payment({
      appointmentId: appointment._id,
      patientId: req.user.id,
      doctorId: appointment.doctorId._id,
      amount: appointment.doctorId.fees,
      status: 'pending',
      paymentMethod: 'UPI',
    });

    await payment.save();

    res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        amount: appointment.doctorId.fees,
        upiId: process.env.UPI_ID || 'tiwari.amit4356-1@oksbi',
        qrCodeData: `upi://pay?pa=${process.env.UPI_ID || 'tiwari.amit4356-1@oksbi'}&pn=Mediverse&am=${appointment.doctorId.fees}&cu=INR`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Confirm UPI payment (after user scans QR and pays)
exports.confirmUPIPayment = async (req, res) => {
  try {
    const { paymentId, transactionId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.patientId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    payment.status = 'completed';
    payment.transactionId = transactionId || `UPI_${Date.now()}`;
    payment.completedAt = new Date();
    await payment.save();

    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment) {
      appointment.paymentId = payment._id;
      appointment.status = 'confirmed';
      await appointment.save();
    }

    res.status(200).json({ success: true, data: payment, message: 'Payment confirmed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ patientId: req.user.id })
      .populate('appointmentId')
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: get all payments
exports.adminGetPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('appointmentId')
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: approve a payment (mark as admin-approved)
exports.adminApprovePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id)
      .populate('patientId')
      .populate('doctorId')
      .populate('appointmentId');
    
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    payment.adminStatus = 'approved';
    // If gateway completed, ensure appointment is confirmed
    if (payment.status === 'completed') {
      const appointment = await Appointment.findById(payment.appointmentId);
      if (appointment) {
        appointment.status = 'confirmed';
        appointment.paymentId = payment._id;
        await appointment.save();
      }
    }

    await payment.save();

    // Send approval notification emails
    try {
      const appointmentDate = payment.appointmentId?.date ? new Date(payment.appointmentId.date).toLocaleDateString() : 'N/A';
      const appointmentSlot = payment.appointmentId?.slot || 'N/A';
      
      // Email to patient
      await emailService.sendEmail({
        to: payment.patientId?.email,
        subject: 'Payment Approved - Your Appointment is Confirmed',
        text: `Payment Approved! Your payment of ₹${payment.amount} has been approved. Appointment with Dr. ${payment.doctorId?.name} on ${appointmentDate} at ${appointmentSlot} at clinic ${payment.doctorId?.address?.fullAddress || 'N/A'} is now confirmed. Transaction ID: ${payment.transactionId || payment._id.toString().slice(-8)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h2 style="margin: 0;">✓ Payment Approved!</h2>
            </div>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Dear ${payment.patientId?.name || 'Patient'},</p>
              <p>Your payment of <strong style="color: #10B981;">₹${payment.amount}</strong> has been approved by our admin team.</p>
              
              <div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
                <h4 style="margin-top: 0; color: #667eea;">📋 Appointment Receipt:</h4>
                <p><strong>Doctor Name:</strong> Dr. ${payment.doctorId?.name}</p>
                <p><strong>Specialization:</strong> ${payment.doctorId?.specialization || 'N/A'}</p>
                <p><strong>📍 Clinic Location:</strong> ${payment.doctorId?.address?.fullAddress || 'N/A'}</p>
                <p><strong>📅 Appointment Date:</strong> ${appointmentDate}</p>
                <p><strong>⏰ Appointment Time:</strong> ${appointmentSlot}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
                <p style="text-align: right; font-weight: bold; font-size: 18px; color: #667eea;">Total Amount Paid: ₹${payment.amount}</p>
                <p><strong>Transaction ID:</strong> ${payment.transactionId || payment._id.toString().slice(-8)}</p>
              </div>
              
              <p style="background: #FEF3C7; padding: 12px; border-radius: 4px; border-left: 4px solid #F59E0B;">
                <strong>📌 Important:</strong> Your appointment is now confirmed. Please arrive <strong>5 minutes early</strong>.
              </p>
              
              <p>If you have any questions, please contact us at support@mediverse.com</p>
              <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
                Best regards,<br/>
                <strong>Mediverse Team</strong>
              </p>
            </div>
          </div>
        `,
      });

      // Email to doctor
      await emailService.sendEmail({
        to: payment.doctorId?.email,
        subject: 'New Appointment Confirmed - Payment Verified',
        text: `New Appointment Confirmed! Patient ${payment.patientId?.name} (${payment.patientId?.email}) has a confirmed appointment on ${appointmentDate} at ${appointmentSlot}. Payment of ₹${payment.amount} has been verified.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h2 style="margin: 0;">✓ New Appointment Confirmed</h2>
            </div>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Dear Dr. ${payment.doctorId?.name},</p>
              <p>A new appointment has been confirmed for you!</p>
              
              <div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
                <h4 style="margin-top: 0; color: #667eea;">📋 Appointment Details & Receipt:</h4>
                <p><strong>Patient Name:</strong> ${payment.patientId?.name}</p>
                <p><strong>Patient Email:</strong> ${payment.patientId?.email}</p>
                <p><strong>📅 Appointment Date:</strong> ${appointmentDate}</p>
                <p><strong>⏰ Appointment Time:</strong> ${appointmentSlot}</p>
                <p><strong>📍 Your Clinic Location:</strong> ${payment.doctorId?.address?.fullAddress || 'N/A'}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
                <p><strong>Appointment Fee:</strong> ₹${payment.amount}</p>
                <p><strong>Payment Status:</strong> <span style="color: #10B981; font-weight: bold;">✓ Verified & Approved</span></p>
                <p><strong>Transaction ID:</strong> ${payment.transactionId || payment._id.toString().slice(-8)}</p>
              </div>
              
              <p style="background: #DBEAFE; padding: 12px; border-radius: 4px; border-left: 4px solid #3B82F6;">
                <strong>📌 Note:</strong> The payment has been verified by our admin team. The patient will arrive on the scheduled date and time.
              </p>
              
              <p>If you need to reschedule or have any concerns, please contact us immediately.</p>
              <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
                Best regards,<br/>
                <strong>Mediverse Team</strong>
              </p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Error sending approval emails:', emailErr);
    }

    res.status(200).json({ success: true, data: payment, message: 'Payment approved by admin' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: reject a payment (mark as fraud / rejected)
exports.adminRejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id)
      .populate('patientId')
      .populate('doctorId')
      .populate('appointmentId');
    
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    payment.adminStatus = 'rejected';
    // mark gateway status as failed for clarity
    payment.status = 'failed';
    await payment.save();

    // update appointment to cancelled and clear payment association
    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment) {
      appointment.status = 'cancelled';
      appointment.paymentId = payment._id;
      await appointment.save();
    }

    // Send rejection notification emails
    try {
      const appointmentDate = payment.appointmentId?.date ? new Date(payment.appointmentId.date).toLocaleDateString() : 'N/A';
      const appointmentSlot = payment.appointmentId?.slot || 'N/A';

      // Email to patient
      await emailService.sendEmail({
        to: payment.patientId?.email,
        subject: 'Payment Rejected - Appointment Cancelled',
        text: `Your payment for the appointment with Dr. ${payment.doctorId?.name} has been rejected. The appointment has been cancelled. Please contact support@mediverse.com for assistance.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h2 style="margin: 0;">⚠ Payment Rejected</h2>
            </div>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Dear ${payment.patientId?.name || 'Patient'},</p>
              <p>Unfortunately, your payment for the appointment has been <strong style="color: #EF4444;">rejected</strong> by our admin team.</p>
              
              <div style="background: white; padding: 15px; border-left: 4px solid #EF4444; margin: 20px 0; border-radius: 4px;">
                <h4 style="margin-top: 0; color: #EF4444;">Cancelled Appointment:</h4>
                <p><strong>Doctor:</strong> Dr. ${payment.doctorId?.name}</p>
                <p><strong>Date:</strong> ${appointmentDate}</p>
                <p><strong>Time Slot:</strong> ${appointmentSlot}</p>
                <p><strong>Amount:</strong> ₹${payment.amount}</p>
                <p><strong>Transaction ID:</strong> ${payment.transactionId || payment._id.toString().slice(-8)}</p>
              </div>
              
              <p style="background: #FEF3C7; padding: 12px; border-radius: 4px; border-left: 4px solid #F59E0B;">
                <strong>📌 Next Steps:</strong> Please verify your payment details and try booking again, or contact our support team.
              </p>
              
              <p>For assistance, please reach out to us at <strong>support@mediverse.com</strong></p>
              <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
                Best regards,<br/>
                <strong>Mediverse Team</strong>
              </p>
            </div>
          </div>
        `,
      });

      // Email to doctor
      await emailService.sendEmail({
        to: payment.doctorId?.email,
        subject: 'Appointment Cancelled - Payment Rejected',
        text: `An appointment with patient ${payment.patientId?.name} on ${appointmentDate} at ${appointmentSlot} has been cancelled. The payment was rejected by admin review. The time slot is now available for rebooking.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h2 style="margin: 0;">⚠ Appointment Cancelled</h2>
            </div>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Dear Dr. ${payment.doctorId?.name},</p>
              <p>An appointment has been <strong style="color: #EF4444;">cancelled</strong> due to payment rejection during admin review.</p>
              
              <div style="background: white; padding: 15px; border-left: 4px solid #EF4444; margin: 20px 0; border-radius: 4px;">
                <h4 style="margin-top: 0; color: #EF4444;">Cancelled Appointment Details:</h4>
                <p><strong>Patient Name:</strong> ${payment.patientId?.name}</p>
                <p><strong>Patient Email:</strong> ${payment.patientId?.email}</p>
                <p><strong>Date:</strong> ${appointmentDate}</p>
                <p><strong>Time Slot:</strong> ${appointmentSlot}</p>
                <p><strong>Amount:</strong> ₹${payment.amount}</p>
                <p><strong>Cancellation Reason:</strong> <span style="color: #EF4444; font-weight: bold;">Payment Rejected</span></p>
              </div>
              
              <p style="background: #DBEAFE; padding: 12px; border-radius: 4px; border-left: 4px solid #3B82F6;">
                <strong>📌 Note:</strong> The time slot is now available for rebooking by other patients. No payment has been transferred for this appointment.
              </p>
              
              <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
                Best regards,<br/>
                <strong>Mediverse Team</strong>
              </p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Error sending rejection emails:', emailErr);
    }

    res.status(200).json({ success: true, data: payment, message: 'Payment rejected by admin' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

