const AppError = require('../utils/appError');

const sendErrDevelopment = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
  });

const sendErrProduction = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong.',
  });
};

const handleJwtError = () =>
  new AppError(`Invalid token. Please login again.`, 400);

const handleJwtExpiredError = () =>
  new AppError(`Token expired. Please login again.`, 400);

const handleValidateErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join(', ')}`;

  return new AppError(message, 400);
};

exports.globalErrorHandler = (err, req, res, next) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') sendErrDevelopment(err, res);
  else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    if (error.name === 'ValidationError') error = handleValidateErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJwtError();
    if (error.name === 'TokenExpiredError') error = handleJwtExpiredError();
    else error = new AppError(err.message, error.statusCode);

    sendErrProduction(error, res);
  }

  next();
};

exports.catchErrorAsync = (func) => (req, res, next) => {
  func(req, res, next).catch(next);
};
