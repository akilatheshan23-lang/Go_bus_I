import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
    promoCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: null // null means unlimited usage
    },
    usageCount: {
        type: Number,
        default: 0
    },
    minimumAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    applicableRoutes: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Index for promoCode is automatically created due to unique: true
// Additional indexes for commonly queried fields
promotionSchema.index({ isActive: 1 });
promotionSchema.index({ validFrom: 1, validUntil: 1 });

// Validate that validUntil is after validFrom
promotionSchema.pre('validate', function(next) {
    if (this.validUntil <= this.validFrom) {
        const err = new Error('Valid until date must be after valid from date');
        err.name = 'ValidationError';
        return next(err);
    }
    next();
});

// Method to check if promotion is currently valid
promotionSchema.methods.isValid = function() {
    const now = new Date();
    return this.isActive && 
           now >= this.validFrom && 
           now <= this.validUntil &&
           (this.usageLimit === null || this.usageCount < this.usageLimit);
};

// Method to apply discount
promotionSchema.methods.applyDiscount = function(amount) {
    if (!this.isValid()) {
        throw new Error('Promotion is not valid');
    }
    
    if (amount < this.minimumAmount) {
        throw new Error(`Minimum amount required: ${this.minimumAmount}`);
    }
    
    if (this.discountType === 'percentage') {
        return amount * (1 - this.discountValue / 100);
    } else {
        return Math.max(0, amount - this.discountValue);
    }
};

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion;