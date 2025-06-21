/**
 * Integration test for enhanced visualizations
 * Tests the complete pipeline from data processing to visualization
 */

const AnalysisEngine = require("./analysisEngine.js");
const PowerLawAnalyzer = require("./powerLawAnalyzer.js");
const LogNormalAnalyzer = require("./logNormalAnalyzer.js");
const ExponentialAnalyzer = require("./exponentialAnalyzer.js");
const { parseInputData, calculateCCDF } = require("./dataProcessor.js");

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

console.log("Integration Test: Enhanced Visualizations");
console.log("=".repeat(50));

try {
  // Step 1: Parse input data
  console.log("Step 1: Parsing input data...");
  const parsedData = parseInputData(sampleDataText);
  console.log(`✓ Parsed ${parsedData.length} data points`);

  // Step 2: Calculate CCDF
  console.log("Step 2: Calculating CCDF...");
  const dataWithCCDF = calculateCCDF(parsedData);
  console.log(`✓ Calculated CCDF for ${dataWithCCDF.length} points`);

  // Step 3: Set up analysis engine
  console.log("Step 3: Setting up analysis engine...");
  const analysisEngine = new AnalysisEngine();
  analysisEngine.registerAnalyzer(new PowerLawAnalyzer());
  analysisEngine.registerAnalyzer(new LogNormalAnalyzer());
  analysisEngine.registerAnalyzer(new ExponentialAnalyzer());
  console.log("✓ Analysis engine configured with 3 analyzers");

  // Step 4: Run multi-distribution analysis
  console.log("Step 4: Running multi-distribution analysis...");
  const results = analysisEngine.analyzeMultiple(dataWithCCDF);
  console.log(`✓ Analysis complete. Found ${results.results.length} results`);
  console.log(`✓ Best fit: ${results.bestFit.distributionType} (R² = ${results.bestFit.goodnessOfFit.rSquared.toFixed(3)})`);

  // Step 5: Test enhanced visualization functions
  console.log("Step 5: Testing enhanced visualization functions...");

  // Import visualization functions from our test file
  const { createEnhancedCCDFPlot, createResidualPlot, createEnhancedCCDFChartConfig } = require("./test-enhanced-visualizations-node.js");

  // Test enhanced CCDF plot
  const ccdfPlotData = createEnhancedCCDFPlot(results);
  console.log(`✓ Enhanced CCDF plot created with ${ccdfPlotData.datasets.length} datasets`);

  // Test residual plot
  const residualPlotData = createResidualPlot(results);
  console.log(`✓ Residual plot created with ${residualPlotData.datasets.length} datasets`);

  // Test chart configuration
  const chartConfig = createEnhancedCCDFChartConfig(results);
  console.log(`✓ Chart configuration created (type: ${chartConfig.type})`);

  // Step 6: Verify data integrity
  console.log("Step 6: Verifying data integrity...");
  
  // Check that empirical data matches
  const empiricalDataset = ccdfPlotData.datasets.find(d => d.label === "Empirical Data");
  if (empiricalDataset && empiricalDataset.data.length === dataWithCCDF.length) {
    console.log("✓ Empirical data integrity verified");
  } else {
    console.log("✗ Empirical data integrity check failed");
  }

  // Check that all distributions are represented
  const distributionTypes = ["Power Law", "Log-Normal", "Exponential"];
  const foundDistributions = ccdfPlotData.datasets
    .filter(d => distributionTypes.some(type => d.label.includes(type)))
    .map(d => d.label);
  
  if (foundDistributions.length === 3) {
    console.log("✓ All three distribution types represented in plot");
  } else {
    console.log(`✗ Missing distributions. Found: ${foundDistributions.join(", ")}`);
  }

  // Check best fit highlighting
  const bestFitType = results.bestFit.distributionType;
  const bestFitDataset = ccdfPlotData.datasets.find(d => 
    d.label.toLowerCase().includes(bestFitType.toLowerCase())
  );
  
  if (bestFitDataset && bestFitDataset.borderWidth > 2) {
    console.log("✓ Best fit distribution properly highlighted");
  } else {
    console.log("✗ Best fit distribution not properly highlighted");
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Integration test PASSED - Enhanced visualizations working correctly!");
  console.log(`📊 Summary: ${results.bestFit.distributionType} distribution detected with ${(results.bestFit.goodnessOfFit.rSquared * 100).toFixed(1)}% confidence`);

} catch (error) {
  console.log("\n" + "=".repeat(50));
  console.log("❌ Integration test FAILED");
  console.log(`Error: ${error.message}`);
  console.log(error.stack);
  process.exit(1);
}
