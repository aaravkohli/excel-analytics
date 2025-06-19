import { calculateStatistics } from './fileAnalysis.js';

export const generateChart = async (data, config) => {
    const { type, xAxis, yAxis, zAxis, aggregation, filters } = config;
    
    // Apply filters if any
    let filteredData = applyFilters(data, filters);

    // Prepare data based on chart type
    switch (type) {
        case 'bar':
        case 'line':
        case 'area':
            return generate2DChart(filteredData, xAxis, yAxis, aggregation);
        case 'pie':
            return generatePieChart(filteredData, xAxis.column, yAxis.column);
        case 'scatter':
            return generateScatterChart(filteredData, xAxis, yAxis);
        case '3d-bar':
        case '3d-scatter':
        case '3d-surface':
            return generate3DChart(filteredData, xAxis, yAxis, zAxis, type);
        default:
            throw new Error(`Unsupported chart type: ${type}`);
    }
};

export const calculateCorrelation = async (data, columns) => {
    const correlations = {};
    
    for (let i = 0; i < columns.length; i++) {
        correlations[columns[i]] = {};
        
        for (let j = 0; j < columns.length; j++) {
            if (i === j) {
                correlations[columns[i]][columns[j]] = 1;
                continue;
            }

            const col1Data = data.map(row => row[columns[i]]).filter(val => !isNaN(val));
            const col2Data = data.map(row => row[columns[j]]).filter(val => !isNaN(val));

            correlations[columns[i]][columns[j]] = pearsonCorrelation(col1Data, col2Data);
        }
    }

    return correlations;
};

export const performRegression = async (data, dependentVar, independentVars) => {
    const X = data.map(row => independentVars.map(v => row[v]));
    const y = data.map(row => row[dependentVar]);

    // Perform multiple linear regression
    const result = multipleLinearRegression(X, y);

    return {
        coefficients: result.coefficients,
        intercept: result.intercept,
        rSquared: result.rSquared,
        adjustedRSquared: result.adjustedRSquared,
        predictions: result.predictions
    };
};

export const calculateDescriptiveStats = async (data, columns) => {
    return await calculateStatistics(data, columns);
};

export const generateInsights = async (data, analysisResults) => {
    const insights = [];

    // Analyze trends
    if (analysisResults.type === 'line') {
        const trend = analyzeTrend(analysisResults.data);
        insights.push(trend);
    }

    // Analyze correlations
    if (analysisResults.correlations) {
        const correlationInsights = analyzeCorrelations(analysisResults.correlations);
        insights.push(...correlationInsights);
    }

    // Analyze distributions
    const distributionInsights = analyzeDistributions(data);
    insights.push(...distributionInsights);

    // Analyze outliers
    const outlierInsights = analyzeOutliers(data);
    insights.push(...outlierInsights);

    return insights;
};

// Helper functions

const applyFilters = (data, filters = []) => {
    if (!filters.length) return data;

    return data.filter(row => {
        return filters.every(filter => {
            const value = row[filter.column];
            switch (filter.operator) {
                case 'equals':
                    return value === filter.value;
                case 'not_equals':
                    return value !== filter.value;
                case 'greater_than':
                    return value > filter.value;
                case 'less_than':
                    return value < filter.value;
                case 'contains':
                    return String(value).includes(String(filter.value));
                case 'not_contains':
                    return !String(value).includes(String(filter.value));
                default:
                    return true;
            }
        });
    });
};

const generate2DChart = (data, xAxis, yAxis, aggregation) => {
    const grouped = groupData(data, xAxis.column, yAxis.column, aggregation);
    return {
        labels: Object.keys(grouped),
        datasets: [{
            label: yAxis.label,
            data: Object.values(grouped)
        }]
    };
};

const generatePieChart = (data, labelColumn, valueColumn) => {
    const grouped = groupData(data, labelColumn, valueColumn, 'sum');
    return {
        labels: Object.keys(grouped),
        datasets: [{
            data: Object.values(grouped)
        }]
    };
};

const generateScatterChart = (data, xAxis, yAxis) => {
    return {
        datasets: [{
            label: `${xAxis.label} vs ${yAxis.label}`,
            data: data.map(row => ({
                x: row[xAxis.column],
                y: row[yAxis.column]
            }))
        }]
    };
};

const generate3DChart = (data, xAxis, yAxis, zAxis, type) => {
    return {
        datasets: [{
            label: `${xAxis.label} vs ${yAxis.label} vs ${zAxis.label}`,
            data: data.map(row => ({
                x: row[xAxis.column],
                y: row[yAxis.column],
                z: row[zAxis.column]
            }))
        }]
    };
};

