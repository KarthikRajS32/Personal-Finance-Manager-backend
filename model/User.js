const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profile: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      phone: { type: String, default: "" },
      dateOfBirth: { type: Date },
      avatar: { type: String, default: "" },
    },
    preferences: {
      currency: { type: String, default: "USD" },
      dateFormat: { type: String, default: "MM/DD/YYYY" },
      timezone: { type: String, default: "UTC" },
      language: { type: String, default: "en" },
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      budgetAlerts: { type: Boolean, default: true },
      goalReminders: { type: Boolean, default: true },
      recurringExpenses: { type: Boolean, default: true },
    },
    security: {
      mfaEnabled: { type: Boolean, default: false },
      mfaSecret: { type: String },
      lastLogin: { type: Date },
      loginAttempts: { type: Number, default: 0 },
      lockUntil: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);

