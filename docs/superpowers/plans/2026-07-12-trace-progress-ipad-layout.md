# Trace Progress and iPad Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 防止一般筆畫只點一下就完成，並讓 iPad Air 4 加到主畫面的橫向畫面完整顯示底部三個操作按鈕。

**Architecture:** 在 `TraceWritingArea` 中以目前 SVG path 為唯一有效走廊，累積落在走廊內的指標移動距離；達到自適應門檻後才補滿與前進。版面以新的短螢幕 media query 使用剩餘高度與 safe-area，不改動一般桌機、直向配置或資料結構。

**Tech Stack:** React、Pointer Events、Canvas 2D、SVGPathElement、CSS dynamic viewport units、Vite。

## Global Constraints

- 不加入 AI、手寫辨識、後端或資料庫。
- 不修改注音資料、筆畫 path、首頁或學習流程。
- `pointercancel` 不得完成筆畫。
- 一般長筆畫單點不得前進；極短點畫必須仍可合理完成。
- iPad 測試尺寸固定包含 `1180 × 820` 與 `820 × 1180`。
- 不執行 Git commit 或 push。

---

### Task 1: 純函式描寫門檻與測試

**Files:**
- Create: `src/utils/traceProgress.js`
- Create: `scripts/test-trace-progress.mjs`

**Interfaces:**
- Produces: `getRequiredTraceDistance(pathLength, scale)` 回傳 CSS pixel 距離。
- Produces: `isShortDotStroke(pathLength)` 回傳是否為極短點畫。
- Produces: `hasEnoughTraceProgress(validDistance, requiredDistance)` 回傳是否達標。

- [ ] **Step 1: 建立會先失敗的 Node 測試**

```js
import assert from 'node:assert/strict'
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
console.log('trace progress tests passed')
```

- [ ] **Step 2: 執行測試並確認缺少 module**

Run:

```powershell
& $node scripts/test-trace-progress.mjs
```

Expected: FAIL，指出 `src/utils/traceProgress.js` 不存在。

- [ ] **Step 3: 實作最小純函式**

```js
export const TRACE_PROGRESS_RATIO = 0.45
export const SHORT_DOT_PATH_LENGTH = 18

export function isShortDotStroke(pathLength) {
  return pathLength <= SHORT_DOT_PATH_LENGTH
}

export function getRequiredTraceDistance(pathLength, scale) {
  if (isShortDotStroke(pathLength)) return Math.max(1, pathLength * scale * 0.2)
  return Math.max(48, pathLength * scale * TRACE_PROGRESS_RATIO)
}

export function hasEnoughTraceProgress(validDistance, requiredDistance) {
  return validDistance >= requiredDistance
}
```

- [ ] **Step 4: 重跑測試**

Expected: `trace progress tests passed`。

---

### Task 2: 只有有效描寫才完成筆畫

**Files:**
- Modify: `src/components/TraceWritingArea.jsx`
- Test: `scripts/test-trace-progress.mjs`

**Interfaces:**
- Consumes: Task 1 的三個 pure functions。
- Produces: `getTracePathLength(path)`、`isPointOnActiveStroke(point)`、`recordValidProgress(points)`。

- [ ] **Step 1: 在結構測試加入防回歸檢查**

```js
const source = await readFile(new URL('../src/components/TraceWritingArea.jsx', import.meta.url), 'utf8')
assert.match(source, /hasEnoughTraceProgress/)
assert.match(source, /onStrokeIncomplete/)
assert.doesNotMatch(source, /event\.type === 'pointerup'\) \{\s*completeActiveStrokeFill\(\)/)
```

- [ ] **Step 2: 執行測試確認失敗**

Expected: FAIL，因元件尚未使用有效進度判定。

- [ ] **Step 3: 加入 path 長度快取與目前筆畫進度 refs**

```js
const TRACE_LENGTH_CACHE = new Map()

function getTracePathLength(path) {
  if (!TRACE_LENGTH_CACHE.has(path)) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    element.setAttribute('d', path)
    TRACE_LENGTH_CACHE.set(path, element.getTotalLength())
  }
  return TRACE_LENGTH_CACHE.get(path)
}
```

在 `DrawingCanvas` 建立：

```js
const validDistanceRef = useRef(0)
const requiredDistanceRef = useRef(0)
```

- [ ] **Step 4: 將指標位置轉換成 400 × 400 guide 座標並檢查走廊**

```js
const isPointOnActiveStroke = (point) => {
  const activeStroke = strokes?.[Math.min(strokeStep, strokes.length - 1)]
  if (!activeStroke?.path) return true
  const layout = getTraceLayout(canvasRectRef.current)
  const x = (point.x - layout.contentLeft) / layout.scale
  const y = (point.y - layout.contentTop) / layout.scale
  const context = strokeLayerRef.current.getContext('2d')
  context.save()
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.lineWidth = TRACE_GUIDE.pathWidth + 12
  context.lineCap = 'round'
  context.lineJoin = 'round'
  const inside = context.isPointInStroke(getTracePath(activeStroke.path), x, y)
  context.restore()
  return inside
}
```

- [ ] **Step 5: 累積落在走廊內的 segment 距離**

