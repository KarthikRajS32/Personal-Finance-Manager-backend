const cron = require("node-cron");
const Budget = require("../model/Budget");
const Goal = require("../model/Goal");
const RecurringExpense = require("../model/RecurringExpense");
const Transaction = require("../model/Transaction");
const User = require("../model/User");
const Notification = require("../model/Notification");

class NotificationService {
  static init() {
    // Run budget checks every hour
    cron.schedule("0 * * * *", () => {
      this.checkBudgetAlerts();
    });

    // Run goal checks daily at 9 AM
    cron.schedule("0 9 * * *", () => {
      this.checkGoalReminders();
    });

    // Run recurring expense checks daily at 8 AM
    cron.schedule("0 8 * * *", () => {
      this.checkRecurringExpenses();
    });

    console.log("✅ Notification service initialized");
  }

  static async checkBudgetAlerts() {
    try {
      const budgets = await Budget.find({ isActive: true }).populate("user");

      for (const budget of budgets) {
        if (!budget.user.notifications.budgetAlerts) continue;

        const currentSpending = await Transaction.aggregate([
          {
            $match: {
              user: budget.user._id,
              category: budget.category,
              type: "expense",
              date: {
                $gte: budget.startDate,
                $lte: budget.endDate,
              },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ]);

        const spent = currentSpending.length > 0 ? currentSpending[0].total : 0;
        const utilizationRate = (spent / budget.amount) * 100;

        if (utilizationRate >= budget.alertThreshold) {
          const existingAlert = await Notification.findOne({
            user: budget.user._id,
            type: "budget_alert",
            "data.budgetId": budget._id,
            createdAt: {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          });

          if (!existingAlert) {
            let title, message, priority;

            if (utilizationRate >= 100) {
              title = "Budget Exceeded!";
              message = `You have exceeded your ${budget.name} budget by ${(utilizationRate - 100).toFixed(1)}%`;
              priority = "high";
            } else if (utilizationRate >= 90) {
              title = "Budget Almost Exceeded";
              message = `You have used ${utilizationRate.toFixed(1)}% of your ${budget.name} budget`;
              priority = "high";
            } else {
              title = "Budget Alert";
              message = `You have used ${utilizationRate.toFixed(1)}% of your ${budget.name} budget`;
              priority = "medium";
            }

            await this.createNotification(
              budget.user._id,
              "budget_alert",
              title,
              message,
              {
                budgetId: budget._id,
                budgetName: budget.name,
                budgetAmount: budget.amount,
                spent,
                utilizationRate,
              },
              priority
            );
          }
        }
      }
    } catch (error) {
      console.error("Error checking budget alerts:", error);
    }
  }

  static async checkGoalReminders() {
    try {
      const goals = await Goal.find({ status: "active" }).populate("user");

      for (const goal of goals) {
        if (!goal.user.notifications.goalReminders) continue;

        const now = new Date();
        const deadline = new Date(goal.deadline);
        const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        const progress = (goal.currentAmount / goal.targetAmount) * 100;

        let shouldNotify = false;
        let title, message, priority = "medium";

        if (daysUntilDeadline <= 7 && progress < 90) {
          title = "Goal Deadline Approaching";
          message = `Your goal "${goal.name}" is due in ${daysUntilDeadline} days and is ${progress.toFixed(1)}% complete`;
          priority = "high";
          shouldNotify = true;
        } else if (daysUntilDeadline <= 30 && progress < 50) {
          title = "Goal Progress Check";
          message = `Your goal "${goal.name}" is ${progress.toFixed(1)}% complete with ${daysUntilDeadline} days remaining`;
          shouldNotify = true;
        } else if (progress >= 100) {
          title = "Goal Achieved! 🎉";
          message = `Congratulations! You've achieved your goal "${goal.name}"`;
          priority = "high";
          shouldNotify = true;

          goal.status = "completed";
          await goal.save();
        }

        if (shouldNotify) {
          const existingReminder = await Notification.findOne({
            user: goal.user._id,
            type: "goal_reminder",
            "data.goalId": goal._id,
            createdAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          });

          if (!existingReminder) {
            await this.createNotification(
              goal.user._id,
              "goal_reminder",
              title,
              message,
              {
                goalId: goal._id,
                goalName: goal.name,
                targetAmount: goal.targetAmount,
                currentAmount: goal.currentAmount,
                progress,
                daysUntilDeadline,
              },
              priority
            );
          }
        }
      }
    } catch (error) {
      console.error("Error checking goal reminders:", error);
    }
  }

  static async checkRecurringExpenses() {
    try {
      const recurringExpenses = await RecurringExpense.find({ isActive: true }).populate("user");

      for (const expense of recurringExpenses) {
        if (!expense.user.notifications.recurringExpenses) continue;

        const now = new Date();
        const nextDue = new Date(expense.nextDueDate);
        const daysUntilDue = Math.ceil((nextDue - now) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= 3 && daysUntilDue >= 0) {
          const existingReminder = await Notification.findOne({
            user: expense.user._id,
            type: "recurring_expense",
            "data.expenseId": expense._id,
            createdAt: {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          });

          if (!existingReminder) {
            const title = daysUntilDue === 0 ? "Recurring Expense Due Today" : `Recurring Expense Due in ${daysUntilDue} Days`;
            const message = `${expense.name} (${expense.category}) - $${expense.amount} is due ${daysUntilDue === 0 ? "today" : `in ${daysUntilDue} days`}`;

            await this.createNotification(
              expense.user._id,
              "recurring_expense",
              title,
              message,
              {
                expenseId: expense._id,
                expenseName: expense.name,
                amount: expense.amount,
                category: expense.category,
                dueDate: expense.nextDueDate,
                daysUntilDue,
              },
              daysUntilDue === 0 ? "high" : "medium"
            );
          }
        }

        if (now > nextDue) {
          const nextDate = new Date(nextDue);
          switch (expense.frequency) {
            case "daily":
              nextDate.setDate(nextDate.getDate() + 1);
              break;
            case "weekly":
              nextDate.setDate(nextDate.getDate() + 7);
              break;
            case "monthly":
              nextDate.setMonth(nextDate.getMonth() + 1);
              break;
            case "yearly":
              nextDate.setFullYear(nextDate.getFullYear() + 1);
              break;
          }
          
          expense.nextDueDate = nextDate;
          await expense.save();
        }
      }
    } catch (error) {
      console.error("Error checking recurring expenses:", error);
    }
  }

  static async createNotification(userId, type, title, message, data = null, priority = "medium") {
    try {
      const notification = await Notification.create({
        user: userId,
        type,
        title,
        message,
        data,
        priority,
      });
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }
}

module.exports = NotificationService;