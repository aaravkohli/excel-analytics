import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import * as analysisController from '../controllers/analysis.controller.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Restrict to real users (not demo)
router.use(restrictTo('user', 'admin', 'pending-admin'));

// Analysis creation and management
router.post('/', analysisController.createAnalysis);
router.get('/', analysisController.getAllAnalyses);
router.get('/my', analysisController.getMyAnalyses);
router.get('/stats', analysisController.getAnalysisStats);
router.get('/:id', analysisController.getAnalysis);
router.patch('/:id', analysisController.updateAnalysis);
router.delete('/:id', analysisController.deleteAnalysis);

// Chart generation
router.post('/:id/chart', analysisController.generateChart);
router.get('/:id/chart', analysisController.getChartData);

// Statistical analysis
router.post('/:id/correlation', analysisController.calculateCorrelation);
router.post('/:id/regression', analysisController.performRegression);
router.post('/:id/statistics', analysisController.calculateDescriptiveStats);

// Data insights
router.post('/:id/insights', analysisController.generateInsights);
router.get('/:id/insights', analysisController.getInsights);

// Export options
router.get('/:id/export', analysisController.exportAnalysis);

// New AI-enhanced routes
router.get('/file/:fileId/history', analysisController.getAnalysisHistory);
router.get('/file/:id/suggestions', analysisController.suggestAnalyses);
router.post('/compare', analysisController.compareAnalyses);

// Maintenance routes
router.post('/cleanup', analysisController.cleanupAnalyses);

// Admin only routes
router.use(restrictTo('admin'));
router.post('/system/cleanup', analysisController.cleanupAnalyses);

export default router; 