import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { MECH_CHART } from '@/lib/chartTheme'
import { formatCurrency, formatCurrencyAbbrev } from '@/lib/utils'

export interface IncomeExpenseBarData {
  month: string
  income: number
  expense: number
}

interface IncomeExpenseBarProps {
  data: IncomeExpenseBarData[]
  height?: number
}

/** Grouped bar chart showing income vs expense per month. */
export default function IncomeExpenseBar({ data, height = 240 }: IncomeExpenseBarProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barGap={4} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={MECH_CHART.gridLine.stroke} strokeDasharray={MECH_CHART.gridLine.strokeDasharray} />
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
          cursor={{ fill: 'rgba(212,200,194,0.15)' }}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Legend
          wrapperStyle={{ fontFamily: 'Space Grotesk', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          formatter={(label) => label.toUpperCase()}
        />
        <Bar dataKey="income"  name="Income"  fill={MECH_CHART.colors.income}  barSize={24} radius={0} />
        <Bar dataKey="expense" name="Expense" fill={MECH_CHART.colors.expense} barSize={24} radius={0} />
      </BarChart>
    </ResponsiveContainer>
  )
}
