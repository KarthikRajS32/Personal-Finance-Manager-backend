const asyncHandler = require("express-async-handler");
const Goal = require("../model/Goal");
const Transaction = require("../model/Transaction");

const goalController = {
  // Create Goal
  create: asyncHandler(async (req, res) => {
    const { name, description, targetAmount, deadline, category, priority, monthlyContribution } = req.body;
    
    const goal = await Goal.create({
      user: req.user,
      name,
      description,
      targetAmount,
      deadline,
      category,
      priority,
      monthlyContribution,
    });

    res.status(201).json(goal);
  }),

  // List Goals
  list: asyncHandler(async (req, res) => {
    const goals = await Goal.find({ user: req.user }).sort({ createdAt: -1 });
    
    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
      const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
      const requiredMonthly = Math.max(0, (goal.targetAmount - goal.currentAmount) / monthsLeft);
      
      return {
        ...goal.toObject(),
        progress: Math.min(progress, 100),
        daysLeft,
        monthsLeft,
        requiredMonthly,
        isOnTrack: goal.monthlyContribution >= requiredMonthly,
      };
    });

    res.status(200).json(goalsWithProgress);
  }),

  // Update Goal
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const goal = await Goal.findOneAndUpdate(
      { _id: id, user: req.user },
      req.body,
      { new: true }
    );

    if (!goal) {
      res.status(404);
      throw new Error("Goal not found");
    }

    res.status(200).json(goal);
  }),

  // Delete Goal
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const goal = await Goal.findOneAndDelete({ _id: id, user: req.user });

    if (!goal) {
      res.status(404);
      throw new Error("Goal not found");
    }

    res.status(200).json({ message: "Goal deleted successfully" });
  }),

  // Add Contribution
  addContribution: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    const goal = await Goal.findOne({ _id: id, user: req.user });
    if (!goal) {
      res.status(404);
      throw new Error("Goal not found");
    }

    goal.currentAmount += amount;
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = "completed";
    }
    
    await goal.save();
    res.status(200).json(goal);
  }),

  // Get Financial Forecast
  forecast: asyncHandler(async (req, res) => {
    const { months = 12 } = req.query;
    
    // Get last 6 months of transactions for trend analysis
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const transactions = await Transaction.find({
      user: req.user,
      date: { $gte: sixMonthsAgo }
    });

    // Calculate monthly averages
    const monthlyData = {};
    transactions.forEach(transaction => {
      const monthKey = `${transaction.date.getFullYear()}-${transaction.date.getMonth()}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      monthlyData[monthKey][transaction.type] += transaction.amount;
    });

    const monthlyAverages = Object.values(monthlyData);
    const avgIncome = monthlyAverages.reduce((sum, month) => sum + month.income, 0) / monthlyAverages.length || 0;
    const avgExpense = monthlyAverages.reduce((sum, month) => sum + month.expense, 0) / monthlyAverages.length || 0;
    const avgSavings = avgIncome - avgExpense;

    // Generate forecast
    const forecast = [];
    let cumulativeSavings = 0;
    
    for (let i = 1; i <= months; i++) {
      const projectedDate = new Date();
      projectedDate.setMonth(projectedDate.getMonth() + i);
      
      cumulativeSavings += avgSavings;
      
      forecast.push({
        month: projectedDate.toISOString().slice(0, 7),
        projectedIncome: avgIncome,
        projectedExpense: avgExpense,
        projectedSavings: avgSavings,
        cumulativeSavings,
      });
    }

    // Get active goals for recommendations
    const activeGoals = await Goal.find({ user: req.user, status: "active" });
    
    const recommendations = [];
    activeGoals.forEach(goal => {
      const monthsToDeadline = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30));
      const requiredMonthly = (goal.targetAmount - goal.currentAmount) / monthsToDeadline;
      
      if (requiredMonthly > avgSavings) {
        recommendations.push({
          goalName: goal.name,
          message: `Increase monthly savings by $${(requiredMonthly - avgSavings).toFixed(2)} to meet goal deadline`,
          type: "warning"
        });
      } else if (requiredMonthly <= avgSavings * 0.5) {
        recommendations.push({
          goalName: goal.name,
          message: `You're on track! Consider increasing contribution to reach goal earlier`,
          type: "success"
        });
      }
    });

    res.status(200).json({
      currentTrends: {
        avgIncome,
        avgExpense,
        avgSavings,
        savingsRate: avgIncome > 0 ? (avgSavings / avgIncome) * 100 : 0,
      },
      forecast,
      recommendations,
    });
  }),
};

module.exports = goalController;