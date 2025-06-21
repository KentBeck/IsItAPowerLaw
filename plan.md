# Plan: Extend Analysis to Log-Normal & Exponential Distributions

## Overview

Extend the current power law analysis tool to also detect and analyze log-normal and exponential distributions. This will provide users with a comprehensive distribution analysis tool that can identify the most likely distribution type for their data.

## Current State Analysis

- **Existing**: Power law detection using log-log linear regression on CCDF
- **Architecture**: Single-page JavaScript application with Chart.js visualization
- **Input**: Value-frequency pairs
- **Output**: Power law verdict with R² goodness of fit

## Critical Structural Changes Needed First

### Current Problems

1. **Monolithic Functions**: `processData()` is 135 lines doing everything
2. **Tight Coupling**: Data processing, analysis, and UI updates all mixed together
3. **Global State**: `processedData` and `stats` are global variables
4. **No Separation of Concerns**: Statistical analysis mixed with DOM manipulation
5. **Hard to Test**: No pure functions, everything depends on DOM elements
6. **No Abstraction**: Power law logic is hardcoded, not extensible

### Required Refactoring (Tidy First Approach)

#### Phase 0: Structural Cleanup (MUST DO FIRST)

- [x] **0.1** Extract data processing into pure functions ✅ COMPLETE

  - `parseInputData(inputText)` → returns parsed data or throws error
  - `calculateBasicStats(data)` → returns statistics object
  - `calculateCCDF(data)` → returns data with CDF/CCDF

- [x] **0.2** Extract statistical analysis into testable modules ✅ COMPLETE

  - `statisticalTests.js` - pure functions for regression, goodness-of-fit
  - `distributionAnalyzers.js` - separate analyzer for each distribution type
  - `mathUtils.js` - utility functions for log transforms, etc.

- [x] **0.3** Create distribution abstraction layer ✅ COMPLETE

  ```javascript
  class DistributionAnalyzer {
    analyze(data) {
      /* returns { parameters, goodnessOfFit, theoretical } */
    }
    getTheoreticalValues(data, parameters) {
      /* returns theoretical curve */
    }
    getPlotData(data, parameters) {
      /* returns plot-specific transformations */
    }
  }
  ```

- [x] **0.4** Separate UI concerns from business logic ✅ COMPLETE

  - `dataProcessor.js` - pure data processing functions
  - `analysisEngine.js` - coordinates multiple distribution analyses
  - `chartManager.js` - handles all Chart.js interactions (pending)
  - `uiController.js` - handles DOM updates and user interactions (pending)

- [ ] **0.5** Implement proper state management
  ```javascript
  class AnalysisState {
    constructor() {
      this.rawData = null;
      this.processedData = null;
      this.analysisResults = new Map(); // keyed by distribution type
      this.currentView = "loglog";
    }
  }
  ```

#### Phase 0.6: Add Testing Infrastructure

- [x] Set up Jest or similar testing framework ✅ COMPLETE
- [x] Create test data generators for known distributions ✅ COMPLETE
- [x] Add unit tests for all pure functions ✅ COMPLETE
- [x] Add integration tests for analysis pipeline ✅ COMPLETE

### Benefits of This Refactoring

1. **Testability**: Each function can be tested in isolation
2. **Extensibility**: Adding new distributions becomes trivial
3. **Maintainability**: Clear separation of concerns
4. **Reusability**: Statistical functions can be reused across distributions
5. **Debugging**: Easier to isolate and fix issues

### Example of Improved Architecture

```javascript
// Before: Monolithic function (135 lines)
function processData(inputData) {
  /* everything mixed together */
}

// After: Modular, testable functions
const dataProcessor = {
  parseInput: (text) => {
    /* pure function */
  },
  calculateCCDF: (data) => {
    /* pure function */
  },
  calculateBasicStats: (data) => {
    /* pure function */
  },
};

const powerLawAnalyzer = new DistributionAnalyzer({
  name: "powerLaw",
  analyze: (data) => {
    /* returns analysis results */
  },
  getTheoreticalCCDF: (x, params) => Math.pow(x, -params.alpha),
  getPlotTransform: (data) => ({ x: log10(data.x), y: log10(data.y) }),
});

const analysisEngine = {
  analyzeAll: (data) => {
    const results = new Map();
    for (const analyzer of [
      powerLawAnalyzer,
      logNormalAnalyzer,
      exponentialAnalyzer,
    ]) {
      results.set(analyzer.name, analyzer.analyze(data));
    }
    return results;
  },
};
```

## Implementation Plan

### Phase 1: Core Distribution Analysis Framework

