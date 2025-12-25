const asyncHandler = require("express-async-handler");
const Transaction = require("../model/Transaction");
const Budget = require("../model/Budget");

const reportController = {
  // Expense Report
  expenseReport: asyncHandler(async (req, res) => {
    const { startDate, endDate, category, groupBy = "category" } = req.query;
    
    const matchQuery = {
      user: req.user,
      type: "expense",
    };

    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (category) {
      matchQuery.category = category;
    }

    // Get detailed transactions
    const transactions = await Transaction.find(matchQuery).sort({ date: -1 });

    // Group by specified field
    let groupField;
    switch (groupBy) {
      case "date":
        groupField = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
        break;
      case "month":
        groupField = { $dateToString: { format: "%Y-%m", date: "$date" } };
        break;
      default:
        groupField = "$category";
    }

    const aggregatedData = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupField,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
          maxAmount: { $max: "$amount" },
          minAmount: { $min: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalExpenses = aggregatedData.reduce((sum, item) => sum + item.total, 0);
    const totalTransactions = aggregatedData.reduce((sum, item) => sum + item.count, 0);

    res.status(200).json({
      summary: {
        totalExpenses,
        totalTransactions,
        averageExpense: totalExpenses / totalTransactions || 0,
        dateRange: { startDate, endDate },
        groupBy,
      },
      aggregatedData,
      transactions: transactions.slice(0, 100), // Limit for performance
    });
  }),

  // Budget Report
  budgetReport: asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const budgets = await Budget.find({ user: req.user, isActive: true });
    
    const budgetAnalysis = [];
    
    for (const budget of budgets) {
      const dateFilter = {
        $gte: startDate ? new Date(startDate) : budget.startDate,
        $lte: endDate ? new Date(endDate) : budget.endDate,
      };

      const actualSpending = await Transaction.aggregate([
        {
          $match: {
            user: budget.user,
            category: budget.category,
            type: "expense",
            date: dateFilter,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]);

      const spent = actualSpending.length > 0 ? actualSpending[0].total : 0;
      const transactionCount = actualSpending.length > 0 ? actualSpending[0].count : 0;
      const variance = budget.amount - spent;
      const utilizationRate = (spent / budget.amount) * 100;

      budgetAnalysis.push({
        budgetId: budget._id,
        budgetName: budget.name,
        category: budget.category,
        budgetAmount: budget.amount,
        actualSpent: spent,
        variance,
        utilizationRate,
        status: variance >= 0 ? "under" : "over",
        transactionCount,
        period: budget.period,
        alertThreshold: budget.alertThreshold,
      });
    }

    const totalBudgeted = budgetAnalysis.reduce((sum, item) => sum + item.budgetAmount, 0);
    const totalSpent = budgetAnalysis.reduce((sum, item) => sum + item.actualSpent, 0);
    const overBudgetCount = budgetAnalysis.filter(item => item.status === "over").length;

    res.status(200).json({
      summary: {
        totalBudgeted,
        totalSpent,
        totalVariance: totalBudgeted - totalSpent,
        overallUtilization: (totalSpent / totalBudgeted) * 100 || 0,
        budgetsOverLimit: overBudgetCount,
        totalBudgets: budgetAnalysis.length,
      },
      budgetAnalysis,
    });
  }),

  // Income Report
  incomeReport: asyncHandler(async (req, res) => {
    const { startDate, endDate, category, groupBy = "category" } = req.query;
    
    const matchQuery = {
      user: req.user,
      type: "income",
    };

    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (category) {
      matchQuery.category = category;
    }

    // Get detailed transactions
    const transactions = await Transaction.find(matchQuery).sort({ date: -1 });

    // Group by specified field
    let groupField;
    switch (groupBy) {
      case "date":
        groupField = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
        break;
      case "month":
        groupField = { $dateToString: { format: "%Y-%m", date: "$date" } };
        break;
      default:
        groupField = "$category";
    }

    const aggregatedData = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupField,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
          maxAmount: { $max: "$amount" },
          minAmount: { $min: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Get expense data for comparison
    const expenseQuery = { ...matchQuery, type: "expense" };
    const expenseData = await Transaction.aggregate([
      { $match: expenseQuery },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalIncome = aggregatedData.reduce((sum, item) => sum + item.total, 0);
    const totalExpenses = expenseData.length > 0 ? expenseData[0].total : 0;
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    res.status(200).json({
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        totalTransactions: aggregatedData.reduce((sum, item) => sum + item.count, 0),
        averageIncome: totalIncome / aggregatedData.reduce((sum, item) => sum + item.count, 0) || 0,
        dateRange: { startDate, endDate },
        groupBy,
      },
      aggregatedData,
      transactions: transactions.slice(0, 100),
    });
  }),

  // Financial Forecasting
  financialForecast: asyncHandler(async (req, res) => {
    const { months = 6 } = req.query;
    const forecastMonths = parseInt(months);
    
    // Get historical data for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const historicalData = await Transaction.aggregate([
      {
        $match: {
          user: req.user,
          date: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Calculate averages and trends
    const incomeData = historicalData.filter(item => item._id.type === "income");
    const expenseData = historicalData.filter(item => item._id.type === "expense");
    
    const avgMonthlyIncome = incomeData.reduce((sum, item) => sum + item.total, 0) / Math.max(incomeData.length, 1);
    const avgMonthlyExpense = expenseData.reduce((sum, item) => sum + item.total, 0) / Math.max(expenseData.length, 1);
    
    // Calculate growth trends (simple linear regression)
    const calculateTrend = (data) => {
      if (data.length < 2) return 0;
      const n = data.length;
      const sumX = data.reduce((sum, _, index) => sum + index, 0);
      const sumY = data.reduce((sum, item) => sum + item.total, 0);
      const sumXY = data.reduce((sum, item, index) => sum + (index * item.total), 0);
      const sumXX = data.reduce((sum, _, index) => sum + (index * index), 0);
      
      return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
    };
    
    const incomeTrend = calculateTrend(incomeData);
    const expenseTrend = calculateTrend(expenseData);
    
    // Generate forecasts
    const forecasts = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= forecastMonths; i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      
      const projectedIncome = Math.max(0, avgMonthlyIncome + (incomeTrend * i));
      const projectedExpense = Math.max(0, avgMonthlyExpense + (expenseTrend * i));
      const projectedSavings = projectedIncome - projectedExpense;
      
      forecasts.push({
        month: forecastDate.toISOString().substring(0, 7),
        projectedIncome,
        projectedExpense,
        projectedSavings,
        savingsRate: projectedIncome > 0 ? (projectedSavings / projectedIncome) * 100 : 0,
      });
    }
    
    // Get current financial goals for comparison
    const Goal = require("../model/Goal");
    const activeGoals = await Goal.find({ user: req.user, status: "active" });
    
    const goalAnalysis = activeGoals.map(goal => {
      const monthsToDeadline = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30));
      const requiredMonthlySavings = (goal.targetAmount - goal.currentAmount) / Math.max(monthsToDeadline, 1);
      const avgProjectedSavings = forecasts.reduce((sum, f) => sum + f.projectedSavings, 0) / forecasts.length;
      
      return {
        goalId: goal._id,
        goalName: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        remainingAmount: goal.targetAmount - goal.currentAmount,
        monthsToDeadline,
        requiredMonthlySavings,
        avgProjectedSavings,
        feasible: avgProjectedSavings >= requiredMonthlySavings,
        shortfall: Math.max(0, requiredMonthlySavings - avgProjectedSavings),
      };
    });
    
    res.status(200).json({
      historical: {
        avgMonthlyIncome,
        avgMonthlyExpense,
        avgMonthlySavings: avgMonthlyIncome - avgMonthlyExpense,
        incomeTrend,
        expenseTrend,
      },
      forecasts,
      goalAnalysis,
      recommendations: {
        budgetAdjustments: expenseTrend > 0 ? "Consider reducing expenses as they are trending upward" : null,
        incomeOpportunities: incomeTrend < 0 ? "Look for additional income sources as income is trending downward" : null,
        savingsOptimization: forecasts.some(f => f.projectedSavings < 0) ? "Review budget to ensure positive cash flow" : null,
      },
    });
  }),

  // Comprehensive Financial Report
  comprehensiveReport: asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get income and expense summaries
    const financialSummary = await Transaction.aggregate([
      {
        $match: {
          user: req.user,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
        },
      },
    ]);

    // Get monthly trends
    const monthlyTrends = await Transaction.aggregate([
      {
        $match: {
          user: req.user,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get category breakdown
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: req.user,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: {
            category: "$category",
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const income = financialSummary.find(item => item._id === "income") || { total: 0, count: 0, avgAmount: 0 };
    const expense = financialSummary.find(item => item._id === "expense") || { total: 0, count: 0, avgAmount: 0 };

    res.status(200).json({
      summary: {
        totalIncome: income.total,
        totalExpenses: expense.total,
        netSavings: income.total - expense.total,
        savingsRate: income.total > 0 ? ((income.total - expense.total) / income.total) * 100 : 0,
        totalTransactions: income.count + expense.count,
        dateRange: { startDate, endDate },
      },
      monthlyTrends,
      categoryBreakdown,
      incomeVsExpense: {
        income: income.total,
        expense: expense.total,
        avgIncome: income.avgAmount,
        avgExpense: expense.avgAmount,
      },
    });
  }),
};

module.exports = reportController;