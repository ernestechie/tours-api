const mongoose = require('mongoose');

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

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name avatar',
  });
  //   .populate({
  //   path: 'tour',
  //   select: 'name',
  // });

  next();
});

const ReviewModel = model('Review', reviewSchema);

module.exports = ReviewModel;
