const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

const { getAllUsers, getUser } = userController;
const { login, signup, forgotPassword, resetPassword } = authController;

router.post('/login', login);
router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

router.route('/').get(getAllUsers);
router.route('/:id').get(getUser);

module.exports = router;
