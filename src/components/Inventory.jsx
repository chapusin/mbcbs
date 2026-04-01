import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import StatusBadge from './StatusBadge'

const SEARCH_FIELDS = [
  { value: 'keg_id',         label: 'Keg ID' },
  { value: 'location',       label: 'Location' },
  { value: 'status',         label: 'Status' },
  { value: 'date',           label: 'Date' },
  { value: 'beer',           label: 'Beer' },
  { value: 'batch_number',   label: 'Batch Number' },
  { value: 'invoice_number', label: 'Invoice Number' },
]

const STATUS_ORDER = [
  'Clean/In Stock',
  'Full/In Stock',
  'Delivered/Remote',
  'Dirty/In Stock',
  'Dirty/Washing',
]

export default function Inventory() {
  const [kegs, setKegs]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [searchTerm, setSearchTerm]   = useState('')
  const [searchCategory, setSearchCategory] = useState('keg_id')
  const [dateRange, setDateRange]     = useState({ start: '', end: '' })

  useEffect(() => { fetchKegs() }, [])

  const fetchKegs = async () => {
    setLoading(true)
    let query = supabase.from('kegs').select('*').order('keg_id', { ascending: true })
    if (searchTerm) {
      if (searchCategory === 'date') {
        if (dateRange.start && dateRange.end)
          query = query.gte('date', dateRange.start).lte('date', dateRange.end)
      } else {
        query = query.ilike(searchCategory, `%${searchTerm}%`)
      }
    }
    const { data, error } = await query
    if (error) console.error(error)
    else setKegs(data)
    setLoading(false)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setDateRange({ start: '', end: '' })
    setTimeout(fetchKegs, 0)
  }

  // Compute summary counts
  const summary = STATUS_ORDER.map(status => ({
    status,
    count: kegs.filter(k => k.status === status).length
  }))

  // ── Styles ────────────────────────────────────────────────────
  const s = {
    card: {
      background: 'var(--dark-2)',
      border: '1px solid var(--dark-3)',
      borderRadius: 12,
      padding: 24,
    },
    label: {
      display: 'block', fontSize: 12, fontWeight: 500,
      color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'
    },
    input: {
      width: '100%', padding: '9px 12px',
      background: 'var(--dark-3)', border: '1px solid #44403C',
      borderRadius: 7, color: 'var(--light)', fontSize: 14,
      outline: 'none', fontFamily: 'DM Sans, sans-serif',
    },
    btn: (variant = 'primary') => ({
      padding: '9px 18px', borderRadius: 7, border: 'none',
      cursor: 'pointer', fontWeight: 500, fontSize: 14,
      fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
      ...(variant === 'primary' ? { background: 'var(--amber)', color: 'var(--dark)' }
                                : { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--dark-3)' })
    }),
    th: {
      padding: '12px 16px', textAlign: 'left', fontSize: 11,
      fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase',
      letterSpacing: '0.08em', borderBottom: '1px solid var(--dark-3)',
      whiteSpace: 'nowrap'
    },
    td: {
      padding: '13px 16px', fontSize: 14, color: 'var(--light)',
      borderBottom: '1px solid rgba(68,64,60,0.4)', whiteSpace: 'nowrap'
    },
  }

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-4xl" style={{ color: 'var(--light)', lineHeight: 1 }}>INVENTORY</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
            Read-only view · {kegs.length} keg{kegs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {summary.map(({ status, count }) => (
          <div key={status} style={{ ...s.card, padding: '16px 20px' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--amber)', fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>
              {count}
            </div>
            <StatusBadge status={status} />
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '0 0 160px' }}>
            <label style={s.label}>Search By</label>
            <select value={searchCategory} onChange={e => setSearchCategory(e.target.value)} style={s.input}>
              {SEARCH_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={s.label}>{searchCategory === 'date' ? 'Date Range' : 'Search Term'}</label>
            {searchCategory === 'date' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="date" style={s.input} value={dateRange.start}
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                <input type="date" style={s.input} value={dateRange.end}
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
              </div>
            ) : (
              <input type="text" placeholder={`Search by ${searchCategory.replace('_', ' ')}…`}
                style={s.input} value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchKegs()} />
            )}
          </div>

          <button style={s.btn('primary')} onClick={fetchKegs}>Search</button>
          <button style={s.btn('ghost')} onClick={clearSearch}>Clear</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--dark-3)' }}>
                <th style={s.th}>Keg ID</th>
                <th style={s.th}>Location</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Date</th>
                <th style={s.th}>Beer</th>
                <th style={s.th}>Batch #</th>
                <th style={s.th}>Invoice #</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                  Loading…
                </td></tr>
              ) : kegs.length === 0 ? (
                <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                  No kegs found
                </td></tr>
              ) : kegs.map((keg, i) => (
                <tr key={keg.id} className="keg-row" style={{ animationDelay: `${i * 0.02}s` }}>
                  <td style={{ ...s.td, fontWeight: 600, color: 'var(--amber)' }}>{keg.keg_id}</td>
                  <td style={s.td}>{keg.location || '—'}</td>
                  <td style={s.td}><StatusBadge status={keg.status} /></td>
                  <td style={{ ...s.td, color: 'var(--muted)' }}>{keg.date || '—'}</td>
                  <td style={s.td}>{keg.beer || '—'}</td>
                  <td style={{ ...s.td, color: 'var(--muted)' }}>{keg.batch_number || '—'}</td>
                  <td style={{ ...s.td, color: 'var(--muted)' }}>{keg.invoice_number || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
