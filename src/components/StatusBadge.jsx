import React from 'react'

const statusClass = (status = '') => {
  const s = status.toLowerCase().replace(/[^a-z]/g, '')
  if (s.includes('clean'))    return 'status-clean'
  if (s.includes('full') && !s.includes('deliver') && !s.includes('remote')) return 'status-full'
  if (s.includes('deliver') || s.includes('remote')) return 'status-delivered'
  if (s.includes('wash'))     return 'status-washing'
  if (s.includes('dirty'))    return 'status-dirty'
  return 'status-dirty' // fallback
}

export default function StatusBadge({ status }) {
  return (
    <span className={statusClass(status)} style={{
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
