// Multi-Distribution Analysis System
// Uses the new modular architecture with AnalysisEngine

const sampleData = `1 1436
2 5491
3 1773
4 1163
5 737
6 512
7 354
8 267
9 200
10 132
11 146
12 52
13 45
14 32
15 32
16 26
17 27
18 14
19 11
20 10
21 7
22 7
23 7
24 6
25 2
26 2
27 5
28 1
29 2
30 1
31 2
33 1
34 1
36 1
37 1
39 1
43 2
44 1
70 1
73 1
74 1`;

let currentViewMode = "loglog";
let currentDistribution = "all"; // "all", "powerLaw", "logNormal", "exponential"
let chartInstance = null;
let analysisResults = null;
let analysisEngine = null;

// Interactive control state
let visibleDistributions = ["powerLaw", "logNormal", "exponential"];
let currentPlotType = "logarithmic";

/*
 * Fathom Analytics Tracking Events for Enhanced Features:
 *
 * Core Analysis:
 * - multi_distribution_analysis: When user runs analysis with multiple distributions
 *
 * View Mode Changes:
 * - enhanced_ccdf_view: User clicks Enhanced CCDF button
 * - residual_plot_view: User clicks Residual Plot button
 * - qq_plot_view: User clicks Q-Q Plot button
 * - powerlaw_plot_view: User clicks Power Law Plot button
 * - lognormal_plot_view: User clicks Log-Normal Plot button
 * - exponential_plot_view: User clicks Exponential Plot button
 *
 * Interactive Controls:
 * - interactive_controls_shown: Interactive controls panel becomes visible
 * - toggle_powerlaw: User toggles Power Law distribution visibility
 * - toggle_lognormal: User toggles Log-Normal distribution visibility
 * - toggle_exponential: User toggles Exponential distribution visibility
 * - change_plot_type: User switches between linear/logarithmic scales
 *
 * Chart Interactions:
 * - chart_zoom: User zooms in/out on chart
 * - chart_pan: User pans around chart
 * - enhanced_ccdf_plot_rendered: Enhanced CCDF plot is displayed
 * - residual_plot_rendered: Residual plot is displayed
 */

// Initialize the analysis engine with all three distribution analyzers
function initializeAnalysisEngine() {
  analysisEngine = new AnalysisEngine();
  analysisEngine.registerAnalyzer(new PowerLawAnalyzer());
  analysisEngine.registerAnalyzer(new LogNormalAnalyzer());
  analysisEngine.registerAnalyzer(new ExponentialAnalyzer());
}

function showError(message) {
  fathom.trackEvent("error");
  const errorMsg = document.getElementById("errorMsg");
  const resultsContainer = document.getElementById("resultsContainer");
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
  resultsContainer.classList.add("hidden");
}

function parseInput() {
  try {
    // Reset error message
    const errorMsg = document.getElementById("errorMsg");
    const dataInput = document.getElementById("dataInput");
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");

    const inputText = dataInput.value;

    // Use the new data processor
    const parsedData = parseInputData(inputText);
    const dataWithCCDF = calculateCCDF(parsedData);

    // Run multi-distribution analysis
    analyzeData(dataWithCCDF);
  } catch (err) {
    showError("Error parsing input: " + err.message);
  }
}

function analyzeData(dataWithCCDF) {
  try {
    // Run multi-distribution analysis using the analysis engine
    const result = analysisEngine.analyzeMultiple(dataWithCCDF);

    // Track multi-distribution analysis usage
    fathom.trackEvent("multi_distribution_analysis", {
      distributions_analyzed: result.results.length,
      best_fit: result.bestFit.distributionType,
      confidence: Math.round(result.bestFit.goodnessOfFit.rSquared * 100),
    });

    // Store results globally
    analysisResults = result;

    // Update the UI with results
    updateResults();
    updateChart();

    // Show results container
    const resultsContainer = document.getElementById("resultsContainer");
    resultsContainer.classList.remove("hidden");

    // Show interactive controls
    const interactiveControls = document.getElementById("interactiveControls");
    if (interactiveControls) {
      interactiveControls.classList.remove("hidden");
      fathom.trackEvent("interactive_controls_shown");
    }
  } catch (err) {
    showError("Error analyzing data: " + err.message);
  }
}

