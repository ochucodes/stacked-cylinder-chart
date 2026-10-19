// Everything about how the cylinders look and behave. The chart takes any part of this
// and fills in the rest from DEFAULT_CONFIG.
export type CylinderConfig = {
  // px
  height: number
  // gap between bars, as a percentage of each bar's slot
  gap: number
  // how tall the cylinder's ellipses are, against the bar's width
  tilt: number
  // the tallest the ellipses get, in px, so wide bars don't tip towards the viewer
  lidCap: number
  // how far the body lightens on its left edge and darkens on its right, 0–1
  depth: number
  // where across the body the colour is at its truest, as a percentage from the left
  highlight: number
  // how much lighter the lid is than the body, 0–1
  lid: number
  // grey out the other bars while one is hovered
  greyOut: boolean
  // seconds the grey takes to fade in and out
  fade: number
  tooltip: boolean
  axisLabels: boolean
}

export const DEFAULT_CONFIG: CylinderConfig = {
  height: 260,
  gap: 22,
  tilt: 0.22,
  lidCap: 10,
  depth: 0.25,
  highlight: 45,
  lid: 0.4,
  greyOut: true,
  fade: 0.2,
  tooltip: true,
  axisLabels: true,
}
