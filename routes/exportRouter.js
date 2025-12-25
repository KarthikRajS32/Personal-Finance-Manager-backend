const express = require("express");
const exportController = require("../controllers/exportCtrl");
const isAuthenticated = require("../middlewares/isAuth");

const exportRouter = express.Router();

// Export transactions
exportRouter.get("/transactions", isAuthenticated, exportController.exportTransactions);

// Export budgets
exportRouter.get("/budgets", isAuthenticated, exportController.exportBudgets);

// Export goals
exportRouter.get("/goals", isAuthenticated, exportController.exportGoals);

// Export comprehensive report
exportRouter.get("/financial-report", isAuthenticated, exportController.exportFinancialReport);

// Export PDF report
exportRouter.get("/pdf-report", isAuthenticated, exportController.exportPDFReport);

module.exports = exportRouter;