// Tests for DistributionAnalyzer base interface and utilities

describe("DistributionAnalyzer", () => {
  it("should not allow direct instantiation", () => {
    expect(() => new DistributionAnalyzer()).toThrow(
      "DistributionAnalyzer is an abstract class"
    );
  });

  it("should require subclasses to implement abstract methods", () => {
    class TestAnalyzer extends DistributionAnalyzer {
      constructor() {
        super();
        this.name = "test";
        this.displayName = "Test";
        this.description = "Test distribution";
      }
    }

    const analyzer = new TestAnalyzer();

    expect(() => analyzer.analyze([])).toThrow(
      "analyze() method must be implemented"
    );
    expect(() => analyzer.validateData([])).toThrow(
      "validateData() method must be implemented"
    );
    expect(() => analyzer.getTheoreticalCCDF([], {})).toThrow(
      "getTheoreticalCCDF() method must be implemented"
    );
    expect(() => analyzer.getPlotData([], {})).toThrow(
      "getPlotData() method must be implemented"
    );
    expect(() => analyzer.getDistributionSpecificPlot([])).toThrow(
      "getDistributionSpecificPlot() method must be implemented"
    );
    expect(() => analyzer.calculateGoodnessOfFit([], [])).toThrow(
      "calculateGoodnessOfFit() method must be implemented"
    );
  });

  it("should provide default implementations for utility methods", () => {
    class TestAnalyzer extends DistributionAnalyzer {
      constructor() {
        super();
        this.name = "test";
        this.displayName = "Test";
        this.description = "Test distribution";
      }
    }

    const analyzer = new TestAnalyzer();

    expect(analyzer.getMinimumDataPoints()).toBe(5);
    expect(analyzer.getRecommendedMinimumRange()).toBe(10);
  });

  it("should correctly determine good fit based on R²", () => {
    class TestAnalyzer extends DistributionAnalyzer {
      constructor() {
        super();
        this.name = "test";
        this.displayName = "Test";
      }
    }

    const analyzer = new TestAnalyzer();

    const goodResult = { goodnessOfFit: { rSquared: 0.95 } };
    const badResult = { goodnessOfFit: { rSquared: 0.7 } };

    expect(analyzer.isGoodFit(goodResult)).toBe(true);
    expect(analyzer.isGoodFit(badResult)).toBe(false);
  });

  it("should calculate confidence scores correctly", () => {
    class TestAnalyzer extends DistributionAnalyzer {
      constructor() {
        super();
        this.name = "test";
        this.displayName = "Test";
      }
    }

    const analyzer = new TestAnalyzer();

    const result1 = { goodnessOfFit: { rSquared: 0.95 } };
    const result2 = { goodnessOfFit: { confidenceScore: 0.8 } };
    const result3 = { goodnessOfFit: { kolmogorovSmirnov: { pValue: 0.6 } } };
    const result4 = { goodnessOfFit: {} };

    expect(analyzer.getConfidenceScore(result1)).toBe(0.95);
    expect(analyzer.getConfidenceScore(result2)).toBe(0.8);
    expect(analyzer.getConfidenceScore(result3)).toBe(0.6);
    expect(analyzer.getConfidenceScore(result4)).toBe(0.5);
  });

  it("should compare results correctly", () => {
    class TestAnalyzer extends DistributionAnalyzer {
      constructor() {
        super();
        this.name = "test";
        this.displayName = "Test";
      }
    }

    const analyzer = new TestAnalyzer();

    const betterResult = { goodnessOfFit: { rSquared: 0.95, aic: 100 } };
    const worseResult = { goodnessOfFit: { rSquared: 0.8, aic: 120 } };

    expect(analyzer.compareWith(betterResult, worseResult)).toBeGreaterThan(0);
    expect(analyzer.compareWith(worseResult, betterResult)).toBeLessThan(0);
  });

  it("should generate appropriate summaries", () => {
    class TestAnalyzer extends DistributionAnalyzer {
      constructor() {
        super();
        this.name = "test";
        this.displayName = "Test Distribution";
      }
    }

    const analyzer = new TestAnalyzer();

    const goodResult = { goodnessOfFit: { rSquared: 0.95 } };
    const badResult = { goodnessOfFit: { rSquared: 0.7 } };

    const goodSummary = analyzer.getSummary(goodResult);
    const badSummary = analyzer.getSummary(badResult);

    expect(goodSummary).toContain("high evidence");
    expect(goodSummary).toContain("Test Distribution");
    expect(badSummary).toContain("does not show strong evidence");
    expect(badSummary).toContain("Test Distribution");
  });
});

