// Log-Normal Distribution Analyzer - Dedicated analyzer for log-normal distributions

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
 * Log-Normal Distribution Analyzer Class
 * Implements the DistributionAnalyzer interface for log-normal distributions
 *
 * Log-normal distribution: If X ~ LogNormal(μ, σ), then ln(X) ~ Normal(μ, σ)
 * CCDF: P(X > x) = 1 - Φ((ln(x) - μ)/σ)
 */
class LogNormalAnalyzer extends DistributionAnalyzer {
  constructor() {
    super();
    this.name = "logNormal";
    this.displayName = "Log-Normal";
    this.description = "ln(X) ~ Normal(μ, σ)";
    this.parameterNames = ["mu", "sigma"];

    // Store references to utility functions
    if (typeof module !== "undefined") {
      // Node.js environment - require modules directly
      this.mathUtils = require("./mathUtils.js");
      this.statisticalTests = require("./statisticalTests.js");
    } else {
      // Browser environment - functions should be available globally
      this.mathUtils = {
        mean: mean,
        standardDeviation: standardDeviation,
        normalCDF: normalCDF,
        normalInverseCDF: normalInverseCDF,
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
   * Analyzes data for log-normal distribution
   * @param {Array} dataWithCCDF - Data points with CCDF values
   * @returns {Object} Analysis results with parameters, goodness of fit, and theoretical values
   */
  analyze(dataWithCCDF) {
    if (!Array.isArray(dataWithCCDF) || dataWithCCDF.length === 0) {
      throw new Error("Data must be a non-empty array");
    }

    // Add natural log transforms for log-normal analysis
    const dataWithLn = this.addLnTransforms(dataWithCCDF);

    // Filter out points with invalid log values
    const validLnData = dataWithLn.filter(
      (item) => item.lnValue !== null && !isNaN(item.lnValue)
    );

    if (validLnData.length < 3) {
      throw new Error(
        "Not enough valid data points after log transformation. Need at least 3 points with positive values."
      );
    }

    // Estimate log-normal parameters using method of moments on ln(X)
    const lnValues = validLnData.map((item) => item.lnValue);
    const mu = this.mathUtils.mean(lnValues);
    const sigma = this.mathUtils.standardDeviation(lnValues, true); // Sample standard deviation

    const parameters = { mu, sigma };

    // Calculate theoretical CCDF values for log-normal
    const theoreticalValues = validLnData.map((item) => ({
      ...item,
      theoreticalCCDF: this.getTheoreticalCCDF([item.value], parameters)[0],
    }));

    // Calculate goodness of fit metrics
    const goodnessOfFit = this.calculateGoodnessOfFit(
      validLnData,
      theoreticalValues,
      { parameters }
    );

    // Generate normal probability plot data
    const normalProbabilityPlot =
      this.generateNormalProbabilityPlot(validLnData);

    return {
      distributionName: this.name,
      parameters,
      goodnessOfFit,
      theoreticalValues,
      normalProbabilityPlot,
      validDataPoints: validLnData.length,
      originalDataPoints: dataWithCCDF.length,
    };
  }

  /**
   * Adds natural logarithm transforms to data points
   * @param {Array} data - Data points
   * @returns {Array} Data with lnValue added
   */
  addLnTransforms(data) {
    return data.map((item) => ({
      ...item,
      lnValue: item.value > 0 ? Math.log(item.value) : null,
    }));
  }

  /**
   * Generates normal probability plot data for log-normal distribution
   * @param {Array} data - Data points with ln transforms
   * @returns {Object} Normal probability plot data
   */
  generateNormalProbabilityPlot(data) {
    // Sort data by ln(value)
    const sortedData = [...data].sort((a, b) => a.lnValue - b.lnValue);

    // Calculate empirical quantiles (using plotting positions)
    const n = sortedData.length;
    const plotData = sortedData.map((item, i) => {
      // Use Blom plotting position: (i + 1 - 3/8) / (n + 1/4)
      const empiricalQuantile = (i + 1 - 3 / 8) / (n + 1 / 4);
      const theoreticalQuantile =
        this.mathUtils.normalInverseCDF(empiricalQuantile);

      return {
        lnValue: item.lnValue,
        theoreticalQuantile,
        empiricalQuantile,
        originalValue: item.value,
        ccdf: item.ccdf,
      };
    });

    // Perform linear regression on theoretical vs empirical quantiles
    const regressionData = plotData.map((point) => ({
      x: point.theoreticalQuantile,
      y: point.lnValue,
    }));

    const regression = this.statisticalTests.linearRegression(regressionData);

    return {
      plotData,
      regression,
      estimatedMu: regression.intercept,
      estimatedSigma: regression.slope,
      rSquared: regression.rSquared,
    };
  }

  /**
   * Validates if data is suitable for log-normal analysis
   * @param {Array} data - Data to validate
   * @returns {Object} Validation result with success flag and message
   */
  validateData(data) {
    if (!Array.isArray(data)) {
      return { valid: false, message: "Data must be an array" };
    }

    if (data.length < 5) {
      return {
        valid: false,
        message: "Need at least 5 data points for log-normal analysis",
      };
    }

    // Check for positive values (required for log transformation)
    const positiveValues = data.filter((item) => item.value > 0);
    if (positiveValues.length < 3) {
      return {
        valid: false,
        message:
          "Need at least 3 data points with positive values for log-normal analysis",
      };
    }

    if (positiveValues.length < data.length) {
      return {
        valid: true,
        message: `Warning: ${
          data.length - positiveValues.length
        } data points with non-positive values will be excluded from log-normal analysis.`,
        warning: true,
      };
    }

    return { valid: true, message: "Data is suitable for log-normal analysis" };
  }

  /**
   * Gets theoretical CCDF values for given x values and parameters
   * @param {Array<number>} xValues - X values to calculate CCDF for
   * @param {Object} parameters - Log-normal parameters {mu, sigma}
   * @returns {Array<number>} Theoretical CCDF values
   */
  getTheoreticalCCDF(xValues, parameters) {
    const { mu, sigma } = parameters;
    return xValues.map((x) => {
      if (x <= 0) return 1; // CCDF = 1 for x <= 0
      const z = (Math.log(x) - mu) / sigma;
      return 1 - this.mathUtils.normalCDF(z);
    });
  }

  /**
   * Gets plot data for log-normal visualization
   * @param {Array} data - Data points
   * @param {Object} parameters - Log-normal parameters
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
        empirical: data.map((d) => ({ x: Math.log10(d.value), y: d.ccdf })),
        theoretical: data.map((d) => ({
          x: Math.log10(d.value),
          y: this.getTheoreticalCCDF([d.value], parameters)[0],
        })),
      },
    };
  }

  /**
   * Gets the distribution-specific plot for log-normal (normal probability plot)
   * @param {Array} data - Data points with ln transforms
   * @returns {Object} Normal probability plot data
   */
  getDistributionSpecificPlot(data) {
    const dataWithLn = this.addLnTransforms(data);
    const validData = dataWithLn.filter((d) => d.lnValue !== null);
    const normalProbPlot = this.generateNormalProbabilityPlot(validData);

    return {
      type: "normalProbability",
      title: "Normal Probability Plot (Log-Normal Test)",
      xLabel: "Theoretical Quantiles",
      yLabel: "ln(Value)",
      data: normalProbPlot.plotData,
      regression: normalProbPlot.regression,
      description:
        "Log-normal distributions appear as straight lines in normal probability plots of ln(x)",
    };
  }

  /**
   * Calculates goodness of fit metrics for log-normal distribution
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

    // Calculate normal probability plot R²
    const normalProbPlot = this.generateNormalProbabilityPlot(empiricalData);
    const normalProbR2 = normalProbPlot.rSquared;

    // Calculate log-likelihood for AIC/BIC
    const logLikelihood = this.calculateLogLikelihood(
      empiricalData,
      additionalInfo.parameters
    );
    const numParameters = 2; // Log-normal has 2 parameters: μ and σ
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

    // Use normal probability plot R² as primary goodness-of-fit measure
    const confidenceLevel = this.getConfidenceLevel(normalProbR2);
    const isLogNormal = normalProbR2 > 0.9;

    return {
      rSquared: normalProbR2,
      normalProbabilityR2: normalProbR2,
      adjustedRSquared:
        1 -
        ((1 - normalProbR2) * (sampleSize - 1)) /
          (sampleSize - numParameters - 1),
      kolmogorovSmirnov: ksTest,
      logLikelihood,
      aic,
      bic,
      confidenceLevel,
      isLogNormal,
      confidenceScore: normalProbR2,
    };
  }

  /**
   * Calculates log-likelihood for log-normal distribution
   * @param {Array} data - Data points
   * @param {Object} parameters - Log-normal parameters {mu, sigma}
   * @returns {number} Log-likelihood value
   */
  calculateLogLikelihood(data, parameters) {
    const { mu, sigma } = parameters;
    let logLikelihood = 0;

    for (const item of data) {
      if (item.value > 0) {
        // Log-normal PDF: (1/(x*σ*√(2π))) * exp(-((ln(x)-μ)²)/(2σ²))
        const lnX = Math.log(item.value);
        const z = (lnX - mu) / sigma;
        const logPdf =
          -Math.log(item.value) -
          Math.log(sigma) -
          0.5 * Math.log(2 * Math.PI) -
          0.5 * z * z;
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
    return 5; // Need at least 5 points for parameter estimation
  }

  /**
   * Gets recommended minimum data range for reliable analysis
   * @returns {number} Recommended minimum range ratio
   */
  getRecommendedMinimumRange() {
    return 5; // Log-normal can work with smaller ranges than power law
  }
}

// Export for testing (if in Node.js environment)
if (typeof module !== "undefined" && module.exports) {
  module.exports = LogNormalAnalyzer;
}