function updateResults() {
  if (!analysisResults) return;

  const bestFit = analysisResults.bestFit;
  const rankedResults = analysisResults.results;

  // Calculate basic statistics from the first result (they should be the same across all)
  const firstResult = rankedResults[0];
  const totalObs = firstResult.originalDataPoints;

  // Update basic statistics
  document.getElementById("totalObs").textContent = totalObs.toLocaleString();

  if (bestFit) {
    document.getElementById("bestDistribution").textContent =
      bestFit.displayName;

    // Format parameters based on distribution type
    let paramText = "";
    if (bestFit.distributionType === "powerLaw") {
      paramText = `α = ${bestFit.parameters.exponent.toFixed(2)}`;
    } else if (bestFit.distributionType === "logNormal") {
      paramText = `μ = ${bestFit.parameters.mu.toFixed(
        2
      )}, σ = ${bestFit.parameters.sigma.toFixed(2)}`;
    } else if (bestFit.distributionType === "exponential") {
      paramText = `λ = ${bestFit.parameters.lambda.toFixed(3)}`;
    }
    document.getElementById("bestParameters").textContent = paramText;

    document.getElementById("rSquared").textContent =
      bestFit.goodnessOfFit.rSquared.toFixed(4);
    document.getElementById("confidence").textContent =
      bestFit.goodnessOfFit.confidenceLevel;
    document.getElementById("overallConfidence").textContent = `${(
      analysisResults.summary.confidence * 100
    ).toFixed(1)}%`;
  } else {
    document.getElementById("bestDistribution").textContent = "None";
    document.getElementById("bestParameters").textContent = "N/A";
    document.getElementById("rSquared").textContent = "N/A";
    document.getElementById("confidence").textContent = "Very Low";
    document.getElementById("overallConfidence").textContent = "0%";
  }

  // Update verdict with multi-distribution results
  const verdictCard = document.getElementById("verdictCard");
  const verdictContent = document.getElementById("verdictContent");

  fathom.trackEvent(bestFit ? bestFit.distributionType : "no clear fit");

  if (bestFit) {
    verdictCard.className = "p-4 rounded-lg bg-green-50";
    verdictContent.innerHTML = `
      <div class="text-green-700 font-bold text-lg mb-2">
          ✓ ${analysisResults.summary.verdict}
      </div>
      <p class="text-sm">${analysisResults.summary.recommendation}</p>
    `;
  } else {
    verdictCard.className = "p-4 rounded-lg bg-yellow-50";
    verdictContent.innerHTML = `
      <div class="text-yellow-700 font-bold text-lg mb-2">
          ✗ ${analysisResults.summary.verdict}
      </div>
      <p class="text-sm">${analysisResults.summary.recommendation}</p>
    `;
  }

  // Update detailed distribution comparison
  updateDistributionComparison(rankedResults);
}

// Update the detailed distribution comparison panel
function updateDistributionComparison(rankedResults) {
  const container = document.getElementById("distributionComparison");
  if (!container) return;

  container.innerHTML = rankedResults
    .map((result, index) => {
      const rank = index + 1;
      const confidence = (result.confidenceScore * 100).toFixed(1);
      const isWinner = index === 0;

      // Format parameters
      let paramText = "";
      if (result.distributionType === "powerLaw") {
        paramText = `α = ${result.parameters.exponent.toFixed(2)}`;
      } else if (result.distributionType === "logNormal") {
        paramText = `μ = ${result.parameters.mu.toFixed(
          2
        )}, σ = ${result.parameters.sigma.toFixed(2)}`;
      } else if (result.distributionType === "exponential") {
        paramText = `λ = ${result.parameters.lambda.toFixed(3)}`;
      }

      const cardClass = isWinner
        ? "bg-green-50 border-2 border-green-200"
        : "bg-white border border-gray-200";

      const rankBadgeClass = isWinner
        ? "bg-green-500 text-white"
        : index === 1
        ? "bg-yellow-500 text-white"
        : "bg-gray-500 text-white";

      return `
      <div class="${cardClass} p-4 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-lg">${result.displayName}</h3>
          <span class="${rankBadgeClass} px-2 py-1 rounded-full text-xs font-bold">
            #${rank}
          </span>
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Confidence:</span>
            <span class="font-medium">${confidence}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">R²:</span>
            <span class="font-medium">${result.goodnessOfFit.rSquared.toFixed(
              3
            )}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Parameters:</span>
            <span class="font-medium text-xs">${paramText}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">AIC:</span>
            <span class="font-medium">${result.goodnessOfFit.aic.toFixed(
              1
            )}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Quality:</span>
            <span class="font-medium">${
              result.goodnessOfFit.confidenceLevel
            }</span>
          </div>
        </div>
        ${
          isWinner
            ? '<div class="mt-2 text-xs text-green-600 font-medium">🏆 Best Fit</div>'
            : ""
        }
      </div>
    `;
    })
    .join("");
}

