const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);

// @GET /api/budgets?month=&year=
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    let budget = await Budget.findOne({ user: req.user._id, month, year });

    // Get actual spending for this month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const spending = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalSpent = spending.reduce((sum, s) => sum + s.total, 0);

    res.json({
      success: true,
      data: { budget, spending, totalSpent, month, year }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/budgets (create or update)
router.post('/', async (req, res) => {
  try {
    const { month, year, totalBudget, categoryBudgets, alertThreshold } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, month, year },
      { totalBudget, categoryBudgets, alertThreshold },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
