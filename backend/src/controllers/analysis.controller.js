import XLSX from 'xlsx';
import { AppError } from '../middleware/error.middleware.js';
import Analysis from '../models/analysis.model.js';
import File from '../models/file.model.js';
import {
    generateChart as generateChartData,
    calculateCorrelation as correlationCalculator,
    performRegression as regressionAnalyzer,
    calculateDescriptiveStats as statsCalculator,
    generateInsights as insightsGenerator
} from '../utils/analysisUtils.js';

export const createAnalysis = async (req, res, next) => {
    try {
        const analysis = await Analysis.create({
            ...req.body,
            createdBy: req.user.id
        });

        res.status(201).json({
            status: 'success',
            data: { analysis }
        });
    } catch (error) {
        next(error);
    }
};

export const generateChart = async (req, res, next) => {
    try {
        const analysis = await Analysis.findById(req.params.id);
        if (!analysis) {
            return next(new AppError('No analysis found with that ID', 404));
        }

        const file = await File.findById(analysis.file);
        if (!file) {
            return next(new AppError('Associated file not found', 404));
        }

        // Read file data
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Generate chart data
        const chartData = await generateChartData(data, analysis.chartConfig);

        // Update analysis with chart data
        analysis.results.data = chartData;
        analysis.status = 'completed';
        await analysis.save();

        res.status(200).json({
            status: 'success',
            data: { chartData }
        });
    } catch (error) {
        next(error);
    }
};

export const getChartData = async (req, res, next) => {
    try {
        const analysis = await Analysis.findById(req.params.id);
        if (!analysis) {
            return next(new AppError('No analysis found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { chartData: analysis.results.data }
        });
    } catch (error) {
        next(error);
    }
};

export const calculateCorrelation = async (req, res, next) => {
    try {
        const analysis = await Analysis.findById(req.params.id);
        if (!analysis) {
            return next(new AppError('No analysis found with that ID', 404));
        }

        const file = await File.findById(analysis.file);
        if (!file) {
            return next(new AppError('Associated file not found', 404));
        }

        // Read file data
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Calculate correlation
        const correlationResults = await correlationCalculator(data, req.body.columns);

        // Update analysis with correlation results
        analysis.results.data = correlationResults;
        analysis.status = 'completed';
        await analysis.save();

        res.status(200).json({
            status: 'success',
            data: { correlationResults }
        });
    } catch (error) {
        next(error);
    }
};

export const performRegression = async (req, res, next) => {
    try {
        const analysis = await Analysis.findById(req.params.id);
        if (!analysis) {
            return next(new AppError('No analysis found with that ID', 404));
        }

        const file = await File.findById(analysis.file);
        if (!file) {
            return next(new AppError('Associated file not found', 404));
        }

        // Read file data
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Perform regression analysis
        const regressionResults = await regressionAnalyzer(
            data,
            req.body.dependentVariable,
            req.body.independentVariables
        );

        // Update analysis with regression results
        analysis.results.data = regressionResults;
        analysis.status = 'completed';
        await analysis.save();

        res.status(200).json({
            status: 'success',
            data: { regressionResults }
        });
    } catch (error) {
        next(error);
    }
};

export const calculateDescriptiveStats = async (req, res, next) => {
    try {
        const analysis = await Analysis.findById(req.params.id);
        if (!analysis) {
            return next(new AppError('No analysis found with that ID', 404));
        }

        const file = await File.findById(analysis.file);
        if (!file) {
            return next(new AppError('Associated file not found', 404));
        }

        // Read file data
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Calculate descriptive statistics
        const statsResults = await statsCalculator(data, req.body.columns);

        // Update analysis with statistics results
        analysis.results.data = statsResults;
        analysis.status = 'completed';
        await analysis.save();

        res.status(200).json({
            status: 'success',
            data: { statsResults }
        });
    } catch (error) {
        next(error);
    }
};

export const getInsights = async (req, res, next) => {
    try {
        const analysis = await Analysis.findById(req.params.id);
        if (!analysis) {
            return next(new AppError('No analysis found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { insights: analysis.results.insights }
        });
    } catch (error) {
        next(error);
    }
};

export const generateInsights = async (req, res, next) => {
    try {
        const analysis = await Analysis.findById(req.params.id);
        if (!analysis) {
            return next(new AppError('No analysis found with that ID', 404));
        }

        const file = await File.findById(analysis.file);
        if (!file) {
            return next(new AppError('Associated file not found', 404));
        }

        // Read file data
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Generate insights using traditional methods only
        const insights = await insightsGenerator(data, analysis.results.data);

        // Update analysis with insights
        analysis.results.insights = insights;
        await analysis.save();

        res.status(200).json({
            status: 'success',
            data: { insights }
        });
    } catch (error) {
        next(error);
    }
};

export const suggestAnalyses = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return next(new AppError('No file found with that ID', 404));
        }

        const suggestions = await suggestAnalyses(file);

        res.status(200).json({
            status: 'success',
            data: { suggestions }
        });
    } catch (error) {
        next(error);
    }
};

