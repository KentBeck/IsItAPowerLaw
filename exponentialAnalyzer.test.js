// Tests for ExponentialAnalyzer

describe("ExponentialAnalyzer", () => {
  let ExponentialAnalyzer;
  let DistributionAnalyzer;

  beforeAll(() => {
    // Load modules in Node.js environment
    if (typeof require !== "undefined") {
      const { DistributionAnalyzer: DA } = require("./distributionAnalyzer.js");
      DistributionAnalyzer = DA;
      ExponentialAnalyzer = require("./exponentialAnalyzer.js");
    } else {
      // Browser environment - classes should be available globally
      DistributionAnalyzer = window.DistributionAnalyzer;
      ExponentialAnalyzer = window.ExponentialAnalyzer;
    }
  });

  describe("constructor", () => {
    it("should create an ExponentialAnalyzer with correct properties", () => {
      const analyzer = new ExponentialAnalyzer();

      expect(analyzer.name).toBe("exponential");
      expect(analyzer.displayName).toBe("Exponential");
      expect(analyzer.description).toBe("P(X > x) = e^(-λx)");
      expect(analyzer.parameterNames).toEqual(["lambda"]);
    });

    it("should extend DistributionAnalyzer", () => {
      const analyzer = new ExponentialAnalyzer();
      expect(analyzer instanceof DistributionAnalyzer).toBe(true);
    });
  });

  describe("validateData", () => {
    let analyzer;

    beforeEach(() => {
      analyzer = new ExponentialAnalyzer();
    });

    it("should reject non-array data", () => {
      const result = analyzer.validateData("not an array");
      expect(result.valid).toBe(false);
      expect(result.message).toBe("Data must be an array");
    });

    it("should reject data with too few points", () => {
      const data = [
        { value: 1, ccdf: 0.8 },
        { value: 2, ccdf: 0.6 },
      ];
      const result = analyzer.validateData(data);
      expect(result.valid).toBe(false);
      expect(result.message).toBe(
        "Need at least 3 data points for exponential analysis"
      );
    });

    it("should reject data with non-positive values", () => {
      const data = [
        { value: -1, ccdf: 0.9 },
        { value: 0, ccdf: 0.8 },
        { value: 1, ccdf: 0.6 },
      ];
      const result = analyzer.validateData(data);
      expect(result.valid).toBe(false);
      expect(result.message).toBe(
        "Need at least 3 data points with positive values for exponential analysis"
      );
    });

    it("should accept valid data", () => {
      const data = [
        { value: 1, ccdf: 0.8 },
        { value: 2, ccdf: 0.6 },
        { value: 3, ccdf: 0.4 },
        { value: 4, ccdf: 0.2 },
      ];
      const result = analyzer.validateData(data);
      expect(result.valid).toBe(true);
      expect(result.message).toBe("Data is suitable for exponential analysis");
    });

    it("should warn about non-positive values but still accept if enough positive values", () => {
      const data = [
        { value: -1, ccdf: 0.9 },
        { value: 1, ccdf: 0.8 },
        { value: 2, ccdf: 0.6 },
        { value: 3, ccdf: 0.4 },
        { value: 4, ccdf: 0.2 },
      ];
      const result = analyzer.validateData(data);
      expect(result.valid).toBe(true);
      expect(result.warning).toBe(true);
      expect(result.message).toContain("non-positive values will be excluded");
    });
  });

  describe("getTheoreticalCCDF", () => {
    let analyzer;

    beforeEach(() => {
      analyzer = new ExponentialAnalyzer();
    });

    it("should calculate theoretical CCDF correctly", () => {
      const parameters = { lambda: 0.5 };
      const xValues = [0, 1, 2, 4];

      const ccdfValues = analyzer.getTheoreticalCCDF(xValues, parameters);

      expect(ccdfValues[0]).toBeCloseTo(1.0, 5); // P(X > 0) = 1
      expect(ccdfValues[1]).toBeCloseTo(Math.exp(-0.5), 5); // P(X > 1) = e^(-0.5)
      expect(ccdfValues[2]).toBeCloseTo(Math.exp(-1.0), 5); // P(X > 2) = e^(-1.0)
      expect(ccdfValues[3]).toBeCloseTo(Math.exp(-2.0), 5); // P(X > 4) = e^(-2.0)
    });

    it("should return 1 for negative x values", () => {
      const parameters = { lambda: 1.0 };
      const xValues = [-2, -1];

      const ccdfValues = analyzer.getTheoreticalCCDF(xValues, parameters);

      expect(ccdfValues[0]).toBe(1);
      expect(ccdfValues[1]).toBe(1);
    });

    it("should handle lambda = 0 gracefully", () => {
      const parameters = { lambda: 0 };
      const xValues = [1, 2, 3];

      const ccdfValues = analyzer.getTheoreticalCCDF(xValues, parameters);

      // When lambda = 0, CCDF should be 1 for all x
      expect(ccdfValues[0]).toBe(1);
      expect(ccdfValues[1]).toBe(1);
      expect(ccdfValues[2]).toBe(1);
    });
  });

  describe("analyze", () => {
    let analyzer;

    beforeEach(() => {
      analyzer = new ExponentialAnalyzer();
    });

    it("should throw error for empty data", () => {
      expect(() => analyzer.analyze([])).toThrow(
        "Data must be a non-empty array"
      );
    });

    it("should throw error for non-array data", () => {
      expect(() => analyzer.analyze("not an array")).toThrow(
        "Data must be a non-empty array"
      );
    });

    it("should analyze exponential data correctly", () => {
      // Create test data that follows exponential distribution
      const testData = [
        { value: 0.5, ccdf: 0.779 },
        { value: 1.0, ccdf: 0.607 },
        { value: 1.5, ccdf: 0.472 },
        { value: 2.0, ccdf: 0.368 },
        { value: 2.5, ccdf: 0.287 },
        { value: 3.0, ccdf: 0.223 },
      ];

      const result = analyzer.analyze(testData);

      expect(result.distributionName).toBe("exponential");
      expect(result.parameters).toHaveProperty("lambda");
      expect(result.parameters.lambda).toBeGreaterThan(0);
      expect(result.goodnessOfFit).toHaveProperty("rSquared");
      expect(result.theoreticalValues).toHaveLength(testData.length);
      expect(result.validDataPoints).toBe(testData.length);
      expect(result.originalDataPoints).toBe(testData.length);
    });

    it("should filter out non-positive values", () => {
      const testData = [
        { value: -1, ccdf: 0.9 },
        { value: 0, ccdf: 0.85 },
        { value: 1.0, ccdf: 0.607 },
        { value: 2.0, ccdf: 0.368 },
        { value: 3.0, ccdf: 0.223 },
      ];

      const result = analyzer.analyze(testData);

      expect(result.validDataPoints).toBe(3); // Only positive values
      expect(result.originalDataPoints).toBe(5);
    });
  });

  describe("getDistributionSpecificPlot", () => {
    let analyzer;

    beforeEach(() => {
      analyzer = new ExponentialAnalyzer();
    });

    it("should generate exponential probability plot", () => {
      const testData = [
        { value: 1, ccdf: 0.8 },
        { value: 2, ccdf: 0.6 },
        { value: 3, ccdf: 0.4 },
        { value: 4, ccdf: 0.2 },
      ];

      const plotData = analyzer.getDistributionSpecificPlot(testData);

      expect(plotData.type).toBe("exponentialProbability");
      expect(plotData.title).toBe("Exponential Probability Plot");
      expect(plotData.xLabel).toBe("Value");
      expect(plotData.yLabel).toBe("-ln(CCDF)");
      expect(plotData.data).toHaveLength(testData.length);
      expect(plotData.description).toContain("straight line");
    });
  });

  describe("getMinimumDataPoints", () => {
    it("should return minimum required data points", () => {
      const analyzer = new ExponentialAnalyzer();
      expect(analyzer.getMinimumDataPoints()).toBe(3);
    });
  });

  describe("getRecommendedMinimumRange", () => {
    it("should return recommended minimum range", () => {
      const analyzer = new ExponentialAnalyzer();
      expect(analyzer.getRecommendedMinimumRange()).toBe(3);
    });
  });
});
