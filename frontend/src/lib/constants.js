export const STATUS_LABELS = {
  open: 'Open',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
}

export const STATUS_STYLES = {
  open: 'bg-sky-100 text-sky-800 ring-sky-300',
  in_review: 'bg-amber-100 text-amber-800 ring-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  rejected: 'bg-red-100 text-red-800 ring-red-300',
  completed: 'bg-slate-200 text-slate-800 ring-slate-400',
}

export const STATUS_DOTS = {
  open: 'bg-sky-500',
  in_review: 'bg-amber-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
  completed: 'bg-slate-500',
}

export const REASON_LABELS = {
  damaged: 'Damaged',
  wrong_item: 'Wrong Item',
  size_issue: 'Size Issue',
  not_as_described: 'Not As Described',
  changed_mind: 'Changed Mind',
}

export const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }))

export const STATUS_OPTIONS = toOptions(STATUS_LABELS)
export const REASON_OPTIONS = toOptions(REASON_LABELS)

export const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'customer_name:asc', label: 'Customer A to Z' },
  { value: 'customer_name:desc', label: 'Customer Z to A' },
  { value: 'status:asc', label: 'Status (lifecycle order)' },
  { value: 'reference:asc', label: 'Reference' },
]

export const RESOLUTION_LABELS = {
  refund: 'Refund',
  replacement: 'Replacement',
  store_credit: 'Store Credit',
}

export const RESOLUTION_OPTIONS = toOptions(RESOLUTION_LABELS)

export const TRANSITION_LABELS = {
  in_review: 'Move to In Review',
  approved: 'Approve',
  rejected: 'Reject',
  completed: 'Mark Completed',
}