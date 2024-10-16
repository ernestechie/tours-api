const mongoose = require('mongoose');
const slugify = require('slugify');
const UserModel = require('./userModel');

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
    startLocation: {
      // GeoJson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: Schema.ObjectId,
        ref: 'User',
      },
    ],
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

// Create index to improve read performance
tourSchema.index({ price: 1, ratingsAverage: 1 });

// Create virtual field, "durationWeeks"
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtually populate the tour model with reviews without saving the reviews in the tour object to the db.
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Docuement middleware
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Docuement middleware
tourSchema.pre('save', async function (next) {
  const guidesPromise = this.guides.map(
    async (id) => await UserModel.findById(id),
  );

  const guides = await Promise.all(guidesPromise);
  this.guides = guides;

  next();
});

// Query Middleware
tourSchema.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

// Populate the tours response with all the tour guides by referencing
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -passwordResetExpires -passwordResetToken',
  });

  next();
});

// Aggregate Middleware
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  next();
});

const TourModel = model('Tour', tourSchema);

module.exports = TourModel;
