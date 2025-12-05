const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// For Stripe integration (you'll need to install stripe: npm install stripe)
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
} catch (error) {
  console.log('Stripe not configured');
}

// Create payment intent
exports.createPaymentIntent = async (req, res) => {
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

    const amount = appointment.doctorId.fees * 100; // Convert to cents

    if (stripe) {
      // Real Stripe integration
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'inr',
        metadata: {
          appointmentId: appointment._id.toString(),
          patientId: req.user.id,
          doctorId: appointment.doctorId._id.toString(),
        },
      });

      // Create payment record
      const payment = new Payment({
        appointmentId: appointment._id,
        patientId: req.user.id,
        doctorId: appointment.doctorId._id,
        amount: appointment.doctorId.fees,
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
      });

      await payment.save();

      res.status(200).json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentId: payment._id,
        },
      });
    } else {
      // Mock payment for development
      const payment = new Payment({
        appointmentId: appointment._id,
        patientId: req.user.id,
        doctorId: appointment.doctorId._id,
        amount: appointment.doctorId.fees,
        status: 'completed',
        transactionId: `mock_${Date.now()}`,
      });

      await payment.save();
      appointment.paymentId = payment._id;
      await appointment.save();

      res.status(200).json({
        success: true,
        data: {
          clientSecret: 'mock_client_secret',
          paymentId: payment._id,
          mock: true,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Confirm payment
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    payment.status = 'completed';
    payment.transactionId = payment.transactionId || `txn_${Date.now()}`;
    await payment.save();

    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment) {
      appointment.paymentId = payment._id;
      await appointment.save();
    }

    res.status(200).json({ success: true, data: payment, message: 'Payment confirmed' });
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

