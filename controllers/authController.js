const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const AppError = require('../utils/appError');

const { catchErrorAsync } = require('./errorController');

// User signup
const signJwtToken = ({ userId, next }) => {
  if (!userId) return next(new AppError('Invalid user Id'));

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

exports.signup = catchErrorAsync(async (req, res, next) => {
  const { requestTime } = req;
  const { name, email, avatar, password, passwordConfirm, passwordChangedAt } =
    req.body;

  const user = await UserModel.create({
    name,
    email,
    avatar,
    password,
    passwordConfirm,
    passwordChangedAt,
  });

  const token = signJwtToken({ userId: user._id, next });

  if (user._id) {
    res.status(201).json({
      status: 'success',
      data: { user, token, requestTime },
      message: 'Signup successful',
    });
  }
});

// User auth login
exports.login = catchErrorAsync(async (req, res, next) => {
  const { requestTime } = req;
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError('Please provide email and password', 400));

  const user = await UserModel.findOne({
    email,
  }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid Email or Password', 401));
  }

  const token = signJwtToken({ userId: user._id, next });

  res.status(200).json({
    status: 'success',
    data: { user, token, requestTime },
    message: 'Successfully logged in',
  });
});

// Protected route
exports.protectRoute = catchErrorAsync(async (req, res, next) => {
  const { headers } = req;

  const token = headers.authorization || '';
  const userToken = token.replace('Bearer ', '').trim() || '';

  // 1: Get the user token or check if its valid.
  if (!token || !userToken) {
    return next(new AppError('Please login to gain access.', 401));
  }

  // 2: Validate token - Verification.
  const decoded = await promisify(jwt.verify)(
    userToken,
    process.env.JWT_SECRET,
  );

  // 3: Check if user accessing the route exists.
  const foundUser = await UserModel.findById(decoded.id);

  if (!foundUser) {
    return next(new AppError('Invalid user. Please create an account.', 401));
  }

  // 4: Check if user changed passwords after token was issued.
  if (await foundUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password changed since last login.', 401));
  }

  // 5: Grant access to protected route
  req.user = foundUser;
  next();
});
