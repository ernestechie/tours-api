const mongoose = require('mongoose');
const TourModel = require('./tourModel');

const { Schema, model } = mongoose;
const { ObjectId } = Schema;

const reviewSchema = new Schema(
  {
    review: {
      type: String,
      trim: true,
      required: [true, 'Review must have a title'],
    },
    rating: {
      type: Number,
      required: [true, 'Review must have a rating'],
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    tour: {
      type: ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

// Calculate average rating for tour
reviewSchema.statics.calculateAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        ratingsQuantity: { $sum: 1 },
        ratingsAverage: { $avg: '$rating' },
      },
    },
    {
      $project: {
        _id: 1,
        ratingsQuantity: 1,
        ratingsAverage: { $round: ['$ratingsAverage', 2] },
      },
    },
  ]);

  return stats;
};

// Calculate average rating before storing
reviewSchema.post('save', async function (docs, next) {
  const stats = await this.constructor.calculateAverageRating(this.tour);

  const { _id, ratingsQuantity, ratingsAverage } = stats[0];

  await TourModel.findByIdAndUpdate(
    _id,
    {
      ratingsQuantity,
      ratingsAverage,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  next();
});

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name avatar',
  });

  next();
});

const ReviewModel = model('Review', reviewSchema);

module.exports = ReviewModel;
