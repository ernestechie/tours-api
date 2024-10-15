const express = require('express');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

const { protectRoute, restrictTo } = authController;
const { addReview, getAllReviews, deleteReview, updateReview } =
  reviewController;

// Authentication Midedleware - Protects all routes below
router.use(protectRoute);

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo(['USER']), addReview);

router.route('/:id').delete(deleteReview).patch(updateReview);

module.exports = router;
