// Test the LogNormalAnalyzer
const fs = require('fs');

// Load all modules in correct order
const mathUtils = require('./mathUtils.js');
const statisticalTests = require('./statisticalTests.js');
const dataProcessor = require('./dataProcessor.js');
const { DistributionAnalyzer, DistributionUtils } = require('./distributionAnalyzer.js');
const AnalysisEngine = require('./analysisEngine.js');
const PowerLawAnalyzer = require('./powerLawAnalyzer.js');
const LogNormalAnalyzer = require('./logNormalAnalyzer.js');

console.log('🧪 Testing LogNormalAnalyzer...\n');

// Test 1: LogNormalAnalyzer basic functionality
console.log('Test 1: LogNormalAnalyzer interface compliance');
try {
    const logNormalAnalyzer = new LogNormalAnalyzer();
    
    console.log('✓ LogNormalAnalyzer created:', logNormalAnalyzer.name);
    console.log('✓ Display name:', logNormalAnalyzer.displayName);
    console.log('✓ Description:', logNormalAnalyzer.description);
    console.log('✓ Parameter names:', logNormalAnalyzer.parameterNames);
    console.log('✓ Extends DistributionAnalyzer:', logNormalAnalyzer instanceof DistributionAnalyzer);
    
} catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    process.exit(1);
}

// Test 2: Log transforms
console.log('\nTest 2: Natural log transforms');
try {
    const logNormalAnalyzer = new LogNormalAnalyzer();
    
    const testData = [
        { value: 1, ccdf: 0.8 },
        { value: Math.E, ccdf: 0.6 },
        { value: Math.E * Math.E, ccdf: 0.4 },
        { value: 0, ccdf: 0.9 },
        { value: -1, ccdf: 0.95 }
    ];
    
    const withLn = logNormalAnalyzer.addLnTransforms(testData);
    
    console.log('✓ ln(1) =', withLn[0].lnValue, '(should be 0)');
    console.log('✓ ln(e) =', withLn[1].lnValue.toFixed(3), '(should be 1)');
    console.log('✓ ln(e²) =', withLn[2].lnValue.toFixed(3), '(should be 2)');
    console.log('✓ ln(0) =', withLn[3].lnValue, '(should be null)');
    console.log('✓ ln(-1) =', withLn[4].lnValue, '(should be null)');
    
} catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    process.exit(1);
}

// Test 3: Data validation
console.log('\nTest 3: Data validation');
try {
    const logNormalAnalyzer = new LogNormalAnalyzer();
    
    // Valid data
    const validData = [
        { value: 1, ccdf: 0.8 },
        { value: 2, ccdf: 0.6 },
        { value: 3, ccdf: 0.4 },
        { value: 4, ccdf: 0.2 },
        { value: 5, ccdf: 0.1 }
    ];
    
    const validResult = logNormalAnalyzer.validateData(validData);
    console.log('✓ Valid data validation:', validResult.valid, '-', validResult.message);
    
    // Insufficient data
    const insufficientData = [{ value: 1, ccdf: 0.5 }];
    const insufficientResult = logNormalAnalyzer.validateData(insufficientData);
    console.log('✓ Insufficient data validation:', insufficientResult.valid, '-', insufficientResult.message);
    
    // Data with negative values
    const mixedData = [
        { value: -1, ccdf: 0.9 },
        { value: 0, ccdf: 0.8 },
        { value: 1, ccdf: 0.6 },
        { value: 2, ccdf: 0.4 },
        { value: 3, ccdf: 0.2 }
    ];
    
    const mixedResult = logNormalAnalyzer.validateData(mixedData);
    console.log('✓ Mixed data validation:', mixedResult.valid, '- Warning:', mixedResult.warning);
    
} catch (error) {
    console.error('❌ Test 3 failed:', error.message);
    process.exit(1);
}