function updateChart() {
  if (!analysisResults) return;

  const ctx = document.getElementById("chart").getContext("2d");

  // Destroy previous chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Get the best fit result for plotting
  const bestFit = analysisResults.bestFit;
  const firstResult = analysisResults.results[0]; // Use first result for data

  if (currentViewMode === "frequency") {
    // Show frequency distribution (bar chart)
    // We'll need to reconstruct this from the analysis results
    // For now, show a simple message
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Frequency view not yet implemented"],
        datasets: [
          {
            label: "Frequency",
            data: [1],
            backgroundColor: "rgba(130, 202, 157, 0.8)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Frequency distribution view coming soon",
          },
        },
      },
    });
  } else if (currentViewMode === "ccdf") {
    // Show CCDF in linear scale with all distributions
    const datasets = [
      {
        label: "Empirical CCDF",
        data: firstResult.theoreticalValues.map((d) => ({
          x: d.value,
          y: d.ccdf,
        })),
        backgroundColor: "rgba(136, 132, 216, 0.1)",
        borderColor: "rgba(136, 132, 216, 1)",
        borderWidth: 2,
        pointRadius: 3,
        showLine: true,
      },
    ];

    // Add theoretical curves for each distribution
    const colors = [
      "rgba(255, 115, 0, 1)", // Orange for first
      "rgba(34, 197, 94, 1)", // Green for second
      "rgba(239, 68, 68, 1)", // Red for third
    ];

    analysisResults.results.forEach((result, i) => {
      datasets.push({
        label: `${result.displayName} (${(result.confidenceScore * 100).toFixed(
          1
        )}%)`,
        data: result.theoreticalValues.map((d) => ({
          x: d.value,
          y: d.theoreticalCCDF,
        })),
        backgroundColor: colors[i] + "20",
        borderColor: colors[i],
        borderWidth: 2,
        pointRadius: 0,
        showLine: true,
      });
    });

    chartInstance = new Chart(ctx, {
      type: "scatter",
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            title: {
              display: true,
              text: "CCDF P(X > x)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Value",
            },
          },
        },
      },
    });
  } else if (currentViewMode === "loglog") {
    // Show distribution-specific plot based on best fit
    if (bestFit && bestFit.distributionType === "powerLaw") {
      showPowerLawPlot(ctx);
    } else if (bestFit && bestFit.distributionType === "logNormal") {
      showLogNormalPlot(ctx);
    } else if (bestFit && bestFit.distributionType === "exponential") {
      showExponentialPlot(ctx);
    } else {
      // Show power law plot as default
      showPowerLawPlot(ctx);
    }
  } else if (currentViewMode === "powerLaw") {
    showPowerLawPlot(ctx);
  } else if (currentViewMode === "logNormal") {
    showLogNormalPlot(ctx);
  } else if (currentViewMode === "exponential") {
    showExponentialPlot(ctx);
  } else if (currentViewMode === "qqplot") {
    showQQPlot(ctx);
  } else if (currentViewMode === "enhancedCCDF") {
    showEnhancedCCDFPlot(ctx);
  } else if (currentViewMode === "residualPlot") {
    showResidualPlot(ctx);
  }
}

