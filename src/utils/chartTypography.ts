/**
 * BD. CivilLab — Chart & SVG Typography Engine (Nikosh Bengali Font Integration)
 * 
 * Provides unified font family declarations and configuration presets for all
 * Recharts, D3, and custom SVG analytical charts to enforce seamless visual consistency
 * with the application's authentic Nikosh Bengali typography.
 */

export const NIKOSH_FONT_FAMILY = "'Nikosh', 'NikoshBAN', 'SolaimanLipi', sans-serif";

/**
 * Common SVG Text style preset for custom SVG charts, plots, and diagrams
 */
export const svgNikoshTextStyle: React.CSSProperties = {
  fontFamily: NIKOSH_FONT_FAMILY,
  WebkitFontSmoothing: 'antialiased',
  textRendering: 'optimizeLegibility',
};

/**
 * Recharts CartesianAxis & PolarAxis tick configuration preset
 */
export const rechartsAxisTickProps = {
  style: {
    fontFamily: NIKOSH_FONT_FAMILY,
    fontSize: '11px',
  },
  className: 'recharts-cartesian-axis-tick-value font-nikosh',
};

/**
 * Recharts Axis Label configuration preset
 */
export const rechartsAxisLabelProps = {
  style: {
    fontFamily: NIKOSH_FONT_FAMILY,
    fontWeight: 600,
    fontSize: '11px',
  },
  className: 'recharts-label font-nikosh',
};

/**
 * Recharts Tooltip container and item configuration preset
 */
export const rechartsTooltipProps = {
  contentStyle: {
    fontFamily: NIKOSH_FONT_FAMILY,
    borderRadius: '0.5rem',
    fontSize: '12px',
  },
  itemStyle: {
    fontFamily: NIKOSH_FONT_FAMILY,
  },
  labelStyle: {
    fontFamily: NIKOSH_FONT_FAMILY,
    fontWeight: 700,
  },
};

/**
 * Recharts Legend configuration preset
 */
export const rechartsLegendProps = {
  wrapperStyle: {
    fontFamily: NIKOSH_FONT_FAMILY,
    fontSize: '11px',
  },
};

/**
 * Recharts Pie / Radial Bar label preset
 */
export const rechartsPieLabelProps = {
  style: {
    fontFamily: NIKOSH_FONT_FAMILY,
    fontSize: '11px',
    fontWeight: 600,
  },
};

/**
 * Utility for D3 axis selections to enforce the Nikosh font family on all generated text nodes
 */
export function applyNikoshToD3Selection(selection: any): void {
  if (!selection || typeof selection.selectAll !== 'function') return;
  try {
    selection
      .selectAll('text')
      .style('font-family', NIKOSH_FONT_FAMILY)
      .classed('font-nikosh', true);
  } catch {
    // Graceful fallback
  }
}
