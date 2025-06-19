// Analysis Engine - Coordinates multiple distribution analyzers and compares results

/**
 * Analysis Engine Class
 * Manages multiple distribution analyzers and provides unified analysis interface
 */
class AnalysisEngine {
    constructor() {
        this.analyzers = new Map();
        this.defaultAnalyzers = [];
    }

    /**
     * Registers a distribution analyzer
     * @param {DistributionAnalyzer} analyzer - The analyzer to register
     * @param {boolean} isDefault - Whether to include in default analysis
     */
    registerAnalyzer(analyzer, isDefault = true) {
        if (!analyzer.name) {
            throw new Error('Analyzer must have a name property');
        }

        this.analyzers.set(analyzer.name, analyzer);
        
        if (isDefault && !this.defaultAnalyzers.includes(analyzer.name)) {
            this.defaultAnalyzers.push(analyzer.name);
        }
    }

    /**
     * Unregisters a distribution analyzer
     * @param {string} analyzerName - Name of the analyzer to remove
     */
    unregisterAnalyzer(analyzerName) {
        this.analyzers.delete(analyzerName);
        const index = this.defaultAnalyzers.indexOf(analyzerName);
        if (index > -1) {
            this.defaultAnalyzers.splice(index, 1);
        }
    }

    /**
     * Gets a registered analyzer by name
     * @param {string} analyzerName - Name of the analyzer
     * @returns {DistributionAnalyzer|null} The analyzer or null if not found
     */
    getAnalyzer(analyzerName) {
        return this.analyzers.get(analyzerName) || null;
    }

    /**
     * Lists all registered analyzers
     * @returns {Array<string>} Array of analyzer names
     */
    listAnalyzers() {
        return Array.from(this.analyzers.keys());
    }

    /**
     * Analyzes data with a specific distribution analyzer
     * @param {string} analyzerName - Name of the analyzer to use
     * @param {Array} data - Data to analyze (should have CCDF values)
     * @returns {Object} Standardized analysis result
     */
    analyzeSingle(analyzerName, data) {
        const analyzer = this.getAnalyzer(analyzerName);
        if (!analyzer) {
            throw new Error(`Analyzer '${analyzerName}' not found`);
        }

        // Validate data first
        const validation = analyzer.validateData(data);
        if (!validation.valid) {
            throw new Error(`Data validation failed for ${analyzerName}: ${validation.message}`);
        }

        // Perform analysis
        const rawResult = analyzer.analyze(data);
        
        // Standardize result
        return DistributionUtils.standardizeResult(rawResult, analyzer);
    }

    /**
     * Analyzes data with multiple distribution analyzers
     * @param {Array} data - Data to analyze (should have CCDF values)
     * @param {Array<string>} analyzerNames - Names of analyzers to use (defaults to all default analyzers)
     * @returns {Object} Multi-distribution analysis results
     */
    analyzeMultiple(data, analyzerNames = null) {
        const analyzersToUse = analyzerNames || this.defaultAnalyzers;
        
        if (analyzersToUse.length === 0) {
            throw new Error('No analyzers specified and no default analyzers registered');
        }

        const results = [];
        const errors = [];

        // Run each analyzer
        for (const analyzerName of analyzersToUse) {
            try {
                const result = this.analyzeSingle(analyzerName, data);
                results.push(result);
            } catch (error) {
                errors.push({
                    analyzer: analyzerName,
                    error: error.message
                });
            }
        }

        // Rank results by goodness of fit
        const rankedResults = DistributionUtils.rankResults(results);
        const bestFit = DistributionUtils.getBestFit(results);

        return {
            results: rankedResults,
            bestFit: bestFit,
            errors: errors,
            summary: this.generateSummary(rankedResults, bestFit, errors)
        };
    }

