// models/Withdrawal.js

const mongoose = require('mongoose');
const withdrawalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  transactionId: String,
  notes: String
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
