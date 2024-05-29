const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = require("./app");
const http = require("http");

dotenv.config();

// Connect to the database
connectDB();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
