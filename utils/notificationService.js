const Notification = require("../models/Notification");

const createNotification = async (userId, title, message, type, relatedId = null, data = {}) => {
  try {
    const notification = new Notification({
      user: userId,
      title,
      message,
      type,
      relatedId,
      data,
      isRead: false,
    });

    await notification.save();
    
    // Try to emit socket notification, but don't fail if socket is not available
    try {
      const io = require("../utils/socket").getIO();
      io.to(`notification_${userId}`).emit("newNotification", notification);
    } catch (socketError) {
      console.log("Socket notification failed (socket may not be configured):", socketError.message);
    }
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

const createAppointmentNotification = async (appointment, user, type) => {
  let title, message;

  switch (type) {
    case "scheduled":
      title = "New Appointment Scheduled";
      message = `Your appointment with ${appointment.specialistCategory} has been scheduled for ${new Date(appointment.dateTime).toLocaleString()}`;
      break;
    case "reminder":
      title = "Appointment Reminder";
      message = `Reminder: You have an appointment with ${appointment.specialistCategory} on ${new Date(appointment.dateTime).toLocaleString()}`;
      break;
    case "dayOf":
      title = "Today's Appointment";
      message = `You have an appointment with ${appointment.specialistCategory} today at ${new Date(appointment.dateTime).toLocaleTimeString()}`;
      break;
    case "cancelled":
      title = "Appointment Cancelled";
      message = `Your appointment with ${appointment.specialistCategory} has been cancelled`;
      break;
    default:
      return null;
  }

  return await createNotification(
    user._id,
    title,
    message,
    "appointment",
    appointment._id,
    { appointmentId: appointment._id }
  );
};

const markNotificationAsRead = async (notificationId) => {
  const notification = await Notification.findById(notificationId);
  if (notification) {
    notification.isRead = true;
    await notification.save();
  }
  return notification;
};

const markAllNotificationsAsRead = async (userId) => {
  await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  );
};

const getUserNotifications = async (userId, limit = 10) => {
  return await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

const getUnreadNotificationCount = async (userId) => {
  return await Notification.countDocuments({
    user: userId,
    isRead: false,
  });
};

module.exports = {
  createNotification,
  createAppointmentNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUserNotifications,
  getUnreadNotificationCount,
}; 