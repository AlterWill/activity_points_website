import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { SubmissionStatus } from '@/lib/types'

const STATUS_STYLES: Record<
  SubmissionStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  PENDING: {
    label: 'Pending',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: Clock,
  },
  APPROVED: {
    label: 'Approved',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejected',
    className: 'border-red-200 bg-red-50 text-red-700',
    icon: XCircle,
  },
}

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const item = STATUS_STYLES[status]
  const Icon = item.icon

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}
    >
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {item.label}
    </span>
  )
}
