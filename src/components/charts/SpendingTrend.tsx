import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { MECH_CHART } from '@/lib/chartTheme'
import { formatCurrency, formatCurrencyAbbrev } from '@/lib/utils'

export interface SpendingTrendData {
  date: string
  amount: number
  isToday?: boolean
}

interface SpendingTrendProps {
  data: SpendingTrendData[]
  height?: number
}

/** Line chart showing daily spending over a 30-day window. */
export default function SpendingTrend({ data, height = 200 }: SpendingTrendProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={MECH_CHART.gridLine.stroke} strokeDasharray={MECH_CHART.gridLine.strokeDasharray} />
        <XAxis
          dataKey="date"
          axisLine={MECH_CHART.axisLine}
          tickLine={false}
          tick={{ fontFamily: MECH_CHART.font, fontSize: MECH_CHART.fontSize, fill: MECH_CHART.colors.text }}
          interval={4}
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
          formatter={(value: number) => [formatCurrency(value), 'Spent']}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke={MECH_CHART.colors.expense}
          strokeWidth={2}
          dot={(props) => {
            const { cx, cy, payload } = props as { cx: number; cy: number; payload: SpendingTrendData }
            if (payload?.isToday) {
              return <circle key="today" cx={cx} cy={cy} r={4} fill={MECH_CHART.colors.expense} strokeWidth={0} />
            }
            return <g key={`empty-${cx}`} />
          }}
          activeDot={{ r: 4, fill: MECH_CHART.colors.expense, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