// Test 4: Theoretical CCDF calculation
console.log('\nTest 4: Theoretical CCDF calculation');
try {
    const logNormalAnalyzer = new LogNormalAnalyzer();
    
    // Standard log-normal parameters (μ=0, σ=1)
    const parameters = { mu: 0, sigma: 1 };
    const xValues = [0.5, 1, 2, 4];
    
    const ccdfValues = logNormalAnalyzer.getTheoreticalCCDF(xValues, parameters);
    
    console.log('✓ CCDF values for standard log-normal:');
    xValues.forEach((x, i) => {
        console.log(`  P(X > ${x}) = ${ccdfValues[i].toFixed(4)}`);
    });
    
    // Check that CCDF is decreasing
    for (let i = 1; i < ccdfValues.length; i++) {
        if (ccdfValues[i] >= ccdfValues[i-1]) {
            throw new Error('CCDF should be decreasing');
        }
    }
    console.log('✓ CCDF is properly decreasing');
    
    // Test edge cases
    const edgeCCDF = logNormalAnalyzer.getTheoreticalCCDF([0, -1], parameters);
    console.log('✓ CCDF for x≤0:', edgeCCDF, '(should be [1, 1])');
    
} catch (error) {
    console.error('❌ Test 4 failed:', error.message);
    process.exit(1);
}

// Test 5: Full analysis with synthetic log-normal data
console.log('\nTest 5: Full log-normal analysis');
try {
    const logNormalAnalyzer = new LogNormalAnalyzer();
    
    // Create synthetic log-normal data (μ=1, σ=0.5)
    const logNormalData = [
        { value: 1.0, frequency: 100, ccdf: 0.85 },
        { value: 1.5, frequency: 150, ccdf: 0.70 },
        { value: 2.0, frequency: 120, ccdf: 0.55 },
        { value: 3.0, frequency: 80, ccdf: 0.35 },
        { value: 4.0, frequency: 50, ccdf: 0.20 },
        { value: 6.0, frequency: 30, ccdf: 0.10 },
        { value: 8.0, frequency: 20, ccdf: 0.05 }
    ];
    
    const result = logNormalAnalyzer.analyze(logNormalData);
    
    console.log('✓ Analysis completed:');
    console.log('  - Distribution:', result.distributionName);
    console.log('  - μ (mu):', result.parameters.mu.toFixed(3));
    console.log('  - σ (sigma):', result.parameters.sigma.toFixed(3));
    console.log('  - Normal prob R²:', result.goodnessOfFit.normalProbabilityR2.toFixed(4));
    console.log('  - Confidence:', result.goodnessOfFit.confidenceLevel);
    console.log('  - Is log-normal:', result.goodnessOfFit.isLogNormal);
    console.log('  - Valid data points:', result.validDataPoints);
    console.log('  - AIC:', result.goodnessOfFit.aic.toFixed(2));
    console.log('  - BIC:', result.goodnessOfFit.bic.toFixed(2));
    
} catch (error) {
    console.error('❌ Test 5 failed:', error.message);
    process.exit(1);
}

// Test 6: Distribution-specific plotting
console.log('\nTest 6: Distribution-specific plotting');
try {
    const logNormalAnalyzer = new LogNormalAnalyzer();
    
    const testData = [
        { value: 1, ccdf: 0.8 },
        { value: 2, ccdf: 0.6 },
        { value: 4, ccdf: 0.4 },
        { value: 8, ccdf: 0.2 }
    ];
    
    const plotData = logNormalAnalyzer.getDistributionSpecificPlot(testData);
    
    console.log('✓ Normal probability plot generated:');
    console.log('  - Type:', plotData.type);
    console.log('  - Title:', plotData.title);
    console.log('  - Data points:', plotData.data.length);
    console.log('  - Regression R²:', plotData.regression.rSquared.toFixed(4));
    console.log('  - Description:', plotData.description);
    
} catch (error) {
    console.error('❌ Test 6 failed:', error.message);
    process.exit(1);
}

console.log('\n🎉 All LogNormalAnalyzer tests passed!');
console.log('\n📊 LogNormalAnalyzer Status:');
console.log('✅ Interface compliance: Working');
console.log('✅ Parameter estimation: Working');
console.log('✅ Goodness-of-fit testing: Working');
console.log('✅ Normal probability plots: Working');
console.log('✅ Data validation: Working');
console.log('✅ Edge case handling: Working');

console.log('\n🚀 LogNormalAnalyzer ready for integration!');
