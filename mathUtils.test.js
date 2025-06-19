// Tests for mathUtils.js functions

describe("log10", () => {
  it("should calculate log10 correctly for positive numbers", () => {
    expect(log10(1)).toBeCloseTo(0, 5);
    expect(log10(10)).toBeCloseTo(1, 5);
    expect(log10(100)).toBeCloseTo(2, 5);
    expect(log10(0.1)).toBeCloseTo(-1, 5);
  });

  it("should return null for zero and negative numbers", () => {
    expect(log10(0)).toBe(null);
    expect(log10(-1)).toBe(null);
    expect(log10(-10)).toBe(null);
  });
});

describe("ln", () => {
  it("should calculate natural log correctly for positive numbers", () => {
    expect(ln(1)).toBeCloseTo(0, 5);
    expect(ln(Math.E)).toBeCloseTo(1, 5);
    expect(ln(Math.E * Math.E)).toBeCloseTo(2, 5);
  });

  it("should return null for zero and negative numbers", () => {
    expect(ln(0)).toBe(null);
    expect(ln(-1)).toBe(null);
  });
});

describe("addLogTransforms", () => {
  const testData = [
    { value: 1, ccdf: 0.5 },
    { value: 10, ccdf: 0.1 },
    { value: 100, ccdf: 0.01 },
    { value: 1000, ccdf: 0 },
  ];

  it("should add log transforms correctly", () => {
    const result = addLogTransforms(testData);

    expect(result[0].logValue).toBeCloseTo(0, 5); // log10(1) = 0
    expect(result[0].logCCDF).toBeCloseTo(-0.301, 2); // log10(0.5) ≈ -0.301

    expect(result[1].logValue).toBeCloseTo(1, 5); // log10(10) = 1
    expect(result[1].logCCDF).toBeCloseTo(-1, 5); // log10(0.1) = -1

    expect(result[2].logValue).toBeCloseTo(2, 5); // log10(100) = 2
    expect(result[2].logCCDF).toBeCloseTo(-2, 5); // log10(0.01) = -2
  });

  it("should handle zero CCDF values", () => {
    const result = addLogTransforms(testData);
    expect(result[3].logCCDF).toBe(null); // log10(0) should be null
  });

  it("should preserve original data", () => {
    const result = addLogTransforms(testData);
    expect(result[0].value).toBe(1);
    expect(result[0].ccdf).toBe(0.5);
  });
});

describe("filterValidLogData", () => {
  const testData = [
    { value: 1, ccdf: 0.5, logValue: 0, logCCDF: -0.301 },
    { value: 10, ccdf: 0.1, logValue: 1, logCCDF: -1 },
    { value: 100, ccdf: 0, logValue: 2, logCCDF: null },
    { value: 1000, ccdf: 0.001, logValue: 3, logCCDF: -3 },
  ];

  it("should filter out invalid log values", () => {
    const result = filterValidLogData(testData);
    expect(result.length).toBe(3); // Should exclude the one with null logCCDF
    expect(
      result.every((item) => item.logValue !== null && item.logCCDF !== null)
    ).toBe(true);
  });

  it("should preserve valid data points", () => {
    const result = filterValidLogData(testData);
    expect(result[0].value).toBe(1);
    expect(result[1].value).toBe(10);
    expect(result[2].value).toBe(1000);
  });
});

describe("normalCDF", () => {
  it("should calculate normal CDF correctly for standard values", () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 2); // CDF(0) = 0.5
    expect(normalCDF(-1.96)).toBeCloseTo(0.025, 2); // Approximately 2.5th percentile
    expect(normalCDF(1.96)).toBeCloseTo(0.975, 2); // Approximately 97.5th percentile
  });

  it("should handle extreme values", () => {
    expect(normalCDF(-5)).toBeCloseTo(0, 3);
    expect(normalCDF(5)).toBeCloseTo(1, 3);
  });
});

