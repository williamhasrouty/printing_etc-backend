require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const { errors } = require("celebrate");
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");
const { requestLogger, errorLogger } = require("./middlewares/logger");
const { PORT, MONGODB_URI, NODE_ENV } = require("./config/config");
const { NotFoundError } = require("./errors/errors");

const app = express();

// Trust proxy in production (for proper client IP detection behind NGINX)
if (NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Security middleware
app.use(helmet());

// Prevent NoSQL injection attacks
app.use(mongoSanitize());

// Sanitize user input from XSS attacks
app.use(xss());

// CORS configuration
const corsOptions = {
  origin:
    NODE_ENV === "production"
      ? ["https://printingetc.com", "https://www.printingetc.com"]
      : "*",
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === "production" ? 100 : 1000, // 100 for production, 1000 for development
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// HTTPS enforcement in production
if (NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      return res.redirect(`https://${req.header("host")}${req.url}`);
    }
    next();
  });
}

// Root route
app.get("/", (req, res) => {
  res.status(200).send("Printing Etc backend is running 🚀");
});

// Routes
app.use(routes);

// Handle undefined routes
app.use((req, res, next) => {
  next(new NotFoundError("Requested resource not found"));
});

// Error logging
app.use(errorLogger);

// Celebrate error handler
app.use(errors());

// Custom error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
