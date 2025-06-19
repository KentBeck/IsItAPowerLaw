// Data Processing Functions - Pure functions for statistical analysis

/**
 * Parses input text into structured data array
 * @param {string} inputText - Raw input text with "value frequency" pairs
 * @returns {Array<{value: number, frequency: number}>} Parsed data array
 * @throws {Error} If input is invalid
 */
function parseInputData(inputText) {
    if (typeof inputText !== 'string') {
        throw new Error('Input must be a string');
    }

    // Split by newlines and filter out empty lines
    const lines = inputText
        .trim()
        .split('\n')
        .filter(line => line.trim() !== '');

    if (lines.length < 5) {
        throw new Error('Please provide at least 5 data points for meaningful analysis.');
    }

    const parsedData = [];

    for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].trim().split(/\s+/);

        if (parts.length !== 2) {
            throw new Error(`Line ${i + 1} is not in the correct format. Expected "value count".`);
        }

        const value = parseFloat(parts[0]);
        const frequency = parseInt(parts[1], 10);

        if (isNaN(value) || isNaN(frequency)) {
            throw new Error(`Line ${i + 1} contains invalid numbers.`);
        }

        if (value <= 0 || frequency <= 0) {
            throw new Error(`Line ${i + 1} contains zero or negative numbers. Both value and count must be positive.`);
        }

        parsedData.push({ value, frequency });
    }

    return parsedData;
}

/**
 * Calculates basic statistics from parsed data
 * @param {Array<{value: number, frequency: number}>} data - Parsed data array
 * @returns {Object} Statistics object with totalObservations, minValue, maxValue, meanValue
 */
function calculateBasicStats(data) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Data must be a non-empty array');
    }

    const totalObservations = data.reduce((sum, item) => sum + item.frequency, 0);
    const minValue = Math.min(...data.map(item => item.value));
    const maxValue = Math.max(...data.map(item => item.value));
    const meanValue = data.reduce((sum, item) => sum + item.value * item.frequency, 0) / totalObservations;

    return {
        totalObservations,
        minValue,
        maxValue,
        meanValue
    };
}

/**
 * Calculates probability, CDF, and CCDF for each data point
 * @param {Array<{value: number, frequency: number}>} data - Parsed data array
 * @returns {Array<{value: number, frequency: number, probability: number, cdf: number, ccdf: number}>}
 */
function calculateCCDF(data) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Data must be a non-empty array');
    }

    const totalObservations = data.reduce((sum, item) => sum + item.frequency, 0);

    // Calculate PDF (Probability Density Function)
    const dataWithProbability = data.map(item => ({
        ...item,
        probability: item.frequency / totalObservations
    }));

    // Calculate CDF and CCDF
    let cumulativeProbability = 0;
    const dataWithCCDF = dataWithProbability.map(item => {
        cumulativeProbability += item.probability;
        return {
            ...item,
            cdf: cumulativeProbability,
            ccdf: 1 - cumulativeProbability
        };
    });

    return dataWithCCDF;
}

// Export functions for testing (if in Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseInputData,
        calculateBasicStats,
        calculateCCDF
    };
}