describe("normalInverseCDF", () => {
  it("should calculate inverse normal CDF correctly", () => {
    expect(normalInverseCDF(0.5)).toBeCloseTo(0, 2);
    expect(normalInverseCDF(0.025)).toBeCloseTo(-1.96, 1);
    expect(normalInverseCDF(0.975)).toBeCloseTo(1.96, 1);
  });

  it("should throw error for invalid probabilities", () => {
    expect(() => normalInverseCDF(0)).toThrow(
      "Probability must be between 0 and 1"
    );
    expect(() => normalInverseCDF(1)).toThrow(
      "Probability must be between 0 and 1"
    );
    expect(() => normalInverseCDF(-0.1)).toThrow(
      "Probability must be between 0 and 1"
    );
    expect(() => normalInverseCDF(1.1)).toThrow(
      "Probability must be between 0 and 1"
    );
  });
});

describe("mean", () => {
  it("should calculate mean correctly", () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
    expect(mean([10, 20, 30])).toBe(20);
    expect(mean([5])).toBe(5);
  });

  it("should handle negative numbers", () => {
    expect(mean([-1, 0, 1])).toBe(0);
    expect(mean([-5, -10])).toBe(-7.5);
  });

  it("should throw error for empty array", () => {
    expect(() => mean([])).toThrow("Values must be a non-empty array");
    expect(() => mean(null)).toThrow("Values must be a non-empty array");
  });
});

describe("standardDeviation", () => {
  it("should calculate sample standard deviation correctly", () => {
    const values = [1, 2, 3, 4, 5];
    const result = standardDeviation(values);
    expect(result).toBeCloseTo(1.58, 1); // Sample std dev
  });

  it("should calculate population standard deviation correctly", () => {
    const values = [1, 2, 3, 4, 5];
    const result = standardDeviation(values, false);
    expect(result).toBeCloseTo(1.41, 1); // Population std dev
  });

  it("should handle single value", () => {
    expect(() => standardDeviation([5])).toThrow(); // Sample std dev of single value is undefined
    expect(standardDeviation([5], false)).toBe(0); // Population std dev of single value is 0
  });

  it("should throw error for empty array", () => {
    expect(() => standardDeviation([])).toThrow(
      "Values must be a non-empty array"
    );
  });
});

// Tests for statisticalTests.js functions
describe("linearRegression", () => {
  const perfectLineData = [
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 },
    { x: 4, y: 8 },
  ];

  it("should calculate perfect linear relationship correctly", () => {
    const result = linearRegression(perfectLineData);

    expect(result.slope).toBeCloseTo(2, 5);
    expect(result.intercept).toBeCloseTo(0, 5);
    expect(result.rSquared).toBeCloseTo(1, 5);
    expect(result.n).toBe(4);
  });

  const noisyData = [
    { x: 1, y: 2.1 },
    { x: 2, y: 3.9 },
    { x: 3, y: 6.2 },
    { x: 4, y: 7.8 },
  ];

  it("should handle noisy data", () => {
    const result = linearRegression(noisyData);

    expect(result.slope).toBeCloseTo(2, 0); // Approximately 2
    expect(result.rSquared).toBeGreaterThan(0.9); // Should still be high
    expect(result.residuals.length).toBe(4);
  });

  it("should throw error for insufficient data", () => {
    expect(() => linearRegression([{ x: 1, y: 2 }])).toThrow(
      "Data must be an array with at least 2 points"
    );
    expect(() => linearRegression([])).toThrow(
      "Data must be an array with at least 2 points"
    );
  });

  it("should throw error for invalid data", () => {
    expect(() =>
      linearRegression([
        { x: 1, y: "invalid" },
        { x: 2, y: 4 },
      ])
    ).toThrow("All data points must have numeric x and y values");
  });
});

describe("kolmogorovSmirnovTest", () => {
  const empiricalCDF = [0.1, 0.3, 0.6, 0.8, 1.0];
  const theoreticalCDF = [0.15, 0.35, 0.55, 0.75, 0.95];

  it("should calculate KS statistic correctly", () => {
    const result = kolmogorovSmirnovTest(empiricalCDF, theoreticalCDF);

    expect(result.statistic).toBeGreaterThan(0);
    expect(result.pValue).toBeGreaterThan(0);
    expect(result.pValue).toBeLessThanOrEqual(1);
    expect(result.criticalValue).toBeGreaterThan(0);
    expect(typeof result.significant).toBe("boolean");
  });

  it("should handle identical CDFs", () => {
    const result = kolmogorovSmirnovTest(empiricalCDF, empiricalCDF);
    expect(result.statistic).toBeCloseTo(0, 5);
    expect(result.significant).toBe(false);
  });

  it("should throw error for mismatched array lengths", () => {
    expect(() => kolmogorovSmirnovTest([0.1, 0.2], [0.1, 0.2, 0.3])).toThrow(
      "CDF arrays must have the same length"
    );
  });

  it("should throw error for empty arrays", () => {
    expect(() => kolmogorovSmirnovTest([], [])).toThrow(
      "CDF arrays cannot be empty"
    );
  });
});

