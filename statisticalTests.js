// Statistical Tests Module - Pure functions for regression and goodness-of-fit tests

/**
 * Performs linear regression on x,y data points
 * @param {Array<{x: number, y: number}>} data - Array of x,y coordinate objects
 * @returns {Object} Regression results with slope, intercept, rSquared, and residuals
 */
function linearRegression(data) {
    if (!Array.isArray(data) || data.length < 2) {
        throw new Error('Data must be an array with at least 2 points');
    }

    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    // Calculate sums
    data.forEach(point => {
        if (typeof point.x !== 'number' || typeof point.y !== 'number') {
            throw new Error('All data points must have numeric x and y values');
        }
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumXX += point.x * point.x;
    });

    // Calculate slope and intercept
    const denominator = n * sumXX - sumX * sumX;
    if (Math.abs(denominator) < 1e-10) {
        throw new Error('Cannot perform regression: x values are too similar');
    }

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    let ssTot = 0, ssRes = 0;

    const residuals = data.map(point => {
        const yPred = slope * point.x + intercept;
        const residual = point.y - yPred;
        ssTot += Math.pow(point.y - meanY, 2);
        ssRes += Math.pow(residual, 2);
        return { x: point.x, y: point.y, predicted: yPred, residual };
    });

    const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 1;

    return {
        slope,
        intercept,
        rSquared,
        residuals,
        n,
        standardError: Math.sqrt(ssRes / (n - 2))
    };
}

/**
 * Performs Kolmogorov-Smirnov test for goodness of fit
 * @param {Array<number>} empiricalCDF - Empirical CDF values
 * @param {Array<number>} theoreticalCDF - Theoretical CDF values
 * @returns {Object} KS test results with statistic and p-value approximation
 */
function kolmogorovSmirnovTest(empiricalCDF, theoreticalCDF) {
    if (!Array.isArray(empiricalCDF) || !Array.isArray(theoreticalCDF)) {
        throw new Error('Both CDFs must be arrays');
    }
    
    if (empiricalCDF.length !== theoreticalCDF.length) {
        throw new Error('CDF arrays must have the same length');
    }

    const n = empiricalCDF.length;
    if (n === 0) {
        throw new Error('CDF arrays cannot be empty');
    }

    // Calculate KS statistic (maximum difference between CDFs)
    let maxDiff = 0;
    for (let i = 0; i < n; i++) {
        const diff = Math.abs(empiricalCDF[i] - theoreticalCDF[i]);
        maxDiff = Math.max(maxDiff, diff);
    }

    // Approximate p-value using Kolmogorov distribution
    // This is a simplified approximation
    const ksStatistic = maxDiff;
    const lambda = ksStatistic * Math.sqrt(n);
    
    // Approximation for p-value (two-sided test)
    let pValue;
    if (lambda < 0.27) {
        pValue = 1;
    } else if (lambda < 1) {
        pValue = 2 * Math.exp(-2 * lambda * lambda);
    } else {
        // More accurate approximation for larger lambda
        pValue = 2 * Math.exp(-2 * lambda * lambda) * 
                (1 - 2 * lambda * lambda / 3 + 8 * Math.pow(lambda, 4) / 45);
    }

    return {
        statistic: ksStatistic,
        pValue: Math.max(0, Math.min(1, pValue)),
        criticalValue: 1.36 / Math.sqrt(n), // 95% confidence level
        significant: ksStatistic > 1.36 / Math.sqrt(n)
    };
}

/**
 * Calculates Anderson-Darling test statistic for goodness of fit
 * @param {Array<number>} empiricalCDF - Empirical CDF values (sorted)
 * @param {Array<number>} theoreticalCDF - Theoretical CDF values
 * @returns {Object} AD test results with statistic and significance
 */
function andersonDarlingTest(empiricalCDF, theoreticalCDF) {
    if (!Array.isArray(empiricalCDF) || !Array.isArray(theoreticalCDF)) {
        throw new Error('Both CDFs must be arrays');
    }
    
    if (empiricalCDF.length !== theoreticalCDF.length) {
        throw new Error('CDF arrays must have the same length');
    }

    const n = empiricalCDF.length;
    if (n === 0) {
        throw new Error('CDF arrays cannot be empty');
    }

    // Calculate Anderson-Darling statistic
    let adStatistic = 0;
    
    for (let i = 0; i < n; i++) {
        const Fi = theoreticalCDF[i];
        const Fn_i = empiricalCDF[n - 1 - i];
        
        // Avoid log(0) by using small epsilon
        const epsilon = 1e-10;
        const logFi = Math.log(Math.max(Fi, epsilon));
        const log1minusFn_i = Math.log(Math.max(1 - Fn_i, epsilon));
        
        adStatistic += (2 * i + 1) * (logFi + log1minusFn_i);
    }
    
    adStatistic = -n - adStatistic / n;

    // Critical values for normal distribution (approximate)
    const criticalValues = {
        '0.10': 0.631,
        '0.05': 0.752,
        '0.025': 0.873,
        '0.01': 1.035
    };

    return {
        statistic: adStatistic,
        criticalValues,
        significant: adStatistic > criticalValues['0.05']
    };
}

/**
 * Calculates Akaike Information Criterion (AIC)
 * @param {number} logLikelihood - Log-likelihood of the model
 * @param {number} numParameters - Number of parameters in the model
 * @returns {number} AIC value
 */
function calculateAIC(logLikelihood, numParameters) {
    return 2 * numParameters - 2 * logLikelihood;
}

/**
 * Calculates Bayesian Information Criterion (BIC)
 * @param {number} logLikelihood - Log-likelihood of the model
 * @param {number} numParameters - Number of parameters in the model
 * @param {number} sampleSize - Sample size
 * @returns {number} BIC value
 */
function calculateBIC(logLikelihood, numParameters, sampleSize) {
    return Math.log(sampleSize) * numParameters - 2 * logLikelihood;
}

/**
 * Calculates confidence intervals for regression parameters
 * @param {Object} regressionResult - Result from linearRegression function
 * @param {number} confidenceLevel - Confidence level (e.g., 0.95 for 95%)
 * @returns {Object} Confidence intervals for slope and intercept
 */
function regressionConfidenceIntervals(regressionResult, confidenceLevel = 0.95) {
    const { slope, intercept, standardError, n, residuals } = regressionResult;
    
    // Calculate standard errors for slope and intercept
    const sumXX = residuals.reduce((sum, point) => sum + point.x * point.x, 0);
    const sumX = residuals.reduce((sum, point) => sum + point.x, 0);
    const meanX = sumX / n;
    
    const slopeStdError = standardError / Math.sqrt(sumXX - n * meanX * meanX);
    const interceptStdError = standardError * Math.sqrt(1/n + (meanX * meanX) / (sumXX - n * meanX * meanX));
    
    // t-value for given confidence level (approximation for large n)
    const alpha = 1 - confidenceLevel;
    const tValue = 1.96; // Approximate for 95% confidence, should use t-distribution for small n
    
    return {
        slope: {
            estimate: slope,
            standardError: slopeStdError,
            lowerBound: slope - tValue * slopeStdError,
            upperBound: slope + tValue * slopeStdError
        },
        intercept: {
            estimate: intercept,
            standardError: interceptStdError,
            lowerBound: intercept - tValue * interceptStdError,
            upperBound: intercept + tValue * interceptStdError
        }
    };
}

// Export functions for testing (if in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        linearRegression,
        kolmogorovSmirnovTest,
        andersonDarlingTest,
        calculateAIC,
        calculateBIC,
        regressionConfidenceIntervals
    };
}
