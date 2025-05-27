const Notification = require("../models/Notification");
const { sendAppointmentConfirmation } = require("./emailService");

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
  const isPatient = user._id.toString() === appointment.patient.toString();
  const isDoctor = user._id.toString() === appointment.specialist.toString();

  // Get appointment details
  const appointmentDate = new Date(appointment.dateTime);
  const dateFormatted = appointmentDate.toLocaleDateString();
  const timeFormatted = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  switch (type) {
    case "scheduled":
      if (isPatient) {
        title = "Appointment Confirmed";
        message = `Your appointment with ${appointment.specialistCategory} has been scheduled for ${dateFormatted} at ${timeFormatted}`;
      } else if (isDoctor) {
        title = "New Appointment Request";
        message = `New appointment scheduled with a patient for ${dateFormatted} at ${timeFormatted}`;
      }
      break;
    case "reminder":
      if (isPatient) {
        title = "Appointment Reminder";
        message = `Reminder: You have an appointment with ${appointment.specialistCategory} tomorrow at ${timeFormatted}`;
      } else if (isDoctor) {
        title = "Appointment Reminder";
        message = `Reminder: You have an appointment with a patient tomorrow at ${timeFormatted}`;
      }
      break;
    case "dayOf":
      if (isPatient) {
        title = "Today's Appointment";
        message = `You have an appointment with ${appointment.specialistCategory} today at ${timeFormatted}`;
      } else if (isDoctor) {
        title = "Today's Appointment";
        message = `You have an appointment with a patient today at ${timeFormatted}`;
      }
      break;
    case "cancelled":
      if (isPatient) {
        title = "Appointment Cancelled";
        message = `Your appointment with ${appointment.specialistCategory} scheduled for ${dateFormatted} has been cancelled`;
      } else if (isDoctor) {
        title = "Appointment Cancelled";
        message = `The appointment scheduled for ${dateFormatted} at ${timeFormatted} has been cancelled`;
      }
      break;
    case "confirmed":
      if (isPatient) {
        title = "Appointment Confirmed";
        message = `Your appointment with ${appointment.specialistCategory} for ${dateFormatted} at ${timeFormatted} has been confirmed`;
      } else if (isDoctor) {
        title = "Appointment Confirmed";
        message = `You have confirmed the appointment for ${dateFormatted} at ${timeFormatted}`;
      }
      break;
    default:
      return null;
  }

  console.log(`Creating notification for ${isPatient ? 'patient' : 'doctor'}: ${title} - ${message}`);

  // Create in-app notification
  const notification = await createNotification(
    user._id,
    title,
    message,
    "appointment",
    appointment._id,
    { appointmentId: appointment._id, type }
  );

  // Send email notification for important events
  if (type === "scheduled" || type === "confirmed" || type === "cancelled") {
    try {
      await sendAppointmentConfirmation(appointment, user);
      console.log(`✅ Email notification sent to ${user.email} for appointment ${type}`);
    } catch (emailError) {
      console.error(`❌ Failed to send email notification to ${user.email}:`, emailError.message);
      // Don't fail the entire notification process if email fails
    }
  }

  return notification;
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