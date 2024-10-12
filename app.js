const express = require('express');
const morgan = require('morgan');

const rateLimit = require('express-rate-limit');
const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const { globalErrorHandler } = require('./controllers/errorController');

const app = express();

// Global Middlewares
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

const limiter = rateLimit({
  max: 10, // Maximum number of requests in the window
  windowMs: 3600000, // 1 hour (in Milliseconds)
  message: 'Too many requests, please try again in 1hr.',
});

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes
app.use('/api', limiter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// Catch all not-found routes.
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find URL -> ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
