import multer from 'multer';
import XLSX from 'xlsx';
import { AppError } from '../middleware/error.middleware.js';
import File from '../models/file.model.js';
import { analyzeFileData, calculateStatistics } from '../utils/fileAnalysis.js';
import { cleanupOldFiles } from '../utils/fileCleanup.js';
import { storage } from '../utils/cloudinaryConfig.js';

// Configure multer for file upload
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
            'application/csv', // .csv (sometimes)
            'text/plain' // .csv (sometimes)
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only .xlsx, .xls, and .csv files are allowed'), false);
        }
    }
});

export const uploadFile = [
    upload.single('file'),
    async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
            }
            // Save file metadata and Cloudinary URL to MongoDB
            const fileDoc = await File.create({
                filename: req.file.originalname,
                fileUrl: req.file.path, // Cloudinary URL
                uploadedBy: req.user._id,
                mimeType: req.file.mimetype,
                size: req.file.size,
                // Add other fields as needed
            });
            res.status(201).json({ status: 'success', data: { file: fileDoc } });
        } catch (error) {
            next(error);
        }
    }
];

export const processFile = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return next(new AppError('No file found with that ID', 404));
        }

        // Update processing status
        file.processingStatus = 'processing';
        await file.save();

        // Read and process Excel file
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Analyze file data
        const analysis = await analyzeFileData(data);
        
        // Update file with analysis results
        file.columns = analysis.columns;
        file.rowCount = analysis.rowCount;
        file.columnCount = analysis.columnCount;
        file.dataQualityScore = analysis.qualityScore;
        file.processingStatus = 'completed';
        file.lastAnalyzed = new Date();
        await file.save();

        res.status(200).json({
            status: 'success',
            data: { file }
        });
    } catch (error) {
        // Update processing status to error
        if (req.params.id) {
            await File.findByIdAndUpdate(req.params.id, {
                processingStatus: 'error',
                processingError: error.message
            });
        }
        next(error);
    }
};

export const getFilePreview = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return next(new AppError('No file found with that ID', 404));
        }

        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Return first 100 rows for preview
        const preview = data.slice(0, 100);

        res.status(200).json({
            status: 'success',
            data: {
                headers: data[0],
                rows: preview.slice(1)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getFileColumns = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return next(new AppError('No file found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { columns: file.columns }
        });
    } catch (error) {
        next(error);
    }
};

export const getFileStatistics = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return next(new AppError('No file found with that ID', 404));
        }

        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const statistics = await calculateStatistics(data, file.columns);

        res.status(200).json({
            status: 'success',
            data: { statistics }
        });
    } catch (error) {
        next(error);
    }
};

export const getAllFiles = async (req, res, next) => {
    try {
        const files = await File.find()
            .populate('uploadedBy', 'name email')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: files.length,
            data: { files }
        });
    } catch (error) {
        next(error);
    }
};

export const getMyFiles = async (req, res, next) => {
    try {
        const files = await File.find({ uploadedBy: req.user.id })
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: files.length,
            data: { files }
        });
    } catch (error) {
        next(error);
    }
};

export const getFile = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id)
            .populate('uploadedBy', 'name email');

        if (!file) {
            return next(new AppError('No file found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { file }
        });
    } catch (error) {
        next(error);
    }
};

export const updateFile = async (req, res, next) => {
    try {
        const file = await File.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!file) {
            return next(new AppError('No file found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { file }
        });
    } catch (error) {
        next(error);
    }
};

export const deleteFile = async (req, res, next) => {
    try {
        const file = await File.findByIdAndDelete(req.params.id);

        if (!file) {
            return next(new AppError('No file found with that ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

export const getStorageStats = async (req, res, next) => {
    try {
        const stats = await File.aggregate([
            {
                $group: {
                    _id: null,
                    totalFiles: { $sum: 1 },
                    totalSize: { $sum: '$size' },
                    avgSize: { $avg: '$size' }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: { stats: stats[0] }
        });
    } catch (error) {
        next(error);
    }
};

export const cleanupFiles = async (req, res, next) => {
    try {
        const result = await cleanupOldFiles();

        res.status(200).json({
            status: 'success',
            data: { result }
        });
    } catch (error) {
        next(error);
    }
}; 