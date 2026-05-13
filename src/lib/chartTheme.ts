/**
 * Shared Recharts theme constants for MECH DS v1.2.0.
 * Import and apply to all chart instances.
 */
export const MECH_CHART = {
  colors: {
    income:  '#2ECC71',
    expense: '#E74C3C',
    primary: '#FF5B24',
    neutral: '#D4C8C2',
    text:    '#8C7D76',
    dark:    '#1D1A19',
    grid:    '#F1E7E2',
  },
  categoryColors: [
    '#FF5B24', '#E74C3C', '#E67E22', '#F39C12',
    '#2ECC71', '#1ABC9C', '#3498DB', '#9B59B6',
    '#34495E', '#95A5A6',
  ],
  font:     'JetBrains Mono',
  fontSize: 11,
  axisLine:  { stroke: '#D4C8C2', strokeWidth: 1 },
  gridLine:  { stroke: '#F1E7E2', strokeDasharray: '4 4' },
  tooltip: {
    contentStyle: {
      background:   '#F9F2EE',
      border:       '1px solid #D4C8C2',
      borderRadius: 0,
      fontFamily:   'JetBrains Mono',
      fontSize:     11,
      boxShadow:    'none',
    },
    labelStyle: {
      fontFamily: 'Space Grotesk',
      fontSize:   11,
      color:      '#1D1A19',
      fontWeight: 600,
    },
  },
} as const