export const getAnalysisHistory = async (req, res, next) => {
    try {
        const { fileId } = req.params;
        
        const analyses = await Analysis.find({ file: fileId })
            .sort('-createdAt')
            .populate('createdBy', 'name email');

        const history = analyses.map(analysis => ({
            id: analysis._id,
            name: analysis.name,
            type: analysis.type,
            createdAt: analysis.createdAt,
            status: analysis.status,
            createdBy: analysis.createdBy,
            summary: analysis.results.summary,
            hasInsights: analysis.results.insights?.length > 0
        }));

        res.status(200).json({
            status: 'success',
            results: history.length,
            data: { history }
        });
    } catch (error) {
        next(error);
    }
};

export const compareAnalyses = async (req, res, next) => {
    try {
        const { analysisIds } = req.body;
        if (!Array.isArray(analysisIds) || analysisIds.length < 2) {
            return next(new AppError('Please provide at least two analysis IDs to compare', 400));
        }

        const analyses = await Analysis.find({ _id: { $in: analysisIds } });
        if (analyses.length !== analysisIds.length) {
            return next(new AppError('One or more analyses not found', 404));
        }

        // Return comparison data for frontend processing
        const comparisonData = analyses.map(analysis => ({
            id: analysis._id,
            name: analysis.name,
            type: analysis.type,
            results: analysis.results,
            createdAt: analysis.createdAt
        }));

        res.status(200).json({
            status: 'success',
            data: {
                analyses: comparisonData
            }
        });
    } catch (error) {
        next(error);
    }
};

export const exportAnalysis = async (req, res, next) => {
    try {
        const analysis = await Analysis.findById(req.params.id);
        if (!analysis) {
            return next(new AppError('No analysis found with that ID', 404));
        }

        // Create workbook with analysis results
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(analysis.results.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Analysis Results');

        // Set response headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=analysis-${analysis._id}.xlsx`);

        // Send the workbook as response
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};

export const getAllAnalyses = async (req, res, next) => {
    try {
        const analyses = await Analysis.find()
            .populate('file', 'filename originalName')
            .populate('createdBy', 'name email')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: analyses.length,
            data: { analyses }
        });
    } catch (error) {
        next(error);
    }
};

export const getMyAnalyses = async (req, res, next) => {
    try {
        const analyses = await Analysis.find({ createdBy: req.user.id })
            .populate('file', 'filename originalName')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: analyses.length,
            data: { analyses }
        });
    } catch (error) {
        next(error);
    }
};

export const getAnalysis = async (req, res, next) => {
    try {
        const analysis = await Analysis.findById(req.params.id)
            .populate('file', 'filename originalName')
            .populate('createdBy', 'name email');

        if (!analysis) {
            return next(new AppError('No analysis found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { analysis }
        });
    } catch (error) {
        next(error);
    }
};

export const updateAnalysis = async (req, res, next) => {
    try {
        const analysis = await Analysis.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!analysis) {
            return next(new AppError('No analysis found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { analysis }
        });
    } catch (error) {
        next(error);
    }
};

export const deleteAnalysis = async (req, res, next) => {
    try {
        const analysis = await Analysis.findByIdAndDelete(req.params.id);

        if (!analysis) {
            return next(new AppError('No analysis found with that ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

export const getAnalysisStats = async (req, res, next) => {
    try {
        const stats = await Analysis.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    avgProcessingTime: {
                        $avg: {
                            $subtract: ['$updatedAt', '$createdAt']
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: { stats }
        });
    } catch (error) {
        next(error);
    }
};

export const cleanupAnalyses = async (req, res, next) => {
    try {
        // Delete analyses older than 30 days that are not marked as important
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = await Analysis.deleteMany({
            createdAt: { $lt: thirtyDaysAgo },
            isPublic: false
        });

        res.status(200).json({
            status: 'success',
            data: { result }
        });
    } catch (error) {
        next(error);
    }
}; 