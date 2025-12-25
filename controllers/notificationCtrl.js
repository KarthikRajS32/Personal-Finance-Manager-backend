const asyncHandler = require("express-async-handler");
const Notification = require("../model/Notification");

const notificationController = {
  // Get user notifications
  getNotifications: asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { user: req.user };
    if (unreadOnly === "true") {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: req.user, read: false });

    res.status(200).json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  }),

  // Mark notification as read
  markAsRead: asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user },
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404);
      throw new Error("Notification not found");
    }

    res.status(200).json(notification);
  }),

  // Mark all notifications as read
  markAllAsRead: asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { user: req.user, read: false },
      { read: true }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  }),

  // Delete notification
  deleteNotification: asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const notification = await Notification.findOneAndDelete({ _id: id, user: req.user });

    if (!notification) {
      res.status(404);
      throw new Error("Notification not found");
    }

    res.status(200).json({ message: "Notification deleted" });
  }),

  // Create notification (internal use)
  createNotification: async (userId, type, title, message, data = null, priority = "medium") => {
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
  },
};

module.exports = notificationController;