describe("DistributionUtils", () => {
  class MockAnalyzer extends DistributionAnalyzer {
    constructor() {
      super();
      this.name = "mock";
      this.displayName = "Mock Distribution";
      this.description = "Mock for testing";
    }

    isGoodFit(result) {
      return result.goodnessOfFit.rSquared > 0.9;
    }

    getConfidenceScore(result) {
      return result.goodnessOfFit.rSquared || 0.5;
    }

    getSummary(result) {
      return `Mock summary for ${result.goodnessOfFit.rSquared}`;
    }
  }

  it("should standardize results correctly", () => {
    const analyzer = new MockAnalyzer();
    const rawResult = {
      parameters: { param1: 1.5 },
      goodnessOfFit: { rSquared: 0.95, aic: 100 },
      theoreticalValues: [1, 2, 3],
      validDataPoints: 10,
      originalDataPoints: 12,
    };

    const standardized = DistributionUtils.standardizeResult(
      rawResult,
      analyzer
    );

    expect(standardized.distributionType).toBe("mock");
    expect(standardized.displayName).toBe("Mock Distribution");
    expect(standardized.description).toBe("Mock for testing");
    expect(standardized.parameters).toEqual({ param1: 1.5 });
    expect(standardized.isGoodFit).toBe(true);
    expect(standardized.confidenceScore).toBe(0.95);
    expect(standardized.summary).toContain("Mock summary");
    expect(standardized.validDataPoints).toBe(10);
  });

  it("should rank results by confidence score", () => {
    const results = [
      { confidenceScore: 0.8, goodnessOfFit: { aic: 120 } },
      { confidenceScore: 0.95, goodnessOfFit: { aic: 100 } },
      { confidenceScore: 0.7, goodnessOfFit: { aic: 110 } },
    ];

    const ranked = DistributionUtils.rankResults(results);

    expect(ranked[0].confidenceScore).toBe(0.95);
    expect(ranked[1].confidenceScore).toBe(0.8);
    expect(ranked[2].confidenceScore).toBe(0.7);
  });

  it("should use AIC as tiebreaker when confidence scores are similar", () => {
    const results = [
      { confidenceScore: 0.91, goodnessOfFit: { aic: 120 } },
      { confidenceScore: 0.92, goodnessOfFit: { aic: 100 } },
    ];

    const ranked = DistributionUtils.rankResults(results);

    // Should prefer lower AIC when confidence scores are close
    expect(ranked[0].goodnessOfFit.aic).toBe(100);
    expect(ranked[1].goodnessOfFit.aic).toBe(120);
  });

  it("should identify best fit correctly", () => {
    const goodResults = [
      { isGoodFit: true, confidenceScore: 0.95 },
      { isGoodFit: true, confidenceScore: 0.85 },
      { isGoodFit: false, confidenceScore: 0.7 },
    ];

    const badResults = [
      { isGoodFit: false, confidenceScore: 0.8 },
      { isGoodFit: false, confidenceScore: 0.7 },
    ];

    const bestGood = DistributionUtils.getBestFit(goodResults);
    const bestBad = DistributionUtils.getBestFit(badResults);

    expect(bestGood).toBeTruthy();
    expect(bestGood.confidenceScore).toBe(0.95);
    expect(bestBad).toBe(null);
  });
});

