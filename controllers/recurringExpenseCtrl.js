const asyncHandler = require("express-async-handler");
const RecurringExpense = require("../model/RecurringExpense");
const Transaction = require("../model/Transaction");

const calculateNextDueDate = (startDate, frequency) => {
  const date = new Date(startDate);
  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date;
};

const recurringExpenseController = {
  // Create recurring expense
  create: asyncHandler(async (req, res) => {
    const { name, amount, category, frequency, startDate, endDate, description } = req.body;
    
    if (!name || !amount || !frequency || !startDate) {
      throw new Error("Name, amount, frequency and start date are required");
    }

    const nextDueDate = calculateNextDueDate(startDate, frequency);

    const recurringExpense = await RecurringExpense.create({
      user: req.user,
      name,
      amount,
      category,
      frequency,
      startDate,
      endDate,
      nextDueDate,
      description,
    });

    res.status(201).json(recurringExpense);
  }),

  // Get all recurring expenses
  getAll: asyncHandler(async (req, res) => {
    const recurringExpenses = await RecurringExpense.find({ user: req.user }).sort({ createdAt: -1 });
    res.json(recurringExpenses);
  }),

  // Update recurring expense
  update: asyncHandler(async (req, res) => {
    const recurringExpense = await RecurringExpense.findById(req.params.id);
    
    if (recurringExpense && recurringExpense.user.toString() === req.user.toString()) {
      const updatedData = { ...req.body };
      
      if (req.body.startDate || req.body.frequency) {
        updatedData.nextDueDate = calculateNextDueDate(
          req.body.startDate || recurringExpense.startDate,
          req.body.frequency || recurringExpense.frequency
        );
      }

      const updatedRecurringExpense = await RecurringExpense.findByIdAndUpdate(
        req.params.id,
        updatedData,
        { new: true }
      );
      
      res.json(updatedRecurringExpense);
    } else {
      res.status(404);
      throw new Error("Recurring expense not found");
    }
  }),

  // Delete recurring expense
  delete: asyncHandler(async (req, res) => {
    const recurringExpense = await RecurringExpense.findById(req.params.id);
    
    if (recurringExpense && recurringExpense.user.toString() === req.user.toString()) {
      await RecurringExpense.findByIdAndDelete(req.params.id);
      res.json({ message: "Recurring expense removed" });
    } else {
      res.status(404);
      throw new Error("Recurring expense not found");
    }
  }),

  // Process due recurring expenses (create transactions)
  processDue: asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueExpenses = await RecurringExpense.find({
      user: req.user,
      isActive: true,
      nextDueDate: { $lte: today },
    });

    const processedTransactions = [];

    for (const expense of dueExpenses) {
      // Create transaction
      const transaction = await Transaction.create({
        user: req.user,
        type: "expense",
        category: expense.category,
        amount: expense.amount,
        description: `${expense.name} (Recurring)`,
        date: expense.nextDueDate,
      });

      processedTransactions.push(transaction);

      // Update next due date
      const nextDueDate = calculateNextDueDate(expense.nextDueDate, expense.frequency);
      
      // Check if end date is reached
      if (expense.endDate && nextDueDate > expense.endDate) {
        expense.isActive = false;
      } else {
        expense.nextDueDate = nextDueDate;
      }

      await expense.save();
    }

    res.json({
      message: `Processed ${processedTransactions.length} recurring expenses`,
      transactions: processedTransactions,
    });
  }),
};

module.exports = recurringExpenseController;