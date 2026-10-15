export const TRANSITIONS = {
  open: ['in_review'],
  in_review: ['approved', 'rejected'],
  approved: ['completed'],
  rejected: [],
  completed: [],
}

export const EDITABLE_STATUSES = ['open', 'in_review']
export const REMOVABLE_STATUSES = ['open', 'rejected']

export const allowedActions = (status) => ({
  transitions: TRANSITIONS[status],
  canEdit: EDITABLE_STATUSES.includes(status),
  canRemove: REMOVABLE_STATUSES.includes(status),
})