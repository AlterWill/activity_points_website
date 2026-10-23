interface PointsRingProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  label?: string
}

export function PointsRing({
  value,
  max,
  size = 168,
  strokeWidth = 12,
  label = 'Total activity points',
}: PointsRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const offset = circumference * (1 - ratio)
  const percentage = Math.round(ratio * 100)

  return (
    <div className="relative inline-flex items-center justify-center" role="img" aria-label={`${label}: ${value} of ${max}`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-indigo-400 transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-4xl font-black tracking-tight">{value}</span>
        <span className="mt-1 text-xs font-semibold text-slate-400">of {max} points</span>
        <span className="mt-0.5 text-[11px] font-bold text-indigo-300">{percentage}%</span>
      </div>
    </div>
  )
}
