const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  getNotifications,
  markAsRead,
  createNotification,
  markAllAsRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.route("/").get(protect, getNotifications);
router.route("/create").post(protect, createNotification);
router.route("/read-all").put(protect, markAllAsRead);
router.route("/:id/read").put(protect, markAsRead);

module.exports = router;
