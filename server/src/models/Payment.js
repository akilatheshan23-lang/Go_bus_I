import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        required: true,
        unique: true
    },
    cardholderName: {
        type: String,
        required: true,
        trim: true
    },
    passengerName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'bank_transfer', 'cash'],
        default: 'card'
    },
    currency: {
        type: String,
        default: 'LKR'
    },
    country: {
        type: String,
        default: 'Sri Lanka'
    },
    // Refund fields
    refundAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    refundDate: {
        type: Date
    },
    refundReason: {
        type: String,
        trim: true
    },
    refundedBy: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes are automatically created for unique fields (bookingId, transactionId)
// Additional indexes for commonly queried fields
paymentSchema.index({ email: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;