const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);

// @GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const today = new Date();

    // Total income and expense all time
    const totals = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    const totalIncome = totals.find(t => t._id === 'income')?.total || 0;
    const totalExpense = totals.find(t => t._id === 'expense')?.total || 0;

    // This month
    const monthlyTotals = await Transaction.aggregate([
      { $match: { user: req.user._id, date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    const monthlyIncome = monthlyTotals.find(t => t._id === 'income')?.total || 0;
    const monthlyExpense = monthlyTotals.find(t => t._id === 'expense')?.total || 0;

    // Category breakdown this month
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: monthStart, $lte: monthEnd }
        }
      },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyTrend = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Recent transactions
    const recentTransactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totals: { income: totalIncome, expense: totalExpense, balance: totalIncome - totalExpense },
        monthly: { income: monthlyIncome, expense: monthlyExpense, balance: monthlyIncome - monthlyExpense },
        categoryBreakdown,
        monthlyTrend,
        recentTransactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
