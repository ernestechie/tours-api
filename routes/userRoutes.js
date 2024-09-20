const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

const { getAllUsers, getUser } = userController;

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.route('/').get(getAllUsers);
router.route('/:id').get(getUser);

module.exports = router;
