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
let chartInstance = null;
let processedData = null;
let stats = null;

function showError(message) {
  fathom.trackEvent("error");
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
  resultsContainer.classList.add("hidden");
}

function parseInput() {
  try {
    // Reset error message
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");

    const inputText = dataInput.value;

    // Split by newlines and filter out empty lines
    const lines = inputText
      .trim()
      .split("\n")
      .filter((line) => line.trim() !== "");

    if (lines.length < 5) {
      showError(
        "Please provide at least 5 data points for meaningful analysis."
      );
      return;
    }

    const parsedData = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);

      if (parts.length !== 2) {
        showError(
          `Line ${i + 1} is not in the correct format. Expected "value count".`
        );
        return;
      }

      const value = parseFloat(parts[0]);
      const frequency = parseInt(parts[1], 10);

      if (isNaN(value) || isNaN(frequency)) {
        showError(`Line ${i + 1} contains invalid numbers.`);
        return;
      }

      if (value <= 0 || frequency <= 0) {
        showError(
          `Line ${
            i + 1
          } contains zero or negative numbers. Both value and count must be positive.`
        );
        return;
      }

      parsedData.push({ value, frequency });
    }

    processData(parsedData);
  } catch (err) {
    showError("Error parsing input: " + err.message);
  }
}

function processData(inputData) {
  try {
    // Calculate total observations
    const totalObservations = inputData.reduce(
      (sum, item) => sum + item.frequency,
      0
    );

    // Calculate PDF (Probability Density Function)
    const dataWithProbability = inputData.map((item) => ({
      ...item,
      probability: item.frequency / totalObservations,
    }));

    // Calculate CDF and CCDF
    let cumulativeProbability = 0;
    const dataWithCCDF = dataWithProbability.map((item) => {
      cumulativeProbability += item.probability;
      return {
        ...item,
        cdf: cumulativeProbability,
        ccdf: 1 - cumulativeProbability,
      };
    });

    // Calculate log values for power law analysis
    const dataWithLog = dataWithCCDF.map((item) => ({
      ...item,
      logValue: Math.log10(item.value),
      logCCDF: item.ccdf > 0 ? Math.log10(item.ccdf) : null,
    }));

    // Filter out points with zero CCDF (can't take log of 0)
    const logLogData = dataWithLog.filter((item) => item.ccdf > 0);

    if (logLogData.length < 3) {
      showError(
        "Not enough valid data points after processing. Need at least 3 points with non-zero CCDF."
      );
      return;
    }

    // Perform linear regression on log-log data to test for power law
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;
    const n = logLogData.length;

    logLogData.forEach((item) => {
      sumX += item.logValue;
      sumY += item.logCCDF;
      sumXY += item.logValue * item.logCCDF;
      sumXX += item.logValue * item.logValue;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const powerLawExponent = -slope;

    // Calculate R-squared to assess goodness of fit
    const meanY = sumY / n;
    let ssTot = 0,
      ssRes = 0;

    logLogData.forEach((item) => {
      const yPred = slope * item.logValue + intercept;
      ssTot += Math.pow(item.logCCDF - meanY, 2);
      ssRes += Math.pow(item.logCCDF - yPred, 2);
    });

    const rSquared = 1 - ssRes / ssTot;

    // Calculate the theoretical CCDF for power law
    const dataWithTheoretical = logLogData.map((item) => ({
      ...item,
      theoreticalCCDF: Math.pow(10, intercept + slope * item.logValue),
    }));

    // Calculate basic statistics
    const minValue = Math.min(...inputData.map((item) => item.value));
    const maxValue = Math.max(...inputData.map((item) => item.value));
    const meanValue =
      inputData.reduce((sum, item) => sum + item.value * item.frequency, 0) /
      totalObservations;

    // Generate regression line for plotting
    const minLogX = Math.min(...logLogData.map((d) => d.logValue));
    const maxLogX = Math.max(...logLogData.map((d) => d.logValue));

    const regressionLine = [
      { logValue: minLogX, logCCDF: intercept + slope * minLogX },
      { logValue: maxLogX, logCCDF: intercept + slope * maxLogX },
    ];

    // Determine if this is likely a power law
    // General criteria: R² > 0.9 and at least 5 orders of magnitude span is ideal
    // But we'll be more lenient since user data might be limited
    const isPowerLaw = rSquared > 0.9;
    const confidenceLevel =
      rSquared > 0.98
        ? "Very High"
        : rSquared > 0.95
        ? "High"
        : rSquared > 0.9
        ? "Moderate"
        : rSquared > 0.8
        ? "Low"
        : "Very Low";

    processedData = {
      raw: inputData,
      processed: dataWithTheoretical,
      regressionLine,
    };

    stats = {
      totalObservations,
      powerLawExponent,
      rSquared,
      minValue,
      maxValue,
      meanValue,
      intercept,
      slope,
      confidenceLevel,
      isPowerLaw,
    };

    updateResults();
    updateChart();
    resultsContainer.classList.remove("hidden");
  } catch (err) {
    showError("Error processing data: " + err.message);
  }
}

function updateResults() {
  // Update statistics
  document.getElementById("totalObs").textContent =
    stats.totalObservations.toLocaleString();
  document.getElementById("exponent").textContent =
    stats.powerLawExponent.toFixed(2);
  document.getElementById("rSquared").textContent = stats.rSquared.toFixed(4);
  document.getElementById(
    "range"
  ).textContent = `${stats.minValue} - ${stats.maxValue}`;
  document.getElementById("mean").textContent = stats.meanValue.toFixed(2);
  document.getElementById("confidence").textContent = stats.confidenceLevel;

  // Update verdict
  const verdictCard = document.getElementById("verdictCard");
  const verdictContent = document.getElementById("verdictContent");

  fathom.trackEvent(stats.isPowerLaw ? "power law" : "not power law");
  if (stats.isPowerLaw) {
    verdictCard.className = "p-4 rounded-lg bg-green-50";
    verdictContent.innerHTML = `
          <div class="text-green-700 font-bold text-lg mb-2">
              ✓ Likely follows a power law distribution
          </div>
          <p>
              Your data shows strong evidence of power law behavior with an exponent of ${stats.powerLawExponent.toFixed(
                2
              )}.
              The high R² value (${stats.rSquared.toFixed(
                4
              )}) indicates that the log-log plot is very close to linear,
              which is a key signature of power law distributions.
          </p>
      `;
  } else {
    verdictCard.className = "p-4 rounded-lg bg-yellow-50";
    verdictContent.innerHTML = `
          <div class="text-yellow-700 font-bold text-lg mb-2">
              ✗ Likely does NOT follow a power law distribution
          </div>
          <p>
              Your data doesn't show strong evidence of power law behavior. The R² value (${stats.rSquared.toFixed(
                4
              )}) 
              suggests that the relationship in the log-log plot deviates from linearity.
              Consider testing other distributions like log-normal, exponential, or stretched exponential.
          </p>
      `;
  }
}

function updateChart() {
  const ctx = document.getElementById("chart").getContext("2d");

  // Destroy previous chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  if (currentViewMode === "frequency") {
    // Show frequency distribution (bar chart)
    // Limit to first 30 data points for better visibility
    const data = processedData.raw.slice(0, 30);

    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((d) => d.value),
        datasets: [
          {
            label: "Frequency",
            data: data.map((d) => d.frequency),
            backgroundColor: "rgba(130, 202, 157, 0.8)",
            borderColor: "rgba(130, 202, 157, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Frequency",
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
  } else if (currentViewMode === "ccdf") {
    // Show CCDF in linear scale
    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: processedData.processed.map((d) => d.value),
        datasets: [
          {
            label: "Empirical CCDF",
            data: processedData.processed.map((d) => d.ccdf),
            backgroundColor: "rgba(136, 132, 216, 0.1)",
            borderColor: "rgba(136, 132, 216, 1)",
            borderWidth: 2,
            pointRadius: 0,
          },
          {
            label: "Theoretical Power Law",
            data: processedData.processed.map((d) => d.theoreticalCCDF),
            backgroundColor: "rgba(255, 115, 0, 0.1)",
            borderColor: "rgba(255, 115, 0, 1)",
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
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
    // Show log-log plot
    // Create scatter plot for data points
    const scatterData = processedData.processed.map((d) => ({
      x: d.logValue,
      y: d.logCCDF,
    }));

    // Create line for regression
    const lineData = processedData.regressionLine.map((d) => ({
      x: d.logValue,
      y: d.logCCDF,
    }));

    chartInstance = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Data Points",
            data: scatterData,
            backgroundColor: "rgba(136, 132, 216, 0.8)",
            pointRadius: 5,
          },
          {
            label: "Power Law Fit",
            data: lineData,
            type: "line",
            backgroundColor: "rgba(255, 115, 0, 0)",
            borderColor: "rgba(255, 115, 0, 1)",
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
}

document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const dataInput = document.getElementById("dataInput");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const sampleBtn = document.getElementById("sampleBtn");
  const errorMsg = document.getElementById("errorMsg");
  const resultsContainer = document.getElementById("resultsContainer");

  const freqBtn = document.getElementById("freqBtn");
  const ccdfBtn = document.getElementById("ccdfBtn");
  const loglogBtn = document.getElementById("loglogBtn");

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

  // Analyze data
  analyzeBtn.addEventListener("click", function () {
    fathom.trackEvent("analyze");
    parseInput();
  });

  function setViewMode(mode) {
    fathom.trackEvent(mode);
    currentViewMode = mode;

    // Update button styles
    freqBtn.className =
      "px-4 py-2 mr-2 rounded " +
      (mode === "frequency" ? "bg-blue-500 text-white" : "bg-gray-200");
    ccdfBtn.className =
      "px-4 py-2 mr-2 rounded " +
      (mode === "ccdf" ? "bg-blue-500 text-white" : "bg-gray-200");
    loglogBtn.className =
      "px-4 py-2 rounded " +
      (mode === "loglog" ? "bg-blue-500 text-white" : "bg-gray-200");

    // Update chart
    if (processedData) {
      updateChart();
    }
  }
});
