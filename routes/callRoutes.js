const express = require("express");
const router = express.Router();
const {
  initiateCall,
  updateCallStatus,
  acceptCall,
  getCall,
  getCalls,
} = require("../controllers/callController");

// Initiate a call
router.post("/initiate", initiateCall);

// Accept call
router.post("/accept", acceptCall);

// Update call status
router.patch("/status/:callId", updateCallStatus);

router.get("/get-call/:callId", getCall);

router.get("/get-calls", getCalls);

module.exports = router;
