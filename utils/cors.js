const cors = require("cors");

const corsOptions = {
  origin: "*",
  methods: ["GET", "PATCH", "POST", "DELETE", "PUT"],
  credentials: true,
};

module.exports = cors(corsOptions);