// Tests for AnalysisEngine
describe("AnalysisEngine", () => {
  class MockAnalyzer extends DistributionAnalyzer {
    constructor(name, displayName, shouldFail = false) {
      super();
      this.name = name;
      this.displayName = displayName;
      this.description = `${displayName} distribution`;
      this.shouldFail = shouldFail;
    }

    validateData(data) {
      if (this.shouldFail) {
        return { valid: false, message: "Mock validation failure" };
      }
      return { valid: true, message: "Data is valid" };
    }

    analyze(data) {
      if (this.shouldFail) {
        throw new Error("Mock analysis failure");
      }
      return {
        parameters: { param1: 1.5 },
        goodnessOfFit: {
          rSquared: this.name === "good" ? 0.95 : 0.7,
          aic: this.name === "good" ? 100 : 150,
        },
        theoreticalValues: data,
        validDataPoints: data.length,
        originalDataPoints: data.length,
      };
    }

    getTheoreticalCCDF(xValues, parameters) {
      return xValues.map((x) => Math.exp(-x));
    }

    getPlotData(data, parameters) {
      return { linear: data };
    }

    getDistributionSpecificPlot(data) {
      return data;
    }

    calculateGoodnessOfFit(empiricalData, theoreticalData) {
      return { rSquared: 0.9 };
    }
  }

  let engine;

  beforeEach(() => {
    engine = new AnalysisEngine();
  });

  it("should register and manage analyzers", () => {
    const analyzer1 = new MockAnalyzer("test1", "Test 1");
    const analyzer2 = new MockAnalyzer("test2", "Test 2");

    engine.registerAnalyzer(analyzer1);
    engine.registerAnalyzer(analyzer2, false); // Not default

    expect(engine.listAnalyzers()).toEqual(["test1", "test2"]);
    expect(engine.getAnalyzer("test1")).toBe(analyzer1);
    expect(engine.getAnalyzer("nonexistent")).toBe(null);
    expect(engine.defaultAnalyzers).toEqual(["test1"]);
  });

  it("should unregister analyzers", () => {
    const analyzer = new MockAnalyzer("test", "Test");
    engine.registerAnalyzer(analyzer);

    expect(engine.listAnalyzers()).toContain("test");

    engine.unregisterAnalyzer("test");

    expect(engine.listAnalyzers()).not.toContain("test");
    expect(engine.defaultAnalyzers).not.toContain("test");
  });

  it("should analyze with single analyzer", () => {
    const analyzer = new MockAnalyzer("good", "Good Analyzer");
    engine.registerAnalyzer(analyzer);

    const data = [
      { value: 1, ccdf: 0.5 },
      { value: 2, ccdf: 0.3 },
    ];
    const result = engine.analyzeSingle("good", data);

    expect(result.distributionType).toBe("good");
    expect(result.displayName).toBe("Good Analyzer");
    expect(result.isGoodFit).toBe(true);
    expect(result.confidenceScore).toBe(0.95);
  });

  it("should handle analyzer not found", () => {
    expect(() => engine.analyzeSingle("nonexistent", [])).toThrow(
      "Analyzer 'nonexistent' not found"
    );
  });

  it("should handle validation failure", () => {
    const analyzer = new MockAnalyzer("failing", "Failing Analyzer", true);
    engine.registerAnalyzer(analyzer);

    expect(() => engine.analyzeSingle("failing", [])).toThrow(
      "Data validation failed"
    );
  });

  it("should analyze with multiple analyzers", () => {
    const goodAnalyzer = new MockAnalyzer("good", "Good Analyzer");
    const badAnalyzer = new MockAnalyzer("bad", "Bad Analyzer");
    const failingAnalyzer = new MockAnalyzer(
      "failing",
      "Failing Analyzer",
      true
    );

    engine.registerAnalyzer(goodAnalyzer);
    engine.registerAnalyzer(badAnalyzer);
    engine.registerAnalyzer(failingAnalyzer);

    const data = [
      { value: 1, ccdf: 0.5 },
      { value: 2, ccdf: 0.3 },
    ];
    const result = engine.analyzeMultiple(data);

    expect(result.results.length).toBe(2); // good and bad, failing should error
    expect(result.errors.length).toBe(1);
    expect(result.bestFit).toBeTruthy();
    expect(result.bestFit.distributionType).toBe("good");
    expect(result.summary.verdict).toContain("Good Analyzer");
  });

  it("should generate appropriate summary", () => {
    const goodAnalyzer = new MockAnalyzer("good", "Good Analyzer");
    engine.registerAnalyzer(goodAnalyzer);

    const data = [{ value: 1, ccdf: 0.5 }];
    const result = engine.analyzeMultiple(data);

    expect(result.summary.verdict).toContain("Good Analyzer distribution");
    expect(result.summary.confidence).toBe(0.95);
    expect(result.summary.analyzersRun).toBe(1);
    expect(result.summary.successfulAnalyses).toBe(1);
    expect(result.summary.hasErrors).toBe(false);
  });
});
