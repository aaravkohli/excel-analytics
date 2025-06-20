import fs from 'fs/promises';
import path from 'path';
import File from '../models/file.model.js';

export const cleanupOldFiles = async () => {
    try {
        // Find files older than 30 days that are not marked as important
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const oldFiles = await File.find({
            createdAt: { $lt: thirtyDaysAgo },
            isPublic: false
        });

        const results = {
            totalFiles: oldFiles.length,
            deletedFiles: 0,
            errors: []
        };

        // Delete files from storage and database
        for (const file of oldFiles) {
            try {
                // Delete file from storage
                await fs.unlink(file.path);

                // Delete file record from database
                await File.findByIdAndDelete(file._id);

                results.deletedFiles++;
            } catch (error) {
                results.errors.push({
                    fileId: file._id,
                    error: error.message
                });
            }
        }

        return results;
    } catch (error) {
        throw new Error(`File cleanup failed: ${error.message}`);
    }
};

export const cleanupOrphanedFiles = async () => {
    try {
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const results = {
            totalFiles: 0,
            deletedFiles: 0,
            errors: []
        };

        // Get all files in the uploads directory
        const files = await fs.readdir(uploadsDir);
        results.totalFiles = files.length;

        for (const filename of files) {
            try {
                const filePath = path.join(uploadsDir, filename);
                const fileStats = await fs.stat(filePath);

                // Skip if not a file
                if (!fileStats.isFile()) continue;

                // Check if file exists in database
                const fileExists = await File.findOne({ filename });

                if (!fileExists) {
                    // Delete orphaned file
                    await fs.unlink(filePath);
                    results.deletedFiles++;
                }
            } catch (error) {
                results.errors.push({
                    filename,
                    error: error.message
                });
            }
        }

        return results;
    } catch (error) {
        throw new Error(`Orphaned file cleanup failed: ${error.message}`);
    }
};

export const validateFileIntegrity = async () => {
    try {
        const files = await File.find();
        const results = {
            totalFiles: files.length,
            missingFiles: [],
            corruptedFiles: []
        };

        for (const file of files) {
            try {
                // Check if file exists in storage
                const exists = await fs.access(file.path)
                    .then(() => true)
                    .catch(() => false);

                if (!exists) {
                    results.missingFiles.push(file._id);
                    continue;
                }

                // Check file size
                const stats = await fs.stat(file.path);
                if (stats.size !== file.size) {
                    results.corruptedFiles.push(file._id);
                }
            } catch (error) {
                results.missingFiles.push(file._id);
            }
        }

        return results;
    } catch (error) {
        throw new Error(`File integrity check failed: ${error.message}`);
    }
};

export const createUploadDirectory = async () => {
    try {
        const uploadsDir = path.join(process.cwd(), 'uploads');
        
        // Create uploads directory if it doesn't exist
        await fs.mkdir(uploadsDir, { recursive: true });

        // Set appropriate permissions
        await fs.chmod(uploadsDir, 0o755);

        return true;
    } catch (error) {
        throw new Error(`Failed to create uploads directory: ${error.message}`);
    }
};

export const getDirectorySize = async (directory) => {
    try {
        const files = await fs.readdir(directory);
        let totalSize = 0;

        for (const file of files) {
            const filePath = path.join(directory, file);
            const stats = await fs.stat(filePath);

            if (stats.isFile()) {
                totalSize += stats.size;
            }
        }

        return totalSize;
    } catch (error) {
        throw new Error(`Failed to get directory size: ${error.message}`);
    }
}; 