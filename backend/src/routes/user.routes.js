import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import * as userController from '../controllers/user.controller.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Restrict to real users (not demo)
router.use(restrictTo('user', 'admin', 'pending-admin'));

// Regular user routes
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.get('/activity', userController.getUserActivity);
router.get('/storage-usage', userController.getStorageUsage);

// Admin only routes
router.use(restrictTo('admin'));

// Pending admin application management
router.get('/pending-admins', userController.getPendingAdminApplications);
router.post('/approve-admin/:id', userController.approveAdminApplication);
router.post('/reject-admin/:id', userController.rejectAdminApplication);

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Admin analytics
router.get('/stats/overview', userController.getUserStats);
router.get('/stats/activity', userController.getActivityStats);
router.get('/stats/storage', userController.getStorageStats);

export default router; 