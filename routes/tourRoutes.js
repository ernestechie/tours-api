const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const router = express.Router();

const { protectRoute } = authController;

const {
  getTour,
  getAllTours,
  checkRequestBody,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourMetrics,
  getMonthlyStats,
} = tourController;

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);
router.route('/basic-metrics').get(getTourMetrics);
router.route('/monthly-stats/:year').get(getMonthlyStats);
router
  .route('/')
  .get(protectRoute, getAllTours)
  .post(checkRequestBody, protectRoute, createTour);
router.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

module.exports = router;
