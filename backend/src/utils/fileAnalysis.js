import { isNumber, isDate } from './validators.js';

export const analyzeFileData = async (data) => {
    if (!data || data.length === 0) {
        throw new Error('No data provided for analysis');
    }

    const headers = data[0];
    const rows = data.slice(1);
    const columns = [];
    let qualityScore = 100;

    // Analyze each column
    for (let i = 0; i < headers.length; i++) {
        const columnData = rows.map(row => row[i]);
        const columnAnalysis = analyzeColumn(headers[i], columnData);
        columns.push(columnAnalysis);

        // Adjust quality score based on null values and data consistency
        const nullPercentage = (columnAnalysis.statistics.nullCount / rows.length) * 100;
        if (nullPercentage > 5) {
            qualityScore -= Math.min(20, nullPercentage);
        }
    }

    return {
        columns,
        rowCount: rows.length,
        columnCount: headers.length,
        qualityScore: Math.max(0, Math.round(qualityScore))
    };
};

const analyzeColumn = (header, data) => {
    const analysis = {
        name: header,
        type: detectDataType(data),
        statistics: {
            nullCount: 0,
            uniqueCount: 0,
            min: null,
            max: null,
            mean: null,
            median: null,
            mode: null
        }
    };

    // Count null values and get unique values
    const nonNullValues = data.filter(val => val !== null && val !== undefined && val !== '');
    analysis.statistics.nullCount = data.length - nonNullValues.length;
    const uniqueValues = new Set(nonNullValues);
    analysis.statistics.uniqueCount = uniqueValues.size;

    // Calculate statistics based on data type
    if (analysis.type === 'number') {
        const numbers = nonNullValues.map(Number);
        analysis.statistics.min = Math.min(...numbers);
        analysis.statistics.max = Math.max(...numbers);
        analysis.statistics.mean = calculateMean(numbers);
        analysis.statistics.median = calculateMedian(numbers);
        analysis.statistics.mode = calculateMode(numbers);
    } else if (analysis.type === 'date') {
        const dates = nonNullValues.map(val => new Date(val));
        analysis.statistics.min = new Date(Math.min(...dates));
        analysis.statistics.max = new Date(Math.max(...dates));
    }

    return analysis;
};

const detectDataType = (data) => {
    const sample = data.filter(val => val !== null && val !== undefined && val !== '').slice(0, 100);
    if (sample.length === 0) return 'string';

    const numberCount = sample.filter(val => isNumber(val)).length;
    const dateCount = sample.filter(val => isDate(val)).length;

    const numberPercentage = (numberCount / sample.length) * 100;
    const datePercentage = (dateCount / sample.length) * 100;

    if (numberPercentage >= 80) return 'number';
    if (datePercentage >= 80) return 'date';
    return 'string';
};

export const calculateStatistics = async (data, columns) => {
    const stats = {};
    const headers = data[0];
    const rows = data.slice(1);

    columns.forEach((column, index) => {
        const columnData = rows.map(row => row[index]);
        
        if (column.type === 'number') {
            const numbers = columnData
                .filter(val => val !== null && val !== undefined && val !== '')
                .map(Number);

            stats[column.name] = {
                min: Math.min(...numbers),
                max: Math.max(...numbers),
                mean: calculateMean(numbers),
                median: calculateMedian(numbers),
                standardDeviation: calculateStandardDeviation(numbers),
                quartiles: calculateQuartiles(numbers),
                outliers: detectOutliers(numbers)
            };
        } else if (column.type === 'string') {
            const frequencies = calculateFrequencies(columnData);
            stats[column.name] = {
                uniqueValues: new Set(columnData).size,
                mostCommon: Object.entries(frequencies)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
            };
        }
    });

    return stats;
};

// Helper functions for statistical calculations
const calculateMean = (numbers) => {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
};

const calculateMedian = (numbers) => {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
};

const calculateMode = (numbers) => {
    const frequencies = calculateFrequencies(numbers);
    let maxFreq = 0;
    let mode = null;

    for (const [num, freq] of Object.entries(frequencies)) {
        if (freq > maxFreq) {
            maxFreq = freq;
            mode = Number(num);
        }
    }

    return mode;
};

const calculateStandardDeviation = (numbers) => {
    const mean = calculateMean(numbers);
    const squareDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return Math.sqrt(calculateMean(squareDiffs));
};

const calculateQuartiles = (numbers) => {
    const sorted = [...numbers].sort((a, b) => a - b);
    return {
        Q1: calculateMedian(sorted.slice(0, Math.floor(sorted.length / 2))),
        Q2: calculateMedian(sorted),
        Q3: calculateMedian(sorted.slice(Math.ceil(sorted.length / 2)))
    };
};

const detectOutliers = (numbers) => {
    const quartiles = calculateQuartiles(numbers);
    const iqr = quartiles.Q3 - quartiles.Q1;
    const lowerBound = quartiles.Q1 - 1.5 * iqr;
    const upperBound = quartiles.Q3 + 1.5 * iqr;

    return numbers.filter(num => num < lowerBound || num > upperBound);
};

const calculateFrequencies = (values) => {
    return values.reduce((freq, val) => {
        freq[val] = (freq[val] || 0) + 1;
        return freq;
    }, {});
}; 