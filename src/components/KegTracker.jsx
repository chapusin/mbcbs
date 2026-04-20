import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { supabase } from '../supabaseClient'
import StatusBadge from './StatusBadge'

const STATUS_OPTIONS = [
  'Clean | In stock',
  'Full | In stock',
  'Full | Delivered',
  'Dirty | In stock',
  'Dirty | Washing',
]

const SIZE_OPTIONS = ['20L', '30L', '50L', '60L', 'CAN12', 'CAN16']

const SEARCH_FIELDS = [
  { value: 'keg_id',         label: 'Keg ID' },
  { value: 'location',       label: 'Location' },
  { value: 'status',         label: 'Status' },
  { value: 'date',           label: 'Date' },
  { value: 'size',           label: 'Size' },
  { value: 'batch_number',   label: 'Batch Number' },
  { value: 'invoice_number', label: 'Invoice Number' },
]

const EMPTY_ENTRY = {
  keg_id: '', location: '', status: 'Clean | In stock',
  date: '', size: '20L', batch_number: '', invoice_number: '', can_count: ''
}

const isCan = (size = '') => size === 'CAN12' || size === 'CAN16'

export default function KegTracker() {
  const [kegs, setKegs]                     = useState([])
  const [loading, setLoading]               = useState(true)
  const [searchTerm, setSearchTerm]         = useState('')
  const [searchCategory, setSearchCategory] = useState('keg_id')
  const [dateRange, setDateRange]           = useState({ start: '', end: '' })
  const [showModal, setShowModal]           = useState(false)
  const [selectedKegs, setSelectedKegs]     = useState([])
  const [bulkEdit, setBulkEdit]             = useState(false)
  const [bulkChanges, setBulkChanges]       = useState({}) // tracks which fields were touched
  const [currentKeg, setCurrentKeg]         = useState(EMPTY_ENTRY)
  const [saving, setSaving]                 = useState(false)
  const [toast, setToast]                   = useState(null)

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
    if (error) { console.error(error); showToast('Failed to load entries', 'error') }
    else setKegs(data)
    setLoading(false)
  }

  const saveKeg = async () => {
    setSaving(true)
    if (bulkEdit) {
      // Only update fields the user actually changed
      if (Object.keys(bulkChanges).length === 0) {
        showToast('No fields were changed', 'error')
        setSaving(false)
        return
      }
      // If can_count is in changes, parse it
      const payload = { ...bulkChanges }
      if ('can_count' in payload) {
        payload.can_count = payload.can_count !== '' ? parseInt(payload.can_count) : null
      }
      for (const id of selectedKegs) {
        const { error } = await supabase.from('kegs').update(payload).eq('id', id)
        if (error) { console.error(error); showToast('Bulk update failed', 'error'); setSaving(false); return }
      }
      showToast(`Updated ${selectedKegs.length} entries`)
    } else {
      const payload = { ...currentKeg, can_count: currentKeg.can_count !== '' ? parseInt(currentKeg.can_count) : null }
      if (currentKeg.id) {
        const { error } = await supabase.from('kegs').update(payload).eq('id', currentKeg.id)
        if (error) { console.error(error); showToast('Update failed', 'error'); setSaving(false); return }
        showToast('Entry updated')
      } else {
        const { error } = await supabase.from('kegs').insert([payload])
        if (error) { console.error(error); showToast('Insert failed', 'error'); setSaving(false); return }
        showToast('Entry added')
      }
    }
    setSaving(false)
    setShowModal(false)
    setSelectedKegs([])
    fetchKegs()
  }

  const deleteKeg = async (id) => {
    if (!confirm('Delete this entry?')) return
    const { error } = await supabase.from('kegs').delete().eq('id', id)
    if (error) { showToast('Delete failed', 'error'); return }
    showToast('Entry deleted')
    fetchKegs()
  }

  const toggleSelect  = (id) => setSelectedKegs(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id])
  const toggleSelectAll = () => selectedKegs.length === kegs.length ? setSelectedKegs([]) : setSelectedKegs(kegs.map(k => k.id))

  const openAdd      = () => { setCurrentKeg(EMPTY_ENTRY); setBulkEdit(false); setBulkChanges({}); setShowModal(true) }
  const openEdit     = (keg) => { setCurrentKeg({ ...keg, can_count: keg.can_count ?? '' }); setBulkEdit(false); setBulkChanges({}); setShowModal(true) }
  const openBulkEdit = () => { setCurrentKeg({ ...EMPTY_ENTRY, keg_id: '—' }); setBulkEdit(true); setBulkChanges({}); setShowModal(true) }
  const clearSearch  = () => { setSearchTerm(''); setDateRange({ start: '', end: '' }); setTimeout(fetchKegs, 0) }

  // Helper: update a field and mark it as changed during bulk edit
  const updateField = (field, value) => {
    setCurrentKeg(prev => ({ ...prev, [field]: value }))
    if (bulkEdit) setBulkChanges(prev => ({ ...prev, [field]: value }))
  }

  const s = {
    card:  { background: 'var(--dark-2)', border: '1px solid var(--dark-3)', borderRadius: 12, padding: 24 },
    label: { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: { width: '100%', padding: '9px 12px', background: 'var(--dark-3)', border: '1px solid #44403C', borderRadius: 7, color: 'var(--light)', fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif' },
    btn: (v = 'primary') => ({
      padding: '9px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 14, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
      ...(v === 'primary' ? { background: 'var(--amber)', color: 'var(--dark)' } :
          v === 'danger'  ? { background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)' } :
          v === 'ghost'   ? { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--dark-3)' } :
          v === 'warning' ? { background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.3)' } :
                            { background: 'var(--dark-3)', color: 'var(--light)' })
    }),
    th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--dark-3)', whiteSpace: 'nowrap' },
    td: { padding: '13px 16px', fontSize: 14, color: 'var(--light)', borderBottom: '1px solid rgba(68,64,60,0.4)', whiteSpace: 'nowrap' },
  }

  const sizeBadge = (size) => (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
      background: isCan(size) ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.12)',
      color: isCan(size) ? '#A5B4FC' : 'var(--amber)',
      border: `1px solid ${isCan(size) ? 'rgba(99,102,241,0.3)' : 'rgba(245,158,11,0.25)'}`,
    }}>{size}</span>
  )

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
        }} className="fade-in">{toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-4xl" style={{ color: 'var(--light)', lineHeight: 1 }}>KEG TRACKER</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{kegs.length} entr{kegs.length !== 1 ? 'ies' : 'y'} total</p>
        </div>
        <button style={s.btn('primary')} onClick={openAdd}>+ Add New Entry</button>
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
                <input type="date" style={s.input} value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                <input type="date" style={s.input} value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
              </div>
            ) : (
              <input type="text" placeholder={`Search by ${searchCategory.replace('_', ' ')}…`} style={s.input}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchKegs()} />
            )}
          </div>
          <button style={s.btn('primary')} onClick={fetchKegs}>Search</button>
          <button style={s.btn('ghost')} onClick={clearSearch}>Clear</button>
        </div>
      </div>

      {/* Bulk Edit Banner */}
      {selectedKegs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }} className="slide-in">
          <span style={{ color: 'var(--amber)', fontWeight: 500, fontSize: 14 }}>{selectedKegs.length} entr{selectedKegs.length > 1 ? 'ies' : 'y'} selected</span>
          <button style={s.btn('warning')} onClick={openBulkEdit}>Bulk Edit</button>
          <button style={{ ...s.btn('ghost'), marginLeft: 'auto' }} onClick={() => setSelectedKegs([])}>Clear Selection</button>
        </div>
      )}

      {/* Table */}
      <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--dark-3)' }}>
                <th style={{ ...s.th, width: 44 }}>
                  <input type="checkbox" checked={kegs.length > 0 && selectedKegs.length === kegs.length} onChange={toggleSelectAll} style={{ cursor: 'pointer', accentColor: 'var(--amber)' }} />
                </th>
                <th style={s.th}>Keg ID</th>
                <th style={s.th}>Location</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Date</th>
                <th style={s.th}>Size</th>
                <th style={s.th}>Batch #</th>
                <th style={s.th}>Invoice #</th>
                <th style={s.th}>Can Count</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ ...s.td, textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Loading…</td></tr>
              ) : kegs.length === 0 ? (
                <tr><td colSpan={10} style={{ ...s.td, textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No entries found</td></tr>
              ) : kegs.map((keg, i) => (
                <tr key={keg.id} className="keg-row"
                  style={{ background: selectedKegs.includes(keg.id) ? 'rgba(245,158,11,0.06)' : undefined, animationDelay: `${i * 0.02}s` }}>
                  <td style={{ ...s.td, width: 44 }}>
                    <input type="checkbox" checked={selectedKegs.includes(keg.id)} onChange={() => toggleSelect(keg.id)} style={{ cursor: 'pointer', accentColor: 'var(--amber)' }} />
                  </td>
                  <td style={{ ...s.td, fontWeight: 600, color: 'var(--amber)' }}>{keg.keg_id}</td>
                  <td style={s.td}>{keg.location || '—'}</td>
                  <td style={s.td}><StatusBadge status={keg.status} /></td>
                  <td style={{ ...s.td, color: 'var(--muted)' }}>{keg.date || '—'}</td>
                  <td style={s.td}>{keg.size ? sizeBadge(keg.size) : '—'}</td>
                  <td style={{ ...s.td, color: 'var(--muted)' }}>{keg.batch_number || '—'}</td>
                  <td style={{ ...s.td, color: 'var(--muted)' }}>{keg.invoice_number || '—'}</td>
                  <td style={{ ...s.td, color: 'var(--muted)' }}>{keg.can_count != null ? keg.can_count : '—'}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <button style={{ ...s.btn('ghost'), padding: '5px 12px', fontSize: 13, marginRight: 6 }} onClick={() => openEdit(keg)}>Edit</button>
                    <button style={{ ...s.btn('danger'), padding: '5px 12px', fontSize: 13 }} onClick={() => deleteKeg(keg.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Portal */}
      {showModal && ReactDOM.createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, overflowY: 'auto' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-3)', borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }} className="fade-in">

              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--dark-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="font-display text-2xl" style={{ color: 'var(--amber)' }}>
                  {bulkEdit ? `BULK EDIT (${selectedKegs.length})` : currentKeg.id ? 'EDIT ENTRY' : 'ADD NEW ENTRY'}
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>

              {/* Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Bulk edit hint */}
                {bulkEdit && (
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--muted)' }}>
                    Only fields you <span style={{ color: 'var(--amber)', fontWeight: 600 }}>edit</span> will be updated. Untouched fields stay as-is on each keg.
                  </div>
                )}

                {/* Helper to style fields: dim untouched bulk-edit fields */}
                {/* Keg ID — locked in bulk */}
                <div>
                  <label style={s.label}>Keg ID {bulkEdit && <span style={{ color: 'var(--muted)', textTransform: 'none', fontSize: 11 }}>(locked in bulk edit)</span>}</label>
                  <input type="text" style={{ ...s.input, opacity: bulkEdit ? 0.35 : 1 }} value={currentKeg.keg_id} disabled={bulkEdit}
                    onChange={e => updateField('keg_id', e.target.value)} />
                </div>

                {/* Location */}
                <div>
                  <label style={{ ...s.label, color: bulkEdit && bulkChanges.location !== undefined ? 'var(--amber)' : 'var(--muted)' }}>
                    Location {bulkEdit && bulkChanges.location !== undefined && <span style={{ fontSize: 10, marginLeft: 6 }}>● will update</span>}
                  </label>
                  <input type="text" style={{ ...s.input, opacity: bulkEdit && bulkChanges.location === undefined ? 0.45 : 1, borderColor: bulkEdit && bulkChanges.location !== undefined ? 'var(--amber)' : '#44403C' }}
                    value={currentKeg.location} placeholder={bulkEdit ? 'Leave blank to keep existing…' : ''}
                    onChange={e => updateField('location', e.target.value)} />
                </div>

                {/* Status */}
                <div>
                  <label style={{ ...s.label, color: bulkEdit && bulkChanges.status !== undefined ? 'var(--amber)' : 'var(--muted)' }}>
                    Status {bulkEdit && bulkChanges.status !== undefined && <span style={{ fontSize: 10, marginLeft: 6 }}>● will update</span>}
                  </label>
                  <select style={{ ...s.input, opacity: bulkEdit && bulkChanges.status === undefined ? 0.45 : 1, borderColor: bulkEdit && bulkChanges.status !== undefined ? 'var(--amber)' : '#44403C' }}
                    value={currentKeg.status} onChange={e => updateField('status', e.target.value)}>
                    {bulkEdit && bulkChanges.status === undefined && <option value="">— keep existing —</option>}
                    {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label style={{ ...s.label, color: bulkEdit && bulkChanges.date !== undefined ? 'var(--amber)' : 'var(--muted)' }}>
                    Date {bulkEdit && bulkChanges.date !== undefined && <span style={{ fontSize: 10, marginLeft: 6 }}>● will update</span>}
                  </label>
                  <input type="date" style={{ ...s.input, opacity: bulkEdit && bulkChanges.date === undefined ? 0.45 : 1, borderColor: bulkEdit && bulkChanges.date !== undefined ? 'var(--amber)' : '#44403C' }}
                    value={currentKeg.date} onChange={e => updateField('date', e.target.value)} />
                </div>

                {/* Size */}
                <div>
                  <label style={{ ...s.label, color: bulkEdit && bulkChanges.size !== undefined ? 'var(--amber)' : 'var(--muted)' }}>
                    Size {bulkEdit && bulkChanges.size !== undefined && <span style={{ fontSize: 10, marginLeft: 6 }}>● will update</span>}
                  </label>
                  <select style={{ ...s.input, opacity: bulkEdit && bulkChanges.size === undefined ? 0.45 : 1, borderColor: bulkEdit && bulkChanges.size !== undefined ? 'var(--amber)' : '#44403C' }}
                    value={currentKeg.size} onChange={e => updateField('size', e.target.value)}>
                    {bulkEdit && bulkChanges.size === undefined && <option value="">— keep existing —</option>}
                    {SIZE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>

                {/* Batch + Invoice */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ ...s.label, color: bulkEdit && bulkChanges.batch_number !== undefined ? 'var(--amber)' : 'var(--muted)' }}>
                      Batch # {bulkEdit && bulkChanges.batch_number !== undefined && <span style={{ fontSize: 10 }}>●</span>}
                    </label>
                    <input type="text" style={{ ...s.input, opacity: bulkEdit && bulkChanges.batch_number === undefined ? 0.45 : 1, borderColor: bulkEdit && bulkChanges.batch_number !== undefined ? 'var(--amber)' : '#44403C' }}
                      value={currentKeg.batch_number} placeholder={bulkEdit ? 'Keep existing…' : ''}
                      onChange={e => updateField('batch_number', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ ...s.label, color: bulkEdit && bulkChanges.invoice_number !== undefined ? 'var(--amber)' : 'var(--muted)' }}>
                      Invoice # {bulkEdit && bulkChanges.invoice_number !== undefined && <span style={{ fontSize: 10 }}>●</span>}
                    </label>
                    <input type="text" style={{ ...s.input, opacity: bulkEdit && bulkChanges.invoice_number === undefined ? 0.45 : 1, borderColor: bulkEdit && bulkChanges.invoice_number !== undefined ? 'var(--amber)' : '#44403C' }}
                      value={currentKeg.invoice_number} placeholder={bulkEdit ? 'Keep existing…' : ''}
                      onChange={e => updateField('invoice_number', e.target.value)} />
                  </div>
                </div>

                {/* Can Count */}
                {isCan(currentKeg.size) && (
                  <div className="slide-in">
                    <label style={{ ...s.label, color: bulkEdit && bulkChanges.can_count !== undefined ? '#A5B4FC' : 'var(--muted)' }}>
                      Can Count {bulkEdit && bulkChanges.can_count !== undefined && <span style={{ fontSize: 10, marginLeft: 6 }}>● will update</span>}
                    </label>
                    <input type="number" min="0"
                      style={{ ...s.input, border: `1px solid ${bulkEdit && bulkChanges.can_count !== undefined ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.25)'}`, opacity: bulkEdit && bulkChanges.can_count === undefined ? 0.45 : 1 }}
                      placeholder="Number of cans" value={currentKeg.can_count}
                      onChange={e => updateField('can_count', e.target.value)} />
                  </div>
                )}

                {/* Changed fields summary */}
                {bulkEdit && Object.keys(bulkChanges).length > 0 && (
                  <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--muted)' }}>
                    Will update: <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{Object.keys(bulkChanges).join(', ').replace(/_/g, ' ')}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--dark-3)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button style={s.btn('ghost')} onClick={() => setShowModal(false)}>Cancel</button>
                <button style={s.btn('primary')} onClick={saveKeg} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
