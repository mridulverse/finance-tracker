const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);

// Core AI insights generation function
async function generateInsights(userId) {
  const now = new Date();
  const insights = [];

  // Current month data
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Previous month data
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Last 3 months for trend analysis
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const [currentExpenses, prevExpenses, allExpenses, currentIncome] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: prevMonthStart, $lte: prevMonthEnd } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: threeMonthsAgo } } },
      { $group: { _id: { month: { $month: '$date' }, year: { $year: '$date' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: 'income', date: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const totalCurrentExpense = currentExpenses.reduce((s, e) => s + e.total, 0);
  const totalPrevExpense = prevExpenses.reduce((s, e) => s + e.total, 0);
  const totalIncome = currentIncome[0]?.total || 0;

  // === INSIGHT 1: Top spending category ===
  if (currentExpenses.length > 0) {
    const topCategory = currentExpenses.reduce((max, e) => e.total > max.total ? e : max);
    const percentage = totalCurrentExpense > 0 ? ((topCategory.total / totalCurrentExpense) * 100).toFixed(1) : 0;
    insights.push({
      type: 'spending_pattern',
      severity: percentage > 40 ? 'warning' : 'info',
      icon: '📊',
      title: 'Top Spending Category',
      message: `You're spending ${percentage}% of your budget on ${topCategory._id} this month.`,
      value: topCategory.total,
      category: topCategory._id
    });
  }

  // === INSIGHT 2: Month-over-month change ===
  if (totalPrevExpense > 0 && totalCurrentExpense > 0) {
    const change = ((totalCurrentExpense - totalPrevExpense) / totalPrevExpense * 100).toFixed(1);
    const isIncrease = change > 0;
    insights.push({
      type: 'trend',
      severity: isIncrease && change > 15 ? 'warning' : isIncrease ? 'info' : 'success',
      icon: isIncrease ? '📈' : '📉',
      title: 'Monthly Spending Change',
      message: `Your expenses ${isIncrease ? 'increased' : 'decreased'} by ${Math.abs(change)}% compared to last month.`,
      change: Number(change)
    });
  }

  // === INSIGHT 3: Savings rate ===
  if (totalIncome > 0) {
    const savings = totalIncome - totalCurrentExpense;
    const savingsRate = ((savings / totalIncome) * 100).toFixed(1);
    insights.push({
      type: 'savings',
      severity: savingsRate < 10 ? 'danger' : savingsRate < 20 ? 'warning' : 'success',
      icon: savings > 0 ? '💰' : '⚠️',
      title: 'Savings Rate',
      message: savings > 0
        ? `You're saving ${savingsRate}% of your income this month. ${savingsRate >= 20 ? 'Great job!' : 'Try to save at least 20%.'}`
        : `You've spent ₹${Math.abs(savings).toLocaleString()} more than your income. Reduce expenses immediately.`,
      savings,
      savingsRate: Number(savingsRate)
    });
  }

  // === INSIGHT 4: Category-specific savings tip ===
  const highSpendCategories = currentExpenses.filter(e => {
    const percentage = totalCurrentExpense > 0 ? (e.total / totalCurrentExpense) * 100 : 0;
    return percentage > 25 && e._id !== 'Salary' && e._id !== 'Investment';
  });

  if (highSpendCategories.length > 0) {
    const highCat = highSpendCategories[0];
    const savingsPotential = (highCat.total * 0.2).toFixed(0);
    insights.push({
      type: 'saving_tip',
      severity: 'info',
      icon: '💡',
      title: 'Savings Opportunity',
      message: `You could save approximately ₹${Number(savingsPotential).toLocaleString()} by reducing your ${highCat._id} spending by 20%.`,
      potential: Number(savingsPotential),
      category: highCat._id
    });
  }

  // === INSIGHT 5: Spending trend prediction ===
  if (allExpenses.length >= 2) {
    const recentMonths = allExpenses.slice(-3);
    const avgGrowth = recentMonths.length > 1
      ? recentMonths.slice(1).reduce((sum, m, i) => {
          const prev = recentMonths[i];
          return sum + (m.total - prev.total) / prev.total;
        }, 0) / (recentMonths.length - 1)
      : 0;

    const lastMonthTotal = recentMonths[recentMonths.length - 1]?.total || totalCurrentExpense;
    const predictedNext = Math.round(lastMonthTotal * (1 + avgGrowth));

    insights.push({
      type: 'prediction',
      severity: 'info',
      icon: '🔮',
      title: 'Next Month Prediction',
      message: `Based on your spending patterns, you're likely to spend approximately ₹${predictedNext.toLocaleString()} next month.`,
      predicted: predictedNext,
      trend: avgGrowth > 0 ? 'increasing' : avgGrowth < 0 ? 'decreasing' : 'stable'
    });
  }

  // === INSIGHT 6: Unusual spending spike ===
  for (const curr of currentExpenses) {
    const prev = prevExpenses.find(p => p._id === curr._id);
    if (prev && prev.total > 0) {
      const spike = ((curr.total - prev.total) / prev.total) * 100;
      if (spike > 50) {
        insights.push({
          type: 'anomaly',
          severity: 'warning',
          icon: '🚨',
          title: 'Spending Spike Detected',
          message: `Your ${curr._id} spending jumped by ${spike.toFixed(0)}% compared to last month.`,
          category: curr._id,
          spike: spike.toFixed(0)
        });
        break; // Only report the biggest spike
      }
    }
  }

  return insights;
}

// @GET /api/insights
router.get('/', async (req, res) => {
  try {
    const insights = await generateInsights(req.user._id);

    // Also return spending breakdown for charts
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const spendingByCategory = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: monthStart, $lte: monthEnd }
        }
      },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    res.json({
      success: true,
      data: { insights, spendingByCategory }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
