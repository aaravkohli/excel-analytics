import User from '../models/user.model.js';
import File from '../models/file.model.js';
import Analysis from '../models/analysis.model.js';
import { AppError } from '../middleware/error.middleware.js';

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();

        res.status(200).json({
            status: 'success',
            results: users.length,
            data: { users }
        });
    } catch (error) {
        next(error);
    }
};

export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return next(new AppError('No user found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

export const createUser = async (req, res, next) => {
    try {
        const newUser = await User.create(req.body);

        res.status(201).json({
            status: 'success',
            data: { user: newUser }
        });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return next(new AppError('No user found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return next(new AppError('No user found with that ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        // Filter out unwanted fields that should not be updated
        const filteredBody = filterObj(req.body, 'name', 'email');
        
        const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: { user: updatedUser }
        });
    } catch (error) {
        next(error);
    }
};

export const getUserActivity = async (req, res, next) => {
    try {
        const files = await File.find({ uploadedBy: req.user.id })
            .select('filename createdAt processingStatus')
            .sort('-createdAt')
            .limit(10);

        const analyses = await Analysis.find({ createdBy: req.user.id })
            .select('name type createdAt status')
            .sort('-createdAt')
            .limit(10);

        res.status(200).json({
            status: 'success',
            data: {
                recentFiles: files,
                recentAnalyses: analyses
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getStorageUsage = async (req, res, next) => {
    try {
        const stats = await File.aggregate([
            {
                $match: { uploadedBy: req.user._id }
            },
            {
                $group: {
                    _id: null,
                    totalFiles: { $sum: 1 },
                    totalSize: { $sum: '$size' }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                usage: stats[0] || { totalFiles: 0, totalSize: 0 }
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getUserStats = async (req, res, next) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    numUsers: { $sum: 1 },
                    avgCreatedAt: { $avg: '$createdAt' }
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

export const getActivityStats = async (req, res, next) => {
    try {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const fileStats = await File.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastMonth }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    uploads: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const analysisStats = await Analysis.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastMonth }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    analyses: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                fileStats,
                analysisStats
            }
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
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    totalSize: { $sum: '$size' },
                    avgSize: { $avg: '$size' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
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

// List all users with role 'pending-admin'
export const getPendingAdminApplications = async (req, res, next) => {
    try {
        const pendingAdmins = await User.find({ role: 'pending-admin' });
        res.status(200).json({
            status: 'success',
            results: pendingAdmins.length,
            data: { users: pendingAdmins }
        });
    } catch (error) {
        next(error);
    }
};

// Approve a pending admin application
export const approveAdminApplication = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'pending-admin') {
            return next(new AppError('No pending admin application found for this user', 404));
        }
        user.role = 'admin';
        if (user.adminApplication) {
            user.adminApplication.status = 'approved';
            user.adminApplication.reviewedAt = new Date();
        }
        await user.save();
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

// Reject a pending admin application
export const rejectAdminApplication = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'pending-admin') {
            return next(new AppError('No pending admin application found for this user', 404));
        }
        user.role = 'user'; // Optionally revert to regular user
        if (user.adminApplication) {
            user.adminApplication.status = 'rejected';
            user.adminApplication.reviewedAt = new Date();
        }
        await user.save();
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to filter allowed fields
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}; 