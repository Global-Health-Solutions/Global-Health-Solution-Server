// routes/adminRoutes.js
const express = require("express");
const { registerAdmin, authAdmin } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const User = require("../models/User");
const { getUsers } = require("../controllers/adminController");

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", authAdmin);

router.get("/check-unapproved", async (req, res) => {
  const users = await User.find({ isApproved: false });
  res.json(!!users);
});

// Protect all routes below with adminProtect
router.route("/unapproved-specialists").get(protect, async (req, res) => {
  const users = await User.find({ role: "specialist", isApproved: false });
  res.json(users);
});

router.route("/fetch-user/:userId").get(protect, async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  res.json(user);
});

router.route("/approve-user/:userId").patch(protect, async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  user.isApproved = true;
  await user.save();
  res.json(user);
});

router.get("/get-users", protect, getUsers);


module.exports = router;
