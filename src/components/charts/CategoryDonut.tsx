import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts'
import { MECH_CHART } from '@/lib/chartTheme'
import { formatCurrency, formatCurrencyAbbrev } from '@/lib/utils'

export interface CategoryDonutData {
  name: string
  value: number
  color: string
}

interface CategoryDonutProps {
  data: CategoryDonutData[]
  height?: number
  showLegend?: boolean
}

/** Donut chart showing expense breakdown by category with custom square-dot legend. */
export default function CategoryDonut({ data, height = 280, showLegend = true }: CategoryDonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="font-poppins text-sm text-mech-ink-50">No expenses this month</p>
      </div>
    )
  }

  return (
    <div className="flex gap-4" style={{ height }}>
      {/* Donut */}
      <div className="flex-shrink-0" style={{ width: height * 0.65, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="55%"
              outerRadius="75%"
              paddingAngle={0}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  const vb = viewBox as { cx?: number; cy?: number }
                  const cx = vb?.cx ?? 0
                  const cy = vb?.cy ?? 0
                  return (
                    <g>
                      <text x={cx} y={cy - 10} textAnchor="middle" fill={MECH_CHART.colors.text}
                        fontSize={9} fontFamily="Space Grotesk" fontWeight={600} letterSpacing="0.08em">
                        TOTAL
                      </text>
                      <text x={cx} y={cy + 8} textAnchor="middle" fill={MECH_CHART.colors.dark}
                        fontSize={12} fontFamily={MECH_CHART.font}>
                        {formatCurrencyAbbrev(total)}
                      </text>
                    </g>
                  )
                }}
                position="center"
              />
            </Pie>
            <Tooltip
              contentStyle={MECH_CHART.tooltip.contentStyle}
              labelStyle={MECH_CHART.tooltip.labelStyle}
              formatter={(value: number) => [
                `${formatCurrency(value)} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom legend with square dots */}
      {showLegend && (
        <div className="flex flex-col justify-center gap-2 min-w-0 flex-1 overflow-y-auto">
          {data.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 flex-shrink-0" style={{ background: entry.color }} />
              <span className="font-poppins text-xs text-mech-ink-80 flex-1 truncate">{entry.name}</span>
              <span className="font-mono text-xs text-mech-ink-50 flex-shrink-0">
                {total > 0 ? `${((entry.value / total) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
