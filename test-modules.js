// Simple test to verify our modules work
const fs = require('fs');

// Load modules
const mathUtils = require('./mathUtils.js');
const statisticalTests = require('./statisticalTests.js');
const dataProcessor = require('./dataProcessor.js');

console.log('✓ All modules loaded successfully');

// Test basic functions
console.log('✓ log10(10):', mathUtils.log10(10));
console.log('✓ mean([1,2,3]):', mathUtils.mean([1,2,3]));

// Test linear regression
const testData = [
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 }
];
const regression = statisticalTests.linearRegression(testData);
console.log('✓ Linear regression slope:', regression.slope);

// Test data processing
const sampleText = '1 100\n2 50\n3 25\n4 12\n5 6';
const parsed = dataProcessor.parseInputData(sampleText);
console.log('✓ Parsed data length:', parsed.length);

const stats = dataProcessor.calculateBasicStats(parsed);
console.log('✓ Total observations:', stats.totalObservations);

const withCCDF = dataProcessor.calculateCCDF(parsed);
console.log('✓ Data with CCDF length:', withCCDF.length);

console.log('All core modules working correctly!');
