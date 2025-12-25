const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
console.log("MONGO_URI =>", process.env.MONGO_URI); // debug line

const userRouter = require("./routes/userRouter");
const categoryRouter = require("./routes/categoryRouter");
const transactionRouter = require("./routes/transactionRouter");
const recurringExpenseRouter = require("./routes/recurringExpenseRouter");
const budgetRouter = require("./routes/budgetRouter");
const goalRouter = require("./routes/goalRouter");
const reportRouter = require("./routes/reportRouter");
const notificationRouter = require("./routes/notificationRouter");
const exportRouter = require("./routes/exportRouter");
const errorHandler = require("./middlewares/errorHandlerMiddleware");
const NotificationService = require("./services/notificationService");

const app = express();

//! Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // 30s timeout
    socketTimeoutMS: 45000, // 45s timeout
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 5, // Maintain at least 5 socket connections
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ Mongoose disconnected");
});

//! Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//! Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/recurring-expenses", recurringExpenseRouter);
app.use("/api/v1/budgets", budgetRouter);
app.use("/api/v1/goals", goalRouter);
app.use("/api/v1/reports", reportRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/export", exportRouter);

//! Error Handler Middleware
app.use(errorHandler);

//! Initialize Notification Service
NotificationService.init();

//! Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
