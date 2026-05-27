/**
 * Seed script - populates the DB with a demo user and 3 months of sample transactions
 * Usage: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Budget = require('./models/Budget');

const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@financeai.com',
  password: 'demo123',
};

const categories = {
  expense: ['Food & Dining','Travel & Transport','Bills & Utilities','Shopping','Entertainment','Healthcare'],
  income:  ['Salary','Freelance']
};

function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const sampleTransactions = () => {
  const txns = [];
  const now = new Date();

  for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0);

    // Salary
    txns.push({ type: 'income', amount: 75000, category: 'Salary',
      description: 'Monthly salary', date: new Date(monthStart.getFullYear(), monthStart.getMonth(), 1) });

    // Freelance (some months)
    if (Math.random() > 0.4) {
      txns.push({ type: 'income', amount: randBetween(8000, 25000), category: 'Freelance',
        description: 'Freelance project', date: randomDate(monthStart, monthEnd) });
    }

    // Regular expenses
    const expenseTemplates = [
      { category: 'Food & Dining',      min: 800,  max: 2500,  count: 12, descriptions: ['Zomato order','Swiggy lunch','Restaurant dinner','Grocery store','Café coffee'] },
      { category: 'Travel & Transport', min: 100,  max: 800,   count: 8,  descriptions: ['Uber ride','Ola cab','Metro card','Petrol refill','Auto rickshaw'] },
      { category: 'Bills & Utilities',  min: 500,  max: 3000,  count: 4,  descriptions: ['Electricity bill','Internet bill','Water bill','Mobile recharge'] },
      { category: 'Shopping',           min: 500,  max: 4000,  count: 4,  descriptions: ['Amazon order','Clothing','Electronics','Books','Myntra purchase'] },
      { category: 'Entertainment',      min: 200,  max: 1500,  count: 4,  descriptions: ['Netflix subscription','Movie tickets','Gaming','Spotify'] },
      { category: 'Healthcare',         min: 200,  max: 2000,  count: 2,  descriptions: ['Pharmacy','Doctor consultation','Lab test'] },
    ];

    expenseTemplates.forEach(({ category, min, max, count, descriptions }) => {
      for (let i = 0; i < count; i++) {
        txns.push({
          type: 'expense', amount: randBetween(min, max), category,
          description: descriptions[randBetween(0, descriptions.length - 1)],
          date: randomDate(monthStart, monthEnd)
        });
      }
    });
  }

  return txns;
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Remove existing demo user
  const existingUser = await User.findOne({ email: DEMO_USER.email });
  if (existingUser) {
    await Transaction.deleteMany({ user: existingUser._id });
    await Budget.deleteMany({ user: existingUser._id });
    await User.deleteOne({ _id: existingUser._id });
    console.log('🗑️  Removed existing demo data');
  }

  // Create user
  const user = await User.create(DEMO_USER);
  console.log(`👤 Created demo user: ${DEMO_USER.email} / ${DEMO_USER.password}`);

  // Create transactions
  const txns = sampleTransactions().map(t => ({ ...t, user: user._id }));
  await Transaction.insertMany(txns);
  console.log(`💸 Inserted ${txns.length} sample transactions`);

  // Create budget
  const now = new Date();
  await Budget.create({
    user: user._id,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    totalBudget: 60000,
    alertThreshold: 80
  });
  console.log('🎯 Created sample budget: ₹60,000');

  console.log('\n🎉 Seed complete! Login with:');
  console.log(`   Email:    ${DEMO_USER.email}`);
  console.log(`   Password: ${DEMO_USER.password}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
