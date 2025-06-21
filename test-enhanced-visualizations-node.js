/**
 * Node.js Test for Enhanced Visualizations (Phase 3.2)
 *
 * Tests the enhanced visualization functions without browser dependencies
 */

// Import the analysis modules
const AnalysisEngine = require("./analysisEngine.js");
const PowerLawAnalyzer = require("./powerLawAnalyzer.js");
const LogNormalAnalyzer = require("./logNormalAnalyzer.js");
const ExponentialAnalyzer = require("./exponentialAnalyzer.js");
const { calculateCCDF } = require("./dataProcessor.js");

// Import the enhanced visualization functions from script.js
// We'll need to extract these into a separate module, but for now let's define them here

function createEnhancedCCDFPlot(analysisResults) {
  if (
    !analysisResults ||
    !analysisResults.results ||
    analysisResults.results.length === 0
  ) {
    return { datasets: [] };
  }

  const datasets = [];
  const firstResult = analysisResults.results[0];

  // Add empirical data points
  const empiricalData = firstResult.theoreticalValues.map((d) => ({
    x: d.value,
    y: d.ccdf,
  }));

  datasets.push({
    label: "Empirical Data",
    type: "scatter",
    data: empiricalData,
    backgroundColor: "rgba(75, 85, 99, 0.8)",
    pointRadius: 4,
    showLine: false,
  });

  // Add theoretical curves for all distributions
  const colors = {
    powerLaw: "#3b82f6", // Blue
    logNormal: "#10b981", // Green
    exponential: "#ef4444", // Red
  };

  analysisResults.results.forEach((result) => {
    const theoreticalData = result.theoreticalValues.map((d) => ({
      x: d.value,
      y: d.theoreticalCCDF,
    }));

    const isBestFit =
      result.distributionType === analysisResults.bestFit.distributionType;
    const rSquared = result.goodnessOfFit.rSquared;

    datasets.push({
      label: `${
        result.distributionType === "powerLaw"
          ? "Power Law"
          : result.distributionType === "logNormal"
          ? "Log-Normal"
          : "Exponential"
      } (R² = ${rSquared.toFixed(3)})`,
      type: "line",
      data: theoreticalData,
      borderColor: colors[result.distributionType] || "#6b7280",
      backgroundColor: "transparent",
      borderWidth: isBestFit ? 4 : 2,
      pointRadius: 0,
      showLine: true,
      tension: 0,
    });
  });

  return { datasets };
}

function createResidualPlot(analysisResults) {
  if (!analysisResults || !analysisResults.bestFit) {
    return { datasets: [] };
  }

  const bestFitResult = analysisResults.results.find(
    (r) => r.distributionType === analysisResults.bestFit.distributionType
  );

  if (!bestFitResult) {
    return { datasets: [] };
  }

  // Calculate residuals (empirical - theoretical)
  const residualData = bestFitResult.theoreticalValues.map((d) => ({
    x: d.value,
    y: d.ccdf - d.theoreticalCCDF,
  }));

  // Create zero reference line
  const xValues = bestFitResult.theoreticalValues.map((d) => d.value);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);

  const datasets = [
    {
      label: `Residuals (${analysisResults.bestFit.distributionType})`,
      type: "scatter",
      data: residualData,
      backgroundColor: "rgba(239, 68, 68, 0.6)",
      pointRadius: 4,
      showLine: false,
    },
    {
      label: "Zero Reference",
      type: "line",
      data: [
        { x: minX, y: 0 },
        { x: maxX, y: 0 },
      ],
      borderColor: "rgba(107, 114, 128, 0.8)",
      backgroundColor: "transparent",
      borderWidth: 1,
      pointRadius: 0,
      showLine: true,
    },
  ];

  return { datasets };
}

function createEnhancedCCDFChartConfig(analysisResults) {
  return {
    type: "scatter",
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "logarithmic",
          title: {
            display: true,
            text: "Value",
          },
        },
        y: {
          type: "logarithmic",
          title: {
            display: true,
            text: "CCDF P(X ≥ x)",
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        title: {
          display: true,
          text: "Distribution Comparison - CCDF with Theoretical Curves",
        },
      },
    },
  };
}

