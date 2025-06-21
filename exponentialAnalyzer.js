// Exponential Distribution Analyzer - Dedicated analyzer for exponential distributions

// Load dependencies if in Node.js environment
if (
  typeof module !== "undefined" &&
  typeof DistributionAnalyzer === "undefined"
) {
  const {
    DistributionAnalyzer,
    DistributionUtils,
  } = require("./distributionAnalyzer.js");
  const mathUtils = require("./mathUtils.js");
  const statisticalTests = require("./statisticalTests.js");

  // Make functions available globally
  global.DistributionAnalyzer = DistributionAnalyzer;
  global.DistributionUtils = DistributionUtils;
  global.mathUtils = mathUtils;
  global.statisticalTests = statisticalTests;
}

/**
 * Exponential Distribution Analyzer Class
 * Implements the DistributionAnalyzer interface for exponential distributions
 *
 * Exponential distribution: P(X > x) = e^(-λx) for x ≥ 0
 * Parameter estimation: λ = 1/mean
 */
class ExponentialAnalyzer extends DistributionAnalyzer {
  constructor() {
    super();
    this.name = "exponential";
    this.displayName = "Exponential";
    this.description = "P(X > x) = e^(-λx)";
    this.parameterNames = ["lambda"];

    // Store references to utility functions
    if (typeof module !== "undefined") {
      // Node.js environment - require modules directly
      this.mathUtils = require("./mathUtils.js");
      this.statisticalTests = require("./statisticalTests.js");
    } else {
      // Browser environment - functions should be available globally
      this.mathUtils = {
        mean: mean,
      };
      this.statisticalTests = {
        linearRegression: linearRegression,
        kolmogorovSmirnovTest: kolmogorovSmirnovTest,
        calculateAIC: calculateAIC,
        calculateBIC: calculateBIC,
      };
    }
  }

  /**
   * Analyzes data for exponential distribution
   * @param {Array} dataWithCCDF - Data points with CCDF values
   * @returns {Object} Analysis results with parameters, goodness of fit, and theoretical values
   */
  analyze(dataWithCCDF) {
    if (!Array.isArray(dataWithCCDF) || dataWithCCDF.length === 0) {
      throw new Error("Data must be a non-empty array");
    }

    // Filter out points with non-positive values (exponential distribution requires x > 0)
    const validData = dataWithCCDF.filter((item) => item.value > 0);

    if (validData.length < 3) {
      throw new Error(
        "Not enough valid data points after filtering. Need at least 3 points with positive values."
      );
    }

    // Estimate exponential parameter using method of moments
    // For exponential distribution: λ = 1/mean
    const values = validData.map((item) => item.value);
    const meanValue = this.mathUtils.mean(values);
    const lambda = 1 / meanValue;

    const parameters = { lambda };

    // Calculate theoretical CCDF values for exponential
    const theoreticalValues = validData.map((item) => ({
      ...item,
      theoreticalCCDF: this.getTheoreticalCCDF([item.value], parameters)[0],
    }));

    // Calculate goodness of fit metrics
    const goodnessOfFit = this.calculateGoodnessOfFit(
      validData,
      theoreticalValues,
      { parameters }
    );

    // Generate exponential probability plot data
    const exponentialProbabilityPlot =
      this.generateExponentialProbabilityPlot(validData);

    return {
      distributionName: this.name,
      parameters,
      goodnessOfFit,
      theoreticalValues,
      exponentialProbabilityPlot,
      validDataPoints: validData.length,
      originalDataPoints: dataWithCCDF.length,
    };
  }

  /**
   * Generates exponential probability plot data
   * For exponential distribution, -ln(CCDF) vs x should be linear
   * @param {Array} data - Data points
   * @returns {Object} Exponential probability plot data
   */
  generateExponentialProbabilityPlot(data) {
    // Filter out points with zero CCDF (can't take log of 0)
    const validData = data.filter((item) => item.ccdf > 0);

    // Create plot data: x vs -ln(CCDF)
    const plotData = validData.map((item) => ({
      x: item.value,
      y: -Math.log(item.ccdf),
      originalValue: item.value,
      originalCCDF: item.ccdf,
    }));

    // Perform linear regression on x vs -ln(CCDF)
    const regressionData = plotData.map((point) => ({
      x: point.x,
      y: point.y,
    }));

    const regression = this.statisticalTests.linearRegression(regressionData);

    return {
      plotData,
      regression,
      estimatedLambda: regression.slope,
      rSquared: regression.rSquared,
    };
  }

  /**
   * Validates if data is suitable for exponential analysis
   * @param {Array} data - Data to validate
   * @returns {Object} Validation result with success flag and message
   */
  validateData(data) {
    if (!Array.isArray(data)) {
      return { valid: false, message: "Data must be an array" };
    }

    if (data.length < 3) {
      return {
        valid: false,
        message: "Need at least 3 data points for exponential analysis",
      };
    }

    // Check for positive values (required for exponential distribution)
    const positiveValues = data.filter((item) => item.value > 0);
    if (positiveValues.length < 3) {
      return {
        valid: false,
        message:
          "Need at least 3 data points with positive values for exponential analysis",
      };
    }

    if (positiveValues.length < data.length) {
      return {
        valid: true,
        message: `Warning: ${
          data.length - positiveValues.length
        } data points with non-positive values will be excluded from exponential analysis.`,
        warning: true,
      };
    }

    return { valid: true, message: "Data is suitable for exponential analysis" };
  }