- [x] **1.1** Refactor existing code to support multiple distribution types ✅ COMPLETE

  - Extract power law analysis into separate function
  - Create generic distribution analysis framework
  - Implement distribution comparison infrastructure

- [x] **1.2** Implement log-normal distribution analysis ✅ COMPLETE

  - Add log-normal CCDF calculation: P(X > x) = 1 - Φ((ln(x) - μ)/σ)
  - Implement parameter estimation using method of moments or MLE
  - Create goodness-of-fit test (Kolmogorov-Smirnov or Anderson-Darling)

- [x] **1.3** Implement exponential distribution analysis ✅ COMPLETE
  - Add exponential CCDF calculation: P(X > x) = e^(-λx)
  - Implement parameter estimation (λ = 1/mean)
  - Create goodness-of-fit test

### Phase 2: Statistical Testing & Model Selection

- [x] **2.1** Implement comprehensive goodness-of-fit tests ✅ COMPLETE

  - Kolmogorov-Smirnov test for all distributions
  - Anderson-Darling test (more sensitive to tail behavior)
  - Calculate AIC/BIC for model comparison

- [x] **2.2** Add distribution comparison logic ✅ COMPLETE

  - Compare R²/goodness-of-fit across all three distributions
  - Implement likelihood ratio tests where applicable
  - Create confidence scoring system for each distribution type

- [x] **2.3** Handle edge cases and validation ✅ COMPLETE
  - Minimum sample size requirements for each test
  - Data preprocessing (handling zeros, outliers)
  - Statistical significance thresholds

### Phase 3: Visualization Enhancements

- [ ] **3.1** Add new plot types for distribution analysis

  - Log-normal: Normal probability plot (ln(x) vs Φ⁻¹(F(x)))
  - Exponential: Exponential probability plot (x vs -ln(1-F(x)))
  - Q-Q plots for visual goodness-of-fit assessment

- [ ] **3.2** Enhance existing visualizations

  - Overlay theoretical curves for all three distributions on CCDF plots
  - Add residual plots to show fit quality
  - Color-code best-fitting distribution

- [ ] **3.3** Interactive plot controls
  - Toggle between different probability plots
  - Show/hide theoretical distributions
  - Zoom functionality for detailed analysis

### Phase 4: User Interface & Results

- [ ] **4.1** Update results panel

  - Show analysis for all three distribution types
  - Display parameter estimates with confidence intervals
  - Rank distributions by goodness-of-fit

- [ ] **4.2** Enhanced verdict system

  - Multi-distribution comparison verdict
  - Confidence levels for each distribution type
  - Recommendations for inconclusive cases

- [ ] **4.3** Educational content
  - Add explanations for log-normal and exponential distributions
  - Provide interpretation guidance for different plot types
  - Include examples of real-world phenomena following each distribution

### Phase 5: Advanced Features

- [ ] **5.1** Parameter uncertainty quantification

  - Bootstrap confidence intervals for parameters
  - Uncertainty propagation in theoretical curves

- [ ] **5.2** Additional distribution types (future extension)

  - Weibull distribution
  - Gamma distribution
  - Pareto distribution (generalized power law)

- [ ] **5.3** Data export and reporting
  - Export analysis results as JSON/CSV
  - Generate printable analysis reports
  - Save/load analysis sessions

## Technical Implementation Details

### Distribution Analysis Functions

```javascript
// Core analysis structure
const distributions = {
  powerLaw: { analyze, plot, test },
  logNormal: { analyze, plot, test },
  exponential: { analyze, plot, test },
};

// Parameter estimation methods
function estimateLogNormalParams(data) {
  // Method of moments or MLE
}

function estimateExponentialParams(data) {
  // λ = 1/mean for exponential
}
```

### Statistical Tests

- Implement Kolmogorov-Smirnov test from scratch
- Add Anderson-Darling test for better tail sensitivity
- Calculate p-values and test statistics

### Visualization Strategy

- Extend current Chart.js setup with new plot types
- Add mathematical transformation utilities
- Implement probability plot calculations

## Success Criteria

1. **Accuracy**: Correctly identify distribution type for known test cases
2. **Usability**: Intuitive interface for non-statisticians
3. **Performance**: Fast analysis for datasets up to 10,000 points
4. **Robustness**: Handle edge cases gracefully
5. **Educational**: Help users understand different distribution types

## Testing Strategy

- Unit tests for each distribution analysis function
- Integration tests with known datasets
- Validation against R/Python statistical packages
- User acceptance testing with domain experts

## Deliverables

1. Enhanced web application with multi-distribution analysis
2. Comprehensive test suite
3. Updated documentation and help content
4. Example datasets for each distribution type
