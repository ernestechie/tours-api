const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

const { protectRoute, restrictTo } = authController;

const {
  getTour,
  getAllTours,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourMetrics,
  getMonthlyStats,
} = tourController;

// Merge 'reviews' route with 'tour' router
router.use('/:tourId/reviews', reviewRouter);

// Below are aggregate routes
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);
router.route('/basic-metrics').get(getTourMetrics);
router.route('/monthly-stats/:year').get(getMonthlyStats);

router.route('/').get(protectRoute, getAllTours).post(protectRoute, createTour);

router
  .route('/:id')
  .get(protectRoute, getTour)
  .patch(protectRoute, restrictTo(['ADMIN', 'LEAD-GUIDE']), updateTour)
  .delete(protectRoute, restrictTo(['ADMIN', 'LEAD-GUIDE']), deleteTour);

module.exports = router;
