import { Fragment, useId, useState, type CSSProperties } from 'react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  type BarShapeProps,
  type TooltipContentProps,
} from 'recharts'
import { DEFAULT_CONFIG, type CylinderConfig } from './cylinderConfig'
import './CylinderBarChart.css'

export type CylinderSeries = {
  // the field on each data row holding this series' value
  key: string
  label: string
  // #rrggbb; the shading and the lid are worked out from it
  color: string
}

export type CylinderRow = Record<string, string | number>

type CylinderBarChartProps = {
  data: CylinderRow[]
  // the field on each row shown under its bar, e.g. "Mon"
  xKey: string
  // bottom of the stack first
  series: CylinderSeries[]
  // the heading of a bar's tooltip; defaults to its xKey value
  tooltipTitle?: (row: CylinderRow) => string
  formatValue?: (value: number) => string
  // how the chart looks; anything left out comes from DEFAULT_CONFIG
  config?: Partial<CylinderConfig>
}

// While a bar is hovered the others go grey, banded light and dark so their layers
// still read; the hovered bar keeps its colours.
const GREYS = ['#c9ccd1', '#aeb2b9', '#dadce0', '#bbbec4']

// SVG attributes can't read CSS custom properties, so the axis colour lives here
const MUTED = '#717680'

const defaultFormat = new Intl.NumberFormat('en-US').format

// blend a #rrggbb colour towards white (amount > 0) or black (amount < 0)
function tint(hex: string, amount: number) {
  const target = amount > 0 ? 255 : 0
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgb(${channels.map((c) => Math.round(c + (target - c) * Math.abs(amount))).join(', ')})`
}

type LayerLook = {
  gradientId: string
  greyGradientId: string
  lid: string
  greyLid: string
  tilt: number
  lidCap: number
  // the bar's total across every series
  rowTotal: (row: CylinderRow) => number
  // whether this bar is greyed out, because another one is hovered
  isDimmed: (index: number) => boolean
}

// One layer of a stacked cylinder: a body shaded round by a left-to-right gradient, with
// its top and bottom edges curved like the near side of an ellipse, so each layer nests
// into the one below. Only the top layer gets the lid: the one whose stack reaches the
// bar's total. Everything sits up by one ellipse height, so the curved bottom of the stack
// rests on the baseline. The grey version sits on top and fades in, since gradient fills
// can't transition.
function cylinderLayer(look: LayerLook) {
  return function CylinderLayer({ x, y, width, height, value, payload, index }: BarShapeProps) {
    if (!height || height <= 0) return <g />
    const rx = width / 2
    const ry = Math.min(width * look.tilt, look.lidCap)
    const top = y - ry
    const bottom = y + height - ry
    // stacked bars get [start, end] of their layer
    const reaches = Array.isArray(value) ? value[1] : value
    const isTop = reaches >= look.rowTotal(payload as CylinderRow)
    const dimClass = look.isDimmed(index) ? 'cbc-dim is-on' : 'cbc-dim'
    const body = `M ${x} ${top} L ${x} ${bottom} A ${rx} ${ry} 0 0 0 ${x + width} ${bottom} L ${x + width} ${top} A ${rx} ${ry} 0 0 1 ${x} ${top} Z`
    return (
      <g>
        <path d={body} fill={`url(#${look.gradientId})`} />
        <path d={body} fill={`url(#${look.greyGradientId})`} className={dimClass} />
        {isTop && (
          <>
            <ellipse cx={x + rx} cy={top} rx={rx} ry={ry} fill={look.lid} />
            <ellipse cx={x + rx} cy={top} rx={rx} ry={ry} fill={look.greyLid} className={dimClass} />
          </>
        )}
      </g>
    )
  }
}

type TooltipExtras = {
  title: (row: CylinderRow) => string
  total: (row: CylinderRow) => number
  formatValue: (value: number) => string
}

