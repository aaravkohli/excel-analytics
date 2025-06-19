import mongoose from 'mongoose';

const columnSchema = new mongoose.Schema({
    name: String,
    type: {
        type: String,
        enum: ['string', 'number', 'date', 'boolean'],
        required: true
    },
    statistics: {
        min: Number,
        max: Number,
        mean: Number,
        median: Number,
        mode: mongoose.Schema.Types.Mixed,
        nullCount: Number,
        uniqueCount: Number
    }
});

const fileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: [true, 'File must have a name']
    },
    originalName: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    columns: [columnSchema],
    rowCount: Number,
    columnCount: Number,
    dataQualityScore: {
        type: Number,
        min: 0,
        max: 100
    },
    processingStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'error'],
        default: 'pending'
    },
    processingError: String,
    lastAnalyzed: Date,
    isPublic: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for better query performance
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ filename: 'text', originalName: 'text' });

// Virtual populate for analysis results
fileSchema.virtual('analyses', {
    ref: 'Analysis',
    foreignField: 'file',
    localField: '_id'
});

const File = mongoose.model('File', fileSchema);

export default File; 