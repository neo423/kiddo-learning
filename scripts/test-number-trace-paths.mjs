import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

const dataUrl = new URL('../src/data/numberStrokePaths.js', import.meta.url)
const componentUrl = new URL('../src/components/TraceWritingArea.jsx', import.meta.url)
const appUrl = new URL('../src/App.jsx', import.meta.url)

assert.equal(
  existsSync(dataUrl),
  true,
  'numberStrokePaths.js must exist before number tracing can use precise paths',
)

const { NUMBER_STROKE_PATHS } = await import(dataUrl)
const expectedStrokeCounts = {
  0: 1,
  1: 1,
  2: 1,
  3: 1,
  4: 2,
  5: 2,
  6: 1,
  7: 1,
  8: 1,
  9: 1,
}

assert.deepEqual(
  Object.keys(NUMBER_STROKE_PATHS).sort(),
  Object.keys(expectedStrokeCounts),
  'number tracing data must cover every digit from 0 through 9',
)

for (const [number, expectedCount] of Object.entries(expectedStrokeCounts)) {
  const strokes = NUMBER_STROKE_PATHS[number]
  assert.equal(strokes.length, expectedCount, `${number} must have ${expectedCount} stroke(s)`)

  for (const stroke of strokes) {
    assert.match(stroke.path, /^M\s/, `${number} must use an SVG path beginning with M`)
    assert.match(stroke.path, /\s(?:L|C|Q)\s/, `${number} stroke paths must contain a real trace route`)
    assert.ok(stroke.marker.x >= 0 && stroke.marker.x <= 100, `${number} marker x must be a percentage`)
    assert.ok(stroke.marker.y >= 0 && stroke.marker.y <= 100, `${number} marker y must be a percentage`)
    assert.ok(stroke.direction, `${number} must include a stroke direction hint`)
  }
}

const appSource = await readFile(appUrl, 'utf8')
assert.match(appSource, /NUMBER_STROKE_PATHS/, 'App.jsx must attach precise paths to number items')
assert.match(appSource, /number:\s*9/, 'number practice must include digit 9')

const componentSource = await readFile(componentUrl, 'utf8')
assert.match(
  componentSource,
  /fillPreciseStrokePaths/,
  'completed number strokes must be filled from the same precise SVG paths',
)
assert.match(
  componentSource,
  /isPointOnActiveStroke\(previous\)[\s\S]*isPointOnActiveStroke\(midpoint\)[\s\S]*isPointOnActiveStroke\(point\)/,
  'trace progress must require the complete pointer segment to stay inside the active stroke',
)
assert.match(
  componentSource,
  /Math\.min\(segmentDistance, MAX_TRACE_SEGMENT_DISTANCE\)/,
  'a single long pointer segment must not award unlimited trace progress',
)

console.log('number trace path tests passed')
