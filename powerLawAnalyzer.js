// Power Law Distribution Analyzer - Dedicated analyzer for power law distributions

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
  global.addLogTransforms = mathUtils.addLogTransforms;
  global.filterValidLogData = mathUtils.filterValidLogData;
  global.linearRegression = statisticalTests.linearRegression;
  global.kolmogorovSmirnovTest = statisticalTests.kolmogorovSmirnovTest;
  global.calculateAIC = statisticalTests.calculateAIC;
  global.calculateBIC = statisticalTests.calculateBIC;
}

/**
 * Power Law Distribution Analyzer Class
 * Implements the DistributionAnalyzer interface for power law distributions
 */
class PowerLawAnalyzer extends DistributionAnalyzer {
  constructor() {
    super();
    this.name = "powerLaw";
    this.displayName = "Power Law";
    this.description = "P(X > x) ∝ x^(-α)";
    this.parameterNames = ["exponent", "scalingConstant"];
  }

  /**
   * Analyzes data for power law distribution
   * @param {Array} dataWithCCDF - Data points with CCDF values
   * @returns {Object} Analysis results with parameters, goodness of fit, and theoretical values
   */
  analyze(dataWithCCDF) {
    if (!Array.isArray(dataWithCCDF) || dataWithCCDF.length === 0) {
      throw new Error("Data must be a non-empty array");
    }

    // Add log transforms for power law analysis
    const dataWithLog = addLogTransforms(dataWithCCDF);

    // Filter out points with zero CCDF (can't take log of 0)
    const logLogData = filterValidLogData(dataWithLog);

    if (logLogData.length < 3) {
      throw new Error(
        "Not enough valid data points after log transformation. Need at least 3 points with non-zero CCDF."
      );
    }

    // Prepare data for linear regression (log-log plot should be linear for power law)
    const regressionData = logLogData.map((item) => ({
      x: item.logValue,
      y: item.logCCDF,
    }));

    // Perform linear regression on log-log data
    const regression = linearRegression(regressionData);

    // Extract power law parameters
    const slope = regression.slope;
    const intercept = regression.intercept;
    const powerLawExponent = -slope; // α = -slope in log-log plot
    const scalingConstant = Math.pow(10, intercept);

    // Calculate theoretical CCDF values for power law
    const theoreticalValues = logLogData.map((item) => ({
      ...item,
      theoreticalCCDF: Math.pow(10, intercept + slope * item.logValue),
      theoreticalLogCCDF: intercept + slope * item.logValue,
    }));

    // Calculate goodness of fit metrics
    const goodnessOfFit = this.calculateGoodnessOfFit(
      logLogData,
      theoreticalValues,
      regression
    );

    // Generate regression line for plotting
    const minLogX = Math.min(...logLogData.map((d) => d.logValue));
    const maxLogX = Math.max(...logLogData.map((d) => d.logValue));

    const regressionLine = [
      { logValue: minLogX, logCCDF: intercept + slope * minLogX },
      { logValue: maxLogX, logCCDF: intercept + slope * maxLogX },
    ];

    return {
      distributionName: this.name,
      parameters: {
        exponent: powerLawExponent,
        scalingConstant: scalingConstant,
        slope: slope,
        intercept: intercept,
      },
      goodnessOfFit,
      theoreticalValues,
      regressionLine,
      validDataPoints: logLogData.length,
      originalDataPoints: dataWithCCDF.length,
    };
  }

  /**
   * Calculates goodness of fit metrics for power law
   * @param {Array} empiricalData - Empirical data points
   * @param {Array} theoreticalData - Theoretical data points
   * @param {Object} regression - Regression results
   * @returns {Object} Goodness of fit metrics
   */
  calculateGoodnessOfFit(empiricalData, theoreticalData, regression) {
    const rSquared = regression.rSquared;

    // Calculate Kolmogorov-Smirnov test
    const empiricalCCDF = empiricalData.map((d) => d.ccdf);
    const theoreticalCCDF = theoreticalData.map((d) => d.theoreticalCCDF);
    const ksTest = kolmogorovSmirnovTest(empiricalCCDF, theoreticalCCDF);

    // Calculate log-likelihood for AIC/BIC
    const logLikelihood = this.calculateLogLikelihood(
      empiricalData,
      theoreticalData
    );
    const numParameters = 2; // Power law has 2 parameters: exponent and scaling constant
    const sampleSize = empiricalData.length;

    const aic = calculateAIC(logLikelihood, numParameters);
    const bic = calculateBIC(logLikelihood, numParameters, sampleSize);

    // Determine confidence level based on R²
    const confidenceLevel = this.getConfidenceLevel(rSquared);
    const isPowerLaw = rSquared > 0.9;

    return {
      rSquared,
      adjustedRSquared:
        1 -
        ((1 - rSquared) * (sampleSize - 1)) / (sampleSize - numParameters - 1),
      standardError: regression.standardError,
      kolmogorovSmirnov: ksTest,
      logLikelihood,
      aic,
      bic,
      confidenceLevel,
      isPowerLaw,
      confidenceScore: rSquared,
    };
  }

