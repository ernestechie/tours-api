const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const { Schema, model } = mongoose;

const userSchema = new Schema({
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
      // This only works on SAVE
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords don`t match',
    },
    select: false,
  },
  avatar: String,
  passwordChangedAt: Date,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Hash the password and removes the "passwordConfirm" field.
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

userSchema.methods.correctPassword = async function (
  inputedPassword,
  userPassword,
) {
  return await bcrypt.compare(inputedPassword, userPassword);
};

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

const UserModel = model('User', userSchema);

module.exports = UserModel;
