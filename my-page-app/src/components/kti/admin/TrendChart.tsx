'use client'

interface DataPoint {
  year: number
  value: number | null
}

interface TrendChartProps {
  data: DataPoint[]
  title: string
  color?: string
  height?: number
  showDots?: boolean
  minValue?: number
  maxValue?: number
}

export default function TrendChart({
  data,
  title,
  color = '#3B82F6',
  height = 200,
  showDots = true,
  minValue = 1,
  maxValue = 6,
}: TrendChartProps) {
  // Filter out null values for rendering the line
  const validData = data.filter((d) => d.value !== null) as { year: number; value: number }[]

  if (validData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
        <div
          className="flex items-center justify-center text-gray-400"
          style={{ height }}
        >
          Ingen data
        </div>
      </div>
    )
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 40 }
  const width = 400
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const years = data.map((d) => d.year)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)
  const yearRange = maxYear - minYear || 1

  const valueRange = maxValue - minValue

  // Scale functions
  const xScale = (year: number) => padding.left + ((year - minYear) / yearRange) * chartWidth
  const yScale = (value: number) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight

  // Generate path for the line
  const pathData = validData
    .map((d, i) => {
      const x = xScale(d.year)
      const y = yScale(d.value)
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    })
    .join(' ')

  // Y-axis labels
  const yAxisLabels = [1, 2, 3, 4, 5, 6]

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
        {/* Y-axis grid lines and labels */}
        {yAxisLabels.map((value) => {
          const y = yScale(value)
          return (
            <g key={value}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E5E7EB"
                strokeDasharray="4 2"
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-gray-500 text-xs">
                {value}
              </text>
            </g>
          )
        })}

        {/* X-axis labels */}
        {years.map((year) => {
          const x = xScale(year)
          return (
            <text
              key={year}
              x={x}
              y={height - 10}
              textAnchor="middle"
              className="fill-gray-500 text-xs"
            >
              {year}
            </text>
          )
        })}

        {/* Line */}
        <path d={pathData} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots and values */}
        {showDots &&
          validData.map((d) => {
            const x = xScale(d.year)
            const y = yScale(d.value)
            return (
              <g key={d.year}>
                <circle cx={x} cy={y} r={5} fill={color} />
                <text x={x} y={y - 10} textAnchor="middle" className="fill-gray-700 text-xs font-medium">
                  {d.value.toFixed(2)}
                </text>
              </g>
            )
          })}
      </svg>
    </div>
  )
}

// Multi-line version for comparing questions
interface MultiLineDataPoint {
  year: number
  values: Record<string, number | null>
}

interface MultiLineTrendChartProps {
  data: MultiLineDataPoint[]
  series: { key: string; label: string; color: string }[]
  title: string
  height?: number
  minValue?: number
  maxValue?: number
}

export function MultiLineTrendChart({
  data,
  series,
  title,
  height = 300,
  minValue = 1,
  maxValue = 6,
}: MultiLineTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
        <div className="flex items-center justify-center text-gray-400" style={{ height }}>
          Ingen data
        </div>
      </div>
    )
  }

  const padding = { top: 20, right: 20, bottom: 60, left: 40 }
  const width = 600
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const years = data.map((d) => d.year)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)
  const yearRange = maxYear - minYear || 1

  const valueRange = maxValue - minValue

  const xScale = (year: number) => padding.left + ((year - minYear) / yearRange) * chartWidth
  const yScale = (value: number) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight

  const yAxisLabels = [1, 2, 3, 4, 5, 6]

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
        {/* Y-axis grid lines and labels */}
        {yAxisLabels.map((value) => {
          const y = yScale(value)
          return (
            <g key={value}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E5E7EB"
                strokeDasharray="4 2"
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-gray-500 text-xs">
                {value}
              </text>
            </g>
          )
        })}

        {/* X-axis labels */}
        {years.map((year) => {
          const x = xScale(year)
          return (
            <text key={year} x={x} y={height - 40} textAnchor="middle" className="fill-gray-500 text-xs">
              {year}
            </text>
          )
        })}

        {/* Lines for each series */}
        {series.map((s) => {
          const validPoints = data
            .filter((d) => d.values[s.key] !== null && d.values[s.key] !== undefined)
            .map((d) => ({ year: d.year, value: d.values[s.key] as number }))

          if (validPoints.length < 2) return null

          const pathData = validPoints
            .map((d, i) => {
              const x = xScale(d.year)
              const y = yScale(d.value)
              return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
            })
            .join(' ')

          return (
            <g key={s.key}>
              <path
                d={pathData}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {validPoints.map((d) => (
                <circle key={d.year} cx={xScale(d.year)} cy={yScale(d.value)} r={3} fill={s.color} />
              ))}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-2 justify-center">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
            <span className="text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
