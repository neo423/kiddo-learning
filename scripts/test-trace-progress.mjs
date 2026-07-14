import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  getRequiredTraceDistance,
  hasEnoughTraceProgress,
  isShortDotStroke,
} from '../src/utils/traceProgress.js'

assert.equal(isShortDotStroke(12), true)
assert.equal(isShortDotStroke(80), false)
assert.equal(hasEnoughTraceProgress(0, 60), false)
assert.equal(hasEnoughTraceProgress(59, 60), false)
assert.equal(hasEnoughTraceProgress(60, 60), true)
assert.ok(getRequiredTraceDistance(200, 1) >= 80)
assert.ok(getRequiredTraceDistance(200, 1) <= 100)
assert.ok(getRequiredTraceDistance(50, 0.6) <= 21)
assert.ok(getRequiredTraceDistance(50, 0.6) > 0)

const componentSource = await readFile(
  new URL('../src/components/TraceWritingArea.jsx', import.meta.url),
  'utf8',
)
const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')
const cssSource = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
assert.match(componentSource, /hasEnoughTraceProgress/)
assert.match(componentSource, /onStrokeIncomplete/)
assert.doesNotMatch(
  componentSource,
  /event\.type === 'pointerup'\) \{\s*\/\/[^\n]*\n\s*completeActiveStrokeFill\(\)/,
)
assert.match(appSource, /className="practice-header/)
assert.match(cssSource, /max-height:\s*850px/)
assert.match(cssSource, /safe-area-inset-bottom/)

console.log('trace progress tests passed')