// Helper functions for distribution-specific plots
function showPowerLawPlot(ctx) {
  const powerLawResult = analysisResults.results.find(
    (r) => r.distributionType === "powerLaw"
  );
  if (!powerLawResult) return;

  // Create log-log plot for power law
  const scatterData = powerLawResult.theoreticalValues.map((d) => ({
    x: Math.log10(d.value),
    y: Math.log10(d.ccdf),
  }));

  chartInstance = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Data Points (Log-Log)",
          data: scatterData,
          backgroundColor: "rgba(136, 132, 216, 0.8)",
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Power Law Analysis (R² = ${powerLawResult.goodnessOfFit.rSquared.toFixed(
            3
          )})`,
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "log(CCDF)",
          },
        },
        x: {
          title: {
            display: true,
            text: "log(Value)",
          },
        },
      },
    },
  });
}

function showLogNormalPlot(ctx) {
  const logNormalResult = analysisResults.results.find(
    (r) => r.distributionType === "logNormal"
  );
  if (!logNormalResult) return;

  // Get the log-normal specific plot data or create fallback
  let chartData = [];
  if (
    logNormalResult.logNormalProbabilityPlot &&
    logNormalResult.logNormalProbabilityPlot.plotData
  ) {
    chartData = logNormalResult.logNormalProbabilityPlot.plotData.map((d) => ({
      x: d.x,
      y: d.y,
    }));
  } else {
    // Fallback: create normal probability plot from theoretical values
    chartData = logNormalResult.theoreticalValues.map((d, i) => ({
      x: i / logNormalResult.theoreticalValues.length, // Approximate quantiles
      y: Math.log(d.value),
    }));
  }

  // Show normal probability plot for log-normal
  chartInstance = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Normal Probability Plot",
          data: chartData,
          backgroundColor: "rgba(34, 197, 94, 0.8)",
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Log-Normal Analysis (R² = ${logNormalResult.goodnessOfFit.rSquared.toFixed(
            3
          )})`,
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "ln(Value)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Theoretical Quantiles",
          },
        },
      },
    },
  });
}

