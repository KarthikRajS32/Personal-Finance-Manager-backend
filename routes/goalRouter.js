const express = require("express");
const goalController = require("../controllers/goalCtrl");
const isAuthenticated = require("../middlewares/isAuth");

const goalRouter = express.Router();

// Create goal
goalRouter.post("/create", isAuthenticated, goalController.create);

// Get goals list
goalRouter.get("/list", isAuthenticated, goalController.list);

// Update goal
goalRouter.put("/update/:id", isAuthenticated, goalController.update);

// Delete goal
goalRouter.delete("/delete/:id", isAuthenticated, goalController.delete);

// Add contribution to goal
goalRouter.put("/contribute/:id", isAuthenticated, goalController.addContribution);

// Get financial forecast
goalRouter.get("/forecast", isAuthenticated, goalController.forecast);

module.exports = goalRouter;