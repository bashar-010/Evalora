const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err.message);

  // لو في status من قبل نستخدمه
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server Error",
  });
};

export default errorHandler;