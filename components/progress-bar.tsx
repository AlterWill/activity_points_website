type ProgressTone = 'indigo' | 'emerald' | 'amber' | 'sky' | 'slate'

const TONE_CLASSES: Record<ProgressTone, string> = {
  indigo: 'bg-indigo-600',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  slate: 'bg-slate-500',
}

interface ProgressBarProps {
  value: number
  max: number
  tone?: ProgressTone
  className?: string
  label?: string
}

export function ProgressBar({
  value,
  max,
  tone = 'indigo',
  className = '',
  label,
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${TONE_CLASSES[tone]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
