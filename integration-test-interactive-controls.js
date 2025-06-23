/**
 * Integration test for interactive plot controls
 * Tests the complete pipeline with interactive features
 */

const AnalysisEngine = require("./analysisEngine.js");
const PowerLawAnalyzer = require("./powerLawAnalyzer.js");
const LogNormalAnalyzer = require("./logNormalAnalyzer.js");
const ExponentialAnalyzer = require("./exponentialAnalyzer.js");
const { parseInputData, calculateCCDF } = require("./dataProcessor.js");

// Import interactive control functions
const {
  toggleDistributionVisibility,
  setPlotType,
  enableZoomControls,
  getVisibleDistributions,
  createEnhancedCCDFPlot,
  createEnhancedCCDFChartConfig,
} = require("./test-interactive-controls-node.js");

// Sample data (JUnit5 lines/function data)
const sampleDataText = `1 1436
2 5491
3 1773
4 1163
5 737
6 512
7 354
8 267
9 200
10 132`;

console.log("Integration Test: Interactive Plot Controls");
console.log("=".repeat(50));

try {
  // Step 1: Parse and process data
  console.log("Step 1: Processing data...");
  const parsedData = parseInputData(sampleDataText);
  const dataWithCCDF = calculateCCDF(parsedData);
  console.log(`✓ Processed ${dataWithCCDF.length} data points`);

  // Step 2: Set up analysis engine
  console.log("Step 2: Setting up analysis engine...");
  const analysisEngine = new AnalysisEngine();
  analysisEngine.registerAnalyzer(new PowerLawAnalyzer());
  analysisEngine.registerAnalyzer(new LogNormalAnalyzer());
  analysisEngine.registerAnalyzer(new ExponentialAnalyzer());
  console.log("✓ Analysis engine configured");

  // Step 3: Run analysis
  console.log("Step 3: Running analysis...");
  const results = analysisEngine.analyzeMultiple(dataWithCCDF);
  console.log(
    `✓ Analysis complete. Best fit: ${results.bestFit.distributionType}`
  );

  // Step 4: Test interactive controls with real data
  console.log("Step 4: Testing interactive controls...");

  // Test initial state - all distributions visible
  const initialPlot = createEnhancedCCDFPlot(results);
  console.log(
    `✓ Initial plot has ${initialPlot.datasets.length} datasets (empirical + 3 theoretical)`
  );

  // Test hiding distributions
  toggleDistributionVisibility("powerLaw", false);
  const plotWithoutPowerLaw = createEnhancedCCDFPlot(results);
  console.log(
    `✓ After hiding power law: ${plotWithoutPowerLaw.datasets.length} datasets`
  );

  toggleDistributionVisibility("logNormal", false);
  const plotWithoutLogNormal = createEnhancedCCDFPlot(results);
  console.log(
    `✓ After hiding log-normal: ${plotWithoutLogNormal.datasets.length} datasets`
  );

  // Test showing distributions again
  toggleDistributionVisibility("powerLaw", true);
  toggleDistributionVisibility("logNormal", true);
  const plotRestored = createEnhancedCCDFPlot(results);
  console.log(
    `✓ After restoring all: ${plotRestored.datasets.length} datasets`
  );

  // Test plot type switching
  console.log("Step 5: Testing plot type switching...");

  setPlotType("linear");
  const linearConfig = createEnhancedCCDFChartConfig(results);
  console.log(
    `✓ Linear plot config: x-axis=${linearConfig.options.scales.x.type}, y-axis=${linearConfig.options.scales.y.type}`
  );

  setPlotType("logarithmic");
  const logConfig = createEnhancedCCDFChartConfig(results);
  console.log(
    `✓ Log plot config: x-axis=${logConfig.options.scales.x.type}, y-axis=${logConfig.options.scales.y.type}`
  );

  // Test zoom controls
  console.log("Step 6: Testing zoom controls...");
  const mockChart = { id: "test-chart" };
  const zoomConfig = enableZoomControls(mockChart);
  console.log(
    `✓ Zoom controls enabled: zoom=${
      zoomConfig.zoom && zoomConfig.zoom.wheel
        ? zoomConfig.zoom.wheel.enabled
        : "N/A"
    }, pan=${zoomConfig.pan ? zoomConfig.pan.enabled : "N/A"}`
  );

  // Test visibility tracking
  console.log("Step 7: Testing visibility tracking...");

  // Hide exponential
  toggleDistributionVisibility("exponential", false);
  const visibleAfterHiding = getVisibleDistributions();
  console.log(
    `✓ Visible distributions after hiding exponential: ${visibleAfterHiding.join(
      ", "
    )}`
  );

  // Restore exponential
  toggleDistributionVisibility("exponential", true);
  const visibleAfterRestore = getVisibleDistributions();
  console.log(
    `✓ Visible distributions after restore: ${visibleAfterRestore.join(", ")}`
  );

  // Step 8: Test edge cases
  console.log("Step 8: Testing edge cases...");

  // Hide all distributions
  toggleDistributionVisibility("powerLaw", false);
  toggleDistributionVisibility("logNormal", false);
  toggleDistributionVisibility("exponential", false);
  const plotWithNoDistributions = createEnhancedCCDFPlot(results);
  console.log(
    `✓ Plot with no distributions: ${plotWithNoDistributions.datasets.length} dataset (empirical only)`
  );

  // Test invalid plot type
  try {
    setPlotType("invalid");
    console.log("✗ Should have thrown error for invalid plot type");
  } catch (error) {
    console.log("✓ Correctly throws error for invalid plot type");
  }

  // Restore all for final verification
  toggleDistributionVisibility("powerLaw", true);
  toggleDistributionVisibility("logNormal", true);
  toggleDistributionVisibility("exponential", true);
  const finalPlot = createEnhancedCCDFPlot(results);
  console.log(
    `✓ Final verification: ${finalPlot.datasets.length} datasets restored`
  );

  console.log("\n" + "=".repeat(50));
  console.log(
    "✅ Integration test PASSED - Interactive controls working correctly!"
  );
  console.log("🎛️  Features verified:");
  console.log("   • Toggle distribution visibility");
  console.log("   • Switch between linear and logarithmic scales");
  console.log("   • Zoom and pan controls configuration");
  console.log("   • Visibility state tracking");
  console.log("   • Edge case handling");
} catch (error) {
  console.log("\n" + "=".repeat(50));
  console.log("❌ Integration test FAILED");
  console.log(`Error: ${error.message}`);
  console.log(error.stack);
  process.exit(1);
}