describe("calculateAIC", () => {
  it("should calculate AIC correctly", () => {
    const aic = calculateAIC(-100, 3); // logLikelihood = -100, parameters = 3
    expect(aic).toBe(206); // 2*3 - 2*(-100) = 6 + 200 = 206
  });

  it("should handle zero log-likelihood", () => {
    const aic = calculateAIC(0, 2);
    expect(aic).toBe(4); // 2*2 - 2*0 = 4
  });
});

describe("calculateBIC", () => {
  it("should calculate BIC correctly", () => {
    const bic = calculateBIC(-100, 3, 50); // logLikelihood = -100, parameters = 3, n = 50
    const expected = Math.log(50) * 3 - 2 * -100;
    expect(bic).toBeCloseTo(expected, 5);
  });
});

// Tests for PowerLawAnalyzer
describe("PowerLawAnalyzer", () => {
  const analyzer = new PowerLawAnalyzer();

  // Create test data that should follow a power law
  const powerLawTestData = [
    { value: 1, frequency: 1000, ccdf: 0.9 },
    { value: 2, frequency: 250, ccdf: 0.7 },
    { value: 4, frequency: 62, ccdf: 0.5 },
    { value: 8, frequency: 15, ccdf: 0.3 },
    { value: 16, frequency: 4, ccdf: 0.1 },
  ];

  it("should have correct properties", () => {
    expect(analyzer.name).toBe("powerLaw");
    expect(analyzer.displayName).toBe("Power Law");
    expect(analyzer.description).toBe("P(X > x) ∝ x^(-α)");
  });

  it("should analyze power law data correctly", () => {
    const result = analyzer.analyze(powerLawTestData);

    expect(result.distributionName).toBe("powerLaw");
    expect(result.parameters).toHaveProperty("exponent");
    expect(result.parameters).toHaveProperty("scalingConstant");
    expect(result.goodnessOfFit).toHaveProperty("rSquared");
    expect(result.goodnessOfFit).toHaveProperty("aic");
    expect(result.goodnessOfFit).toHaveProperty("bic");
    expect(result.theoreticalValues.length).toBe(powerLawTestData.length);
  });

  it("should validate data correctly", () => {
    const validResult = analyzer.validateData(powerLawTestData);
    expect(validResult.valid).toBe(true);

    const invalidResult = analyzer.validateData([{ value: 1, ccdf: 0.5 }]);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.message).toContain("at least 5 data points");
  });

  it("should throw error for insufficient data", () => {
    expect(() => analyzer.analyze([])).toThrow(
      "Data must be a non-empty array"
    );

    const insufficientData = [
      { value: 1, ccdf: 0 },
      { value: 2, ccdf: 0 },
    ];
    expect(() => analyzer.analyze(insufficientData)).toThrow(
      "Not enough valid data points"
    );
  });

  it("should calculate confidence levels correctly", () => {
    expect(analyzer.getConfidenceLevel(0.99)).toBe("Very High");
    expect(analyzer.getConfidenceLevel(0.96)).toBe("High");
    expect(analyzer.getConfidenceLevel(0.92)).toBe("Moderate");
    expect(analyzer.getConfidenceLevel(0.85)).toBe("Low");
    expect(analyzer.getConfidenceLevel(0.7)).toBe("Very Low");
  });

  it("should generate plot data correctly", () => {
    const parameters = { exponent: 2, scalingConstant: 1 };
    const plotData = analyzer.getPlotData(powerLawTestData, parameters);

    expect(plotData).toHaveProperty("logLog");
    expect(plotData).toHaveProperty("linear");
    expect(plotData.logLog.empirical.length).toBe(powerLawTestData.length);
    expect(plotData.linear.theoretical.length).toBe(powerLawTestData.length);
  });
});
