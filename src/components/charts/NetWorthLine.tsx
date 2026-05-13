import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { MECH_CHART } from '@/lib/chartTheme'
import { formatCurrency, formatCurrencyAbbrev } from '@/lib/utils'

export interface NetWorthLineData {
  month: string
  netWorth: number
  assets: number
  liabilities: number
}

interface NetWorthLineProps {
  data: NetWorthLineData[]
  height?: number
  showBreakdown?: boolean
}

/** Line chart showing net worth over time, with optional assets/liabilities breakdown. */
export default function NetWorthLine({ data, height = 240, showBreakdown = false }: NetWorthLineProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="font-poppins text-sm text-mech-ink-50 text-center px-4">
          Add your assets and liabilities in Portfolio to track net worth over time
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={MECH_CHART.gridLine.stroke} strokeDasharray={MECH_CHART.gridLine.strokeDasharray} />
        <XAxis
          dataKey="month"
          axisLine={MECH_CHART.axisLine}
          tickLine={false}
          tick={{ fontFamily: 'Space Grotesk', fontSize: MECH_CHART.fontSize, fill: MECH_CHART.colors.text }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontFamily: MECH_CHART.font, fontSize: MECH_CHART.fontSize, fill: MECH_CHART.colors.text }}
          tickFormatter={(v) => formatCurrencyAbbrev(v)}
          width={52}
        />
        <Tooltip
          contentStyle={MECH_CHART.tooltip.contentStyle}
          labelStyle={MECH_CHART.tooltip.labelStyle}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Line
          type="monotone"
          dataKey="netWorth"
          name="Net Worth"
          stroke={MECH_CHART.colors.primary}
          strokeWidth={2}
          dot={{ r: 4, fill: MECH_CHART.colors.primary, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
        {showBreakdown && (
          <>
            <Line
              type="monotone"
              dataKey="assets"
              name="Assets"
              stroke={MECH_CHART.colors.income}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: MECH_CHART.colors.income, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="liabilities"
              name="Liabilities"
              stroke={MECH_CHART.colors.expense}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: MECH_CHART.colors.expense, strokeWidth: 0 }}
            />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
