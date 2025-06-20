export const isNumber = (value) => {
    if (typeof value === 'number') return true;
    if (typeof value !== 'string') return false;

    // Remove common number formatting
    const cleanValue = value
        .replace(/,/g, '')  // Remove commas
        .replace(/\$/g, '') // Remove dollar signs
        .replace(/%$/, '')  // Remove trailing percent
        .trim();

    // Test if it's a valid number
    return !isNaN(cleanValue) && isFinite(cleanValue);
};

export const isDate = (value) => {
    if (value instanceof Date) return true;
    if (typeof value !== 'string') return false;

    // Common date formats
    const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY or DD/MM/YYYY
        /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY or DD-MM-YYYY
        /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
        /^\d{2}\.\d{2}\.\d{4}$/, // DD.MM.YYYY
        /^\d{4}\.\d{2}\.\d{2}$/, // YYYY.MM.DD
    ];

    // Test against patterns
    if (!datePatterns.some(pattern => pattern.test(value))) {
        return false;
    }

    // Try parsing the date
    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
};

export const isEmail = (value) => {
    if (typeof value !== 'string') return false;
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value);
};

export const isStrongPassword = (value) => {
    if (typeof value !== 'string') return false;

    // Password must contain:
    // - At least 8 characters
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one number
    // - At least one special character
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordPattern.test(value);
};

export const isValidUsername = (value) => {
    if (typeof value !== 'string') return false;

    // Username must:
    // - Be between 3 and 30 characters
    // - Start with a letter
    // - Contain only letters, numbers, underscores, and hyphens
    const usernamePattern = /^[a-zA-Z][a-zA-Z0-9_-]{2,29}$/;
    return usernamePattern.test(value);
};

export const isValidFileName = (value) => {
    if (typeof value !== 'string') return false;

    // File name must:
    // - Not contain invalid characters (/, \, :, *, ?, ", <, >, |)
    // - Not start or end with spaces
    // - Be between 1 and 255 characters
    const fileNamePattern = /^[^/\\:*?"<>|][\w\s-]{0,253}[^/\\:*?"<>|\s]$/;
    return fileNamePattern.test(value);
};

export const isValidFileSize = (size, maxSize = 10 * 1024 * 1024) => {
    return typeof size === 'number' && size > 0 && size <= maxSize;
};

export const isValidMimeType = (mimeType, allowedTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']) => {
    return typeof mimeType === 'string' && allowedTypes.includes(mimeType);
};

export const sanitizeString = (value) => {
    if (typeof value !== 'string') return '';
    
    // Remove HTML tags and special characters
    return value
        .replace(/<[^>]*>/g, '')
        .replace(/[<>]/g, '')
        .trim();
};

export const sanitizeFilename = (filename) => {
    if (typeof filename !== 'string') return '';

    // Remove invalid characters and trim
    return filename
        .replace(/[/\\:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

export const validateObject = (obj, schema) => {
    const errors = {};

    for (const [key, rules] of Object.entries(schema)) {
        if (rules.required && (obj[key] === undefined || obj[key] === null || obj[key] === '')) {
            errors[key] = `${key} is required`;
            continue;
        }

        if (obj[key] !== undefined && obj[key] !== null) {
            if (rules.type && typeof obj[key] !== rules.type) {
                errors[key] = `${key} must be a ${rules.type}`;
            }

            if (rules.min !== undefined && obj[key] < rules.min) {
                errors[key] = `${key} must be at least ${rules.min}`;
            }

            if (rules.max !== undefined && obj[key] > rules.max) {
                errors[key] = `${key} must be at most ${rules.max}`;
            }

            if (rules.minLength !== undefined && obj[key].length < rules.minLength) {
                errors[key] = `${key} must be at least ${rules.minLength} characters`;
            }

            if (rules.maxLength !== undefined && obj[key].length > rules.maxLength) {
                errors[key] = `${key} must be at most ${rules.maxLength} characters`;
            }

            if (rules.pattern && !rules.pattern.test(obj[key])) {
                errors[key] = `${key} is invalid`;
            }

            if (rules.enum && !rules.enum.includes(obj[key])) {
                errors[key] = `${key} must be one of: ${rules.enum.join(', ')}`;
            }

            if (rules.validate && typeof rules.validate === 'function') {
                const validationResult = rules.validate(obj[key]);
                if (validationResult !== true) {
                    errors[key] = validationResult;
                }
            }
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}; 