const APIFeatures = require('../modules/APIFeatures');
const UserModel = require('../models/userModel');
const { catchErrorAsync } = require('./errorController');
const AppError = require('../utils/appError');
const { filterBodyObject } = require('../utils');

// Route Handlers
exports.getAllUsers = catchErrorAsync(async (req, res) => {
  const { requestTime } = req;

  const excludedFields = ['page', 'sort', 'limit', 'fields'];

  // Execute the query find()
  const features = new APIFeatures(UserModel.find(), req.query);
  features.filter(excludedFields).sort().limitFields().paginate();

  const users = await features.query;

  // Send response
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
      meta: {
        requestTime,
        currentPage: +req.query.page || 1,
      },
    },
    message: 'Users retrieved successsfully',
  });
});

exports.getUser = catchErrorAsync(async (req, res, next) => {
  const { params, requestTime } = req;

  const user = await UserModel.findById(params.id);

  if (!user) {
    return next(new AppError('No user found with this id', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user, requestTime },
    message: 'User retrieved successsfully',
  });
});

// Update user account/password
exports.updateProfile = catchErrorAsync(async (req, res, next) => {
  const { body } = req;

  if (body.password || body.passwordConfirm) {
    return next(
      new AppError('Cannot update password field with this route.', 400),
    );
  }

  const filteredBody = filterBodyObject(body, 'role', 'email');

  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    },
  );

  await updatedUser.save();

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
    message: 'User updated successfully',
  });
});

// Delete user account
exports.deleteAccount = catchErrorAsync(async (req, res, next) => {
  const currentUser = await UserModel.findById(req.user.id);

  currentUser.isActive = false;
  await currentUser.save();

  res.status(204).json({
    status: 'success',
    message: 'Account deleted successfully',
  });
});
