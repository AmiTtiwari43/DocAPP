const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'cash'],
    default: 'stripe',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  transactionId: {
    type: String,
  },
  stripePaymentIntentId: {
    type: String,
  },
}, {
  timestamps: true,
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

