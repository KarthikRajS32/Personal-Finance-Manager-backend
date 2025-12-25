const express = require("express");
const budgetController = require("../controllers/budgetCtrl");
const isAuthenticated = require("../middlewares/isAuth");

const budgetRouter = express.Router();

// Create budget
budgetRouter.post("/create", isAuthenticated, budgetController.create);

// Get budgets list
budgetRouter.get("/list", isAuthenticated, budgetController.list);

// Update budget
budgetRouter.put("/update/:id", isAuthenticated, budgetController.update);

// Delete budget
budgetRouter.delete("/delete/:id", isAuthenticated, budgetController.delete);

// Get budget alerts
budgetRouter.get("/alerts", isAuthenticated, budgetController.alerts);

// Test route
budgetRouter.get("/test", (req, res) => {
  res.json({ message: "Budget routes working!" });
});

module.exports = budgetRouter;