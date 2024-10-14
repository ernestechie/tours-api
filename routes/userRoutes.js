const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

const { getAllUsers, getUser, updateProfile, deleteAccount } = userController;
const {
  login,
  signup,
  forgotPassword,
  resetPassword,
  protectRoute,
  restrictTo,
} = authController;

// Auth routes
router.post('/login', login);
router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

// Authentication Midedleware - Protects all routes below
router.use(protectRoute);

// User routes
router.patch('/update-profile', updateProfile);
router.delete('/delete-account', deleteAccount);
router.route('/').get(restrictTo(['ADMIN', 'LEAD-GUIDE']), getAllUsers);
router.route('/:id').get(restrictTo(['ADMIN', 'LEAD-GUIDE']), getUser);

module.exports = router;
