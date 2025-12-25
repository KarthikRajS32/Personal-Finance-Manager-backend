const express = require("express");
const reportController = require("../controllers/reportCtrl");
const isAuthenticated = require("../middlewares/isAuth");

const reportRouter = express.Router();

// Expense report
reportRouter.get("/expense", isAuthenticated, reportController.expenseReport);

// Budget report
reportRouter.get("/budget", isAuthenticated, reportController.budgetReport);

// Income report
reportRouter.get("/income", isAuthenticated, reportController.incomeReport);

// Comprehensive report
reportRouter.get("/comprehensive", isAuthenticated, reportController.comprehensiveReport);

// Financial forecasting
reportRouter.get("/forecast", isAuthenticated, reportController.financialForecast);

module.exports = reportRouter;