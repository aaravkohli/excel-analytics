
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExcelColumn {
  name: string;
  type: 'text' | 'number' | 'date';
  values: any[];
}

export const detectColumnType = (values: any[]): 'text' | 'number' | 'date' => {
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonEmptyValues.length === 0) return 'text';
  
  // Check if all values are numbers
  const numberCount = nonEmptyValues.filter(v => {
    if (typeof v === 'number') return true;
    if (typeof v === 'string') {
      // Remove common number formatting (commas, currency symbols, etc.)
      const cleaned = v.replace(/[$,\s%]/g, '');
      return !isNaN(Number(cleaned)) && cleaned !== '';
    }
    return false;
  }).length;
  
  if (numberCount === nonEmptyValues.length) return 'number';
  
  // Check if values look like dates
  const dateCount = nonEmptyValues.filter(v => {
    if (typeof v === 'string') {
      // Enhanced date pattern matching
      const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
        /^\d{1,2}\/\d{1,2}\/\d{4}$/,     // MM/DD/YYYY or M/D/YYYY
        /^\d{1,2}-\d{1,2}-\d{4}$/,       // MM-DD-YYYY or M-D-YYYY
        /^\d{2}\/\d{2}\/\d{4}$/,         // DD/MM/YYYY
        /^\d{4}\/\d{2}\/\d{2}$/,         // YYYY/MM/DD
        /^[A-Za-z]{3}\s\d{1,2},?\s\d{4}$/, // Jan 1, 2023 or Jan 1 2023
        /^\d{1,2}\s[A-Za-z]{3}\s\d{4}$/,   // 1 Jan 2023
      ];
      
      const matchesPattern = datePatterns.some(pattern => pattern.test(v));
      if (matchesPattern) {
        const date = new Date(v);
        return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
      }
    }
    return false;
  }).length;
  
  // If more than 60% of values look like dates, consider it a date column
  if (dateCount > nonEmptyValues.length * 0.6) return 'date';
  
  return 'text';
};

export const analyzeExcelData = (data: any[]): ExcelColumn[] => {
  if (!data || data.length === 0) return [];
  
  const columns = Object.keys(data[0]);
  
  return columns.map(columnName => {
    const values = data.map(row => row[columnName]);
    const type = detectColumnType(values);
    
    return {
      name: columnName,
      type,
      values
    };
  });
};

export const exportDataToExcel = (data: any[], filename: string = 'exported_data') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

export const getDataStatistics = (data: any[], columnName: string) => {
  const values = data.map(row => row[columnName]).filter(v => v !== null && v !== undefined && v !== '');
  
  if (values.length === 0) return null;
  
  const type = detectColumnType(values);
  
  if (type === 'number') {
    const numbers = values.map(v => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        // Handle formatted numbers (currency, percentages, etc.)
        const cleaned = v.replace(/[$,\s%]/g, '');
        return Number(cleaned);
      }
      return Number(v);
    }).filter(n => !isNaN(n));
    
    if (numbers.length === 0) return null;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;
    
    // Calculate standard deviation
    const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate median
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
    
    return {
      type,
      count: numbers.length,
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      average: mean,
      median: median,
      sum: sum,
      stdDev: stdDev,
      range: Math.max(...numbers) - Math.min(...numbers)
    };
  }
  
  return {
    type,
    count: values.length,
    unique: new Set(values).size,
    mostCommon: getMostCommonValue(values)
  };
};

const getMostCommonValue = (values: any[]) => {
  const frequency: { [key: string]: number } = {};
  values.forEach(value => {
    const key = String(value);
    frequency[key] = (frequency[key] || 0) + 1;
  });
  
  let maxCount = 0;
  let mostCommon = null;
  
  Object.entries(frequency).forEach(([value, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = value;
    }
  });
  
  return { value: mostCommon, count: maxCount };
};

// New utility functions for data cleaning suggestions
export const getDataCleaningSuggestions = (data: any[]) => {
  if (!data || data.length === 0) return [];
  
  const suggestions: string[] = [];
  const columns = Object.keys(data[0]);
  const analyzedColumns = analyzeExcelData(data);
  
  // Check for missing values
  const totalCells = data.length * columns.length;
  const emptyCells = data.reduce((count, row) => {
    return count + columns.filter(col => 
      row[col] === null || row[col] === undefined || row[col] === ''
    ).length;
  }, 0);
  
  if (emptyCells > 0) {
    const percentage = (emptyCells / totalCells) * 100;
    suggestions.push(`${emptyCells} missing values found (${percentage.toFixed(1)}% of data)`);
    
    if (percentage > 30) {
      suggestions.push('High percentage of missing data - consider data quality review');
    }
  }
  
  // Check for potential outliers in numeric columns
  analyzedColumns.forEach(column => {
    if (column.type === 'number') {
      const stats = getDataStatistics(data, column.name);
      if (stats && stats.type === 'number') {
        const outliers = column.values.filter(value => {
          const numValue = Number(value);
          return Math.abs(numValue - stats.average) > 2 * stats.stdDev;
        }).length;
        
        if (outliers > 0) {
          suggestions.push(`${outliers} potential outliers detected in "${column.name}" column`);
        }
      }
    }
  });
  
  return suggestions;
};

// Enhanced detection for better data type recognition
export const enhancedColumnAnalysis = (data: any[], columnName: string) => {
  const values = data.map(row => row[columnName]);
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonEmptyValues.length === 0) {
    return {
      type: 'text',
      isEmpty: true,
      confidence: 0,
      patterns: []
    };
  }
  
  // Analyze patterns in the data
  const patterns: string[] = [];
  const sampleValues = nonEmptyValues.slice(0, 10);
  
  // Check for common patterns
  const hasNumbers = sampleValues.some(v => !isNaN(Number(v)));
  const hasDates = sampleValues.some(v => !isNaN(Date.parse(String(v))));
  const hasText = sampleValues.some(v => isNaN(Number(v)) && isNaN(Date.parse(String(v))));
  
  if (hasNumbers) patterns.push('numeric');
  if (hasDates) patterns.push('date-like');
  if (hasText) patterns.push('text');
  
  const type = detectColumnType(values);
  const confidence = (nonEmptyValues.length / values.length) * 100;
  
  return {
    type,
    isEmpty: false,
    confidence,
    patterns,
    sampleValues: sampleValues.slice(0, 5),
    nullCount: values.length - nonEmptyValues.length
  };
};
