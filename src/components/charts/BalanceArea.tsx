import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { MECH_CHART } from '@/lib/chartTheme'
import { formatCurrency, formatCurrencyAbbrev } from '@/lib/utils'

export interface BalanceAreaData {
  date: string
  balance: number
}

interface BalanceAreaProps {
  data: BalanceAreaData[]
  height?: number
}

/** Area chart showing account balance history over time. Used on account detail page. */
export default function BalanceArea({ data, height = 200 }: BalanceAreaProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="font-poppins text-sm text-mech-ink-50">No balance history</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF5B24" stopOpacity={0.10} />
            <stop offset="100%" stopColor="#FF5B24" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={MECH_CHART.gridLine.stroke} strokeDasharray={MECH_CHART.gridLine.strokeDasharray} />
        <XAxis
          dataKey="date"
          axisLine={MECH_CHART.axisLine}
          tickLine={false}
          tick={{ fontFamily: MECH_CHART.font, fontSize: MECH_CHART.fontSize, fill: MECH_CHART.colors.text }}
          interval="preserveStartEnd"
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
          formatter={(value: number) => [formatCurrency(value), 'Balance']}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke={MECH_CHART.colors.primary}
          strokeWidth={2}
          fill="url(#balanceGradient)"
          dot={false}
          activeDot={{ r: 4, fill: MECH_CHART.colors.primary, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
