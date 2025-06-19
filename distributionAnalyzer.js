// Distribution Analyzer Base Interface and Utilities
// Defines the standard interface that all distribution analyzers must implement

/**
 * Base class defining the interface for distribution analyzers
 * All distribution analyzers (PowerLaw, LogNormal, Exponential) should extend this class
 */
class DistributionAnalyzer {
    constructor() {
        if (this.constructor === DistributionAnalyzer) {
            throw new Error('DistributionAnalyzer is an abstract class and cannot be instantiated directly');
        }
        
        // Required properties that subclasses must define
        this.name = null;           // e.g., 'powerLaw', 'logNormal', 'exponential'
        this.displayName = null;    // e.g., 'Power Law', 'Log-Normal', 'Exponential'
        this.description = null;    // e.g., 'P(X > x) ∝ x^(-α)'
        this.parameterNames = [];   // e.g., ['exponent', 'scalingConstant']
    }

    /**
     * Analyzes data for this distribution type
     * @param {Array} dataWithCCDF - Data points with CCDF values
     * @returns {Object} Analysis results with parameters, goodness of fit, and theoretical values
     */
    analyze(dataWithCCDF) {
        throw new Error('analyze() method must be implemented by subclass');
    }

    /**
     * Validates if data is suitable for this distribution analysis
     * @param {Array} data - Data to validate
     * @returns {Object} Validation result with success flag and message
     */
    validateData(data) {
        throw new Error('validateData() method must be implemented by subclass');
    }

    /**
     * Gets theoretical CCDF values for given x values and parameters
     * @param {Array<number>} xValues - X values to calculate CCDF for
     * @param {Object} parameters - Distribution parameters
     * @returns {Array<number>} Theoretical CCDF values
     */
    getTheoreticalCCDF(xValues, parameters) {
        throw new Error('getTheoreticalCCDF() method must be implemented by subclass');
    }

    /**
     * Gets plot data for distribution visualization
     * @param {Array} data - Data points
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Plot data for different visualization types
     */
    getPlotData(data, parameters) {
        throw new Error('getPlotData() method must be implemented by subclass');
    }

    /**
     * Gets the specific plot transformation for this distribution
     * For example: power law uses log-log, log-normal uses normal probability plot
     * @param {Array} data - Data points
     * @returns {Object} Transformed data for distribution-specific plotting
     */
    getDistributionSpecificPlot(data) {
        throw new Error('getDistributionSpecificPlot() method must be implemented by subclass');
    }

    /**
     * Calculates goodness of fit metrics for this distribution
     * @param {Array} empiricalData - Empirical data points
     * @param {Array} theoreticalData - Theoretical data points
     * @param {Object} additionalInfo - Additional information (e.g., regression results)
     * @returns {Object} Goodness of fit metrics
     */
    calculateGoodnessOfFit(empiricalData, theoreticalData, additionalInfo = {}) {
        throw new Error('calculateGoodnessOfFit() method must be implemented by subclass');
    }

    /**
     * Gets the minimum number of data points required for reliable analysis
     * @returns {number} Minimum required data points
     */
    getMinimumDataPoints() {
        return 5; // Default minimum, subclasses can override
    }

    /**
     * Gets the recommended minimum data range (max/min ratio) for reliable analysis
     * @returns {number} Recommended minimum range ratio
     */
    getRecommendedMinimumRange() {
        return 10; // Default 1 order of magnitude, subclasses can override
    }

    /**
     * Determines if the analysis result indicates this distribution is a good fit
     * @param {Object} analysisResult - Result from analyze() method
     * @returns {boolean} True if this distribution is a good fit
     */
    isGoodFit(analysisResult) {
        // Default implementation based on common goodness-of-fit criteria
        const gof = analysisResult.goodnessOfFit;
        
        // Primary criterion: R² or equivalent goodness-of-fit measure
        if (gof.rSquared && gof.rSquared > 0.9) return true;
        if (gof.confidenceScore && gof.confidenceScore > 0.9) return true;
        
        // Secondary criterion: Kolmogorov-Smirnov test
        if (gof.kolmogorovSmirnov && !gof.kolmogorovSmirnov.significant) return true;
        
        return false;
    }

    /**
     * Gets a confidence score (0-1) for how well this distribution fits the data
     * @param {Object} analysisResult - Result from analyze() method
     * @returns {number} Confidence score between 0 and 1
     */
    getConfidenceScore(analysisResult) {
        const gof = analysisResult.goodnessOfFit;
        
        // Use R² as primary confidence measure, fallback to other metrics
        if (gof.rSquared !== undefined) return Math.max(0, Math.min(1, gof.rSquared));
        if (gof.confidenceScore !== undefined) return Math.max(0, Math.min(1, gof.confidenceScore));
        
        // If no direct confidence measure, derive from p-values
        if (gof.kolmogorovSmirnov && gof.kolmogorovSmirnov.pValue !== undefined) {
            return Math.max(0, Math.min(1, gof.kolmogorovSmirnov.pValue));
        }
        
        return 0.5; // Default neutral confidence
    }