// Test functions
function testEnhancedVisualizationFunctions() {
  console.log("Testing Enhanced Visualization Functions (Phase 3.2)");
  console.log("=".repeat(60));

  // Create test data that follows a power law
  const testData = [];
  for (let i = 1; i <= 20; i++) {
    const value = i;
    const frequency = Math.floor(100 * Math.pow(i, -2.5)) + 1;
    testData.push({ value, frequency });
  }

  // Process test data with CCDF values
  const dataWithCCDF = calculateCCDF(testData);

  // Create analysis engine and register analyzers
  const analysisEngine = new AnalysisEngine();
  analysisEngine.registerAnalyzer(new PowerLawAnalyzer());
  analysisEngine.registerAnalyzer(new LogNormalAnalyzer());
  analysisEngine.registerAnalyzer(new ExponentialAnalyzer());

  const results = analysisEngine.analyzeMultiple(dataWithCCDF);

  // Test 1: createEnhancedCCDFPlot function exists and works
  console.log("\nTest 1: createEnhancedCCDFPlot function");
  try {
    const ccdfPlotData = createEnhancedCCDFPlot(results);

    console.log("✓ Function exists and executes");
    console.log(`✓ Returns ${ccdfPlotData.datasets.length} datasets`);

    // Should have empirical data + 3 theoretical curves = 4 datasets
    if (ccdfPlotData.datasets.length === 4) {
      console.log("✓ Correct number of datasets (4)");
    } else {
      console.log(`✗ Expected 4 datasets, got ${ccdfPlotData.datasets.length}`);
    }

    // Check empirical data
    const empiricalDataset = ccdfPlotData.datasets.find(
      (d) => d.label === "Empirical Data"
    );
    if (empiricalDataset) {
      console.log("✓ Empirical data dataset found");
      console.log(
        `✓ Empirical data has ${empiricalDataset.data.length} points`
      );
    } else {
      console.log("✗ Empirical data dataset not found");
    }

    // Check theoretical curves
    const theoreticalDatasets = ccdfPlotData.datasets.filter(
      (d) =>
        d.label.includes("Power Law") ||
        d.label.includes("Log-Normal") ||
        d.label.includes("Exponential")
    );
    console.log(
      `✓ Found ${theoreticalDatasets.length} theoretical curve datasets`
    );

    // Check best fit highlighting
    const bestFitType = results.bestFit.distributionType;
    const bestFitDataset = ccdfPlotData.datasets.find((d) =>
      d.label.toLowerCase().includes(bestFitType.toLowerCase())
    );
    if (bestFitDataset && bestFitDataset.borderWidth > 2) {
      console.log("✓ Best fit distribution has thicker border");
    } else {
      console.log("✗ Best fit distribution not properly highlighted");
    }
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }

  // Test 2: createResidualPlot function
  console.log("\nTest 2: createResidualPlot function");
  try {
    const residualPlotData = createResidualPlot(results);

    console.log("✓ Function exists and executes");
    console.log(`✓ Returns ${residualPlotData.datasets.length} datasets`);

    // Should have residuals + zero reference line = 2 datasets
    if (residualPlotData.datasets.length === 2) {
      console.log("✓ Correct number of datasets (2)");
    } else {
      console.log(
        `✗ Expected 2 datasets, got ${residualPlotData.datasets.length}`
      );
    }

    // Check residual data
    const residualDataset = residualPlotData.datasets.find((d) =>
      d.label.includes("Residuals")
    );
    if (residualDataset) {
      console.log("✓ Residual dataset found");
      console.log(`✓ Residual data has ${residualDataset.data.length} points`);
    } else {
      console.log("✗ Residual dataset not found");
    }

    // Check zero reference line
    const referenceLine = residualPlotData.datasets.find(
      (d) => d.label === "Zero Reference"
    );
    if (referenceLine && referenceLine.data.length === 2) {
      console.log("✓ Zero reference line found with 2 points");
    } else {
      console.log("✗ Zero reference line not found or incorrect");
    }
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }

  // Test 3: createEnhancedCCDFChartConfig function
  console.log("\nTest 3: createEnhancedCCDFChartConfig function");
  try {
    const chartConfig = createEnhancedCCDFChartConfig(results);

    console.log("✓ Function exists and executes");

    // Check chart type
    if (chartConfig.type === "scatter") {
      console.log("✓ Chart type is scatter");
    } else {
      console.log(`✗ Expected scatter chart, got ${chartConfig.type}`);
    }

    // Check logarithmic scales
    if (
      chartConfig.options.scales.x.type === "logarithmic" &&
      chartConfig.options.scales.y.type === "logarithmic"
    ) {
      console.log("✓ Both axes use logarithmic scale");
    } else {
      console.log("✗ Axes do not use logarithmic scale");
    }

    // Check title
    if (
      chartConfig.options.plugins.title.text.includes("Distribution Comparison")
    ) {
      console.log("✓ Chart title includes 'Distribution Comparison'");
    } else {
      console.log("✗ Chart title does not include 'Distribution Comparison'");
    }
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Enhanced Visualization Tests Complete");
}

// Run the tests
if (require.main === module) {
  testEnhancedVisualizationFunctions();
}

module.exports = {
  createEnhancedCCDFPlot,
  createResidualPlot,
  createEnhancedCCDFChartConfig,
};