  /**
   * Calculates log-likelihood for power law distribution
   * @param {Array} empiricalData - Empirical data points
   * @param {Array} theoreticalData - Theoretical data points
   * @returns {number} Log-likelihood value
   */
  calculateLogLikelihood(empiricalData, theoreticalData) {
    // Simplified log-likelihood calculation
    // In practice, this would use the actual power law PDF
    let logLikelihood = 0;

    for (let i = 0; i < empiricalData.length; i++) {
      const observed = empiricalData[i].ccdf;
      const expected = theoreticalData[i].theoreticalCCDF;

      // Avoid log(0) by using small epsilon
      const epsilon = 1e-10;
      const logProb = Math.log(Math.max(expected, epsilon));
      logLikelihood += logProb;
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
   * Gets theoretical CCDF values for given x values and parameters
   * @param {Array<number>} xValues - X values to calculate CCDF for
   * @param {Object} parameters - Power law parameters
   * @returns {Array<number>} Theoretical CCDF values
   */
  getTheoreticalCCDF(xValues, parameters) {
    const { scalingConstant, exponent } = parameters;
    return xValues.map((x) => scalingConstant * Math.pow(x, -exponent));
  }

  /**
   * Gets plot data for power law visualization
   * @param {Array} data - Data points
   * @param {Object} parameters - Power law parameters
   * @returns {Object} Plot data for different visualization types
   */
  getPlotData(data, parameters) {
    return {
      logLog: {
        empirical: data.map((d) => ({ x: d.logValue, y: d.logCCDF })),
        theoretical: data.map((d) => ({
          x: d.logValue,
          y: Math.log10(this.getTheoreticalCCDF([d.value], parameters)[0]),
        })),
      },
      linear: {
        empirical: data.map((d) => ({ x: d.value, y: d.ccdf })),
        theoretical: data.map((d) => ({
          x: d.value,
          y: this.getTheoreticalCCDF([d.value], parameters)[0],
        })),
      },
    };
  }

  /**
   * Gets the distribution-specific plot for power law (log-log plot)
   * @param {Array} data - Data points with log transforms
   * @returns {Object} Log-log plot data
   */
  getDistributionSpecificPlot(data) {
    // Power law specific plot is the log-log plot
    const validLogData = data.filter(
      (d) => d.logValue !== null && d.logCCDF !== null
    );

    return {
      type: "logLog",
      title: "Log-Log Plot (Power Law Test)",
      xLabel: "log(Value)",
      yLabel: "log(CCDF)",
      data: validLogData.map((d) => ({
        x: d.logValue,
        y: d.logCCDF,
        originalValue: d.value,
        originalCCDF: d.ccdf,
      })),
      description:
        "Power law distributions appear as straight lines in log-log plots",
    };
  }

  /**
   * Validates if data is suitable for power law analysis
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
        message: "Need at least 5 data points for power law analysis",
      };
    }

    const withLogs = addLogTransforms(data);
    const validLogData = filterValidLogData(withLogs);

    if (validLogData.length < 3) {
      return {
        valid: false,
        message:
          "Not enough data points with positive CCDF values for log transformation",
      };
    }

    const valueRange =
      Math.max(...data.map((d) => d.value)) /
      Math.min(...data.map((d) => d.value));
    if (valueRange < 10) {
      return {
        valid: true,
        message:
          "Warning: Data spans less than one order of magnitude. Power law analysis may be unreliable.",
        warning: true,
      };
    }

    return { valid: true, message: "Data is suitable for power law analysis" };
  }
}

// Export for testing (if in Node.js environment)
if (typeof module !== "undefined" && module.exports) {
  module.exports = PowerLawAnalyzer;
}
