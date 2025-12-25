const express = require("express");
const notificationController = require("../controllers/notificationCtrl");
const isAuthenticated = require("../middlewares/isAuth");

const notificationRouter = express.Router();

// Get notifications
notificationRouter.get("/", isAuthenticated, notificationController.getNotifications);

// Mark notification as read
notificationRouter.put("/:id/read", isAuthenticated, notificationController.markAsRead);

// Mark all notifications as read
notificationRouter.put("/read-all", isAuthenticated, notificationController.markAllAsRead);

// Delete notification
notificationRouter.delete("/:id", isAuthenticated, notificationController.deleteNotification);

module.exports = notificationRouter;