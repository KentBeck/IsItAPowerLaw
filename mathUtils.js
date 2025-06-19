// Mathematical Utility Functions - Pure functions for statistical calculations

/**
 * Calculates the base-10 logarithm, handling edge cases
 * @param {number} value - The value to take log of
 * @returns {number|null} Log10 of value, or null if value <= 0
 */
function log10(value) {
    if (value <= 0) {
        return null;
    }
    return Math.log10(value);
}

/**
 * Calculates the natural logarithm, handling edge cases
 * @param {number} value - The value to take log of
 * @returns {number|null} Natural log of value, or null if value <= 0
 */
function ln(value) {
    if (value <= 0) {
        return null;
    }
    return Math.log(value);
}

/**
 * Adds log transformations to data points for power law analysis
 * @param {Array} data - Data with CCDF values
 * @returns {Array} Data with logValue and logCCDF added
 */
function addLogTransforms(data) {
    return data.map(item => ({
        ...item,
        logValue: log10(item.value),
        logCCDF: item.ccdf > 0 ? log10(item.ccdf) : null
    }));
}

/**
 * Filters data to only include points with valid log values
 * @param {Array} data - Data with log transforms
 * @returns {Array} Filtered data with valid log values
 */
function filterValidLogData(data) {
    return data.filter(item => 
        item.logValue !== null && 
        item.logCCDF !== null && 
        !isNaN(item.logValue) && 
        !isNaN(item.logCCDF)
    );
}

/**
 * Calculates the cumulative distribution function (CDF) value using normal approximation
 * @param {number} z - Z-score (standardized value)
 * @returns {number} CDF value (probability)
 */
function normalCDF(z) {
    // Approximation of the normal CDF using the error function
    // This is a simplified version - for production use, consider a more accurate implementation
    return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

/**
 * Approximation of the error function
 * @param {number} x - Input value
 * @returns {number} Error function value
 */
function erf(x) {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
}

/**
 * Calculates the inverse normal CDF (quantile function)
 * @param {number} p - Probability (0 < p < 1)
 * @returns {number} Z-score corresponding to the probability
 */
function normalInverseCDF(p) {
    if (p <= 0 || p >= 1) {
        throw new Error('Probability must be between 0 and 1');
    }
    
    // Beasley-Springer-Moro algorithm approximation
    const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [0, -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [0, 7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    let x;
    if (p < pLow) {
        const q = Math.sqrt(-2 * Math.log(p));
        x = (((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) / ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
    } else if (p <= pHigh) {
        const q = p - 0.5;
        const r = q * q;
        x = (((((a[1] * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * r + a[6]) * q / (((((b[1] * r + b[2]) * r + b[3]) * r + b[4]) * r + b[5]) * r + 1);
    } else {
        const q = Math.sqrt(-2 * Math.log(1 - p));
        x = -(((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) / ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
    }

    return x;
}

/**
 * Calculates the mean of an array of numbers
 * @param {Array<number>} values - Array of numeric values
 * @returns {number} Mean value
 */
function mean(values) {
    if (!Array.isArray(values) || values.length === 0) {
        throw new Error('Values must be a non-empty array');
    }
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculates the standard deviation of an array of numbers
 * @param {Array<number>} values - Array of numeric values
 * @param {boolean} sample - Whether to use sample standard deviation (default: true)
 * @returns {number} Standard deviation
 */
function standardDeviation(values, sample = true) {
    if (!Array.isArray(values) || values.length === 0) {
        throw new Error('Values must be a non-empty array');
    }
    
    const meanVal = mean(values);
    const squaredDiffs = values.map(val => Math.pow(val - meanVal, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - (sample ? 1 : 0));
    
    return Math.sqrt(variance);
}

// Export functions for testing (if in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        log10,
        ln,
        addLogTransforms,
        filterValidLogData,
        normalCDF,
        normalInverseCDF,
        erf,
        mean,
        standardDeviation
    };
}
