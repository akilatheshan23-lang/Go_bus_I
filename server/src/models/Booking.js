import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow bookings without registered users
    },
    // Bus and Schedule Information
    busId: {
        type: String,
        required: true
    },
    scheduleId: {
        type: String,
        required: true
    },
    route: {
        from: {
            type: String,
            required: true
        },
        to: {
            type: String,
            required: true
        }
    },
    // Passenger Information
    passengerDetails: {
        name: {
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
        }
    },
    // Booking Details
    selectedSeats: [{
        type: String,
        required: true
    }],
    departureTime: {
        type: String,
        required: true
    },
    departureDate: {
        type: Date,
        required: true
    },
    // Payment Information
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    // Booking Status
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    // Cancellation/Modification Details
    cancellationReason: {
        type: String,
        trim: true
    },
    cancelledAt: {
        type: Date
    },
    cancelledBy: {
        type: String,
        trim: true
    },
    // Additional Information
    specialRequests: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance (bookingId index is already created by unique: true)
bookingSchema.index({ userId: 1 });
bookingSchema.index({ 'passengerDetails.email': 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ departureDate: 1 });
bookingSchema.index({ createdAt: -1 });

// Virtual for passenger name (for easier access)
bookingSchema.virtual('passengerName').get(function() {
    return this.passengerDetails.name;
});

// Virtual for passenger email (for easier access)
bookingSchema.virtual('passengerEmail').get(function() {
    return this.passengerDetails.email;
});

// Instance method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
    const now = new Date();
    const departureDateTime = new Date(this.departureDate);
    
    // Can cancel if departure is more than 2 hours away and status is confirmed
    const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    return this.status === 'confirmed' && departureDateTime > twoHoursFromNow;
};

// Instance method to cancel booking
bookingSchema.methods.cancelBooking = function(reason, cancelledBy = 'System') {
    this.status = 'cancelled';
    this.cancellationReason = reason;
    this.cancelledAt = new Date();
    this.cancelledBy = cancelledBy;
    return this.save();
};

// Static method to find bookings by passenger email
bookingSchema.statics.findByPassengerEmail = function(email) {
    return this.find({ 'passengerDetails.email': email.toLowerCase() })
                .sort({ createdAt: -1 })
                .populate('paymentId');
};

// Static method to find bookings by booking ID
bookingSchema.statics.findByBookingId = function(bookingId) {
    return this.findOne({ bookingId })
                .populate('paymentId')
                .populate('userId', 'username email');
};

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;