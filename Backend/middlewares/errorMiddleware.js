export const errorHandler = (err, req, res, next) => {
  // 1. Determine the correct status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // 2. Log the error for the developer (Internal)
  console.error(`🚩 Error: ${err.message}`);

  // 3. Send the response to the client (External)
  res.status(statusCode).json({
    message: err.message,
    // Only show stack trace if NOT in production
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
