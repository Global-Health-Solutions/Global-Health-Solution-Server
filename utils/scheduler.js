const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { createAppointmentNotification } = require("./notificationService");
const {
  sendAppointmentReminder,
  sendAppointmentDayReminder,
} = require("./emailService");

// Run every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find appointments for tomorrow that haven't had reminders sent
    const appointments = await Appointment.find({
      dateTime: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow,
      },
      status: "scheduled",
      reminderSent: false,
    }).populate("patient specialist");

    for (const appointment of appointments) {
      // Send reminder notification
      await Promise.all([
        createAppointmentNotification(appointment, appointment.patient, "reminder"),
        createAppointmentNotification(appointment, appointment.specialist, "reminder"),
      ]);

      // Send reminder emails
      await Promise.all([
        sendAppointmentReminder(appointment, appointment.patient),
        sendAppointmentReminder(appointment, appointment.specialist),
      ]);

      // Mark reminder as sent
      appointment.reminderSent = true;
      await appointment.save();
    }
  } catch (error) {
    console.error("Error sending appointment reminders:", error);
  }
});

// Run every hour
cron.schedule("0 * * * *", async () => {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find appointments happening in the next hour that haven't had day-of reminders sent
    const appointments = await Appointment.find({
      dateTime: {
        $gte: now,
        $lt: oneHourFromNow,
      },
      status: "scheduled",
      dayOfReminderSent: false,
    }).populate("patient specialist");

    for (const appointment of appointments) {
      // Send day-of reminder notification
      await Promise.all([
        createAppointmentNotification(appointment, appointment.patient, "dayOf"),
        createAppointmentNotification(appointment, appointment.specialist, "dayOf"),
      ]);

      // Send day-of reminder emails
      await Promise.all([
        sendAppointmentDayReminder(appointment, appointment.patient),
        sendAppointmentDayReminder(appointment, appointment.specialist),
      ]);

      // Mark day-of reminder as sent
      appointment.dayOfReminderSent = true;
      await appointment.save();
    }
  } catch (error) {
    console.error("Error sending day-of appointment reminders:", error);
  }
}); 