const groupData = (data, groupBy, valueColumn, aggregation) => {
    const grouped = {};
    
    data.forEach(row => {
        const key = row[groupBy];
        const value = Number(row[valueColumn]) || 0;
        
        if (!grouped[key]) {
            grouped[key] = {
                sum: 0,
                count: 0,
                min: value,
                max: value
            };
        }
        
        grouped[key].sum += value;
        grouped[key].count++;
        grouped[key].min = Math.min(grouped[key].min, value);
        grouped[key].max = Math.max(grouped[key].max, value);
    });

    // Apply aggregation
    return Object.entries(grouped).reduce((result, [key, stats]) => {
        switch (aggregation) {
            case 'sum':
                result[key] = stats.sum;
                break;
            case 'average':
                result[key] = stats.sum / stats.count;
                break;
            case 'count':
                result[key] = stats.count;
                break;
            case 'min':
                result[key] = stats.min;
                break;
            case 'max':
                result[key] = stats.max;
                break;
            default:
                result[key] = stats.sum;
        }
        return result;
    }, {});
};

const pearsonCorrelation = (x, y) => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
};

const multipleLinearRegression = (X, y) => {
    // Simple implementation of multiple linear regression
    // For production use, consider using a statistical library
    const n = X.length;
    const p = X[0].length;
    
    // Add column of 1s for intercept
    const X_aug = X.map(row => [1, ...row]);
    
    // Calculate coefficients using normal equation
    const X_t = transpose(X_aug);
    const X_t_X = matrixMultiply(X_t, X_aug);
    const X_t_X_inv = inverseMatrix(X_t_X);
    const X_t_y = matrixMultiply(X_t, y.map(yi => [yi]));
    const coefficients = matrixMultiply(X_t_X_inv, X_t_y).map(row => row[0]);

    // Calculate predictions
    const predictions = X_aug.map(row => 
        row.reduce((sum, val, i) => sum + val * coefficients[i], 0)
    );

    // Calculate R-squared
    const yMean = y.reduce((sum, yi) => sum + yi, 0) / n;
    const totalSS = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const residualSS = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
    const rSquared = 1 - (residualSS / totalSS);
    const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1) / (n - p - 1));

    return {
        coefficients: coefficients.slice(1),
        intercept: coefficients[0],
        rSquared,
        adjustedRSquared,
        predictions
    };
};

// Matrix operations helpers
const transpose = matrix => {
    return matrix[0].map((_, i) => matrix.map(row => row[i]));
};

const matrixMultiply = (a, b) => {
    return a.map(row => 
        transpose(b).map(col =>
            row.reduce((sum, val, i) => sum + val * col[i], 0)
        )
    );
};

const inverseMatrix = matrix => {
    // Simple implementation for 2x2 matrices
    // For production use, consider using a linear algebra library
    const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    return [
        [matrix[1][1] / det, -matrix[0][1] / det],
        [-matrix[1][0] / det, matrix[0][0] / det]
    ];
};

// Analysis helper functions
const analyzeTrend = (chartData) => {
    const values = chartData.datasets[0].data;
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const change = ((lastValue - firstValue) / firstValue) * 100;

    if (Math.abs(change) < 5) {
        return 'The trend appears to be relatively stable.';
    } else if (change > 0) {
        return `There is an upward trend with a ${change.toFixed(1)}% increase.`;
    } else {
        return `There is a downward trend with a ${Math.abs(change).toFixed(1)}% decrease.`;
    }
};

const analyzeCorrelations = (correlations) => {
    const insights = [];
    const threshold = 0.7;

    for (const [var1, corrs] of Object.entries(correlations)) {
        for (const [var2, value] of Object.entries(corrs)) {
            if (var1 < var2 && Math.abs(value) > threshold) {
                insights.push(
                    `Strong ${value > 0 ? 'positive' : 'negative'} correlation (${value.toFixed(2)}) ` +
                    `between ${var1} and ${var2}.`
                );
            }
        }
    }

    return insights;
};

const analyzeDistributions = (data) => {
    const insights = [];
    const numericColumns = Object.keys(data[0]).filter(key => 
        data.every(row => !isNaN(row[key]))
    );

    numericColumns.forEach(column => {
        const values = data.map(row => row[column]).filter(val => !isNaN(val));
        const stats = calculateBasicStats(values);
        
        if (stats.skewness > 1) {
            insights.push(`${column} shows a strong positive skew.`);
        } else if (stats.skewness < -1) {
            insights.push(`${column} shows a strong negative skew.`);
        }
    });

    return insights;
};

const analyzeOutliers = (data) => {
    const insights = [];
    const numericColumns = Object.keys(data[0]).filter(key => 
        data.every(row => !isNaN(row[key]))
    );

    numericColumns.forEach(column => {
        const values = data.map(row => row[column]).filter(val => !isNaN(val));
        const outliers = detectOutliers(values);
        
        if (outliers.length > 0) {
            insights.push(
                `${column} has ${outliers.length} outliers, which is ` +
                `${((outliers.length / values.length) * 100).toFixed(1)}% of the data.`
            );
        }
    });

    return insights;
};

const calculateBasicStats = (values) => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate skewness
    const skewness = values.reduce((sum, val) => 
        sum + Math.pow((val - mean) / stdDev, 3)
    , 0) / values.length;

    return { mean, variance, stdDev, skewness };
}; 