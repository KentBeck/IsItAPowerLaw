// Tests for dataProcessor.js functions

describe("parseInputData", () => {
  it("should parse valid input correctly", () => {
    const input = "1 100\n2 50\n3 25\n4 12\n5 6";
    const result = parseInputData(input);

    expect(result).toEqual([
      { value: 1, frequency: 100 },
      { value: 2, frequency: 50 },
      { value: 3, frequency: 25 },
      { value: 4, frequency: 12 },
      { value: 5, frequency: 6 },
    ]);
  });

  it("should handle extra whitespace", () => {
    const input = "  1   100  \n  2   50  \n  3   25  \n  4   12  \n  5   6  ";
    const result = parseInputData(input);

    expect(result.length).toBe(5);
    expect(result[0]).toEqual({ value: 1, frequency: 100 });
  });

  it("should handle decimal values", () => {
    const input = "1.5 100\n2.7 50\n3.1 25\n4.9 12\n5.2 6";
    const result = parseInputData(input);

    expect(result[0].value).toBeCloseTo(1.5);
    expect(result[1].value).toBeCloseTo(2.7);
  });

  it("should throw error for non-string input", () => {
    expect(() => parseInputData(123)).toThrow("Input must be a string");
    expect(() => parseInputData(null)).toThrow("Input must be a string");
  });

  it("should throw error for insufficient data points", () => {
    const input = "1 100\n2 50\n3 25";
    expect(() => parseInputData(input)).toThrow(
      "Please provide at least 5 data points"
    );
  });

  it("should throw error for incorrect format", () => {
    const input = "1 100\n2\n3 25\n4 12\n5 6";
    expect(() => parseInputData(input)).toThrow(
      "Line 2 is not in the correct format"
    );
  });

  it("should throw error for invalid numbers", () => {
    const input = "1 100\nabc 50\n3 25\n4 12\n5 6";
    expect(() => parseInputData(input)).toThrow(
      "Line 2 contains invalid numbers"
    );
  });

  it("should throw error for zero or negative values", () => {
    const input = "1 100\n0 50\n3 25\n4 12\n5 6";
    expect(() => parseInputData(input)).toThrow(
      "Line 2 contains zero or negative numbers"
    );

    const input2 = "1 100\n2 -50\n3 25\n4 12\n5 6";
    expect(() => parseInputData(input2)).toThrow(
      "Line 2 contains zero or negative numbers"
    );
  });
});

describe("calculateBasicStats", () => {
  const testData = [
    { value: 1, frequency: 100 },
    { value: 2, frequency: 50 },
    { value: 3, frequency: 25 },
    { value: 4, frequency: 12 },
    { value: 5, frequency: 6 },
  ];

  it("should calculate correct statistics", () => {
    const stats = calculateBasicStats(testData);

    expect(stats.totalObservations).toBe(193);
    expect(stats.minValue).toBe(1);
    expect(stats.maxValue).toBe(5);
    // Mean = (1*100 + 2*50 + 3*25 + 4*12 + 5*6) / 193 = 353/193 ≈ 1.829
    expect(stats.meanValue).toBeCloseTo(1.829, 2);
  });

  it("should handle single data point", () => {
    const singleData = [{ value: 10, frequency: 5 }];
    const stats = calculateBasicStats(singleData);

    expect(stats.totalObservations).toBe(5);
    expect(stats.minValue).toBe(10);
    expect(stats.maxValue).toBe(10);
    expect(stats.meanValue).toBe(10);
  });

  it("should throw error for empty array", () => {
    expect(() => calculateBasicStats([])).toThrow(
      "Data must be a non-empty array"
    );
  });

  it("should throw error for non-array input", () => {
    expect(() => calculateBasicStats(null)).toThrow(
      "Data must be a non-empty array"
    );
    expect(() => calculateBasicStats("not an array")).toThrow(
      "Data must be a non-empty array"
    );
  });
});

describe("calculateCCDF", () => {
  const testData = [
    { value: 1, frequency: 100 },
    { value: 2, frequency: 50 },
    { value: 3, frequency: 25 },
  ];

  it("should calculate probabilities correctly", () => {
    const result = calculateCCDF(testData);
    const total = 175; // 100 + 50 + 25

    expect(result[0].probability).toBeCloseTo(100 / 175, 3);
    expect(result[1].probability).toBeCloseTo(50 / 175, 3);
    expect(result[2].probability).toBeCloseTo(25 / 175, 3);
  });

  it("should calculate CDF correctly", () => {
    const result = calculateCCDF(testData);

    expect(result[0].cdf).toBeCloseTo(100 / 175, 3);
    expect(result[1].cdf).toBeCloseTo(150 / 175, 3);
    expect(result[2].cdf).toBeCloseTo(175 / 175, 3);
  });

  it("should calculate CCDF correctly", () => {
    const result = calculateCCDF(testData);

    expect(result[0].ccdf).toBeCloseTo(75 / 175, 3);
    expect(result[1].ccdf).toBeCloseTo(25 / 175, 3);
    expect(result[2].ccdf).toBeCloseTo(0 / 175, 3);
  });

  it("should preserve original data", () => {
    const result = calculateCCDF(testData);

    expect(result[0].value).toBe(1);
    expect(result[0].frequency).toBe(100);
    expect(result[1].value).toBe(2);
    expect(result[1].frequency).toBe(50);
  });

  it("should throw error for empty array", () => {
    expect(() => calculateCCDF([])).toThrow("Data must be a non-empty array");
  });

  it("should throw error for non-array input", () => {
    expect(() => calculateCCDF(null)).toThrow("Data must be a non-empty array");
  });
});

describe("Integration test with sample data", () => {
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

  it("should process sample data correctly end-to-end", () => {
    // Parse the data
    const parsedData = parseInputData(sampleDataText);
    expect(parsedData.length).toBe(10);
    expect(parsedData[0]).toEqual({ value: 1, frequency: 1436 });
    expect(parsedData[9]).toEqual({ value: 10, frequency: 132 });

    // Calculate basic stats
    const stats = calculateBasicStats(parsedData);
    expect(stats.totalObservations).toBe(11065); // Sum of all frequencies
    expect(stats.minValue).toBe(1);
    expect(stats.maxValue).toBe(10);
    expect(stats.meanValue).toBeCloseTo(2.47, 1); // Weighted mean

    // Calculate CCDF
    const dataWithCCDF = calculateCCDF(parsedData);
    expect(dataWithCCDF.length).toBe(10);
    expect(dataWithCCDF[0].probability).toBeCloseTo(1436 / 11065, 3);
    expect(dataWithCCDF[0].cdf).toBeCloseTo(1436 / 11065, 3);
    expect(dataWithCCDF[9].cdf).toBeCloseTo(1.0, 3); // Last point should have CDF ≈ 1
  });
});
