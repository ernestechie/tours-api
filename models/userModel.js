const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please input name'],
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      required: [true, 'Please input an email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email.'],
    },
    avatar: String,
    role: {
      type: String,
      enum: ['USER', 'GUIDE', 'LEAD-GUIDE', 'ADMIN'],
      default: 'USER',
    },
    password: {
      type: String,
      trim: true,
      minlength: 8,
      required: [true, 'Please input password'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      trim: true,
      minlength: 8,
      required: [true, 'Please confirm password'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords don`t match',
      },
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { context: true },
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  // Hash the password and removes the "passwordConfirm" field.
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

// Update the "passwordChangedAt"
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now() + 3600000;

  next();
});

userSchema.methods.correctPassword = async function (
  inputedPassword,
  userPassword,
) {
  return await bcrypt.compare(inputedPassword, userPassword);
};

// Checks if the user changed password after the token was created
userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Create and store token for resetting password.
userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 5400000;

  return resetToken;
};

const UserModel = model('User', userSchema);

module.exports = UserModel;
