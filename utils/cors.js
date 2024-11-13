const cors = require("cors");

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 600,
  keepAliveTimeout: 60000,
  headersTimeout: 61000,
};

module.exports = cors(corsOptions);
