import { useState } from 'react'
import { CylinderBarChart, type CylinderRow, type CylinderSeries } from './components/CylinderBarChart/CylinderBarChart'
import './App.css'

type Period = 'week' | 'month'

const PERIOD_DAYS: Record<Period, number> = { week: 7, month: 30 }

const SERIES: CylinderSeries[] = [
  { key: 'fragrance', label: 'Fragrance', color: '#7c6cf2' },
  { key: 'clothing', label: 'Clothing', color: '#3ec7b4' },
  { key: 'accessories', label: 'Accessories', color: '#ec5f9a' },
  { key: 'footwear', label: 'Footwear', color: '#3b82f6' },
  { key: 'watches', label: 'Watches', color: '#f2a93b' },
]

const count = new Intl.NumberFormat('en-NG')
const weekday = new Intl.DateTimeFormat('en-NG', { weekday: 'short' })
const dayMonth = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short' })
const fullDate = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

// made-up units sold per category per day, ending today
function sampleData(period: Period): CylinderRow[] {
  const days = PERIOD_DAYS[period]
  const today = new Date()
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - i))
    return {
      label: period === 'week' ? weekday.format(date) : dayMonth.format(date),
      date: fullDate.format(date),
      ...Object.fromEntries(SERIES.map((s) => [s.key, Math.floor(Math.random() * 14)])),
    }
  })
}

export default function App() {
  const [period, setPeriod] = useState<Period>('week')
  const [data, setData] = useState(() => sampleData('week'))
  // unticked rather than ticked; Watches starts off, to show a category turned off
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(['watches']))

  // biggest category first in the list, and at the bottom of each stack
  const totals = new Map(SERIES.map((s) => [s.key, data.reduce((sum, row) => sum + Number(row[s.key]), 0)]))
  const ranked = [...SERIES].sort((a, b) => (totals.get(b.key) ?? 0) - (totals.get(a.key) ?? 0))
  const shown = ranked.filter((s) => !hidden.has(s.key))
  const total = shown.reduce((sum, s) => sum + (totals.get(s.key) ?? 0), 0)

  const switchPeriod = (next: Period) => {
    setPeriod(next)
    setData(sampleData(next))
  }

  const toggle = (key: string) =>
    setHidden((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <main className="demo">
      <header className="demo-head">
        <div>
          <h1>Cylinder bar chart</h1>
          <p>Stacked bars drawn as shaded cylinders. Hover a bar to focus it.</p>
        </div>
        <button type="button" className="shuffle-btn" onClick={() => setData(sampleData(period))}>
          Shuffle
        </button>
      </header>

      <section className="chart-card" aria-labelledby="chart-title">
        <header className="chart-card-head">
          <h2 id="chart-title">Stock movement</h2>
          <div className="segmented" role="group" aria-label="Period">
            {(['week', 'month'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={period === p ? 'is-active' : undefined}
                aria-pressed={period === p}
                onClick={() => switchPeriod(p)}
              >
                {p === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
        </header>

        <div className="chart-card-body">
          {/* tick a category to show it in the chart and the total */}
          <div className="category-list">
            <div className="category-list-head">
              <span>Category</span>
              <span>Units sold</span>
            </div>
            <ul>
              {ranked.map((s) => (
                <li key={s.key}>
                  <label>
                    <input type="checkbox" checked={!hidden.has(s.key)} onChange={() => toggle(s.key)} />
                    <span className="category-name">{s.label}</span>
                    <i className="category-swatch" style={{ background: s.color }} aria-hidden />
                    <span className="category-units">{count.format(totals.get(s.key) ?? 0)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="chart-side">
            <p className="chart-total">
              <strong>{count.format(total)}</strong>
              <span>units sold</span>
            </p>
            <CylinderBarChart
              data={data}
              xKey="label"
              series={shown}
              tooltipTitle={(row) => String(row.date)}
              formatValue={count.format}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
