const ReviewModel = require('../models/reviewModel');
const APIFeatures = require('../modules/APIFeatures');

const { catchErrorAsync } = require('./errorController');

exports.getAllReviews = catchErrorAsync(async (req, res, next) => {
  const reviewsQuery = ReviewModel.find();
  const features = new APIFeatures(reviewsQuery, req.query);
  features.sort().limitFields().paginate();

  const reviews = await features.query;

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
    message: 'Reviews retrieved successsfully',
  });
});

exports.addReview = catchErrorAsync(async (req, res, next) => {
  const { params, body, user } = req;

  const newReview = await ReviewModel.create({
    rating: body.rating,
    review: body.review,
    user: body.user || user._id,
    tour: body.tour || params.tourId,
  });

  if (newReview._id) {
    res.status(201).json({
      status: 'success',
      data: {
        review: newReview,
      },
      message: 'Review added successsfully',
    });
  }
  return next();
});
