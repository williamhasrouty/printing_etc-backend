const { isCelebrateError } = require("celebrate");

const errorHandler = (err, req, res, next) => {
  // Handle Celebrate validation errors
  if (isCelebrateError(err)) {
    const errorBody = {};
    const errorMessages = [];

    // Extract validation errors from Celebrate
    for (const [segment, joiError] of err.details.entries()) {
      errorBody[segment] = {
        source: segment,
        keys: joiError.details.map((detail) => detail.path.join(".")),
        message: joiError.message,
      };
      errorMessages.push(`${segment}: ${joiError.message}`);
    }

    console.log("Validation Error:", JSON.stringify(errorBody, null, 2));

    return res.status(400).send({
      message: "Validation failed",
      validation: errorBody,
      error: errorMessages.join("; "),
    });
  }

  const { statusCode = 500, message } = err;

  // Log server errors for debugging
  if (statusCode === 500) {
    console.error("Server error:", err);
  }

  res.status(statusCode).send({
    message:
      statusCode === 500 ? "An error has occurred on the server" : message,
  });
};

module.exports = errorHandler;
