# Fathom Analytics Tracking Events

This document lists all the Fathom analytics tracking events implemented in the IsItAPowerLaw application, including the new enhanced features from Phases 3.2 and 3.3.

## Existing Events (Pre-Enhancement)

### Basic User Actions
- `load sample` - User loads sample data
- `analyze` - User clicks the analyze button

## New Events (Phases 3.2 & 3.3)

### Core Multi-Distribution Analysis
- **`multi_distribution_analysis`** - Triggered when user runs analysis with multiple distributions
  - Parameters:
    - `distributions_analyzed`: Number of distributions analyzed (typically 3)
    - `best_fit`: The distribution type that best fits the data ("powerLaw", "logNormal", "exponential")
    - `confidence`: Rounded R² value as percentage (0-100)

### View Mode Changes
- **`enhanced_ccdf_view`** - User clicks Enhanced CCDF button
- **`residual_plot_view`** - User clicks Residual Plot button  
- **`qq_plot_view`** - User clicks Q-Q Plot button
- **`powerlaw_plot_view`** - User clicks Power Law Plot button
- **`lognormal_plot_view`** - User clicks Log-Normal Plot button
- **`exponential_plot_view`** - User clicks Exponential Plot button

### Interactive Controls
- **`interactive_controls_shown`** - Interactive controls panel becomes visible after analysis
- **`toggle_powerlaw`** - User toggles Power Law distribution visibility
  - Parameters:
    - `visible`: Boolean indicating if distribution is now visible
- **`toggle_lognormal`** - User toggles Log-Normal distribution visibility
  - Parameters:
    - `visible`: Boolean indicating if distribution is now visible
- **`toggle_exponential`** - User toggles Exponential distribution visibility
  - Parameters:
    - `visible`: Boolean indicating if distribution is now visible
- **`change_plot_type`** - User switches between linear/logarithmic scales
  - Parameters:
    - `type`: "linear" or "logarithmic"

### Chart Interactions
- **`chart_zoom`** - User zooms in/out on chart (wheel or pinch)
- **`chart_pan`** - User pans around chart (click and drag)

### Plot Rendering Events
- **`enhanced_ccdf_plot_rendered`** - Enhanced CCDF plot is displayed
  - Parameters:
    - `visible_distributions`: Number of distributions currently visible
    - `plot_type`: "linear" or "logarithmic"
- **`residual_plot_rendered`** - Residual plot is displayed
  - Parameters:
    - `best_fit_distribution`: The distribution type used for residuals
    - `confidence`: Rounded R² value as percentage (0-100)

## Event Usage Analytics

### User Engagement Metrics
These events help track how users engage with the enhanced features:

1. **Feature Adoption**: Track which new visualization modes are most popular
2. **Interactive Usage**: Monitor how often users customize their view with controls
3. **Analysis Depth**: See if users explore multiple distribution types vs. sticking to one
4. **Zoom/Pan Usage**: Understand if users need detailed exploration capabilities

### Key Performance Indicators (KPIs)

1. **Multi-Distribution Analysis Adoption Rate**
   - Percentage of users who use the new multi-distribution analysis vs. old single-distribution approach

2. **Interactive Controls Engagement**
   - Percentage of users who interact with visibility toggles or plot type switches
   - Average number of control interactions per session

3. **Advanced Visualization Usage**
   - Usage rates of Enhanced CCDF vs. Residual Plot vs. Q-Q Plot
   - Distribution of best-fit results across the three distribution types

4. **Chart Interaction Depth**
   - Percentage of users who zoom/pan for detailed analysis
   - Correlation between chart interactions and session duration

### Data Quality Insights

The tracking data can provide insights into:

1. **Distribution Prevalence**: Which distribution types are most commonly found in real user data
2. **Confidence Patterns**: Distribution of confidence levels in real-world analyses
3. **User Behavior**: How users navigate between different visualization modes
4. **Feature Effectiveness**: Which features help users gain insights vs. which are rarely used

## Implementation Notes

- All events are implemented using `fathom.trackEvent(eventName, parameters)`
- Events with parameters provide richer analytics data for understanding user behavior
- Events are triggered at the moment of user action, not on page load or delayed
- Chart interaction events (zoom/pan) may fire frequently during active exploration
- All events are non-blocking and won't affect application performance

## Privacy Considerations

- No personally identifiable information (PII) is tracked
- Only aggregated usage patterns and feature interactions are recorded
- Data values from user analyses are not transmitted (only metadata like distribution types and confidence levels)
- All tracking follows Fathom's privacy-first analytics approach