function showExponentialPlot(ctx) {
  const exponentialResult = analysisResults.results.find(
    (r) => r.distributionType === "exponential"
  );
  if (!exponentialResult) return;

  // Show exponential probability plot
  const plotData = exponentialResult.theoreticalValues.map((d) => ({
    x: d.value,
    y: -Math.log(d.ccdf),
  }));

  chartInstance = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Exponential Probability Plot",
          data: plotData,
          backgroundColor: "rgba(239, 68, 68, 0.8)",
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Exponential Analysis (R² = ${exponentialResult.goodnessOfFit.rSquared.toFixed(
            3
          )})`,
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "-ln(CCDF)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Value",
          },
        },
      },
    },
  });
}

// Enhanced CCDF Plot with all theoretical curves overlaid
function createEnhancedCCDFPlot(analysisResults) {
  if (
    !analysisResults ||
    !analysisResults.results ||
    analysisResults.results.length === 0
  ) {
    return { datasets: [] };
  }

  const datasets = [];
  const firstResult = analysisResults.results[0];

  // Add empirical data points
  const empiricalData = firstResult.theoreticalValues.map((d) => ({
    x: d.value,
    y: d.ccdf,
  }));

  datasets.push({
    label: "Empirical Data",
    type: "scatter",
    data: empiricalData,
    backgroundColor: "rgba(75, 85, 99, 0.8)",
    pointRadius: 4,
    showLine: false,
  });

  // Add theoretical curves for all distributions
  const colors = {
    powerLaw: "#3b82f6", // Blue
    logNormal: "#10b981", // Green
    exponential: "#ef4444", // Red
  };

  analysisResults.results.forEach((result) => {
    // Only add if distribution is visible
    if (!visibleDistributions.includes(result.distributionType)) {
      return;
    }

    const theoreticalData = result.theoreticalValues.map((d) => ({
      x: d.value,
      y: d.theoreticalCCDF,
    }));

    const isBestFit =
      result.distributionType === analysisResults.bestFit.distributionType;
    const rSquared = result.goodnessOfFit.rSquared;

    datasets.push({
      label: `${
        result.distributionType === "powerLaw"
          ? "Power Law"
          : result.distributionType === "logNormal"
          ? "Log-Normal"
          : "Exponential"
      } (R² = ${rSquared.toFixed(3)})`,
      type: "line",
      data: theoreticalData,
      borderColor: colors[result.distributionType] || "#6b7280",
      backgroundColor: "transparent",
      borderWidth: isBestFit ? 4 : 2,
      pointRadius: 0,
      showLine: true,
      tension: 0,
    });
  });

  return { datasets };
}

// Residual Plot for goodness-of-fit assessment
function createResidualPlot(analysisResults) {
  if (!analysisResults || !analysisResults.bestFit) {
    return { datasets: [] };
  }

  const bestFitResult = analysisResults.results.find(
    (r) => r.distributionType === analysisResults.bestFit.distributionType
  );

  if (!bestFitResult) {
    return { datasets: [] };
  }

  // Calculate residuals (empirical - theoretical)
  const residualData = bestFitResult.theoreticalValues.map((d) => ({
    x: d.value,
    y: d.ccdf - d.theoreticalCCDF,
  }));

  // Create zero reference line
  const xValues = bestFitResult.theoreticalValues.map((d) => d.value);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);

  const datasets = [
    {
      label: `Residuals (${analysisResults.bestFit.distributionType})`,
      type: "scatter",
      data: residualData,
      backgroundColor: "rgba(239, 68, 68, 0.6)",
      pointRadius: 4,
      showLine: false,
    },
    {
      label: "Zero Reference",
      type: "line",
      data: [
        { x: minX, y: 0 },
        { x: maxX, y: 0 },
      ],
      borderColor: "rgba(107, 114, 128, 0.8)",
      backgroundColor: "transparent",
      borderWidth: 1,
      pointRadius: 0,
      showLine: true,
    },
  ];

  return { datasets };
}

// Enhanced CCDF Chart Configuration
function createEnhancedCCDFChartConfig(analysisResults) {
  return {
    type: "scatter",
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: currentPlotType,
          title: {
            display: true,
            text: "Value",
          },
        },
        y: {
          type: currentPlotType,
          title: {
            display: true,
            text: "CCDF P(X ≥ x)",
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        title: {
          display: true,
          text: "Distribution Comparison - CCDF with Theoretical Curves",
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: "xy",
            onZoom: function () {
              fathom.trackEvent("chart_zoom");
            },
          },
          pan: {
            enabled: true,
            mode: "xy",
            onPan: function () {
              fathom.trackEvent("chart_pan");
            },
          },
        },
      },
    },
  };
}

// Interactive Plot Control Functions
function toggleDistributionVisibility(distributionType, isVisible) {
  if (isVisible && !visibleDistributions.includes(distributionType)) {
    visibleDistributions.push(distributionType);
  } else if (!isVisible && visibleDistributions.includes(distributionType)) {
    visibleDistributions = visibleDistributions.filter(
      (d) => d !== distributionType
    );
  }

  // Update chart if analysis results are available
  if (analysisResults) {
    updateChart();
  }
}

function setPlotType(plotType) {
  if (["linear", "logarithmic"].includes(plotType)) {
    currentPlotType = plotType;

    // Update chart if analysis results are available
    if (analysisResults) {
      updateChart();
    }
  } else {
    throw new Error(
      `Invalid plot type: ${plotType}. Must be 'linear' or 'logarithmic'`
    );
  }
}

function enableZoomControls(chartInstance) {
  // Chart.js zoom plugin configuration
  return {
    zoom: {
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true,
        },
        mode: "xy",
      },
      pan: {
        enabled: true,
        mode: "xy",
      },
    },
  };
}

function getVisibleDistributions() {
  return [...visibleDistributions]; // Return a copy
}

// Enhanced CCDF Plot with all theoretical curves overlaid
function showEnhancedCCDFPlot(ctx) {
  if (!analysisResults) return;

  fathom.trackEvent("enhanced_ccdf_plot_rendered", {
    visible_distributions: getVisibleDistributions().length,
    plot_type: currentPlotType,
  });

  const ccdfPlotData = createEnhancedCCDFPlot(analysisResults);
  const chartConfig = createEnhancedCCDFChartConfig(analysisResults);

  chartInstance = new Chart(ctx, {
    ...chartConfig,
    data: ccdfPlotData,
  });
}

// Residual Plot for goodness-of-fit assessment
function showResidualPlot(ctx) {
  if (!analysisResults) return;

  fathom.trackEvent("residual_plot_rendered", {
    best_fit_distribution: analysisResults.bestFit.distributionType,
    confidence: Math.round(
      analysisResults.bestFit.goodnessOfFit.rSquared * 100
    ),
  });

  const residualPlotData = createResidualPlot(analysisResults);

  chartInstance = new Chart(ctx, {
    type: "scatter",
    data: residualPlotData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: "Value",
          },
        },
        y: {
          type: "linear",
          title: {
            display: true,
            text: "Residual (Empirical - Theoretical)",
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        title: {
          display: true,
          text: `Residual Plot - ${analysisResults.bestFit.distributionType}`,
        },
      },
    },
  });
}

// Q-Q Plot function for visual goodness-of-fit assessment
function showQQPlot(ctx) {
  if (!analysisResults || !analysisResults.bestFit) {
    // Show message if no best fit available
    chartInstance = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "No Data",
            data: [{ x: 0, y: 0 }],
            backgroundColor: "rgba(128, 128, 128, 0.8)",
            pointRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Q-Q Plot: No analysis results available",
          },
        },
      },
    });
    return;
  }

  const bestFit = analysisResults.bestFit;
  const data = bestFit.theoreticalValues;

  // Calculate empirical quantiles (from CCDF)
  const empiricalQuantiles = data.map((d) => 1 - d.ccdf); // Convert CCDF to CDF

  // Calculate theoretical quantiles based on distribution type
  let theoreticalQuantiles = [];
  let plotTitle = "";

  if (bestFit.distributionType === "powerLaw") {
    // For power law: use the fitted parameters to generate theoretical quantiles
    theoreticalQuantiles = data.map((d) => 1 - d.theoreticalCCDF);
    plotTitle = `Q-Q Plot: Power Law (α=${bestFit.parameters.exponent.toFixed(
      2
    )})`;
  } else if (bestFit.distributionType === "logNormal") {
    // For log-normal: use the fitted parameters
    theoreticalQuantiles = data.map((d) => 1 - d.theoreticalCCDF);
    plotTitle = `Q-Q Plot: Log-Normal (μ=${bestFit.parameters.mu.toFixed(
      2
    )}, σ=${bestFit.parameters.sigma.toFixed(2)})`;
  } else if (bestFit.distributionType === "exponential") {
    // For exponential: use the fitted parameters
    theoreticalQuantiles = data.map((d) => 1 - d.theoreticalCCDF);
    plotTitle = `Q-Q Plot: Exponential (λ=${bestFit.parameters.lambda.toFixed(
      3
    )})`;
  }

  // Create Q-Q plot data (theoretical vs empirical quantiles)
  const qqData = empiricalQuantiles
    .map((emp, i) => ({
      x: theoreticalQuantiles[i] || 0,
      y: emp,
    }))
    .filter((point) => !isNaN(point.x) && !isNaN(point.y));

  // Add perfect fit line (y = x)
  const minVal = Math.min(...qqData.map((p) => Math.min(p.x, p.y)));
  const maxVal = Math.max(...qqData.map((p) => Math.max(p.x, p.y)));
  const perfectFitLine = [
    { x: minVal, y: minVal },
    { x: maxVal, y: maxVal },
  ];

  chartInstance = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Q-Q Data Points",
          data: qqData,
          backgroundColor: "rgba(147, 51, 234, 0.8)", // Purple
          pointRadius: 5,
        },
        {
          label: "Perfect Fit (y = x)",
          data: perfectFitLine,
          type: "line",
          backgroundColor: "rgba(239, 68, 68, 0)",
          borderColor: "rgba(239, 68, 68, 1)",
          borderWidth: 2,
          pointRadius: 0,
          borderDash: [5, 5],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text:
            plotTitle + ` (R² = ${bestFit.goodnessOfFit.rSquared.toFixed(3)})`,
        },
        legend: {
          display: true,
          position: "top",
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "Empirical Quantiles",
          },
        },
        x: {
          title: {
            display: true,
            text: "Theoretical Quantiles",
          },
        },
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // Initialize the analysis engine
  initializeAnalysisEngine();

  // DOM elements
  const dataInput = document.getElementById("dataInput");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const sampleBtn = document.getElementById("sampleBtn");

  const freqBtn = document.getElementById("freqBtn");
  const ccdfBtn = document.getElementById("ccdfBtn");
  const loglogBtn = document.getElementById("loglogBtn");
  const powerLawBtn = document.getElementById("powerLawBtn");
  const logNormalBtn = document.getElementById("logNormalBtn");
  const exponentialBtn = document.getElementById("exponentialBtn");
  const qqPlotBtn = document.getElementById("qqPlotBtn");
  const enhancedCCDFBtn = document.getElementById("enhancedCCDFBtn");
  const residualPlotBtn = document.getElementById("residualPlotBtn");

  // Load sample data
  sampleBtn.addEventListener("click", function () {
    dataInput.value = sampleData;
    fathom.trackEvent("load sample");
  });

  // Switch between view modes
  freqBtn.addEventListener("click", function () {
    setViewMode("frequency");
  });

  ccdfBtn.addEventListener("click", function () {
    setViewMode("ccdf");
  });

  loglogBtn.addEventListener("click", function () {
    setViewMode("loglog");
  });

  // Distribution-specific plot buttons
  powerLawBtn.addEventListener("click", function () {
    fathom.trackEvent("powerlaw_plot_view");
    setViewMode("powerLaw");
  });

  logNormalBtn.addEventListener("click", function () {
    fathom.trackEvent("lognormal_plot_view");
    setViewMode("logNormal");
  });

  exponentialBtn.addEventListener("click", function () {
    fathom.trackEvent("exponential_plot_view");
    setViewMode("exponential");
  });

  qqPlotBtn.addEventListener("click", function () {
    fathom.trackEvent("qq_plot_view");
    setViewMode("qqplot");
  });

  enhancedCCDFBtn.addEventListener("click", function () {
    fathom.trackEvent("enhanced_ccdf_view");
    setViewMode("enhancedCCDF");
  });

  residualPlotBtn.addEventListener("click", function () {
    fathom.trackEvent("residual_plot_view");
    setViewMode("residualPlot");
  });

  // Interactive control event listeners
  const powerLawCheckbox = document.getElementById("powerLawCheckbox");
  const logNormalCheckbox = document.getElementById("logNormalCheckbox");
  const exponentialCheckbox = document.getElementById("exponentialCheckbox");
  const plotTypeRadios = document.querySelectorAll('input[name="plotType"]');

  if (powerLawCheckbox) {
    powerLawCheckbox.addEventListener("change", function () {
      fathom.trackEvent("toggle_powerlaw", { visible: this.checked });
      toggleDistributionVisibility("powerLaw", this.checked);
    });
  }

  if (logNormalCheckbox) {
    logNormalCheckbox.addEventListener("change", function () {
      fathom.trackEvent("toggle_lognormal", { visible: this.checked });
      toggleDistributionVisibility("logNormal", this.checked);
    });
  }

  if (exponentialCheckbox) {
    exponentialCheckbox.addEventListener("change", function () {
      fathom.trackEvent("toggle_exponential", { visible: this.checked });
      toggleDistributionVisibility("exponential", this.checked);
    });
  }

  plotTypeRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.checked) {
        fathom.trackEvent("change_plot_type", { type: this.value });
        setPlotType(this.value);
      }
    });
  });

  // Analyze data
  analyzeBtn.addEventListener("click", function () {
    fathom.trackEvent("analyze");
    parseInput();
  });

  function setViewMode(mode) {
    fathom.trackEvent(mode);
    currentViewMode = mode;

    // Update main view button styles
    freqBtn.className =
      "px-3 py-2 mr-2 rounded text-sm " +
      (mode === "frequency" ? "bg-blue-500 text-white" : "bg-gray-200");
    ccdfBtn.className =
      "px-3 py-2 mr-2 rounded text-sm " +
      (mode === "ccdf" ? "bg-blue-500 text-white" : "bg-gray-200");
    loglogBtn.className =
      "px-3 py-2 rounded text-sm " +
      (["loglog", "powerLaw", "logNormal", "exponential", "qqplot"].includes(
        mode
      )
        ? "bg-blue-500 text-white"
        : "bg-gray-200");

    // Update distribution-specific button styles
    powerLawBtn.className =
      "px-3 py-2 mr-2 rounded text-sm " +
      (mode === "powerLaw" ? "bg-green-500 text-white" : "bg-gray-200");
    logNormalBtn.className =
      "px-3 py-2 mr-2 rounded text-sm " +
      (mode === "logNormal" ? "bg-green-500 text-white" : "bg-gray-200");
    exponentialBtn.className =
      "px-3 py-2 rounded text-sm " +
      (mode === "exponential" ? "bg-green-500 text-white" : "bg-gray-200");

    qqPlotBtn.className =
      "px-3 py-2 rounded text-sm " +
      (mode === "qqplot" ? "bg-purple-500 text-white" : "bg-gray-200");

    enhancedCCDFBtn.className =
      "px-3 py-2 rounded text-sm " +
      (mode === "enhancedCCDF" ? "bg-indigo-500 text-white" : "bg-gray-200");

    residualPlotBtn.className =
      "px-3 py-2 rounded text-sm " +
      (mode === "residualPlot" ? "bg-pink-500 text-white" : "bg-gray-200");

    // Update chart if analysis results are available
    if (analysisResults) {
      updateChart();
    }
  }
});
