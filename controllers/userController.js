const fs = require('fs');
const APIFeatures = require('../modules/APIFeatures');
const UserModel = require('../models/userModel');

const { catchErrorAsync } = require('./errorController');

const fileUrl = `${__dirname}/../dev-data/data/users.json`;
const users = JSON.parse(fs.readFileSync(fileUrl));

// Middleware Function
exports.checkId = (req, res, next, val) => {
  const userId = req.params.id;
  const userIdFound = users.some((user) => user._id === userId);

  if (!userIdFound)
    return res.status(404).json({
      status: 'fail',
      message: `Cannot find user with 'id' of ${userId}`,
    });

  next();
};

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
    currentPage: +req.query.page || 1,
    data: { users, requestTime },
    message: 'Users retrieved successsfully',
  });
});

exports.getUser = (req, res) => {
  const { params } = req;
  const userId = params.id;

  const user = users.find(({ _id }) => _id == userId);

  res.status(200).json({
    status: 'success',
    data: { user },
    message: 'User fetched successfully',
  });
};
