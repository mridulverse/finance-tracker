const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  totalBudget: {
    type: Number,
    required: [true, 'Total budget is required'],
    min: [0, 'Budget cannot be negative']
  },
  categoryBudgets: [{
    category: String,
    limit: Number
  }],
  alertThreshold: {
    type: Number,
    default: 80, // Alert at 80% of budget
    min: 1,
    max: 100
  }
}, {
  timestamps: true
});

// Unique budget per user per month/year
budgetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