    /**
     * Compares this analyzer's result with another analyzer's result
     * @param {Object} thisResult - This analyzer's result
     * @param {Object} otherResult - Other analyzer's result
     * @returns {number} Positive if this is better, negative if other is better, 0 if equal
     */
    compareWith(thisResult, otherResult) {
        const thisScore = this.getConfidenceScore(thisResult);
        const otherScore = this.getConfidenceScore(otherResult);
        
        // Primary comparison: confidence score
        const scoreDiff = thisScore - otherScore;
        if (Math.abs(scoreDiff) > 0.05) return scoreDiff; // Significant difference
        
        // Secondary comparison: AIC (lower is better)
        if (thisResult.goodnessOfFit.aic && otherResult.goodnessOfFit.aic) {
            return otherResult.goodnessOfFit.aic - thisResult.goodnessOfFit.aic;
        }
        
        // Tertiary comparison: BIC (lower is better)
        if (thisResult.goodnessOfFit.bic && otherResult.goodnessOfFit.bic) {
            return otherResult.goodnessOfFit.bic - thisResult.goodnessOfFit.bic;
        }
        
        return 0; // Equal
    }

    /**
     * Gets a human-readable summary of the analysis result
     * @param {Object} analysisResult - Result from analyze() method
     * @returns {string} Human-readable summary
     */
    getSummary(analysisResult) {
        const isGood = this.isGoodFit(analysisResult);
        const confidence = this.getConfidenceScore(analysisResult);
        const confidenceLevel = confidence > 0.95 ? 'Very High' :
                               confidence > 0.9 ? 'High' :
                               confidence > 0.8 ? 'Moderate' :
                               confidence > 0.6 ? 'Low' : 'Very Low';
        
        if (isGood) {
            return `Data shows ${confidenceLevel.toLowerCase()} evidence of ${this.displayName} behavior (confidence: ${(confidence * 100).toFixed(1)}%)`;
        } else {
            return `Data does not show strong evidence of ${this.displayName} behavior (confidence: ${(confidence * 100).toFixed(1)}%)`;
        }
    }
}

/**
 * Utility functions for distribution analysis
 */
class DistributionUtils {
    /**
     * Standardizes analysis results across different distribution types
     * @param {Object} rawResult - Raw result from a distribution analyzer
     * @param {DistributionAnalyzer} analyzer - The analyzer that produced the result
     * @returns {Object} Standardized result format
     */
    static standardizeResult(rawResult, analyzer) {
        return {
            distributionType: analyzer.name,
            displayName: analyzer.displayName,
            description: analyzer.description,
            parameters: rawResult.parameters || {},
            goodnessOfFit: rawResult.goodnessOfFit || {},
            theoreticalValues: rawResult.theoreticalValues || [],
            plotData: rawResult.plotData || null,
            isGoodFit: analyzer.isGoodFit(rawResult),
            confidenceScore: analyzer.getConfidenceScore(rawResult),
            summary: analyzer.getSummary(rawResult),
            validDataPoints: rawResult.validDataPoints || 0,
            originalDataPoints: rawResult.originalDataPoints || 0
        };
    }

    /**
     * Ranks multiple analysis results by goodness of fit
     * @param {Array<Object>} results - Array of standardized analysis results
     * @returns {Array<Object>} Results sorted by goodness of fit (best first)
     */
    static rankResults(results) {
        return results.sort((a, b) => {
            // Primary: confidence score (higher is better)
            const confidenceDiff = b.confidenceScore - a.confidenceScore;
            if (Math.abs(confidenceDiff) > 0.05) return confidenceDiff;
            
            // Secondary: AIC (lower is better)
            if (a.goodnessOfFit.aic && b.goodnessOfFit.aic) {
                return a.goodnessOfFit.aic - b.goodnessOfFit.aic;
            }
            
            // Tertiary: number of valid data points (more is better for reliability)
            return b.validDataPoints - a.validDataPoints;
        });
    }

    /**
     * Determines the best fitting distribution from multiple results
     * @param {Array<Object>} results - Array of standardized analysis results
     * @returns {Object|null} Best fitting result, or null if none are good fits
     */
    static getBestFit(results) {
        const rankedResults = this.rankResults(results);
        const bestResult = rankedResults[0];
        
        // Only return as "best" if it's actually a good fit
        return bestResult && bestResult.isGoodFit ? bestResult : null;
    }
}

// Export for testing (if in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DistributionAnalyzer,
        DistributionUtils
    };
}