  /**
   * Gets theoretical CCDF values for given x values and parameters
   * @param {Array<number>} xValues - X values to calculate CCDF for
   * @param {Object} parameters - Exponential parameters {lambda}
   * @returns {Array<number>} Theoretical CCDF values
   */
  getTheoreticalCCDF(xValues, parameters) {
    const { lambda } = parameters;
    return xValues.map((x) => {
      if (x < 0) return 1; // CCDF = 1 for x < 0
      if (lambda === 0) return 1; // Handle edge case
      return Math.exp(-lambda * x);
    });
  }

  /**
   * Gets plot data for exponential visualization
   * @param {Array} data - Data points
   * @param {Object} parameters - Exponential parameters
   * @returns {Object} Plot data for different visualization types
   */
  getPlotData(data, parameters) {
    return {
      linear: {
        empirical: data.map((d) => ({ x: d.value, y: d.ccdf })),
        theoretical: data.map((d) => ({
          x: d.value,
          y: this.getTheoreticalCCDF([d.value], parameters)[0],
        })),
      },
      semiLog: {
        empirical: data.map((d) => ({ x: d.value, y: Math.log(d.ccdf) })),
        theoretical: data.map((d) => ({
          x: d.value,
          y: Math.log(this.getTheoreticalCCDF([d.value], parameters)[0]),
        })),
      },
    };
  }

  /**
   * Gets the distribution-specific plot for exponential (exponential probability plot)
   * @param {Array} data - Data points
   * @returns {Object} Exponential probability plot data
   */
  getDistributionSpecificPlot(data) {
    const validData = data.filter((d) => d.value > 0 && d.ccdf > 0);
    const exponentialProbPlot = this.generateExponentialProbabilityPlot(validData);

    return {
      type: "exponentialProbability",
      title: "Exponential Probability Plot",
      xLabel: "Value",
      yLabel: "-ln(CCDF)",
      data: exponentialProbPlot.plotData,
      regression: exponentialProbPlot.regression,
      description:
        "Exponential distributions appear as straight lines in plots of x vs -ln(CCDF)",
    };
  }

  /**
   * Calculates goodness of fit metrics for exponential distribution
   * @param {Array} empiricalData - Empirical data points
   * @param {Array} theoreticalData - Theoretical data points
   * @param {Object} additionalInfo - Additional information including parameters
   * @returns {Object} Goodness of fit metrics
   */
  calculateGoodnessOfFit(empiricalData, theoreticalData, additionalInfo = {}) {
    // Calculate Kolmogorov-Smirnov test
    const empiricalCCDF = empiricalData.map((d) => d.ccdf);
    const theoreticalCCDF = theoreticalData.map((d) => d.theoreticalCCDF);
    const ksTest = this.statisticalTests.kolmogorovSmirnovTest(
      empiricalCCDF,
      theoreticalCCDF
    );

    // Calculate exponential probability plot R²
    const exponentialProbPlot = this.generateExponentialProbabilityPlot(empiricalData);
    const exponentialProbR2 = exponentialProbPlot.rSquared;

    // Calculate log-likelihood for AIC/BIC
    const logLikelihood = this.calculateLogLikelihood(
      empiricalData,
      additionalInfo.parameters
    );
    const numParameters = 1; // Exponential has 1 parameter: λ
    const sampleSize = empiricalData.length;

    const aic = this.statisticalTests.calculateAIC(
      logLikelihood,
      numParameters
    );
    const bic = this.statisticalTests.calculateBIC(
      logLikelihood,
      numParameters,
      sampleSize
    );

    // Use exponential probability plot R² as primary goodness-of-fit measure
    const confidenceLevel = this.getConfidenceLevel(exponentialProbR2);
    const isExponential = exponentialProbR2 > 0.9;

    return {
      rSquared: exponentialProbR2,
      exponentialProbabilityR2: exponentialProbR2,
      adjustedRSquared:
        1 -
        ((1 - exponentialProbR2) * (sampleSize - 1)) /
          (sampleSize - numParameters - 1),
      kolmogorovSmirnov: ksTest,
      logLikelihood,
      aic,
      bic,
      confidenceLevel,
      isExponential,
      confidenceScore: exponentialProbR2,
    };
  }

  /**
   * Calculates log-likelihood for exponential distribution
   * @param {Array} data - Data points
   * @param {Object} parameters - Exponential parameters {lambda}
   * @returns {number} Log-likelihood value
   */
  calculateLogLikelihood(data, parameters) {
    const { lambda } = parameters;
    let logLikelihood = 0;

    for (const item of data) {
      if (item.value > 0) {
        // Exponential PDF: λ * e^(-λx)
        const logPdf = Math.log(lambda) - lambda * item.value;
        logLikelihood += logPdf * item.frequency;
      }
    }

    return logLikelihood;
  }

  /**
   * Determines confidence level based on R² value
   * @param {number} rSquared - R² value
   * @returns {string} Confidence level description
   */
  getConfidenceLevel(rSquared) {
    if (rSquared > 0.98) return "Very High";
    if (rSquared > 0.95) return "High";
    if (rSquared > 0.9) return "Moderate";
    if (rSquared > 0.8) return "Low";
    return "Very Low";
  }

  /**
   * Gets minimum number of data points required for reliable analysis
   * @returns {number} Minimum required data points
   */
  getMinimumDataPoints() {
    return 3; // Need at least 3 points for parameter estimation
  }

  /**
   * Gets recommended minimum data range for reliable analysis
   * @returns {number} Recommended minimum range ratio
   */
  getRecommendedMinimumRange() {
    return 3; // Exponential can work with smaller ranges
  }
}

// Export for testing (if in Node.js environment)
if (typeof module !== "undefined" && module.exports) {
  module.exports = ExponentialAnalyzer;
}
