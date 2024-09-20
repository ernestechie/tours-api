const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const { globalErrorHandler } = require('./controllers/errorController');

const app = express();

// Middlewares
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes

// https://www.natours.dev/api/v1/tours
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Catch all not-found routes.
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find URL -> ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
