import React from 'react'

const statusClass = {
  'Clean/In Stock':    'status-clean',
  'Full/In Stock':     'status-full',
  'Delivered/Remote':  'status-delivered',
  'Dirty/In Stock':    'status-dirty',
  'Dirty/Washing':     'status-washing',
}

export default function StatusBadge({ status }) {
  const cls = statusClass[status] || 'status-dirty'
  return (
    <span className={cls} style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 500,
      whiteSpace: 'nowrap'
    }}>
      {status}
    </span>
  )
}
