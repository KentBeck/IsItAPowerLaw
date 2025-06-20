// Tests for LogNormalAnalyzer

describe('LogNormalAnalyzer', () => {
    const analyzer = new LogNormalAnalyzer();
    
    // Create test data that should follow a log-normal distribution
    // Generated from LogNormal(μ=1, σ=0.5) with some frequencies
    const logNormalTestData = [
        { value: 1.0, frequency: 100, ccdf: 0.85 },
        { value: 1.5, frequency: 150, ccdf: 0.65 },
        { value: 2.0, frequency: 120, ccdf: 0.50 },
        { value: 3.0, frequency: 80, ccdf: 0.30 },
        { value: 4.0, frequency: 50, ccdf: 0.15 },
        { value: 6.0, frequency: 30, ccdf: 0.08 },
        { value: 8.0, frequency: 20, ccdf: 0.04 },
        { value: 12.0, frequency: 10, ccdf: 0.02 }
    ];

    it('should have correct properties', () => {
        expect(analyzer.name).toBe('logNormal');
        expect(analyzer.displayName).toBe('Log-Normal');
        expect(analyzer.description).toBe('ln(X) ~ Normal(μ, σ)');
        expect(analyzer.parameterNames).toEqual(['mu', 'sigma']);
    });

    it('should extend DistributionAnalyzer', () => {
        expect(analyzer instanceof DistributionAnalyzer).toBe(true);
    });

    it('should add ln transforms correctly', () => {
        const testData = [
            { value: 1, ccdf: 0.5 },
            { value: Math.E, ccdf: 0.3 },
            { value: Math.E * Math.E, ccdf: 0.1 }
        ];
        
        const result = analyzer.addLnTransforms(testData);
        
        expect(result[0].lnValue).toBeCloseTo(0, 5); // ln(1) = 0
        expect(result[1].lnValue).toBeCloseTo(1, 5); // ln(e) = 1
        expect(result[2].lnValue).toBeCloseTo(2, 5); // ln(e²) = 2
    });

    it('should handle zero and negative values in ln transforms', () => {
        const testData = [
            { value: 0, ccdf: 0.8 },
            { value: -1, ccdf: 0.9 },
            { value: 2, ccdf: 0.3 }
        ];
        
        const result = analyzer.addLnTransforms(testData);
        
        expect(result[0].lnValue).toBe(null); // ln(0) = null
        expect(result[1].lnValue).toBe(null); // ln(-1) = null
        expect(result[2].lnValue).toBeCloseTo(0.693, 2); // ln(2) ≈ 0.693
    });

    it('should validate data correctly', () => {
        const validResult = analyzer.validateData(logNormalTestData);
        expect(validResult.valid).toBe(true);

        const insufficientData = [{ value: 1, ccdf: 0.5 }];
        const invalidResult = analyzer.validateData(insufficientData);
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.message).toContain('at least 5 data points');

        const negativeData = [
            { value: -1, ccdf: 0.9 },
            { value: 0, ccdf: 0.8 },
            { value: 1, ccdf: 0.5 },
            { value: 2, ccdf: 0.3 },
            { value: 3, ccdf: 0.1 }
        ];
        const negativeResult = analyzer.validateData(negativeData);
        expect(negativeResult.valid).toBe(true);
        expect(negativeResult.warning).toBe(true);
        expect(negativeResult.message).toContain('non-positive values will be excluded');
    });

    it('should calculate theoretical CCDF correctly', () => {
        const parameters = { mu: 0, sigma: 1 }; // Standard log-normal
        const xValues = [1, Math.E, Math.E * Math.E];
        
        const ccdfValues = analyzer.getTheoreticalCCDF(xValues, parameters);
        
        // For standard log-normal, CCDF at x=1 should be 0.5
        expect(ccdfValues[0]).toBeCloseTo(0.5, 2);
        
        // CCDF should be decreasing
        expect(ccdfValues[0]).toBeGreaterThan(ccdfValues[1]);
        expect(ccdfValues[1]).toBeGreaterThan(ccdfValues[2]);
        
        // CCDF for x <= 0 should be 1
        const zeroCCDF = analyzer.getTheoreticalCCDF([0, -1], parameters);
        expect(zeroCCDF[0]).toBe(1);
        expect(zeroCCDF[1]).toBe(1);
    });

    it('should generate normal probability plot correctly', () => {
        const testData = [
            { value: 1, ccdf: 0.8, lnValue: 0 },
            { value: 2, ccdf: 0.6, lnValue: 0.693 },
            { value: 4, ccdf: 0.4, lnValue: 1.386 },
            { value: 8, ccdf: 0.2, lnValue: 2.079 }
        ];
        
        const probPlot = analyzer.generateNormalProbabilityPlot(testData);
        
        expect(probPlot.plotData.length).toBe(4);
        expect(probPlot.regression).toHaveProperty('slope');
        expect(probPlot.regression).toHaveProperty('intercept');
        expect(probPlot.regression).toHaveProperty('rSquared');
        expect(probPlot.estimatedMu).toBe(probPlot.regression.intercept);
        expect(probPlot.estimatedSigma).toBe(probPlot.regression.slope);
        
        // Check that data is sorted by lnValue
        for (let i = 1; i < probPlot.plotData.length; i++) {
            expect(probPlot.plotData[i].lnValue).toBeGreaterThanOrEqual(
                probPlot.plotData[i-1].lnValue
            );
        }
    });

    it('should analyze log-normal data correctly', () => {
        const result = analyzer.analyze(logNormalTestData);
        
        expect(result.distributionName).toBe('logNormal');
        expect(result.parameters).toHaveProperty('mu');
        expect(result.parameters).toHaveProperty('sigma');
        expect(result.parameters.mu).toBeGreaterThan(0); // Should be positive for this data
        expect(result.parameters.sigma).toBeGreaterThan(0); // Should be positive
        
        expect(result.goodnessOfFit).toHaveProperty('rSquared');
        expect(result.goodnessOfFit).toHaveProperty('normalProbabilityR2');
        expect(result.goodnessOfFit).toHaveProperty('aic');
        expect(result.goodnessOfFit).toHaveProperty('bic');
        expect(result.goodnessOfFit).toHaveProperty('kolmogorovSmirnov');
        
        expect(result.theoreticalValues.length).toBe(logNormalTestData.length);
        expect(result.normalProbabilityPlot).toHaveProperty('plotData');
        expect(result.normalProbabilityPlot).toHaveProperty('regression');
        
        expect(result.validDataPoints).toBe(logNormalTestData.length);
        expect(result.originalDataPoints).toBe(logNormalTestData.length);
    });

    it('should get distribution-specific plot correctly', () => {
        const plotData = analyzer.getDistributionSpecificPlot(logNormalTestData);
        
        expect(plotData.type).toBe('normalProbability');
        expect(plotData.title).toBe('Normal Probability Plot (Log-Normal Test)');
        expect(plotData.xLabel).toBe('Theoretical Quantiles');
        expect(plotData.yLabel).toBe('ln(Value)');
        expect(plotData.data.length).toBe(logNormalTestData.length);
        expect(plotData.regression).toHaveProperty('rSquared');
        expect(plotData.description).toContain('Log-normal distributions appear as straight lines');
    });

    it('should get plot data for different visualization types', () => {
        const parameters = { mu: 1, sigma: 0.5 };
        const plotData = analyzer.getPlotData(logNormalTestData, parameters);
        
        expect(plotData).toHaveProperty('linear');
        expect(plotData).toHaveProperty('semiLog');
        
        expect(plotData.linear.empirical.length).toBe(logNormalTestData.length);
        expect(plotData.linear.theoretical.length).toBe(logNormalTestData.length);
        expect(plotData.semiLog.empirical.length).toBe(logNormalTestData.length);
        expect(plotData.semiLog.theoretical.length).toBe(logNormalTestData.length);
        
        // Check that semiLog uses log10 transform
        expect(plotData.semiLog.empirical[0].x).toBeCloseTo(0, 5); // log10(1) = 0
    });

    it('should calculate log-likelihood correctly', () => {
        const parameters = { mu: 1, sigma: 0.5 };
        const testData = [
            { value: 1, frequency: 10 },
            { value: 2, frequency: 5 },
            { value: 4, frequency: 2 }
        ];
        
        const logLikelihood = analyzer.calculateLogLikelihood(testData, parameters);
        
        expect(typeof logLikelihood).toBe('number');
        expect(logLikelihood).toBeLessThan(0); // Log-likelihood should be negative
    });

    it('should handle edge cases gracefully', () => {
        // Test with insufficient data after filtering
        const badData = [
            { value: 0, ccdf: 0.9 },
            { value: -1, ccdf: 0.8 }
        ];
        
        expect(() => analyzer.analyze(badData)).toThrow('Not enough valid data points');
        
        // Test with empty data
        expect(() => analyzer.analyze([])).toThrow('Data must be a non-empty array');
        
        // Test with non-array data
        expect(() => analyzer.analyze(null)).toThrow('Data must be a non-empty array');
    });

    it('should have appropriate minimum requirements', () => {
        expect(analyzer.getMinimumDataPoints()).toBe(5);
        expect(analyzer.getRecommendedMinimumRange()).toBe(5);
    });

    it('should calculate goodness of fit metrics correctly', () => {
        const empiricalData = [
            { value: 1, ccdf: 0.8, lnValue: 0 },
            { value: 2, ccdf: 0.6, lnValue: 0.693 },
            { value: 4, ccdf: 0.4, lnValue: 1.386 }
        ];
        
        const theoreticalData = empiricalData.map(d => ({
            ...d,
            theoreticalCCDF: 0.7 // Mock theoretical value
        }));
        
        const parameters = { mu: 1, sigma: 0.5 };
        const gof = analyzer.calculateGoodnessOfFit(empiricalData, theoreticalData, { parameters });
        
        expect(gof).toHaveProperty('rSquared');
        expect(gof).toHaveProperty('normalProbabilityR2');
        expect(gof).toHaveProperty('adjustedRSquared');
        expect(gof).toHaveProperty('kolmogorovSmirnov');
        expect(gof).toHaveProperty('logLikelihood');
        expect(gof).toHaveProperty('aic');
        expect(gof).toHaveProperty('bic');
        expect(gof).toHaveProperty('confidenceLevel');
        expect(gof).toHaveProperty('isLogNormal');
        expect(gof).toHaveProperty('confidenceScore');
        
        expect(typeof gof.isLogNormal).toBe('boolean');
        expect(typeof gof.confidenceScore).toBe('number');
        expect(gof.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(gof.confidenceScore).toBeLessThanOrEqual(1);
    });
});
