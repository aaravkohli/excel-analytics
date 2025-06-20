import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import * as fileController from '../controllers/file.controller.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Restrict to real users (not demo)
router.use(restrictTo('user', 'admin', 'pending-admin'));

// File upload and management
router.post('/upload', fileController.uploadFile);
router.get('/', fileController.getAllFiles);
router.get('/my-files', fileController.getMyFiles);
router.get('/:id', fileController.getFile);
router.patch('/:id', fileController.updateFile);
router.delete('/:id', fileController.deleteFile);

// File processing and analysis
router.post('/:id/process', fileController.processFile);
router.get('/:id/preview', fileController.getFilePreview);
router.get('/:id/columns', fileController.getFileColumns);
router.get('/:id/statistics', fileController.getFileStatistics);

// Admin only routes
router.use(restrictTo('admin'));
router.get('/system/storage-stats', fileController.getStorageStats);
router.post('/system/cleanup', fileController.cleanupFiles);

export default router; 