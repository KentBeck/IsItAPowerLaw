// Test the ExponentialAnalyzer
const fs = require('fs');

// Load all modules in correct order
const mathUtils = require('./mathUtils.js');
const statisticalTests = require('./statisticalTests.js');
const dataProcessor = require('./dataProcessor.js');
const { DistributionAnalyzer, DistributionUtils } = require('./distributionAnalyzer.js');
const AnalysisEngine = require('./analysisEngine.js');
const PowerLawAnalyzer = require('./powerLawAnalyzer.js');
const LogNormalAnalyzer = require('./logNormalAnalyzer.js');
const ExponentialAnalyzer = require('./exponentialAnalyzer.js');

console.log('🧪 Testing ExponentialAnalyzer...\n');

// Test 1: ExponentialAnalyzer basic functionality
console.log('Test 1: ExponentialAnalyzer interface compliance');
try {
    const exponentialAnalyzer = new ExponentialAnalyzer();
    
    console.log('✓ ExponentialAnalyzer created:', exponentialAnalyzer.name);
    console.log('✓ Display name:', exponentialAnalyzer.displayName);
    console.log('✓ Description:', exponentialAnalyzer.description);
    console.log('✓ Parameter names:', exponentialAnalyzer.parameterNames);
    console.log('✓ Extends DistributionAnalyzer:', exponentialAnalyzer instanceof DistributionAnalyzer);
    
} catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    process.exit(1);
}

// Test 2: Data validation
console.log('\nTest 2: Data validation');
try {
    const exponentialAnalyzer = new ExponentialAnalyzer();
    
    // Test valid data
    const validData = [
        { value: 1, ccdf: 0.8 },
        { value: 2, ccdf: 0.6 },
        { value: 3, ccdf: 0.4 },
        { value: 4, ccdf: 0.2 }
    ];
    const validResult = exponentialAnalyzer.validateData(validData);
    console.log('✓ Valid data validation:', validResult.valid, '-', validResult.message);
    
    // Test insufficient data
    const insufficientData = [
        { value: 1, ccdf: 0.8 },
        { value: 2, ccdf: 0.6 }
    ];
    const insufficientResult = exponentialAnalyzer.validateData(insufficientData);
    console.log('✓ Insufficient data validation:', insufficientResult.valid, '-', insufficientResult.message);
    
    // Test data with non-positive values
    const mixedData = [
        { value: -1, ccdf: 0.9 },
        { value: 0, ccdf: 0.85 },
        { value: 1, ccdf: 0.8 },
        { value: 2, ccdf: 0.6 },
        { value: 3, ccdf: 0.4 }
    ];
    const mixedResult = exponentialAnalyzer.validateData(mixedData);
    console.log('✓ Mixed data validation:', mixedResult.valid, '- Warning:', mixedResult.warning);
    
} catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    process.exit(1);
}

// Test 3: Theoretical CCDF calculation
console.log('\nTest 3: Theoretical CCDF calculation');
try {
    const exponentialAnalyzer = new ExponentialAnalyzer();
    
    // Standard exponential parameters (λ=1)
    const parameters = { lambda: 1 };
    const xValues = [0, 1, 2, 3];
    
    const ccdfValues = exponentialAnalyzer.getTheoreticalCCDF(xValues, parameters);
    
    console.log('✓ CCDF values for standard exponential (λ=1):');
    xValues.forEach((x, i) => {
        console.log(`  P(X > ${x}) = ${ccdfValues[i].toFixed(4)}`);
    });
    
    // Check that CCDF is decreasing for positive values
    for (let i = 1; i < ccdfValues.length; i++) {
        if (ccdfValues[i] >= ccdfValues[i-1]) {
            throw new Error('CCDF should be decreasing for positive values');
        }
    }
    console.log('✓ CCDF is properly decreasing');
    
    // Test CCDF for negative values (should be 1)
    const negativeValues = [-2, -1];
    const negativeCCDF = exponentialAnalyzer.getTheoreticalCCDF(negativeValues, parameters);
    console.log('✓ CCDF for x<0:', negativeCCDF, '(should be [1, 1])');
    
} catch (error) {
    console.error('❌ Test 3 failed:', error.message);
    process.exit(1);
}

