const Notification = require("../models/Notification");
const asyncHandler = require("express-async-handler");

const getNotifications = asyncHandler(async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching notifications" });
  }
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  res.json(notification);
});

const createNotification = asyncHandler(async (req, res) => {
  try {
    const { userId, title, message, type, relatedId, data } = req.body;
    
    if (!userId || !title || !message || !type) {
      return res.status(400).json({ 
        success: false, 
        message: "userId, title, message, and type are required" 
      });
    }

    const notification = new Notification({
      user: userId,
      title,
      message,
      type,
      relatedId,
      data: data || {},
    });
    
    await notification.save();

    // Try to emit socket notification, but don't fail if socket is not available
    try {
      const io = require("../utils/socket").getIO();
      io.to(`notification_${userId}`).emit("newNotification", notification);
    } catch (socketError) {
      console.log("Socket notification failed (socket may not be configured):", socketError.message);
    }

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ success: false, message: "Error creating notification" });
  }
});

const markAllAsRead = asyncHandler(async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error marking notifications as read" });
  }
});

module.exports = {
  getNotifications,
  markAsRead,
  createNotification,
  markAllAsRead,
};
