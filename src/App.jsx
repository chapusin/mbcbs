import React, { useState } from 'react'
import KegTracker from './components/KegTracker'
import Inventory from './components/Inventory'

const tabs = [
  { id: 'tracker', label: 'Keg Tracker' },
  { id: 'inventory', label: 'Inventory' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('tracker')

  return (
    <div className="min-h-screen" style={{ background: 'var(--dark)' }}>
      {/* Header */}
      <header style={{ background: 'var(--dark-2)', borderBottom: '1px solid var(--dark-3)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Keg icon */}
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: 'var(--amber)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="7" ry="3"/>
                <path d="M5 5v14c0 1.66 3.13 3 7 3s7-1.34 7-3V5"/>
                <path d="M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3"/>
              </svg>
            </div>
            <h1 className="font-display text-3xl" style={{ color: 'var(--amber)', lineHeight: 1 }}>
              KEG TRACKER
            </h1>
          </div>

          {/* Tab Nav */}
          <nav className="flex gap-1" style={{
            background: 'var(--dark-3)',
            borderRadius: 8,
            padding: 4
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 20px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 500,
                  fontSize: 14,
                  transition: 'all 0.2s ease',
                  background: activeTab === tab.id ? 'var(--amber)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--dark)' : 'var(--muted)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 fade-in" key={activeTab}>
        {activeTab === 'tracker'   && <KegTracker />}
        {activeTab === 'inventory' && <Inventory />}
      </main>
    </div>
  )
}
