import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import StatusBadge from './StatusBadge'

const STATUS_OPTIONS = [
  'Clean/In Stock',
  'Full/In Stock',
  'Delivered/Remote',
  'Dirty/In Stock',
  'Dirty/Washing',
]

const SEARCH_FIELDS = [
  { value: 'keg_id',         label: 'Keg ID' },
  { value: 'location',       label: 'Location' },
  { value: 'status',         label: 'Status' },
  { value: 'date',           label: 'Date' },
  { value: 'size',           label: 'Size' },
  { value: 'batch_number',   label: 'Batch Number' },
  { value: 'invoice_number', label: 'Invoice Number' },
]

const EMPTY_KEG = {
  keg_id: '', location: '', status: 'Clean/In Stock',
  date: '', size: '', batch_number: '', invoice_number: ''
}

export default function KegTracker() {
  const [kegs, setKegs]                 = useState([])
  const [loading, setLoading]           = useState(true)
  const [searchTerm, setSearchTerm]     = useState('')
  const [searchCategory, setSearchCategory] = useState('keg_id')
  const [dateRange, setDateRange]       = useState({ start: '', end: '' })
  const [showModal, setShowModal]       = useState(false)
  const [selectedKegs, setSelectedKegs] = useState([])
  const [bulkEdit, setBulkEdit]         = useState(false)
  const [currentKeg, setCurrentKeg]     = useState(EMPTY_KEG)
  const [saving, setSaving]             = useState(false)
  const [toast, setToast]               = useState(null)

  useEffect(() => { fetchKegs() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

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
    if (error) { console.error(error); showToast('Failed to load kegs', 'error') }
    else setKegs(data)
    setLoading(false)
  }

  const saveKeg = async () => {
    setSaving(true)
    if (bulkEdit) {
      for (const id of selectedKegs) {
        const { location, status, date, size, batch_number, invoice_number } = currentKeg
        const { error } = await supabase.from('kegs')
          .update({ location, status, date, size, batch_number, invoice_number })
          .eq('id', id)
        if (error) { console.error(error); showToast('Bulk update failed', 'error'); setSaving(false); return }
      }
      showToast(`Updated ${selectedKegs.length} kegs`)
    } else {
      if (currentKeg.id) {
        const { error } = await supabase.from('kegs').update(currentKeg).eq('id', currentKeg.id)
        if (error) { console.error(error); showToast('Update failed', 'error'); setSaving(false); return }
        showToast('Keg updated')
      } else {
        const { error } = await supabase.from('kegs').insert([currentKeg])
        if (error) { console.error(error); showToast('Insert failed', 'error'); setSaving(false); return }
        showToast('Keg added')
      }
    }
    setSaving(false)
    setShowModal(false)
    setSelectedKegs([])
    fetchKegs()
  }

  const deleteKeg = async (id) => {
    if (!confirm('Delete this keg?')) return
    const { error } = await supabase.from('kegs').delete().eq('id', id)
    if (error) { showToast('Delete failed', 'error'); return }
    showToast('Keg deleted')
    fetchKegs()
  }

  const toggleSelect = (id) => {
    setSelectedKegs(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedKegs.length === kegs.length) setSelectedKegs([])
    else setSelectedKegs(kegs.map(k => k.id))
  }

  const openAdd = () => {
    setCurrentKeg(EMPTY_KEG)
    setBulkEdit(false)
    setShowModal(true)
  }

  const openEdit = (keg) => {
    setCurrentKeg(keg)
    setBulkEdit(false)
    setShowModal(true)
  }

  const openBulkEdit = () => {
    setCurrentKeg({ ...EMPTY_KEG, keg_id: '—' })
    setBulkEdit(true)
    setShowModal(true)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setDateRange({ start: '', end: '' })
    setTimeout(fetchKegs, 0)
  }

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
      ...(variant === 'primary'  ? { background: 'var(--amber)',  color: 'var(--dark)' } :
          variant === 'danger'   ? { background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)' } :
          variant === 'ghost'    ? { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--dark-3)' } :
          variant === 'warning'  ? { background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.3)' } :
                                   { background: 'var(--dark-3)', color: 'var(--light)' })
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
    <div style={{ position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#7F1D1D' : '#064E3B',
          border: `1px solid ${toast.type === 'error' ? '#B91C1C' : '#065F46'}`,
          color: toast.type === 'error' ? '#FCA5A5' : '#6EE7B7',
          padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
        }} className="fade-in">
          {toast.msg}
        </div>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-4xl" style={{ color: 'var(--light)', lineHeight: 1 }}>KEG TRACKER</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
            {kegs.length} keg{kegs.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button style={s.btn('primary')} onClick={openAdd}>
          + Add New Keg
        </button>
      </div>

      {/* Search Card */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Search by */}
          <div style={{ flex: '0 0 160px' }}>
            <label style={s.label}>Search By</label>
            <select
              value={searchCategory}
              onChange={e => setSearchCategory(e.target.value)}
              style={s.input}
            >
              {SEARCH_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          {/* Search input */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={s.label}>
              {searchCategory === 'date' ? 'Date Range' : 'Search Term'}
            </label>
            {searchCategory === 'date' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="date" style={s.input} value={dateRange.start}
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                <input type="date" style={s.input} value={dateRange.end}
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
              </div>
            ) : (
              <input
                type="text"
                placeholder={`Search by ${searchCategory.replace('_', ' ')}…`}
                style={s.input}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchKegs()}
              />
            )}
          </div>

          <button style={s.btn('primary')} onClick={fetchKegs}>Search</button>
          <button style={s.btn('ghost')} onClick={clearSearch}>Clear</button>
        </div>
      </div>

      {/* Bulk Edit Banner */}
      {selectedKegs.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 8, padding: '12px 16px', marginBottom: 16
        }} className="slide-in">
          <span style={{ color: 'var(--amber)', fontWeight: 500, fontSize: 14 }}>
            {selectedKegs.length} keg{selectedKegs.length > 1 ? 's' : ''} selected
          </span>
          <button style={s.btn('warning')} onClick={openBulkEdit}>Bulk Edit</button>
          <button style={{ ...s.btn('ghost'), marginLeft: 'auto' }} onClick={() => setSelectedKegs([])}>
            Clear Selection
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--dark-3)' }}>
                <th style={{ ...s.th, width: 44 }}>
                  <input type="checkbox"
                    checked={kegs.length > 0 && selectedKegs.length === kegs.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', accentColor: 'var(--amber)' }}
                  />
                </th>
                <th style={s.th}>Keg ID</th>
                <th style={s.th}>Location</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Date</th>
                <th style={s.th}>Size</th>
                <th style={s.th}>Batch #</th>
                <th style={s.th}>Invoice #</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ ...s.td, textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                  Loading…
                </td></tr>
              ) : kegs.length === 0 ? (
                <tr><td colSpan={9} style={{ ...s.td, textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                  No kegs found
                </td></tr>
              ) : kegs.map((keg, i) => (
                <tr key={keg.id} className="keg-row"
                  style={{ background: selectedKegs.includes(keg.id) ? 'rgba(245,158,11,0.06)' : undefined,
                           animationDelay: `${i * 0.02}s` }}>
                  <td style={{ ...s.td, width: 44 }}>
                    <input type="checkbox"
                      checked={selectedKegs.includes(keg.id)}
                      onChange={() => toggleSelect(keg.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--amber)' }}
                    />
                  </td>
                  <td style={{ ...s.td, fontWeight: 600, color: 'var(--amber)' }}>{keg.keg_id}</td>
                  <td style={s.td}>{keg.location || '—'}</td>
                  <td style={s.td}><StatusBadge status={keg.status} /></td>
                  <td style={{ ...s.td, color: 'var(--muted)' }}>{keg.date || '—'}</td>
                  <td style={s.td}>{keg.size || '—'}</td>
                  <td style={{ ...s.td, color: 'var(--muted)' }}>{keg.batch_number || '—'}</td>
                  <td style={{ ...s.td, color: 'var(--muted)' }}>{keg.invoice_number || '—'}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <button style={{ ...s.btn('ghost'), padding: '5px 12px', fontSize: 13, marginRight: 6 }}
                      onClick={() => openEdit(keg)}>Edit</button>
                    <button style={{ ...s.btn('danger'), padding: '5px 12px', fontSize: 13 }}
                      onClick={() => deleteKeg(keg.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 1000, overflowY: 'auto'
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
        <div style={{
          minHeight: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'var(--dark-2)', border: '1px solid var(--dark-3)',
            borderRadius: 12, width: '100%', maxWidth: 480,
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
          }} className="fade-in">
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--dark-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <h3 className="font-display text-2xl" style={{ color: 'var(--amber)' }}>
                {bulkEdit ? `BULK EDIT (${selectedKegs.length})` : currentKeg.id ? 'EDIT KEG' : 'ADD NEW KEG'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{
                background: 'none', border: 'none', color: 'var(--muted)',
                fontSize: 20, cursor: 'pointer', lineHeight: 1
              }}>✕</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Keg ID */}
              <div>
                <label style={s.label}>Keg ID {bulkEdit && <span style={{ color: 'var(--muted)' }}>(locked in bulk edit)</span>}</label>
                <input type="text" style={{ ...s.input, opacity: bulkEdit ? 0.4 : 1 }}
                  value={currentKeg.keg_id} disabled={bulkEdit}
                  onChange={e => setCurrentKeg({ ...currentKeg, keg_id: e.target.value })} />
              </div>

              {/* Location */}
              <div>
                <label style={s.label}>Location</label>
                <input type="text" style={s.input} value={currentKeg.location}
                  onChange={e => setCurrentKeg({ ...currentKeg, location: e.target.value })} />
              </div>

              {/* Status */}
              <div>
                <label style={s.label}>Status</label>
                <select style={s.input} value={currentKeg.status}
                  onChange={e => setCurrentKeg({ ...currentKeg, status: e.target.value })}>
                  {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              {/* Date */}
              <div>
                <label style={s.label}>Date</label>
                <input type="date" style={s.input} value={currentKeg.date}
                  onChange={e => setCurrentKeg({ ...currentKeg, date: e.target.value })} />
              </div>

              {/* Beer */}
              <div>
                <label style={s.label}>Size</label>
                <input type="text" style={s.input} placeholder="e.g. 20L, 50L, 60L" value={currentKeg.size}
                  onChange={e => setCurrentKeg({ ...currentKeg, size: e.target.value })} />
              </div>

              {/* Two col: Batch + Invoice */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={s.label}>Batch Number</label>
                  <input type="text" style={s.input} value={currentKeg.batch_number}
                    onChange={e => setCurrentKeg({ ...currentKeg, batch_number: e.target.value })} />
                </div>
                <div>
                  <label style={s.label}>Invoice Number</label>
                  <input type="text" style={s.input} value={currentKeg.invoice_number}
                    onChange={e => setCurrentKeg({ ...currentKeg, invoice_number: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid var(--dark-3)',
              display: 'flex', justifyContent: 'flex-end', gap: 10
            }}>
              <button style={s.btn('ghost')} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.btn('primary')} onClick={saveKeg} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
