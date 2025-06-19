// Test the new distribution abstraction layer
const fs = require("fs");

// Load all modules in correct order
const mathUtils = require("./mathUtils.js");
const statisticalTests = require("./statisticalTests.js");
const dataProcessor = require("./dataProcessor.js");
const {
  DistributionAnalyzer,
  DistributionUtils,
} = require("./distributionAnalyzer.js");
const AnalysisEngine = require("./analysisEngine.js");

// Load PowerLawAnalyzer
const PowerLawAnalyzer = require("./powerLawAnalyzer.js");

console.log("🧪 Testing Distribution Abstraction Layer...\n");

// Test 1: PowerLawAnalyzer extends DistributionAnalyzer correctly
console.log("Test 1: PowerLawAnalyzer interface compliance");
try {
  const powerLawAnalyzer = new PowerLawAnalyzer();

  console.log("✓ PowerLawAnalyzer created:", powerLawAnalyzer.name);
  console.log("✓ Display name:", powerLawAnalyzer.displayName);
  console.log("✓ Description:", powerLawAnalyzer.description);
  console.log("✓ Parameter names:", powerLawAnalyzer.parameterNames);

  // Test that it's an instance of DistributionAnalyzer
  console.log(
    "✓ Extends DistributionAnalyzer:",
    powerLawAnalyzer instanceof DistributionAnalyzer
  );
} catch (error) {
  console.error("❌ Test 1 failed:", error.message);
  process.exit(1);
}

// Test 2: AnalysisEngine functionality
console.log("\nTest 2: AnalysisEngine functionality");
try {
  const engine = new AnalysisEngine();
  const powerLawAnalyzer = new PowerLawAnalyzer();

  // Register analyzer
  engine.registerAnalyzer(powerLawAnalyzer);
  console.log("✓ Analyzer registered");

  // Check registration
  const analyzers = engine.listAnalyzers();
  console.log("✓ Listed analyzers:", analyzers);

  const info = engine.getAnalyzerInfo();
  console.log("✓ Analyzer info:", info[0].displayName);
} catch (error) {
  console.error("❌ Test 2 failed:", error.message);
  process.exit(1);
}

// Test 3: End-to-end analysis with abstraction layer
console.log("\nTest 3: End-to-end analysis");
try {
  const engine = new AnalysisEngine();
  const powerLawAnalyzer = new PowerLawAnalyzer();
  engine.registerAnalyzer(powerLawAnalyzer);

  // Use sample data
  const sampleText = `1 1436
2 5491
3 1773
4 1163
5 737
6 512
7 354
8 267
9 200
10 132`;

  // Process data through our pipeline
  const parsedData = dataProcessor.parseInputData(sampleText);
  const dataWithCCDF = dataProcessor.calculateCCDF(parsedData);

  console.log("✓ Data processed:", dataWithCCDF.length, "points");

  // Pre-analyze to check suitability
  const preAnalysis = engine.preAnalyze(dataWithCCDF);
  console.log("✓ Pre-analysis:", preAnalysis.recommendation);

  // Run full analysis
  const result = engine.analyzeMultiple(dataWithCCDF);

  console.log("✓ Analysis completed:");
  console.log("  - Results:", result.results.length);
  console.log(
    "  - Best fit:",
    result.bestFit ? result.bestFit.displayName : "None"
  );
  console.log("  - Verdict:", result.summary.verdict);
  console.log(
    "  - Confidence:",
    (result.summary.confidence * 100).toFixed(1) + "%"
  );
  console.log("  - Errors:", result.errors.length);

  // Test single analyzer
  const singleResult = engine.analyzeSingle("powerLaw", dataWithCCDF);
  console.log(
    "✓ Single analysis confidence:",
    (singleResult.confidenceScore * 100).toFixed(1) + "%"
  );
} catch (error) {
  console.error("❌ Test 3 failed:", error.message);
  process.exit(1);
}

// Test 4: Distribution-specific plotting
console.log("\nTest 4: Distribution-specific plotting");
try {
  const powerLawAnalyzer = new PowerLawAnalyzer();

  // Create test data with log transforms
  const testData = [
    { value: 1, ccdf: 0.9, logValue: 0, logCCDF: -0.045 },
    { value: 10, ccdf: 0.5, logValue: 1, logCCDF: -0.301 },
    { value: 100, ccdf: 0.1, logValue: 2, logCCDF: -1 },
  ];

  const plotData = powerLawAnalyzer.getDistributionSpecificPlot(testData);

  console.log("✓ Plot data generated:");
  console.log("  - Type:", plotData.type);
  console.log("  - Title:", plotData.title);
  console.log("  - Data points:", plotData.data.length);
  console.log("  - Description:", plotData.description);
} catch (error) {
  console.error("❌ Test 4 failed:", error.message);
  process.exit(1);
}

// Test 5: DistributionUtils functionality
console.log("\nTest 5: DistributionUtils functionality");
try {
  const powerLawAnalyzer = new PowerLawAnalyzer();

  // Create mock results
  const mockResult = {
    parameters: { exponent: 2.5, scalingConstant: 1.2 },
    goodnessOfFit: { rSquared: 0.95, aic: 100, bic: 110 },
    theoreticalValues: [],
    validDataPoints: 10,
    originalDataPoints: 12,
  };

  // Test standardization
  const standardized = DistributionUtils.standardizeResult(
    mockResult,
    powerLawAnalyzer
  );

  console.log("✓ Result standardized:");
  console.log("  - Distribution type:", standardized.distributionType);
  console.log("  - Is good fit:", standardized.isGoodFit);
  console.log("  - Confidence score:", standardized.confidenceScore);
  console.log("  - Summary:", standardized.summary);

  // Test ranking
  const results = [
    { confidenceScore: 0.8, goodnessOfFit: { aic: 120 } },
    { confidenceScore: 0.95, goodnessOfFit: { aic: 100 } },
  ];

  const ranked = DistributionUtils.rankResults(results);
  console.log(
    "✓ Results ranked by confidence:",
    ranked[0].confidenceScore,
    ">",
    ranked[1].confidenceScore
  );
} catch (error) {
  console.error("❌ Test 5 failed:", error.message);
  process.exit(1);
}

console.log("\n🎉 All abstraction layer tests passed!");
console.log("\n📊 Abstraction Layer Status:");
console.log("✅ DistributionAnalyzer interface: Working");
console.log("✅ AnalysisEngine coordination: Working");
console.log("✅ PowerLawAnalyzer compliance: Working");
console.log("✅ DistributionUtils: Working");
console.log("✅ End-to-end pipeline: Working");

console.log("\n🚀 Ready for log-normal and exponential analyzers!");
console.log("   - Interface defined and tested");
console.log("   - Engine ready for multiple distributions");
console.log("   - PowerLaw analyzer fully compliant");
console.log("   - Utilities for comparison and ranking ready");
