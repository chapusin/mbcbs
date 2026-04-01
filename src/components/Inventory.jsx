import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import StatusBadge from './StatusBadge'

// Extract beer name from batch_number prefix (letters only)
// e.g. "CONIFERO00263012926" -> "CONIFERO"
const extractBeer = (batch_number = '') => {
  const match = batch_number.match(/^([A-Z]+)/)
  return match ? match[1] : null
}

// Check if a status string means "Full & In Stock" regardless of exact formatting
// Handles: "Full/In Stock", "Full | In stock", "Full/in stock", etc.
const isFullInStock = (status = '') => {
  const s = status.toLowerCase().replace(/[^a-z]/g, '')
  return s.includes('full') && s.includes('instock') && !s.includes('deliver') && !s.includes('remote')
}

export default function Inventory() {
  const [kegs, setKegs]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchKegs() }, [])

  const fetchKegs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('kegs')
      .select('*')
      .order('keg_id', { ascending: true })
    if (error) console.error(error)
    else setKegs(data || [])
    setLoading(false)
  }

  // ── Status summary: dynamic — counts every status that exists in DB ──
  const statusCounts = kegs.reduce((acc, keg) => {
    const s = keg.status || 'Unknown'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})
  // Sort by count descending
  const statusSummary = Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => ({ status, count }))

  // ── Beer x Size breakdown — ONLY Full/In Stock kegs ──────────
  const fullInStockKegs = kegs.filter(k => isFullInStock(k.status || ''))

  const allSizes = [...new Set(fullInStockKegs.map(k => k.size).filter(Boolean))].sort()
  const allBeers = [...new Set(fullInStockKegs.map(k => extractBeer(k.batch_number || '')).filter(Boolean))].sort()

  const beerSizeMap = {}
  fullInStockKegs.forEach(keg => {
    const beer = extractBeer(keg.batch_number || '')
    const size = keg.size
    if (!beer || !size) return
    if (!beerSizeMap[beer]) beerSizeMap[beer] = {}
    beerSizeMap[beer][size] = (beerSizeMap[beer][size] || 0) + 1
  })

  // ── Styles ────────────────────────────────────────────────────
  const s = {
    card: {
      background: 'var(--dark-2)',
      border: '1px solid var(--dark-3)',
      borderRadius: 12,
      padding: 24,
    },
    th: {
      padding: '12px 16px', textAlign: 'left', fontSize: 11,
      fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase',
      letterSpacing: '0.08em', borderBottom: '1px solid var(--dark-3)',
      whiteSpace: 'nowrap'
    },
    thNum: {
      padding: '12px 16px', textAlign: 'center', fontSize: 11,
      fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase',
      letterSpacing: '0.08em', borderBottom: '1px solid var(--dark-3)',
      whiteSpace: 'nowrap'
    },
    td: {
      padding: '13px 16px', fontSize: 14, color: 'var(--light)',
      borderBottom: '1px solid rgba(68,64,60,0.4)',
    },
    tdNum: {
      padding: '13px 16px', fontSize: 14, color: 'var(--light)',
      borderBottom: '1px solid rgba(68,64,60,0.4)',
      textAlign: 'center',
    },
  }

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-4xl" style={{ color: 'var(--light)', lineHeight: 1 }}>INVENTORY</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
            Read-only · {kegs.length} keg{kegs.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={fetchKegs}
          style={{
            padding: '9px 18px', borderRadius: 7, border: '1px solid var(--dark-3)',
            background: 'transparent', color: 'var(--muted)', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: 14
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Status Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', color: 'var(--muted)', fontSize: 14 }}>Loading…</div>
        ) : statusSummary.map(({ status, count }) => (
          <div key={status} style={{ ...s.card, padding: '16px 20px' }}>
            <div style={{
              fontSize: 36, fontWeight: 700, color: 'var(--amber)',
              fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1, marginBottom: 8
            }}>
              {count}
            </div>
            <StatusBadge status={status} />
          </div>
        ))}
      </div>

      {/* ── Beer × Size Breakdown ── */}
      <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--dark-3)',
          background: 'var(--dark-3)',
          display: 'flex', alignItems: 'baseline', gap: 12
        }}>
          <h3 className="font-display text-2xl" style={{ color: 'var(--amber)', lineHeight: 1 }}>
            FULL KEGS IN STOCK
          </h3>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>
            {fullInStockKegs.length} keg{fullInStockKegs.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(28,25,23,0.6)' }}>
                <th style={s.th}>Beer</th>
                {allSizes.map(size => (
                  <th key={size} style={s.thNum}>{size}</th>
                ))}
                <th style={s.thNum}>Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={allSizes.length + 2} style={{ ...s.td, textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                    Loading…
                  </td>
                </tr>
              ) : allBeers.length === 0 ? (
                <tr>
                  <td colSpan={allSizes.length + 2} style={{ ...s.td, textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                    No data found
                  </td>
                </tr>
              ) : allBeers.map((beer, i) => {
                const row = beerSizeMap[beer] || {}
                const total = allSizes.reduce((sum, size) => sum + (row[size] || 0), 0)
                return (
                  <tr key={beer} className="keg-row">
                    <td style={{ ...s.td, fontWeight: 600, color: 'var(--amber)' }}>{beer}</td>
                    {allSizes.map(size => (
                      <td key={size} style={{
                        ...s.tdNum,
                        color: (row[size] || 0) === 0 ? 'var(--dark-3)' : 'var(--light)',
                        fontWeight: (row[size] || 0) > 0 ? 600 : 400,
                      }}>
                        {row[size] || 0}
                      </td>
                    ))}
                    <td style={{
                      ...s.tdNum,
                      fontWeight: 700,
                      color: 'var(--amber)',
                      borderLeft: '1px solid var(--dark-3)'
                    }}>
                      {total}
                    </td>
                  </tr>
                )
              })}

              {/* Totals row */}
              {!loading && allBeers.length > 0 && (
                <tr style={{ background: 'var(--dark-3)' }}>
                  <td style={{ ...s.td, fontWeight: 700, color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total
                  </td>
                  {allSizes.map(size => {
                    const colTotal = fullInStockKegs.filter(k => k.size === size).length
                    return (
                      <td key={size} style={{ ...s.tdNum, fontWeight: 700, color: 'var(--light)' }}>
                        {colTotal}
                      </td>
                    )
                  })}
                  <td style={{ ...s.tdNum, fontWeight: 700, color: 'var(--amber)', borderLeft: '1px solid var(--dark-3)' }}>
                    {fullInStockKegs.filter(k => k.size).length}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
