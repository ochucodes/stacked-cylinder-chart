# Cylinder bar chart

A React component that draws stacked bars as shaded 3D cylinders, with a demo page. Built on [Recharts](https://recharts.org).

```tsx
const series = [
  { key: 'fragrance', label: 'Fragrance', color: '#7c6cf2' },
  { key: 'clothing', label: 'Clothing', color: '#3ec7b4' },
]

const data = [
  { label: 'Mon', fragrance: 8, clothing: 5 },
  { label: 'Tue', fragrance: 3, clothing: 9 },
]

<CylinderBarChart data={data} xKey="label" series={series} />
```

- `data`: one row per bar, with a value for each series.
- `xKey`: the field shown under each bar, e.g. `"label"`.
- `series`: the layers, bottom of the stack first. Each has the `key` of its value on the rows, a `label` for the tooltip, and a `#rrggbb` `color`; the shading and the lid are worked out from it.
- `height`: the chart's height in pixels (default `260`). It fills the width of its parent.
- `tooltipTitle`: the heading of a bar's tooltip (defaults to its `xKey` value).
- `formatValue`: formats the numbers in the tooltip.
- `barGap`: the gap between bars, as a share of each bar's slot (default `"22%"`).

Hovering a bar greys out the others and shows a tooltip with each layer's value, top of the stack first. With reduced motion turned on, the grey-out happens without fading.

## Scripts

```sh
npm install
npm run dev     # start the demo
npm run build   # type-check and build
npm run lint
```