function ChartTooltip({ active, payload, title, total, formatValue }: Partial<TooltipContentProps> & TooltipExtras) {
  const row = payload?.[0]?.payload as CylinderRow | undefined
  if (!active || !payload || !row) return null
  // top of the stack first, as it reads in the chart; empty series left out
  const rows = [...payload].reverse().filter((entry) => Number(entry.value) > 0)
  return (
    <div className="cbc-tooltip">
      <span className="cbc-tooltip-head">
        {title(row)}
        <strong>{formatValue(total(row))}</strong>
      </span>
      {rows.map((entry) => (
        <span key={String(entry.dataKey)} className="cbc-tooltip-row">
          <i style={{ background: entry.color }} />
          {entry.name}
          <strong>{formatValue(Number(entry.value))}</strong>
        </span>
      ))}
    </div>
  )
}

// Stacked bars drawn as shaded cylinders. Hovering a bar greys out the rest and shows
// a tooltip with each series' value, top of the stack first.
export function CylinderBarChart({
  data,
  xKey,
  series,
  tooltipTitle,
  formatValue = defaultFormat,
  config: overrides,
}: CylinderBarChartProps) {
  const config = { ...DEFAULT_CONFIG, ...overrides }
  // the bar under the pointer; the others go grey
  const [active, setActive] = useState<number | null>(null)
  // useId's punctuation isn't safe inside url(#…)
  const prefix = `cbc${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const gradientId = (i: number) => `${prefix}-${i}`

  const rowTotal = (row: CylinderRow) => series.reduce((sum, s) => sum + Number(row[s.key] ?? 0), 0)
  const greyOf = (i: number) => GREYS[i % GREYS.length]
  // the grey lid sits a touch lighter than the coloured one, as the greys start lighter
  const greyLid = Math.min(config.lid + 0.05, 1)

  const shading = (color: string) => (
    <>
      <stop offset="0%" stopColor={tint(color, config.depth)} />
      <stop offset={`${config.highlight}%`} stopColor={color} />
      <stop offset="100%" stopColor={tint(color, -config.depth)} />
    </>
  )

  return (
    <div className="cbc" style={{ height: config.height, '--cbc-fade': `${config.fade}s` } as CSSProperties}>
      <ResponsiveContainer width="100%" height="100%">
        {/* recharts stacks layers in the order they first mounted, so remount when the series change */}
        <BarChart
          key={series.map((s) => s.key).join('|')}
          data={data}
          margin={{ top: config.lidCap * 2 + 4, right: 0, bottom: 0, left: 0 }}
          barCategoryGap={`${config.gap}%`}
          onMouseMove={(state) => setActive(state.activeTooltipIndex == null ? null : Number(state.activeTooltipIndex))}
          onMouseLeave={() => setActive(null)}
        >
          <defs>
            {/* lighter on the left, darker on the right, so the body reads as round */}
            {series.map((s, i) => (
              <Fragment key={s.key}>
                <linearGradient id={gradientId(i)} x1="0" y1="0" x2="1" y2="0">
                  {shading(s.color)}
                </linearGradient>
                <linearGradient id={`${gradientId(i)}-grey`} x1="0" y1="0" x2="1" y2="0">
                  {shading(greyOf(i))}
                </linearGradient>
              </Fragment>
            ))}
          </defs>
          <XAxis
            dataKey={xKey}
            hide={!config.axisLabels}
            tickLine={false}
            axisLine={false}
            tick={{ fill: MUTED, fontSize: 12 }}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <Tooltip
            content={
              config.tooltip ? (
                <ChartTooltip
                  title={tooltipTitle ?? ((row) => String(row[xKey]))}
                  total={rowTotal}
                  formatValue={formatValue}
                />
              ) : (
                () => null
              )
            }
            cursor={false}
          />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId="cylinder"
              fill={s.color}
              shape={cylinderLayer({
                gradientId: gradientId(i),
                greyGradientId: `${gradientId(i)}-grey`,
                lid: tint(s.color, config.lid),
                greyLid: tint(greyOf(i), greyLid),
                tilt: config.tilt,
                lidCap: config.lidCap,
                rowTotal,
                isDimmed: (index) => config.greyOut && active !== null && index !== active,
              })}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
