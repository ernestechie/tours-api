const mongoose = require('mongoose');
const slugify = require('slugify');

const { Schema, model } = mongoose;

const tourSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      required: [true, 'Tour must have a name'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'Tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour must have a group size'],
    },
    difficulty: {
      type: String,
      default: 'easy',
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      max: 5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Tour must have a price'],
      validate: {
        validator: Number.isInteger,
      },
    },
    priceDiscount: {
      type: Number,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'Tour must have a description'],
    },
    imageCover: {
      type: String,
      required: [true, 'Tour must have an image cover'],
    },
    images: [String],
    secretTour: Boolean,
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: { type: [Date], default: [Date.now()] },
  },
  {
    toJSON: {
      virtuals: true,
    },
  },
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Docuement middleware - tourSchema.post()

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });

  next();
});

// Query Middleware
tourSchema.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } });

  next();
});

// Aggregate Middleware
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  next();
});

const TourModel = model('Tour', tourSchema);

module.exports = TourModel;
