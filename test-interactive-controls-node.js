/**
 * Node.js Test for Interactive Plot Controls (Phase 3.3)
 * 
 * Tests the interactive plot control functions without browser dependencies
 */

// Import the analysis modules
const AnalysisEngine = require("./analysisEngine.js");
const PowerLawAnalyzer = require("./powerLawAnalyzer.js");
const LogNormalAnalyzer = require("./logNormalAnalyzer.js");
const ExponentialAnalyzer = require("./exponentialAnalyzer.js");
const { calculateCCDF } = require("./dataProcessor.js");

// Global state for interactive controls
let visibleDistributions = ["powerLaw", "logNormal", "exponential"];
let currentPlotType = "logarithmic";

function toggleDistributionVisibility(distributionType, isVisible) {
  if (isVisible && !visibleDistributions.includes(distributionType)) {
    visibleDistributions.push(distributionType);
  } else if (!isVisible && visibleDistributions.includes(distributionType)) {
    visibleDistributions = visibleDistributions.filter(d => d !== distributionType);
  }
}

function setPlotType(plotType) {
  if (["linear", "logarithmic"].includes(plotType)) {
    currentPlotType = plotType;
  } else {
    throw new Error(`Invalid plot type: ${plotType}. Must be 'linear' or 'logarithmic'`);
  }
}

function enableZoomControls(chartInstance) {
  // In a real implementation, this would add zoom/pan functionality
  // For testing, we'll just return a configuration object
  return {
    zoom: {
      enabled: true,
      mode: 'xy'
    },
    pan: {
      enabled: true,
      mode: 'xy'
    }
  };
}

function getVisibleDistributions() {
  return [...visibleDistributions]; // Return a copy
}

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

  // Add theoretical curves for visible distributions only
  const colors = {
    powerLaw: "#3b82f6", // Blue
    logNormal: "#10b981", // Green
    exponential: "#ef4444", // Red
  };

  analysisResults.results.forEach((result) => {
    // Only add if distribution is visible
    if (!visibleDistributions.includes(result.distributionType)) {
      return;
    }

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

function createEnhancedCCDFChartConfig(analysisResults) {
  return {
    type: "scatter",
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: currentPlotType,
          title: {
            display: true,
            text: "Value",
          },
        },
        y: {
          type: currentPlotType,
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
function testInteractiveControlFunctions() {
  console.log("Testing Interactive Plot Control Functions (Phase 3.3)");
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

  // Test 1: toggleDistributionVisibility function
  console.log("\nTest 1: toggleDistributionVisibility function");
  try {
    // Initially all distributions should be visible
    const initialPlotData = createEnhancedCCDFPlot(results);
    console.log(`✓ Initial plot has ${initialPlotData.datasets.length} datasets`);
    
    if (initialPlotData.datasets.length === 4) {
      console.log("✓ All distributions initially visible (empirical + 3 theoretical)");
    } else {
      console.log(`✗ Expected 4 datasets, got ${initialPlotData.datasets.length}`);
    }

    // Toggle off power law
    toggleDistributionVisibility("powerLaw", false);
    const plotDataWithoutPowerLaw = createEnhancedCCDFPlot(results);
    
    if (plotDataWithoutPowerLaw.datasets.length === 3) {
      console.log("✓ Power law successfully hidden");
    } else {
      console.log(`✗ Expected 3 datasets after hiding power law, got ${plotDataWithoutPowerLaw.datasets.length}`);
    }

    // Check that power law dataset is not present
    const powerLawDataset = plotDataWithoutPowerLaw.datasets.find(d => 
      d.label.includes("Power Law")
    );
    if (!powerLawDataset) {
      console.log("✓ Power law dataset correctly removed from plot");
    } else {
      console.log("✗ Power law dataset still present in plot");
    }

    // Toggle power law back on
    toggleDistributionVisibility("powerLaw", true);
    const plotDataWithPowerLaw = createEnhancedCCDFPlot(results);
    
    if (plotDataWithPowerLaw.datasets.length === 4) {
      console.log("✓ Power law successfully restored");
    } else {
      console.log(`✗ Expected 4 datasets after restoring power law, got ${plotDataWithPowerLaw.datasets.length}`);
    }

  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }

  // Test 2: setPlotType function
  console.log("\nTest 2: setPlotType function");
  try {
    // Test linear scale
    setPlotType("linear");
    const linearConfig = createEnhancedCCDFChartConfig(results);
    
    if (linearConfig.options.scales.x.type === "linear" && 
        linearConfig.options.scales.y.type === "linear") {
      console.log("✓ Linear plot type correctly set");
    } else {
      console.log("✗ Linear plot type not correctly set");
    }

    // Test logarithmic scale
    setPlotType("logarithmic");
    const logConfig = createEnhancedCCDFChartConfig(results);
    
    if (logConfig.options.scales.x.type === "logarithmic" && 
        logConfig.options.scales.y.type === "logarithmic") {
      console.log("✓ Logarithmic plot type correctly set");
    } else {
      console.log("✗ Logarithmic plot type not correctly set");
    }

    // Test invalid plot type
    try {
      setPlotType("invalid");
      console.log("✗ Should have thrown error for invalid plot type");
    } catch (error) {
      console.log("✓ Correctly throws error for invalid plot type");
    }

  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }

  // Test 3: getVisibleDistributions function
  console.log("\nTest 3: getVisibleDistributions function");
  try {
    // Reset to all visible
    visibleDistributions = ["powerLaw", "logNormal", "exponential"];
    
    const allVisible = getVisibleDistributions();
    if (JSON.stringify(allVisible.sort()) === JSON.stringify(["powerLaw", "logNormal", "exponential"].sort())) {
      console.log("✓ All distributions initially visible");
    } else {
      console.log(`✗ Expected all distributions visible, got: ${allVisible.join(", ")}`);
    }

    // Toggle off log normal
    toggleDistributionVisibility("logNormal", false);
    const visibleAfterToggle = getVisibleDistributions();
    if (JSON.stringify(visibleAfterToggle.sort()) === JSON.stringify(["powerLaw", "exponential"].sort())) {
      console.log("✓ Log normal correctly hidden from visible list");
    } else {
      console.log(`✗ Expected powerLaw and exponential, got: ${visibleAfterToggle.join(", ")}`);
    }

    // Toggle log normal back on
    toggleDistributionVisibility("logNormal", true);
    const visibleAfterRestore = getVisibleDistributions();
    if (JSON.stringify(visibleAfterRestore.sort()) === JSON.stringify(["powerLaw", "logNormal", "exponential"].sort())) {
      console.log("✓ Log normal correctly restored to visible list");
    } else {
      console.log(`✗ Expected all distributions visible, got: ${visibleAfterRestore.join(", ")}`);
    }

  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }

  // Test 4: enableZoomControls function
  console.log("\nTest 4: enableZoomControls function");
  try {
    const mockChartInstance = { id: "test-chart" };
    const zoomConfig = enableZoomControls(mockChartInstance);
    
    if (zoomConfig.zoom && zoomConfig.zoom.enabled && zoomConfig.pan && zoomConfig.pan.enabled) {
      console.log("✓ Zoom controls configuration created successfully");
    } else {
      console.log("✗ Zoom controls configuration not properly created");
    }

  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Interactive Plot Control Tests Complete");
}

// Run the tests
if (require.main === module) {
  testInteractiveControlFunctions();
}

module.exports = {
  toggleDistributionVisibility,
  setPlotType,
  enableZoomControls,
  getVisibleDistributions,
  createEnhancedCCDFPlot,
  createEnhancedCCDFChartConfig
};
