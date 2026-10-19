import { useEffect, useId, useState, type ReactNode } from 'react'
import type { CylinderSeries } from '../components/CylinderBarChart/CylinderBarChart'
import { DEFAULT_CONFIG, type CylinderConfig } from '../components/CylinderBarChart/cylinderConfig'
import './ConfigPanel.css'

// Ready-made looks. They only set the shape and shading, so picking one keeps the
// size, hover and chrome settings as they are.
const LOOK_KEYS = ['tilt', 'lidCap', 'depth', 'highlight', 'lid'] as const
type Look = Pick<CylinderConfig, (typeof LOOK_KEYS)[number]>

const PRESETS: Record<string, Look> = {
  Default: {
    tilt: DEFAULT_CONFIG.tilt,
    lidCap: DEFAULT_CONFIG.lidCap,
    depth: DEFAULT_CONFIG.depth,
    highlight: DEFAULT_CONFIG.highlight,
    lid: DEFAULT_CONFIG.lid,
  },
  Flat: { tilt: 0.12, lidCap: 6, depth: 0.06, highlight: 50, lid: 0.18 },
  Glossy: { tilt: 0.3, lidCap: 14, depth: 0.42, highlight: 28, lid: 0.6 },
}

const CUSTOM = 'Custom'

function presetOf(config: CylinderConfig) {
  const match = Object.entries(PRESETS).find(([, look]) => LOOK_KEYS.every((k) => look[k] === config[k]))
  return match ? match[0] : CUSTOM
}

// the settings that differ from the defaults, as a prop to paste into code
function configSnippet(config: CylinderConfig) {
  const changed = (Object.keys(config) as (keyof CylinderConfig)[]).filter((k) => config[k] !== DEFAULT_CONFIG[k])
  if (changed.length === 0) return 'config={{}}'
  return `config={{ ${changed.map((k) => `${k}: ${config[k]}`).join(', ')} }}`
}

const fixed = (digits: number) => (v: number) => v.toFixed(digits)
const withUnit = (unit: string) => (v: number) => `${v}${unit}`

type ConfigPanelProps = {
  config: CylinderConfig
  onConfigChange: (config: CylinderConfig) => void
  // in a fixed order, with their current colours
  series: CylinderSeries[]
  onColorChange: (key: string, color: string) => void
  maxPerDay: number
  onMaxPerDayChange: (value: number) => void
  onShuffle: () => void
  onReplay: () => void
  // puts every setting, colours and data scale included, back to its default
  onReset: () => void
  onClose: () => void
}