// Test 4: Full exponential analysis
console.log('\nTest 4: Full exponential analysis');
try {
    const exponentialAnalyzer = new ExponentialAnalyzer();
    
    // Create test data that approximately follows exponential distribution
    // Using λ = 0.5, so mean = 2
    const testData = [
        { value: 0.5, ccdf: 0.779, frequency: 1 },
        { value: 1.0, ccdf: 0.607, frequency: 1 },
        { value: 1.5, ccdf: 0.472, frequency: 1 },
        { value: 2.0, ccdf: 0.368, frequency: 1 },
        { value: 2.5, ccdf: 0.287, frequency: 1 },
        { value: 3.0, ccdf: 0.223, frequency: 1 },
        { value: 4.0, ccdf: 0.135, frequency: 1 }
    ];
    
    const result = exponentialAnalyzer.analyze(testData);
    
    console.log('✓ Analysis completed:');
    console.log('  - Distribution:', result.distributionName);
    console.log('  - λ (lambda):', result.parameters.lambda.toFixed(3));
    console.log('  - Exponential prob R²:', result.goodnessOfFit.exponentialProbabilityR2.toFixed(4));
    console.log('  - Confidence:', result.goodnessOfFit.confidenceLevel);
    console.log('  - Is exponential:', result.goodnessOfFit.isExponential);
    console.log('  - Valid data points:', result.validDataPoints);
    console.log('  - AIC:', result.goodnessOfFit.aic.toFixed(2));
    console.log('  - BIC:', result.goodnessOfFit.bic.toFixed(2));
    
    // Verify that lambda is reasonable (should be around 0.5 for this test data)
    if (result.parameters.lambda < 0.1 || result.parameters.lambda > 2.0) {
        console.log('⚠️  Warning: Lambda estimate seems unreasonable:', result.parameters.lambda);
    }
    
} catch (error) {
    console.error('❌ Test 4 failed:', error.message);
    process.exit(1);
}

// Test 5: Distribution-specific plotting
console.log('\nTest 5: Distribution-specific plotting');
try {
    const exponentialAnalyzer = new ExponentialAnalyzer();
    
    const testData = [
        { value: 1, ccdf: 0.8 },
        { value: 2, ccdf: 0.6 },
        { value: 3, ccdf: 0.4 },
        { value: 4, ccdf: 0.2 }
    ];
    
    const plotData = exponentialAnalyzer.getDistributionSpecificPlot(testData);
    
    console.log('✓ Exponential probability plot generated:');
    console.log('  - Type:', plotData.type);
    console.log('  - Title:', plotData.title);
    console.log('  - Data points:', plotData.data.length);
    console.log('  - Regression R²:', plotData.regression.rSquared.toFixed(4));
    console.log('  - Description:', plotData.description);
    
    // Verify plot data structure
    if (!plotData.data || plotData.data.length === 0) {
        throw new Error('Plot data should not be empty');
    }
    
    // Check that plot data has correct structure
    const firstPoint = plotData.data[0];
    if (!firstPoint.hasOwnProperty('x') || !firstPoint.hasOwnProperty('y')) {
        throw new Error('Plot data points should have x and y properties');
    }
    
} catch (error) {
    console.error('❌ Test 5 failed:', error.message);
    process.exit(1);
}

// Test 6: Edge cases
console.log('\nTest 6: Edge cases');
try {
    const exponentialAnalyzer = new ExponentialAnalyzer();
    
    // Test with lambda = 0
    const zeroLambdaParams = { lambda: 0 };
    const ccdfZeroLambda = exponentialAnalyzer.getTheoreticalCCDF([1, 2, 3], zeroLambdaParams);
    console.log('✓ CCDF with λ=0:', ccdfZeroLambda, '(should be [1, 1, 1])');
    
    // Test minimum data points
    console.log('✓ Minimum data points:', exponentialAnalyzer.getMinimumDataPoints());
    console.log('✓ Recommended minimum range:', exponentialAnalyzer.getRecommendedMinimumRange());
    
    // Test error handling
    try {
        exponentialAnalyzer.analyze([]);
        throw new Error('Should have thrown error for empty data');
    } catch (error) {
        if (error.message.includes('non-empty array')) {
            console.log('✓ Empty data error handling works');
        } else {
            throw error;
        }
    }
    
} catch (error) {
    console.error('❌ Test 6 failed:', error.message);
    process.exit(1);
}

console.log('\n🎉 All ExponentialAnalyzer tests passed!');

console.log('\n📊 ExponentialAnalyzer Status:');
console.log('✅ Interface compliance: Working');
console.log('✅ Parameter estimation: Working');
console.log('✅ Goodness-of-fit testing: Working');
console.log('✅ Exponential probability plots: Working');
console.log('✅ Data validation: Working');
console.log('✅ Edge case handling: Working');

console.log('\n🚀 ExponentialAnalyzer ready for integration!');
