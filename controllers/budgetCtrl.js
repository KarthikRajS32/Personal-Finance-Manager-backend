const asyncHandler = require("express-async-handler");
const Budget = require("../model/Budget");
const Transaction = require("../model/Transaction");

const budgetController = {
  // Create Budget
  create: asyncHandler(async (req, res) => {
    const { name, category, amount, period, alertThreshold } = req.body;
    
    // Validation
    if (!name || !category || !amount) {
      res.status(400);
      throw new Error("Name, category, and amount are required");
    }
    
    if (amount <= 0) {
      res.status(400);
      throw new Error("Amount must be greater than 0");
    }
    
    const now = new Date();
    let startDate, endDate;
    
    if (period === "monthly") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    }

    const budget = await Budget.create({
      user: req.user,
      name,
      category,
      amount: parseFloat(amount),
      period,
      startDate,
      endDate,
      alertThreshold: alertThreshold || 80,
    });

    res.status(201).json(budget);
  }),

  // List Budgets
  list: asyncHandler(async (req, res) => {
    const budgets = await Budget.find({ user: req.user, isActive: true });
    
    // Calculate spent amount for each budget
    for (let budget of budgets) {
      const spent = await Transaction.aggregate([
        {
          $match: {
            user: budget.user,
            category: budget.category,
            type: "expense",
            date: { $gte: budget.startDate, $lte: budget.endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" }
          }
        }
      ]);
      
      budget.spent = spent.length > 0 ? spent[0].total : 0;
      await budget.save();
    }

    res.status(200).json(budgets);
  }),

  // Update Budget
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const budget = await Budget.findOneAndUpdate(
      { _id: id, user: req.user },
      req.body,
      { new: true }
    );

    if (!budget) {
      res.status(404);
      throw new Error("Budget not found");
    }

    res.status(200).json(budget);
  }),

  // Delete Budget
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const budget = await Budget.findOneAndUpdate(
      { _id: id, user: req.user },
      { isActive: false },
      { new: true }
    );

    if (!budget) {
      res.status(404);
      throw new Error("Budget not found");
    }

    res.status(200).json({ message: "Budget deleted successfully" });
  }),

  // Get Budget Alerts
  alerts: asyncHandler(async (req, res) => {
    const budgets = await Budget.find({ user: req.user, isActive: true });
    const alerts = [];

    for (let budget of budgets) {
      const spent = await Transaction.aggregate([
        {
          $match: {
            user: budget.user,
            category: budget.category,
            type: "expense",
            date: { $gte: budget.startDate, $lte: budget.endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" }
          }
        }
      ]);

      const spentAmount = spent.length > 0 ? spent[0].total : 0;
      const percentage = (spentAmount / budget.amount) * 100;

      if (percentage >= budget.alertThreshold) {
        alerts.push({
          budgetId: budget._id,
          budgetName: budget.name,
          category: budget.category,
          spent: spentAmount,
          budget: budget.amount,
          percentage: Math.round(percentage),
          type: percentage >= 100 ? "exceeded" : "warning"
        });
      }
    }

    res.status(200).json(alerts);
  }),
};

module.exports = budgetController;