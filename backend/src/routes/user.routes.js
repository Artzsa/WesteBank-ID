const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const validate = require('../middlewares/validation.middleware');
const { registerSchema, loginSchema } = require('../validations/user.validation');

router.get('/', userController.getAllUsers);
router.get('/:phoneNumber', userController.getUserByPhone);
router.post('/register', validate(registerSchema), userController.registerUser);
router.post('/login', validate(loginSchema), userController.login);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/points', userController.updatePoints);
router.get('/:id/stats', userController.getUserStats);
router.get('/:phoneNumber/impact', userController.getUserImpact);


module.exports = router;