// A floating panel for tuning the chart live: a preset and copy button at the top,
// then a section per part of the chart.
export function ConfigPanel({
  config,
  onConfigChange,
  series,
  onColorChange,
  maxPerDay,
  onMaxPerDayChange,
  onShuffle,
  onReplay,
  onReset,
  onClose,
}: ConfigPanelProps) {
  const set = <K extends keyof CylinderConfig>(key: K) => (value: CylinderConfig[K]) =>
    onConfigChange({ ...config, [key]: value })
  const preset = presetOf(config)

  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = () => {
    navigator.clipboard
      .writeText(configSnippet(config))
      .then(() => setCopied(true))
      .catch(() => {})
  }

  return (
    <aside className="cfg" aria-label="Chart settings">
      <header className="cfg-head">
        <h2>Cylinder chart</h2>
        <div className="cfg-head-actions">
          <button
            type="button"
            className="cfg-icon-btn"
            aria-label="Reset settings"
            title="Reset settings"
            onClick={onReset}
          >
            <Icon d="M2 8a6 6 0 1 0 6-6 6.5 6.5 0 0 0-4.49 1.83L2 5.33M2 2v3.33h3.33" />
          </button>
          <button type="button" className="cfg-icon-btn" aria-label="Close settings" title="Close" onClick={onClose}>
            <Icon d="M4 4l8 8M12 4l-8 8" />
          </button>
        </div>
      </header>

      <div className="cfg-top">
        <div className="cfg-select">
          <select
            aria-label="Preset"
            value={preset}
            onChange={(e) => onConfigChange({ ...config, ...PRESETS[e.target.value] })}
          >
            {Object.keys(PRESETS).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            {preset === CUSTOM && (
              <option value={CUSTOM} disabled>
                {CUSTOM}
              </option>
            )}
          </select>
          <Icon d="M4 6l4 4 4-4" />
        </div>
        <button
          type="button"
          className="cfg-copy"
          aria-label={copied ? 'Copied' : 'Copy config'}
          title="Copy the changed settings as a config prop"
          onClick={copy}
        >
          {copied ? (
            <Icon d="M3.5 8.5l3 3 6-7" />
          ) : (
            <Icon d="M5.5 5h6A1.5 1.5 0 0 1 13 6.5v6a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 4 12.5v-6A1.5 1.5 0 0 1 5.5 5zM3 10.5v-6A1.5 1.5 0 0 1 4.5 3h6" />
          )}
        </button>
      </div>

      <div className="cfg-group">
        <Slider label="Max per day" value={maxPerDay} min={2} max={50} step={1} format={String} onChange={onMaxPerDayChange} />
        <button type="button" className="cfg-button" onClick={onShuffle}>
          Shuffle data
        </button>
      </div>

      <Section title="Shape">
        <Slider label="Height" value={config.height} min={160} max={420} step={10} format={withUnit('px')} onChange={set('height')} />
        <Slider label="Gap" value={config.gap} min={0} max={60} step={1} format={withUnit('%')} onChange={set('gap')} />
        <Slider label="Tilt" value={config.tilt} min={0.04} max={0.5} step={0.01} format={fixed(2)} onChange={set('tilt')} />
        <Slider label="Lid cap" value={config.lidCap} min={2} max={24} step={1} format={withUnit('px')} onChange={set('lidCap')} />
      </Section>

      <Section title="Shading">
        <Slider label="Depth" value={config.depth} min={0} max={0.6} step={0.01} format={fixed(2)} onChange={set('depth')} />
        <Slider label="Highlight" value={config.highlight} min={5} max={95} step={1} format={withUnit('%')} onChange={set('highlight')} />
        <Slider label="Lid" value={config.lid} min={0} max={0.8} step={0.01} format={fixed(2)} onChange={set('lid')} />
      </Section>

      <Section title="Colours">
        {series.map((s) => (
          <ColorRow key={s.key} label={s.label} value={s.color} onChange={(color) => onColorChange(s.key, color)} />
        ))}
      </Section>

      <Section title="Hover">
        <Toggle label="Grey out" value={config.greyOut} onChange={set('greyOut')} />
        <Slider label="Fade" value={config.fade} min={0} max={1} step={0.05} format={(v) => `${v.toFixed(2)}s`} onChange={set('fade')} />
        <Toggle label="Tooltip" value={config.tooltip} onChange={set('tooltip')} />
      </Section>

      <Section title="Chrome" defaultOpen={false}>
        <Toggle label="Axis labels" value={config.axisLabels} onChange={set('axisLabels')} />
        <button type="button" className="cfg-button" onClick={onReplay}>
          Replay animation
        </button>
      </Section>
    </aside>
  )
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Section({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()
  return (
    <section className="cfg-section">
      <button
        type="button"
        className="cfg-section-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        <Icon d="M4 10l4-4 4 4" />
      </button>
      <div id={bodyId} className="cfg-group" hidden={!open}>
        {children}
      </div>
    </section>
  )
}

type SliderProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  onChange: (value: number) => void
}

// The whole row is the slider: the filled part shows the value, and a see-through range
// input across the row takes the drag, clicks and arrow keys.
function Slider({ label, value, min, max, step, format, onChange }: SliderProps) {
  const filled = ((value - min) / (max - min)) * 100
  return (
    <div className="cfg-row cfg-slider">
      <span className="cfg-slider-fill" style={{ width: `${filled}%` }} aria-hidden />
      <span className="cfg-label">{label}</span>
      <span className="cfg-value">{format(value)}</span>
      <input
        type="range"
        aria-label={label}
        aria-valuetext={format(value)}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="cfg-row cfg-toggle">
      <span className="cfg-label">{label}</span>
      <div className="cfg-choice" role="group" aria-label={label}>
        {[false, true].map((option) => (
          <button
            key={String(option)}
            type="button"
            className={value === option ? 'is-active' : undefined}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {option ? 'On' : 'Off'}
          </button>
        ))}
      </div>
    </div>
  )
}

// clicking anywhere on the row opens the colour picker
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="cfg-row cfg-color">
      <span className="cfg-label">{label}</span>
      <span className="cfg-value">{value}</span>
      <input type="color" aria-label={`${label} colour`} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
