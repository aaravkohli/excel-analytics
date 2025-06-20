import mongoose from 'mongoose';

const chartConfigSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['bar', 'line', 'pie', 'scatter', 'area', '3d-bar', '3d-scatter', '3d-surface'],
        required: true
    },
    xAxis: {
        column: String,
        label: String
    },
    yAxis: {
        column: String,
        label: String
    },
    zAxis: {
        column: String,
        label: String
    },
    aggregation: {
        type: String,
        enum: ['sum', 'average', 'count', 'min', 'max'],
        default: 'sum'
    },
    filters: [{
        column: String,
        operator: {
            type: String,
            enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains']
        },
        value: mongoose.Schema.Types.Mixed
    }]
});

const analysisSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Analysis must have a name']
    },
    description: String,
    file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['visualization', 'statistics', 'correlation', 'prediction'],
        required: true
    },
    chartConfig: chartConfigSchema,
    results: {
        data: mongoose.Schema.Types.Mixed,
        summary: String,
        insights: [String]
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'error'],
        default: 'pending'
    },
    error: String,
    isPublic: {
        type: Boolean,
        default: false
    },
    lastUpdated: Date
}, {
    timestamps: true
});

// Indexes for better query performance
analysisSchema.index({ file: 1, createdAt: -1 });
analysisSchema.index({ createdBy: 1, createdAt: -1 });
analysisSchema.index({ name: 'text', description: 'text' });

// Update lastUpdated timestamp
analysisSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis; 