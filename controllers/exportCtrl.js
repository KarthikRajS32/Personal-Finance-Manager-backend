const asyncHandler = require("express-async-handler");
const { Parser } = require('json2csv');
const Transaction = require("../model/Transaction");
const Budget = require("../model/Budget");
const Goal = require("../model/Goal");

const exportController = {
  // Export transactions to CSV
  exportTransactions: asyncHandler(async (req, res) => {
    const { startDate, endDate, category, type } = req.query;
    
    const query = { user: req.user };
    
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (category) query.category = category;
    if (type) query.type = type;

    const transactions = await Transaction.find(query).sort({ date: -1 });

    const csvData = transactions.map(transaction => ({
      Date: transaction.date.toISOString().split('T')[0],
      Type: transaction.type,
      Category: transaction.category,
      Amount: transaction.amount,
      Description: transaction.description || '',
    }));

    res.status(200).json({
      data: csvData,
      filename: `transactions_${new Date().toISOString().split('T')[0]}.csv`,
    });
  }),

  // Export budgets to CSV
  exportBudgets: asyncHandler(async (req, res) => {
    const budgets = await Budget.find({ user: req.user, isActive: true });

    const csvData = budgets.map(budget => ({
      Name: budget.name,
      Category: budget.category,
      Amount: budget.amount,
      Spent: budget.spent,
      Period: budget.period,
      'Start Date': budget.startDate.toISOString().split('T')[0],
      'End Date': budget.endDate.toISOString().split('T')[0],
      'Alert Threshold': budget.alertThreshold,
    }));

    res.status(200).json({
      data: csvData,
      filename: `budgets_${new Date().toISOString().split('T')[0]}.csv`,
    });
  }),

  // Export goals to CSV
  exportGoals: asyncHandler(async (req, res) => {
    const goals = await Goal.find({ user: req.user });

    const csvData = goals.map(goal => ({
      Name: goal.name,
      Description: goal.description || '',
      'Target Amount': goal.targetAmount,
      'Current Amount': goal.currentAmount,
      Category: goal.category,
      Priority: goal.priority,
      Status: goal.status,
      Deadline: goal.deadline.toISOString().split('T')[0],
      'Monthly Contribution': goal.monthlyContribution,
    }));

    res.status(200).json({
      data: csvData,
      filename: `goals_${new Date().toISOString().split('T')[0]}.csv`,
    });
  }),

  // Export PDF Report Data
  exportPDFReport: asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const transactions = await Transaction.find({ user: req.user, ...dateFilter });
    const budgets = await Budget.find({ user: req.user, isActive: true });
    const goals = await Goal.find({ user: req.user });

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpenses;

    const reportData = {
      title: 'Financial Report',
      date: new Date().toISOString().split('T')[0],
      summary: {
        totalIncome: totalIncome.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        netSavings: netSavings.toFixed(2),
        savingsRate: totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(2) : 0
      },
      transactions: transactions.slice(0, 10).map(t => ({
        date: t.date.toDateString(),
        type: t.type,
        category: t.category,
        amount: t.amount,
        description: t.description || ''
      }))
    };

    res.status(200).json({
      data: reportData,
      filename: `financial_report_${new Date().toISOString().split('T')[0]}.pdf`,
    });
  }),

  // Export comprehensive financial report
  exportFinancialReport: asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Get transactions
    const transactions = await Transaction.find({ user: req.user, ...dateFilter });
    
    // Get budgets
    const budgets = await Budget.find({ user: req.user, isActive: true });
    
    // Get goals
    const goals = await Goal.find({ user: req.user });

    // Calculate summaries
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpenses;

    const reportData = {
      summary: {
        'Total Income': totalIncome,
        'Total Expenses': totalExpenses,
        'Net Savings': netSavings,
        'Savings Rate': totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(2) + '%' : '0%',
        'Total Budgets': budgets.length,
        'Active Goals': goals.filter(g => g.status === 'active').length,
        'Report Date': new Date().toISOString().split('T')[0],
      },
      transactions: transactions.map(t => ({
        Date: t.date.toISOString().split('T')[0],
        Type: t.type,
        Category: t.category,
        Amount: t.amount,
        Description: t.description || '',
      })),
      budgets: budgets.map(b => ({
        Name: b.name,
        Category: b.category,
        Amount: b.amount,
        Spent: b.spent,
        Remaining: b.amount - b.spent,
        Period: b.period,
      })),
      goals: goals.map(g => ({
        Name: g.name,
        'Target Amount': g.targetAmount,
        'Current Amount': g.currentAmount,
        Progress: ((g.currentAmount / g.targetAmount) * 100).toFixed(2) + '%',
        Status: g.status,
        Deadline: g.deadline.toISOString().split('T')[0],
      })),
    };

    res.status(200).json({
      data: reportData,
      filename: `financial_report_${new Date().toISOString().split('T')[0]}.json`,
    });
  }),
};

module.exports = exportController;