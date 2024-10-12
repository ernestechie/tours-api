const express = require('express');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

const { protectRoute, restrictTo } = authController;
const { addReview, getAllReviews } = reviewController;

router
  .route('/')
  .get(protectRoute, getAllReviews)
  .post(protectRoute, restrictTo(['USER']), addReview);

module.exports = router;