```js
const recordValidProgress = (points) => {
  let previous = lastPointRef.current
  points.forEach((point) => {
    if (!previous) return
    const midpoint = { x: (previous.x + point.x) / 2, y: (previous.y + point.y) / 2 }
    if (isPointOnActiveStroke(midpoint)) {
      validDistanceRef.current += Math.hypot(point.x - previous.x, point.y - previous.y)
    }
    previous = point
  })
}
```

- [ ] **Step 6: 在 `pointerup` 套用完成門檻**

一般筆畫未達標時只呼叫 `onStrokeIncomplete`；達標才呼叫 `completeActiveStrokeFill()` 與 `onStrokeComplete()`。極短點畫必須在起筆點落於走廊時使用點畫門檻完成。

```js
const completed = hasEnoughTraceProgress(validDistanceRef.current, requiredDistanceRef.current)
if (event.type === 'pointerup' && completed) {
  completeActiveStrokeFill()
  onStrokeComplete?.()
} else if (event.type === 'pointerup') {
  onStrokeIncomplete?.()
}
```

- [ ] **Step 7: 清除與題目切換同步歸零進度**

在 `clearSignal`、`glyph`、`strokeStep` 改變時將 `validDistanceRef.current` 歸零，並重新計算目前 path 門檻。

- [ ] **Step 8: 顯示未完成提示**

在 `TraceWritingArea` 使用 local state 顯示：

```jsx
{needsMoreTracing
  ? '再沿著虛線多寫一點'
  : completed
    ? '描寫完成！可以再寫一次'
    : `第 ${activeStroke.label} 畫・沿著虛線慢慢寫`}
```

- [ ] **Step 9: 重跑 pure function 與結構測試**

Expected: PASS。

---

### Task 3: iPad Air 4 standalone 緊湊版面

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Produces: `.practice-header` selector。
- Produces: `@media (min-width: 900px) and (max-height: 850px)`。

- [ ] **Step 1: 加入會先失敗的 CSS 結構檢查**

在測試腳本讀取 `App.jsx` 與 `index.css`，驗證：

```js
assert.match(appSource, /className="practice-header/)
assert.match(cssSource, /max-height:\s*850px/)
assert.match(cssSource, /safe-area-inset-bottom/)
```

- [ ] **Step 2: 執行測試確認失敗**

Expected: FAIL，因 `.practice-header` 與短螢幕規則尚未存在。

- [ ] **Step 3: 標記練習頁頁首**

```jsx
<header className="practice-header relative z-10 grid grid-cols-[1fr_auto_1fr] items-center px-5 py-4 sm:px-8">
```

- [ ] **Step 4: 加入短螢幕規則**

```css
@media (min-width: 900px) and (max-height: 850px) {
  .practice-screen {
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .practice-header { padding-block: 8px; }
  .practice-layout { min-height: 0; }
  .stroke-practice-card { height: 100%; min-height: 0; }

  .practice-action-bar {
    flex: none;
    gap: 12px;
    padding: 8px 16px calc(10px + env(safe-area-inset-bottom, 0px));
  }

  .practice-action-bar .action-button,
  .practice-action-bar .action-button-primary {
    min-height: 56px;
    padding-block: 9px;
  }
}
```

- [ ] **Step 5: 重跑結構測試**

Expected: PASS。

---

### Task 4: 真實瀏覽器回歸測試

**Files:**
- Modify if needed: `scripts/qa-trace-ipad.mjs`
- Verify: `src/components/TraceWritingArea.jsx`
- Verify: `src/index.css`

**Interfaces:**
- Consumes: Tasks 1–3 完整行為。
- Produces: 互動測試結果與 viewport 截圖，不寫入正式 UI 資料。

- [ ] **Step 1: 建置 production bundle**

Run:

```powershell
& $node node_modules/vite/bin/vite.js build
```

Expected: `✓ built`。

- [ ] **Step 2: 在 `1180 × 820` 驗證一般長筆畫單點**

對 ㄉ 第一筆只發送 `pointerdown`、`pointerup`，確認提示變成「再沿著虛線多寫一點」，筆畫編號仍為第 1 畫。

- [ ] **Step 3: 驗證字框外亂畫不完成**

在練習卡角落拖曳超過 200 CSS px，確認仍停留第 1 畫。

- [ ] **Step 4: 驗證沿路徑描寫會完成**

沿第一筆 path 採樣點拖曳超過門檻，確認切換至第 2 畫並補滿第一筆。

- [ ] **Step 5: 驗證 37 個注音與數字頁基本流程**

每一題依 path 採樣完成所有筆畫，確認不會卡死；切換題目後 Canvas 清空。

- [ ] **Step 6: 驗證 iPad 操作列邊界**

在 `1180 × 820` 取得三個按鈕 `getBoundingClientRect()`：

```js
const insideViewport = buttons.every((rect) =>
  rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight
)
```

Expected: `insideViewport === true`，且三個按鈕互不重疊。

- [ ] **Step 7: 驗證直向與 Console**

在 `820 × 1180` 確認無水平溢位；兩種 viewport 的 console error 均為 0，Canvas `touch-action` 為 `none`。

- [ ] **Step 8: 最終檢查範圍**

確認只有設計文件、計畫文件、測試工具和指定的三個來源檔案變更；不執行 commit 或 push。
