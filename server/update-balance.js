const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shipcanary';
const EMAIL = 'zz@gmail.com';
const AMOUNT = 500;

async function updateBalance() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log('✅ Connected to MongoDB\n');

    // Find user by email (emails are stored in lowercase)
    const user = await User.findOne({ email: EMAIL.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User with email "${EMAIL}" not found.`);
      process.exit(1);
    }

    const oldBalance = user.balance || 0;
    
    // Update balance
    user.balance = (oldBalance + AMOUNT);
    await user.save();

    console.log(`✅ Balance updated successfully!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Old balance: $${oldBalance.toFixed(2)}`);
    console.log(`   Added: $${AMOUNT.toFixed(2)}`);
    console.log(`   New balance: $${user.balance.toFixed(2)}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateBalance();

