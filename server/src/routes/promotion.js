import express from 'express';
import Promotion from '../models/Promotion.js';
import { requireAuth } from './_authMiddleware.js';

const router = express.Router();

// Get all active promotions (public endpoint)
router.get('/public', async (req, res) => {
    try {
        const now = new Date();
        const promotions = await Promotion.find({
            isActive: true,
            validFrom: { $lte: now },
            validUntil: { $gte: now }
        }).select('promoCode description discountType discountValue minimumAmount');

        res.json(promotions);
    } catch (error) {
        console.error('Get public promotions error:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve promotions', 
            error: error.message 
        });
    }
});

// Validate and apply promotion code
router.post('/apply', requireAuth, async (req, res) => {
    try {
        const { promoCode, amount } = req.body;

        if (!promoCode || !amount) {
            return res.status(400).json({ 
                message: 'Promo code and amount are required' 
            });
        }

        const promotion = await Promotion.findOne({ 
            promoCode: promoCode.toUpperCase() 
        });

        if (!promotion) {
            return res.status(404).json({ message: 'Invalid promo code' });
        }

        if (!promotion.isValid()) {
            return res.status(400).json({ message: 'Promo code has expired or is not active' });
        }

        if (amount < promotion.minimumAmount) {
            return res.status(400).json({ 
                message: `Minimum amount required: LKR ${promotion.minimumAmount}` 
            });
        }

        try {
            const discountedAmount = promotion.applyDiscount(amount);
            const discountAmount = amount - discountedAmount;

            res.json({
                valid: true,
                originalAmount: amount,
                discountAmount,
                finalAmount: discountedAmount,
                promotion: {
                    code: promotion.promoCode,
                    description: promotion.description,
                    discountType: promotion.discountType,
                    discountValue: promotion.discountValue
                }
            });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    } catch (error) {
        console.error('Apply promotion error:', error);
        res.status(500).json({ 
            message: 'Failed to apply promotion', 
            error: error.message 
        });
    }
});

// Get all promotions (admin only)
router.get('/', requireAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive } = req.query;
        const query = {};
        
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const promotions = await Promotion.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Promotion.countDocuments(query);

        res.json({
            promotions,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get promotions error:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve promotions', 
            error: error.message 
        });
    }
});

// Create new promotion (admin only)
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            promoCode,
            description,
            discountType,
            discountValue,
            validUntil,
            usageLimit,
            minimumAmount = 0,
            applicableRoutes = []
        } = req.body;

        // Validate required fields
        if (!promoCode || !description || !discountType || !discountValue || !validUntil) {
            return res.status(400).json({ 
                message: 'Missing required fields: promoCode, description, discountType, discountValue, validUntil' 
            });
        }

        // Validate discount type and value
        if (!['percentage', 'fixed'].includes(discountType)) {
            return res.status(400).json({ 
                message: 'Discount type must be either "percentage" or "fixed"' 
            });
        }

        if (discountValue <= 0) {
            return res.status(400).json({ message: 'Discount value must be greater than 0' });
        }

        if (discountType === 'percentage' && discountValue > 100) {
            return res.status(400).json({ 
                message: 'Percentage discount cannot exceed 100%' 
            });
        }

        const promotion = new Promotion({
            promoCode: promoCode.toUpperCase().trim(),
            description: description.trim(),
            discountType,
            discountValue,
            validUntil: new Date(validUntil),
            usageLimit: usageLimit || null,
            minimumAmount,
            applicableRoutes
        });

        await promotion.save();

        res.status(201).json({
            message: 'Promotion created successfully',
            promotion
        });
    } catch (error) {
        console.error('Create promotion error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Promo code already exists. Please choose a different code.' 
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to create promotion', 
            error: error.message 
        });
    }
});

// Update promotion (admin only)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        // Convert promoCode to uppercase if provided
        if (updateData.promoCode) {
            updateData.promoCode = updateData.promoCode.toUpperCase().trim();
        }

        // Validate validUntil if provided
        if (updateData.validUntil) {
            updateData.validUntil = new Date(updateData.validUntil);
        }

        const promotion = await Promotion.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }

        res.json({
            message: 'Promotion updated successfully',
            promotion
        });
    } catch (error) {
        console.error('Update promotion error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Promo code already exists. Please choose a different code.' 
            });
        }
        
        res.status(500).json({ 
            message: 'Failed to update promotion', 
            error: error.message 
        });
    }
});

// Delete promotion (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const promotion = await Promotion.findByIdAndDelete(req.params.id);
        
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }

        res.json({ 
            message: 'Promotion deleted successfully',
            deletedId: req.params.id
        });
    } catch (error) {
        console.error('Delete promotion error:', error);
        res.status(500).json({ 
            message: 'Failed to delete promotion', 
            error: error.message 
        });
    }
});

// Toggle promotion status (admin only)
router.patch('/:id/toggle', requireAuth, async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id);
        
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }

        promotion.isActive = !promotion.isActive;
        await promotion.save();

        res.json({
            message: `Promotion ${promotion.isActive ? 'activated' : 'deactivated'} successfully`,
            promotion
        });
    } catch (error) {
        console.error('Toggle promotion error:', error);
        res.status(500).json({ 
            message: 'Failed to toggle promotion status', 
            error: error.message 
        });
    }
});

export default router;