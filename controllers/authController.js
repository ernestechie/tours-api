const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const UserModel = require('../models/userModel');
const AppError = require('../utils/appError');
const { catchErrorAsync } = require('./errorController');
const { natoursSendEmail } = require('../utils/email');

const signJwtToken = ({ userId, next }) => {
  if (!userId) return next(new AppError('Invalid user Id'));

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

// Signup / Register
exports.signup = catchErrorAsync(async (req, res, next) => {
  const { requestTime } = req;

  const user = await UserModel.create(req.body);
  const token = signJwtToken({ userId: user._id, next });

  if (user._id) {
    res.status(201).json({
      status: 'success',
      data: { user, token, requestTime },
      message: 'Signup successful',
    });
  }
});

// Login
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

// Fogotten Password
exports.forgotPassword = catchErrorAsync(async (req, res, next) => {
  const { body } = req;

  // 1. Get user by email
  const user = await UserModel.findOne({ email: body.email });

  if (!user) {
    return next(new AppError('User with this email does not exist.', 404));
  }

  // 2. Generate and store a random reset token
  const userToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send token to user email
  const resetURL = `${req.protocol}:${req.get('host')}/api/v1/users/reset-password/${userToken}`;

  await natoursSendEmail({
    recipients: [user.email],
    subject: 'Reset Password (Expires in 30 Mins)',
    text: `
      Hello, ${user.name},\n
      A request to change your password has been made, below is a link to reset your password.\n
      Link: ${resetURL}\n\n
      Kindly ignore if you did not request this.
    `,
  })
    .then((res) => console.log('natoursSendEmail -> ', res))
    .catch(async (err) => {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save({ validateBeforeSave: false });
      return next(
        new AppError('Error! Something went wrong when sending email.', 500),
      );
    });

  res.status(200).json({
    status: 'success',
    message: 'Password reset token sent to email.',
  });
});

// Reset Password
exports.resetPassword = catchErrorAsync(async (req, res, next) => {
  const { newPassword, passwordConfirm } = req.body;
  const token = req.params.token;

  // 1. Get user based on token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // 2. Check if token has expired or if user exists
  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    return next(new AppError('Invalid or expired token.', 400));
  }

  // 3. Update the password and  properties for the current user
  user.password = newPassword;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 4. Log user in by sending JWT
  const newToken = signJwtToken({ userId: user._id, next });

  res.status(200).json({
    status: 'success',
    data: {
      token: newToken,
    },
    message: 'Password reset successful.',
  });
});

// Protected Route Middleware
exports.protectRoute = catchErrorAsync(async (req, res, next) => {
  const { headers } = req;

  const token = headers.authorization || '';
  const userToken = token.replace('Bearer ', '').trim() || '';

  // 1: Get the user token.
  if (!token || !userToken) {
    return next(new AppError('Please login to gain access.', 401));
  }

  // 2: Validate user token.
  const decoded = await promisify(jwt.verify)(
    userToken,
    process.env.JWT_SECRET,
  );

  // 3: Check if user exists.
  const foundUser = await UserModel.findById(decoded.id);
  if (!foundUser) {
    return next(new AppError('Invalid user. Please create an account.', 401));
  }

  // 4: Check if password changed after token was created.
  if (await foundUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password changed since last login.', 401));
  }

  // 5: Grant access to protected route
  req.user = foundUser;
  next();
});

// User Roles and Permissions
exports.restrictTo = (roles) => (req, res, next) => {
  const userRole = req.user?.role;

  const hasPermission = roles.includes(userRole);

  if (!hasPermission)
    return next(
      new AppError('You are not authorized to perform this action.', 403),
    );

  next();
};