    /**
     * Generates a human-readable summary of multi-distribution analysis
     * @param {Array} rankedResults - Results ranked by goodness of fit
     * @param {Object|null} bestFit - Best fitting distribution or null
     * @param {Array} errors - Any errors that occurred during analysis
     * @returns {Object} Summary with verdict and details
     */
    generateSummary(rankedResults, bestFit, errors) {
        const totalAnalyzers = rankedResults.length + errors.length;
        const successfulAnalyzers = rankedResults.length;

        let verdict, confidence, recommendation;

        if (bestFit) {
            // We have a clear best fit
            verdict = `Data appears to follow a ${bestFit.displayName} distribution`;
            confidence = bestFit.confidenceScore;
            recommendation = `The analysis suggests your data follows a ${bestFit.displayName} distribution with ${(confidence * 100).toFixed(1)}% confidence.`;
            
            // Add information about other distributions tested
            if (rankedResults.length > 1) {
                const alternatives = rankedResults.slice(1, 3).map(r => 
                    `${r.displayName} (${(r.confidenceScore * 100).toFixed(1)}%)`
                ).join(', ');
                recommendation += ` Other distributions tested: ${alternatives}.`;
            }
        } else if (rankedResults.length > 0) {
            // No clear best fit, but we have results
            const topResult = rankedResults[0];
            verdict = `Data does not clearly follow any of the tested distributions`;
            confidence = topResult.confidenceScore;
            recommendation = `None of the tested distributions show strong evidence of fitting your data. `;
            recommendation += `The closest match is ${topResult.displayName} with ${(confidence * 100).toFixed(1)}% confidence, `;
            recommendation += `but this is below the threshold for a reliable conclusion.`;
        } else {
            // No successful analyses
            verdict = `Unable to analyze data`;
            confidence = 0;
            recommendation = `Analysis failed for all distribution types. `;
            if (errors.length > 0) {
                recommendation += `Errors: ${errors.map(e => e.error).join('; ')}.`;
            }
        }

        return {
            verdict,
            confidence,
            recommendation,
            analyzersRun: totalAnalyzers,
            successfulAnalyses: successfulAnalyzers,
            hasErrors: errors.length > 0,
            errorCount: errors.length
        };
    }

    /**
     * Validates data against all registered analyzers
     * @param {Array} data - Data to validate
     * @returns {Object} Validation results for each analyzer
     */
    validateDataForAll(data) {
        const validationResults = {};
        
        for (const [name, analyzer] of this.analyzers) {
            try {
                validationResults[name] = analyzer.validateData(data);
            } catch (error) {
                validationResults[name] = {
                    valid: false,
                    message: `Validation error: ${error.message}`,
                    error: true
                };
            }
        }

        return validationResults;
    }

    /**
     * Gets information about all registered analyzers
     * @returns {Array<Object>} Information about each analyzer
     */
    getAnalyzerInfo() {
        return Array.from(this.analyzers.values()).map(analyzer => ({
            name: analyzer.name,
            displayName: analyzer.displayName,
            description: analyzer.description,
            parameterNames: analyzer.parameterNames || [],
            minimumDataPoints: analyzer.getMinimumDataPoints(),
            recommendedMinimumRange: analyzer.getRecommendedMinimumRange(),
            isDefault: this.defaultAnalyzers.includes(analyzer.name)
        }));
    }

    /**
     * Performs a quick analysis to determine which analyzers are likely to work
     * @param {Array} data - Data to pre-analyze
     * @returns {Object} Pre-analysis results with recommendations
     */
    preAnalyze(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return {
                suitable: [],
                unsuitable: [],
                warnings: ['Data is empty or invalid'],
                recommendation: 'Please provide valid data for analysis'
            };
        }

        const validations = this.validateDataForAll(data);
        const suitable = [];
        const unsuitable = [];
        const warnings = [];

        for (const [name, validation] of Object.entries(validations)) {
            const analyzer = this.getAnalyzer(name);
            const info = {
                name,
                displayName: analyzer.displayName,
                validation
            };

            if (validation.valid) {
                suitable.push(info);
                if (validation.warning) {
                    warnings.push(`${analyzer.displayName}: ${validation.message}`);
                }
            } else {
                unsuitable.push(info);
            }
        }

        let recommendation;
        if (suitable.length === 0) {
            recommendation = 'No distribution analyzers can process this data. Please check data format and requirements.';
        } else if (suitable.length === 1) {
            recommendation = `Only ${suitable[0].displayName} analysis is possible with this data.`;
        } else {
            recommendation = `${suitable.length} distribution types can be analyzed: ${suitable.map(s => s.displayName).join(', ')}.`;
        }

        return {
            suitable,
            unsuitable,
            warnings,
            recommendation
        };
    }
}

// Export for testing (if in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalysisEngine;
}
