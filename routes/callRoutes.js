const express = require("express");
const router = express.Router();
const {
  generateToken,
  initiateCall,
  updateCallStatus,
  acceptCall,
} = require("../controllers/callController");

// Generate Agora token
router.post("/token", generateToken);

// Initiate a call
router.post("/initiate", initiateCall);

// Accept call
router.post("/accept", acceptCall);

// Update call status
router.patch("/status/:callId", updateCallStatus);

module.exports = router;
