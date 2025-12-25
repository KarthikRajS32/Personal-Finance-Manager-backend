const express = require("express");
const isAuthenticated = require("../middlewares/isAuth");
const recurringExpenseController = require("../controllers/recurringExpenseCtrl");

const recurringExpenseRouter = express.Router();

// All routes require authentication
recurringExpenseRouter.use(isAuthenticated);

// Routes
recurringExpenseRouter.post("/", recurringExpenseController.create);
recurringExpenseRouter.get("/", recurringExpenseController.getAll);
recurringExpenseRouter.put("/:id", recurringExpenseController.update);
recurringExpenseRouter.delete("/:id", recurringExpenseController.delete);
recurringExpenseRouter.post("/process-due", recurringExpenseController.processDue);

module.exports = recurringExpenseRouter;