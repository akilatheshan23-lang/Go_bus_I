import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Promotion from './src/models/Promotion.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gobus_auth_v2";

const samplePromotions = [
  {
    promoCode: 'WELCOME20',
    description: 'Welcome new customers with 20% discount on their first booking',
    discountType: 'percentage',
    discountValue: 20,
    isActive: true,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    usageLimit: 100,
    usageCount: 5,
    minimumAmount: 500,
    applicableRoutes: ['Colombo → Kandy', 'Kandy → Colombo']
  },
  {
    promoCode: 'SAVE500',
    description: 'Fixed discount of LKR 500 on bookings above LKR 2000',
    discountType: 'fixed',
    discountValue: 500,
    isActive: true,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    usageLimit: null, // Unlimited
    usageCount: 12,
    minimumAmount: 2000,
    applicableRoutes: []
  },
  {
    promoCode: 'STUDENT15',
    description: 'Special 15% discount for students',
    discountType: 'percentage',
    discountValue: 15,
    isActive: false, // Inactive for testing toggle functionality
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    usageLimit: 200,
    usageCount: 0,
    minimumAmount: 0,
    applicableRoutes: ['Colombo → Galle', 'Galle → Colombo']
  },
  {
    promoCode: 'EXPIRED10',
    description: 'Expired promotion for testing (10% off)',
    discountType: 'percentage',
    discountValue: 10,
    isActive: true,
    validFrom: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    validUntil: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago (expired)
    usageLimit: 50,
    usageCount: 25,
    minimumAmount: 1000,
    applicableRoutes: []
  }
];

async function seedPromotions() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    // Clear existing promotions
    console.log('🗑️ Clearing existing promotions...');
    await Promotion.deleteMany({});

    // Insert sample promotions
    console.log('📦 Creating sample promotions...');
    const createdPromotions = await Promotion.insertMany(samplePromotions);
    
    console.log(`✅ Created ${createdPromotions.length} sample promotions:`);
    createdPromotions.forEach(promo => {
      console.log(`   - ${promo.promoCode}: ${promo.description}`);
    });

    console.log('🎉 Promotion seeding completed successfully!');
  } catch (error) {
    console.error('❌ Promotion seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedPromotions();