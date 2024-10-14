const TourModel = require('../models/tourModel');
const APIFeatures = require('../modules/APIFeatures');
const AppError = require('../utils/appError');
const { catchErrorAsync } = require('./errorController');
const { deleteOne, updateOne } = require('./handlerFactory');

// Middleware Functions
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields =
    'name,imageCover,duration,difficulty,price,ratingsAverage,ratingsQuantity';

  next();
};

// Route Handlers
exports.getAllTours = catchErrorAsync(async (req, res, next) => {
  const { requestTime, query } = req;

  const excludedFields = ['page', 'sort', 'limit', 'fields'];

  // Execute the query find()
  const toursQuery = TourModel.find();

  const features = new APIFeatures(toursQuery, query);
  features.filter(excludedFields).sort().limitFields().paginate();

  const tours = await features.query;

  // Send response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
      meta: {
        requestTime,
        currentPage: +query.page || 1,
      },
    },
    message: 'Tours retrieved successsfully',
  });
});

exports.getTour = catchErrorAsync(async (req, res, next) => {
  const { params, requestTime } = req;

  const tour = await TourModel.findById(params.id).populate({
    path: 'reviews',
    select: '-__v',
  });

  if (!tour) {
    return next(new AppError('No tour found with this id', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { tour, requestTime },
    message: 'Tour retrieved successsfully',
  });
});

exports.createTour = catchErrorAsync(async (req, res, next) => {
  const newTour = await TourModel.create(req.body.tour);

  if (newTour._id) {
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
      message: 'Tour added successsfully',
    });
  }
});

// Update tour
exports.updateTour = updateOne(TourModel);

// Delete tour
exports.deleteTour = deleteOne(TourModel);

// Aggregate Function
exports.getTourMetrics = catchErrorAsync(async (req, res) => {
  const { requestTime } = req;

  const metrics = await TourModel.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4 },
      },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        averagePrice: { $avg: '$price' },
        averageDuration: { $avg: '$duration' },
        averageRating: { $avg: '$ratingsAverage' },
        ratingsCount: { $sum: '$ratingsQuantity' },
        toursCount: { $sum: 1 },
      },
    },
    {
      $sort: {
        averageRating: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: metrics.length,
    data: { metrics, requestTime },
    message: 'Aggregate Model',
  });
});

// Get monthly stats
exports.getMonthlyStats = catchErrorAsync(async (req, res) => {
  const { requestTime, params } = req;

  const year = +params.year;

  const tours = await TourModel.aggregate([
    {
      $unwind: {
        path: '$startDates',
      },
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        toursCount: { $sum: 1 },
        tours: {
          $push: { name: '$name', duration: '$duration', _id: '$_id' },
        },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        toursCount: -1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours, requestTime },
    message: 'Aggregate Model',
  });
});
