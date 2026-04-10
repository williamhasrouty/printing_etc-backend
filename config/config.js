const {
  PORT = 3002,
  MONGODB_URI = "mongodb://127.0.0.1:27017/printingetc",
  JWT_SECRET = "dev-secret",
  NODE_ENV = "development",
  CLOUDINARY_CLOUD_NAME = "",
  CLOUDINARY_API_KEY = "",
  CLOUDINARY_API_SECRET = "",
  STRIPE_SECRET_KEY = "",
  STRIPE_WEBHOOK_SECRET = "",
  FRONTEND_URL = "http://localhost:3000",
  RESEND_API_KEY = "",
  EMAIL_FROM = "Printing Etc <orders@printingetc.com>",
} = process.env;

module.exports = {
  PORT,
  MONGODB_URI,
  JWT_SECRET,
  NODE_ENV,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  FRONTEND_URL,
  RESEND_API_KEY,
  EMAIL_FROM,
};
