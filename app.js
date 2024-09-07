const express = require("express");
const morgan = require("morgan");
const routes = require("./routes/index");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongosanitize = require("express-mongo-sanitize");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("cookie-session");
const socket = require("./utils/socket");
const path = require("path");
const customCors = require("./utils/cors");

const app = express();

// const uploadDir = path.join(__dirname, "uploads", "profile-images");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// Enable CORS
app.use(customCors);

// app.use(cookieParser());

// Body parser configurations
app.use(express.json({ limit: "10kb" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session management
app.use(
  session({
    secret: "keyboard cat",
    proxy: true,
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false,
    },
  })
);

// Security headers
app.use(helmet());

// Request logging in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate limiting
const limiter = rateLimit({
  max: 3000,
  windowMs: 60 * 60 * 1000, // In one hour
  message: "Too many Requests from this IP, please try again in an hour!",
});
app.use("/tawk", limiter);

// Input sanitization
app.use(mongosanitize());

// Make io available to our router
app.use((req, res, next) => {
  req.io = socket.getIO();
  next();
});

// Routes
app.use("/api", routes);

// Update the static file middleware
app.use(
  "/uploads",
  customCors,
  express.static(path.join(__dirname, "uploads"))
);

//just to test

app.get("/test", (req, res) => {
  console.log("it is working ");
  res.json({ message: "This is the get-calls route" });
});

module.exports = app;
