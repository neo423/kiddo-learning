# 彩虹探索樂園首頁重設 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以使用者提供的新版圖片為唯一視覺基準，建立可操作、可擴充、以橫式為主的「彩虹探索樂園」React 首頁。

**Architecture:** 將參考圖拆成背景、標題、熊兔與五張卡片資產；React 只負責排列、操作狀態與導航，不把整張圖片當成靜態首頁。桌機與 iPad 橫向使用 3＋2 CSS Grid，小尺寸畫面切換為可由按鈕與觸控操作的 scroll-snap 卡片滑軌。

**Tech Stack:** React、Vite、Tailwind CSS、原生 CSS、Web App Manifest、ImageGen 圖片編輯、Pillow WebP 轉換與檢查、Node.js 驗證腳本。

## Global Constraints

- 先前的低多邊形 3D 方向全部作廢，不得殘留於新版首頁。
- 不得直接將整張參考圖當作首頁背景；所有功能卡必須是獨立 `<button>`。
- 只有注音、數字、聲音與家長模式可操作；英文、形狀、邏輯顯示「即將開放」。
- 不修改注音、數字書寫、筆畫進度或家長模式資料邏輯。
- 不新增資料庫、登入、後端、訂閱或金流。
- 不新增第三方 npm 套件；使用現有 React、Vite 與原生瀏覽器能力。
- 目標測試網址使用 `http://127.0.0.1:5174/`，不得占用 5173。
- Web App manifest 預設 `orientation: "landscape"`，但不顯示強制旋轉遮罩。
- 不執行 `git commit`、`git push` 或 Git 設定修改；每個任務以測試與人工檢查點取代提交步驟。

---

## File Map

### Create

- `src/assets/images/home/rainbow-home-background.webp`：無 UI 的完整樂園背景。
- `src/assets/images/home/rainbow-home-title.webp`：透明的主標題與副標。
- `src/assets/images/home/rainbow-home-bear.webp`：透明小熊角色。
- `src/assets/images/home/rainbow-home-rabbit.webp`：透明小兔角色。
- `src/assets/images/home/card-zhuyin.webp`：注音學習卡。
- `src/assets/images/home/card-number.webp`：數字學習卡。
- `src/assets/images/home/card-english.webp`：英文學習卡。
- `src/assets/images/home/card-shape.webp`：形狀配對卡。
- `src/assets/images/home/card-logic.webp`：邏輯思考卡。
- `src/components/RainbowHome.jsx`：新版首頁與卡片滑動操作。
- `src/data/homeLearningItems.js`：五張卡片的 hardcode metadata。
- `public/manifest.webmanifest`：橫式偏好與 standalone 顯示設定。
- `scripts/validate-rainbow-home-assets.py`：資產尺寸、透明度與檔案存在檢查。
- `scripts/test-home-learning-items.mjs`：卡片資料與 manifest 行為檢查。

### Modify

- `src/App.jsx`：以 `RainbowHome` 取代舊 `Home` 視覺內容，保留既有 navigate 狀態機。
- `src/index.css`：移除舊首頁專屬雲朵、草地、標題、emoji 吉祥物與雙卡樣式，加入新版首頁樣式。
- `index.html`：連結 manifest，更新首頁標題、說明與主題色。
- `package.json`：加入 `test:home` 驗證指令。

### Must Not Modify

- `src/components/TraceWritingArea.jsx`
- `src/data/zhuyinStrokePaths.js`
- `src/data/zhuyinFontStrokePaths.js`
- `src/utils/traceProgress.js`
- 現有注音、數字與家長模式內容區塊。

---

### Task 1: 分離並驗證新版首頁圖片資產

**Files:**
- Create: `scripts/validate-rainbow-home-assets.py`
- Create: `src/assets/images/home/rainbow-home-background.webp`
- Create: `src/assets/images/home/rainbow-home-title.webp`
- Create: `src/assets/images/home/rainbow-home-bear.webp`
- Create: `src/assets/images/home/rainbow-home-rabbit.webp`
- Create: `src/assets/images/home/card-zhuyin.webp`
- Create: `src/assets/images/home/card-number.webp`
- Create: `src/assets/images/home/card-english.webp`
- Create: `src/assets/images/home/card-shape.webp`
- Create: `src/assets/images/home/card-logic.webp`

**Interfaces:**
- Consumes:
  - 首頁視覺來源：`C:/Users/user/AppData/Local/Temp/codex-clipboard-8e134669-378b-4e40-9304-cb8d79846483.png`
  - Logo 主要來源：`C:/Users/user/.codex/codex-remote-attachments/019ee545-ddc7-7d01-a30b-a73fcd79ce89/08D1F512-3AAE-4152-933A-14BA6B617951/1-照片-1.jpg`
- Produces: 九個可由 Vite 匯入的 WebP 資產；背景為不透明，其他八個資產含透明通道。

- [ ] **Step 1: 建立失敗的圖片資產驗證腳本**

```python
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "src" / "assets" / "images" / "home"

EXPECTATIONS = {
    "rainbow-home-background.webp": {"min_size": (1600, 900), "alpha": False},
    "rainbow-home-title.webp": {"min_size": (700, 180), "alpha": True},
    "rainbow-home-bear.webp": {"min_size": (300, 300), "alpha": True},
    "rainbow-home-rabbit.webp": {"min_size": (300, 300), "alpha": True},
    "card-zhuyin.webp": {"min_size": (280, 280), "alpha": True},
    "card-number.webp": {"min_size": (280, 280), "alpha": True},
    "card-english.webp": {"min_size": (280, 280), "alpha": True},
    "card-shape.webp": {"min_size": (280, 280), "alpha": True},
    "card-logic.webp": {"min_size": (280, 280), "alpha": True},
}

for name, expected in EXPECTATIONS.items():
    path = ASSET_DIR / name
    assert path.exists(), f"missing asset: {path}"
    assert path.stat().st_size > 8_000, f"asset too small: {path}"
    with Image.open(path) as image:
        width, height = image.size
        min_width, min_height = expected["min_size"]
        assert width >= min_width and height >= min_height, (
            f"{name}: expected at least {min_width}x{min_height}, got {width}x{height}"
        )
        has_alpha = "A" in image.getbands()
        assert has_alpha is expected["alpha"], (
            f"{name}: expected alpha={expected['alpha']}, got {image.getbands()}"
        )

print(f"validated {len(EXPECTATIONS)} rainbow home assets")
```

- [ ] **Step 2: 執行驗證並確認目前失敗**

Run:

```powershell
python scripts\validate-rainbow-home-assets.py
```

Expected: FAIL，第一個訊息為 `missing asset`。

- [ ] **Step 3: 使用 ImageGen 編輯參考圖並產生分層資產**

每次編輯都使用同一張參考圖，且不將 AI 產生的中文字用於注音練習區。依序使用下列精確目標：

1. 背景：移除標題、副標、聲音、家長模式、五張卡片、熊與兔；補回被遮住的藍天、雲朵、彩虹、草地、小徑、樹木與花朵；維持原圖柔亮 3D 兒童樂園風格；不得留下文字或按鈕殘影。
2. 標題：以最新 Logo 圖片為主要來源，只保留「彩虹探索樂園」與紫色「玩一玩，學會新本領！」布旗；移除 JPEG 圖片內建的棋盤格，輸出真正透明背景；文字、字形、顏色與標點不得改寫。
3. 小熊：只保留左側小熊，完整補齊被遮住的外輪廓，輸出透明背景。
4. 小兔：只保留右側小兔，完整補齊被遮住的外輪廓，輸出透明背景。
5. 五張卡：每次只保留指定卡片，維持卡片內原有圖示與中文字，補齊白色外框與陰影，輸出透明背景，不加入其他裝飾。

先將 ImageGen 輸出保存在 `.tmp/rainbow-home-assets/`，再使用 Pillow 轉成 WebP：

```powershell
python -c "from pathlib import Path; from PIL import Image; src=Path('.tmp/rainbow-home-assets'); dst=Path('src/assets/images/home'); dst.mkdir(parents=True, exist_ok=True); files=list(src.glob('*.png')); [(lambda im,p: (im.convert('RGB') if p.stem=='rainbow-home-background' else im.convert('RGBA')).save(dst/(p.stem+'.webp'), 'WEBP', quality=92, method=6))(Image.open(p),p) for p in files]"
```

Expected: `src/assets/images/home/` 出現九個規格指定檔案。

- [ ] **Step 4: 檢查每張資產的視覺與透明邊緣**

使用本機圖片檢視逐張確認：

- 背景沒有卡片、文字或角色殘影。
- 標題沒有改字、錯字、棋盤格或其他多餘背景，透明區可正常顯示底下天空。
- 熊兔沒有缺耳、缺手腳或白邊。
- 五張卡片的中文字分別為「注音學習、數字學習、英文學習、形狀配對、邏輯思考」。
- 卡片外框完整，透明區沒有殘留其他卡片。

- [ ] **Step 5: 再次執行資產驗證**

Run:

```powershell
python scripts\validate-rainbow-home-assets.py
```

Expected: PASS，輸出 `validated 9 rainbow home assets`。

---

### Task 2: 建立卡片資料、測試與橫式 manifest

**Files:**
- Create: `scripts/test-home-learning-items.mjs`
- Create: `src/data/homeLearningItems.js`
- Create: `public/manifest.webmanifest`
- Modify: `package.json`
- Modify: `index.html`

**Interfaces:**
- Consumes: Task 1 的九個 WebP 檔案。
- Produces: `HOME_LEARNING_ITEMS` 陣列與可由首頁使用的 `assetUrl`、`target`、`enabled` 欄位；瀏覽器可讀取的 landscape manifest。

- [ ] **Step 1: 建立失敗的資料與 manifest 測試**

```js
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { HOME_LEARNING_ITEMS } from '../src/data/homeLearningItems.js'

assert.equal(HOME_LEARNING_ITEMS.length, 5)
assert.deepEqual(HOME_LEARNING_ITEMS.map((item) => item.id), [
  'zhuyin', 'number', 'english', 'shape', 'logic',
])
assert.deepEqual(
  HOME_LEARNING_ITEMS.filter((item) => item.enabled).map((item) => item.target),
  ['zhuyin', 'number'],
)
assert.ok(HOME_LEARNING_ITEMS.slice(2).every((item) => item.status === '即將開放'))

for (const item of HOME_LEARNING_ITEMS) {
  await access(fileURLToPath(item.assetUrl))
}

const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url)))
assert.equal(manifest.name, '彩虹探索樂園')
assert.equal(manifest.display, 'standalone')
assert.equal(manifest.orientation, 'landscape')

console.log('home learning items and manifest are valid')
```

- [ ] **Step 2: 執行測試並確認失敗**

Run: `node scripts/test-home-learning-items.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `homeLearningItems.js`。

- [ ] **Step 3: 建立卡片資料常數**

```js
export const HOME_LEARNING_ITEMS = [
  {
    id: 'zhuyin',
    label: '注音學習',
    assetUrl: new URL('../assets/images/home/card-zhuyin.webp', import.meta.url),
    target: 'zhuyin',
    enabled: true,
    status: '',
  },
  {
    id: 'number',
    label: '數字學習',
    assetUrl: new URL('../assets/images/home/card-number.webp', import.meta.url),
    target: 'number',
    enabled: true,
    status: '',
  },
  {
    id: 'english',
    label: '英文學習',
    assetUrl: new URL('../assets/images/home/card-english.webp', import.meta.url),
    target: null,
    enabled: false,
    status: '即將開放',
  },
  {
    id: 'shape',
    label: '形狀配對',
    assetUrl: new URL('../assets/images/home/card-shape.webp', import.meta.url),
    target: null,
    enabled: false,
    status: '即將開放',
  },
  {
    id: 'logic',
    label: '邏輯思考',
    assetUrl: new URL('../assets/images/home/card-logic.webp', import.meta.url),
    target: null,
    enabled: false,
    status: '即將開放',
  },
]
```

- [ ] **Step 4: 建立 manifest 並連結到 HTML**

`public/manifest.webmanifest`：

```json
{
  "name": "彩虹探索樂園",
  "short_name": "彩虹樂園",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "landscape",
  "background_color": "#79d9f6",
  "theme_color": "#39bdf0"
}
```

在 `index.html` 的 `<head>` 加入：

```html
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

同時將 `<title>` 與 description 更新為「彩虹探索樂園」相關文字，將 `theme-color` 更新為 `#39bdf0`。

- [ ] **Step 5: 加入 npm 驗證指令**

將 `package.json` scripts 更新為：

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test:home": "node scripts/test-home-learning-items.mjs"
}
```

- [ ] **Step 6: 執行資料與 manifest 測試**

Run: `npm run test:home`

Expected: PASS，輸出 `home learning items and manifest are valid`。

---

### Task 3: 建立可操作的 RainbowHome 元件

**Files:**
- Create: `src/components/RainbowHome.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `HOME_LEARNING_ITEMS`、`onNavigate(target)`、`soundOn`、`onToggleSound()`。
- Produces: `RainbowHome({ onNavigate, soundOn, onToggleSound })`；不改變 App 現有的 `page` 狀態與 navigate API。

- [ ] **Step 1: 建立新版首頁元件**

```jsx
import { useRef } from 'react'
import { HOME_LEARNING_ITEMS } from '../data/homeLearningItems'
import titleImage from '../assets/images/home/rainbow-home-title.webp'
import bearImage from '../assets/images/home/rainbow-home-bear.webp'
import rabbitImage from '../assets/images/home/rainbow-home-rabbit.webp'

function SpeakerIcon({ muted }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path d="M5 12h6l7-6v20l-7-6H5z" fill="currentColor" />
      {!muted && <path d="M22 11c2.8 2.8 2.8 7.2 0 10M25 8c4.4 4.4 4.4 11.6 0 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />}
      {muted && <path d="m22 12 7 8m0-8-7 8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />}
    </svg>
  )
}

function GearIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path d="M14 3h4l1 4 3 1 4-2 3 4-3 3v3l3 3-3 4-4-2-3 1-1 4h-4l-1-4-3-1-4 2-3-4 3-3v-3L3 10l3-4 4 2 3-1z" fill="currentColor" />
      <circle cx="16" cy="15" r="4" fill="white" />
    </svg>
  )
}

function RainbowHomeTitle() {
  return (
    <h1 className="rainbow-home-title">
      <img src={titleImage} alt="彩虹探索樂園，玩一玩，學會新本領！" />
    </h1>
  )
}

function HomeLearningCard({ item, onNavigate }) {
  return (
    <button
      type="button"
      className={`rainbow-learning-card rainbow-learning-card-${item.id}`}
      onClick={() => item.enabled && onNavigate(item.target)}
      disabled={!item.enabled}
      aria-disabled={!item.enabled}
      aria-label={item.enabled ? item.label : `${item.label}，即將開放`}
    >
      <img src={item.assetUrl.href} alt="" draggable="false" />
      {!item.enabled && <span className="coming-soon-badge">即將開放</span>}
    </button>
  )
}

function HomeLearningGrid({ onNavigate }) {
  const railRef = useRef(null)

  const scrollCards = (direction) => {
    const rail = railRef.current
    if (!rail) return
    rail.scrollBy({ left: direction * rail.clientWidth * 0.72, behavior: 'smooth' })
  }

  return (
    <div className="rainbow-card-area">
      <button type="button" className="rainbow-rail-button rainbow-rail-prev" onClick={() => scrollCards(-1)} aria-label="上一張學習卡">‹</button>
      <div ref={railRef} className="rainbow-learning-grid">
        {HOME_LEARNING_ITEMS.map((item) => (
          <HomeLearningCard key={item.id} item={item} onNavigate={onNavigate} />
        ))}
      </div>
      <button type="button" className="rainbow-rail-button rainbow-rail-next" onClick={() => scrollCards(1)} aria-label="下一張學習卡">›</button>
    </div>
  )
}

function HomeMascots() {
  return (
    <div className="rainbow-home-mascots" aria-hidden="true">
      <img className="rainbow-bear" src={bearImage} alt="" />
      <img className="rainbow-rabbit" src={rabbitImage} alt="" />
    </div>
  )
}

export default function RainbowHome({ onNavigate, soundOn, onToggleSound }) {
  return (
    <main className="rainbow-home screen-shell">
      <button
        type="button"
        className="rainbow-sound-button"
        onClick={onToggleSound}
        aria-label={soundOn ? '關閉聲音' : '開啟聲音'}
        aria-pressed={soundOn}
      >
        <SpeakerIcon muted={!soundOn} />
      </button>

      <button type="button" className="rainbow-parent-button" onClick={() => onNavigate('parent')}>
        <GearIcon />
        <span>家長模式</span>
      </button>

      <div className="rainbow-home-content">
        <RainbowHomeTitle />
        <HomeLearningGrid onNavigate={onNavigate} />
      </div>
      <HomeMascots />
    </main>
  )
}
```

- [ ] **Step 2: 將 App 的 Home 包裝改為 RainbowHome**

在 `src/App.jsx` 頂部加入：

```jsx
import RainbowHome from './components/RainbowHome'
```

刪除舊的 `Cloud` 與 `AppTitle` 函式，將既有 `Home` 函式替換為：

```jsx
function Home({ onNavigate, soundOn, onToggleSound }) {
  return (
    <RainbowHome
      onNavigate={onNavigate}
      soundOn={soundOn}
      onToggleSound={onToggleSound}
    />
  )
}
```

不得修改 `App` 底部的 `navigate`、`shared`、`ZhuyinPractice`、`NumberPractice` 或 `ParentDashboard` 分支。

- [ ] **Step 3: 執行 production build 檢查 JSX 與資產匯入**

Run: `npm run build`

Expected: PASS；Vite 完成 bundle，沒有找不到 WebP 或 JSX 語法錯誤。

---

### Task 4: 實作 3＋2、滑動選單與橫式首頁樣式

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Consumes: Task 3 的 `rainbow-*` class names。
- Produces: 桌機與 iPad 橫向 3＋2 排列；小尺寸與直式的 scroll-snap 安全排版。

- [ ] **Step 1: 移除舊首頁專屬 CSS**

只移除下列舊選擇器及其首頁媒體查詢覆寫，不改 practice、success 或 parent selectors：

```text
.home-screen
.home-screen::before
.home-screen::after
.cloud
.cloud::before
.cloud::after
.grass
.app-title
.app-title-heading
.app-title-zhuyin
.app-title-plus
.app-title-number
.title-ribbon
.learning-card
.learning-card-pink
.learning-card-blue
.home-main-content
.home-learning-grid
.learning-orb
.mascot-card
.mascot-emoji
.speech-bubble
.speech-left
```

保留共用 `.icon-button` 與 `.parent-mode-button`，因為其他頁面仍可能使用。

- [ ] **Step 2: 加入新版首頁基礎與 3＋2 Grid CSS**

```css
.rainbow-home {
  position: relative;
  min-height: 100dvh;
  overflow: hidden;
  background: #7cddf7 url('./assets/images/home/rainbow-home-background.webp') center / cover no-repeat;
  isolation: isolate;
}

.rainbow-home::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, rgba(255,255,255,.04), transparent 58%, rgba(56,156,62,.08));
  pointer-events: none;
}

.rainbow-home-content {
  position: relative;
  z-index: 3;
  display: flex;
  width: min(100%, 1440px);
  min-height: 100dvh;
  margin-inline: auto;
  flex-direction: column;
  align-items: center;
  padding: max(18px, env(safe-area-inset-top)) 150px calc(20px + env(safe-area-inset-bottom));
}

.rainbow-home-title {
  width: min(62vw, 870px);
  margin: 0;
  line-height: 0;
  filter: drop-shadow(0 10px 12px rgba(34, 100, 137, .2));
}

.rainbow-home-title img { width: 100%; height: auto; }

.rainbow-card-area {
  position: relative;
  display: flex;
  width: min(100%, 940px);
  min-height: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
  margin-top: clamp(-6px, -1vh, -14px);
}

.rainbow-learning-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  align-content: center;
  align-items: center;
  gap: clamp(4px, 1.25vh, 14px) clamp(10px, 1.6vw, 22px);
}

.rainbow-learning-card {
  position: relative;
  width: min(100%, clamp(150px, 17vw, 248px));
  margin: 0;
  justify-self: center;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  filter: drop-shadow(0 13px 12px rgba(42, 79, 95, .22));
  transition: transform .2s ease, filter .2s ease;
}

.rainbow-learning-card:nth-child(1) { grid-column: 1 / 3; }
.rainbow-learning-card:nth-child(2) { grid-column: 3 / 5; }
.rainbow-learning-card:nth-child(3) { grid-column: 5 / 7; }
.rainbow-learning-card:nth-child(4) { grid-column: 2 / 4; }
.rainbow-learning-card:nth-child(5) { grid-column: 4 / 6; }

.rainbow-learning-card img {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
}

.rainbow-learning-card:not(:disabled):hover {
  transform: translateY(-6px) scale(1.035);
  filter: drop-shadow(0 18px 15px rgba(42, 79, 95, .28)) saturate(1.05);
}

.rainbow-learning-card:not(:disabled):active { transform: translateY(2px) scale(.98); }

.rainbow-learning-card:focus-visible {
  outline: 4px solid white;
  outline-offset: 5px;
  border-radius: 34px;
  box-shadow: 0 0 0 9px rgba(34, 143, 216, .72);
}

.rainbow-learning-card:disabled { cursor: default; filter: saturate(.88) drop-shadow(0 10px 10px rgba(42, 79, 95, .18)); }

.coming-soon-badge {
  position: absolute;
  top: 8%;
  right: -3%;
  padding: 7px 12px;
  border: 3px solid white;
  border-radius: 999px;
  background: linear-gradient(145deg, #8169de, #664fc4);
  color: white;
  font-size: clamp(.72rem, 1.2vw, .95rem);
  font-weight: 900;
  box-shadow: 0 5px 0 #4f3ba8;
}

.rainbow-home-mascots { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
.rainbow-home-mascots img { position: absolute; bottom: max(4%, env(safe-area-inset-bottom)); width: clamp(190px, 18vw, 330px); height: auto; }
.rainbow-bear { left: max(1.5%, calc((100vw - 1440px) / 2)); }
.rainbow-rabbit { right: max(1.5%, calc((100vw - 1440px) / 2)); }

.rainbow-sound-button,
.rainbow-parent-button,
.rainbow-rail-button {
  border: 3px solid rgba(255,255,255,.94);
  background: linear-gradient(145deg, #fff, #e8f1f6);
  box-shadow: 0 7px 0 rgba(74,118,148,.3), 0 13px 24px rgba(47,91,120,.2);
  transition: transform .16s ease, box-shadow .16s ease;
}

.rainbow-sound-button,
.rainbow-parent-button { position: absolute; top: max(18px, env(safe-area-inset-top)); z-index: 10; min-height: 60px; }
.rainbow-sound-button { left: max(18px, env(safe-area-inset-left)); width: 64px; border-radius: 22px; background: linear-gradient(145deg, #ffd94b, #ffad18); color: white; padding: 14px; }
.rainbow-sound-button svg { width: 100%; height: 100%; }
.rainbow-parent-button { right: max(18px, env(safe-area-inset-right)); display: inline-flex; align-items: center; gap: 9px; border-radius: 22px; padding: 10px 18px; color: #256795; font-size: 1.05rem; font-weight: 900; }
.rainbow-parent-button svg { width: 30px; height: 30px; }
.rainbow-sound-button:hover,
.rainbow-parent-button:hover { transform: translateY(-2px); }
.rainbow-sound-button:active,
.rainbow-parent-button:active { transform: translateY(4px); box-shadow: 0 3px 0 rgba(74,118,148,.3); }
.rainbow-rail-button { display: none; }
```

- [ ] **Step 3: 加入小尺寸滑動排版與安全直式 fallback**

```css
@media (max-width: 899px), (orientation: portrait) {
  .rainbow-home { min-height: max(600px, 100dvh); overflow-y: auto; }
  .rainbow-home-content { min-height: max(600px, 100dvh); padding-inline: 76px; }
  .rainbow-home-title { width: min(70vw, 590px); }
  .rainbow-card-area { width: 100%; margin-top: 6px; }
  .rainbow-learning-grid {
    display: flex;
    justify-content: flex-start;
    gap: 16px;
    overflow-x: auto;
    padding: 18px max(12%, 54px) 28px;
    scroll-padding-inline: max(12%, 54px);
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .rainbow-learning-grid::-webkit-scrollbar { display: none; }
  .rainbow-learning-card {
    width: clamp(190px, 45vw, 255px);
    flex: 0 0 clamp(190px, 45vw, 255px);
    scroll-snap-align: center;
  }
  .rainbow-home-mascots img { width: clamp(120px, 19vw, 180px); opacity: .9; }
  .rainbow-rail-button {
    position: absolute;
    z-index: 5;
    top: 50%;
    display: grid;
    width: 54px;
    height: 64px;
    place-items: center;
    border-radius: 19px;
    color: #ee628d;
    font-size: 2.5rem;
    font-weight: 900;
    transform: translateY(-50%);
  }
  .rainbow-rail-prev { left: 2px; }
  .rainbow-rail-next { right: 2px; }
}

@media (max-width: 640px) {
  .rainbow-parent-button span { display: none; }
  .rainbow-parent-button { width: 60px; justify-content: center; padding: 12px; }
  .rainbow-home-content { padding-inline: 58px; }
  .rainbow-home-title { width: min(76vw, 500px); }
  .rainbow-home-mascots img { opacity: .45; }
}

@media (prefers-reduced-motion: reduce) {
  .rainbow-learning-card,
  .rainbow-sound-button,
  .rainbow-parent-button,
  .rainbow-learning-grid { scroll-behavior: auto; transition: none; }
}
```

- [ ] **Step 4: 執行 build 與資料測試**

Run:

```powershell
npm run test:home
npm run build
```

Expected: 兩個命令皆 PASS；CSS 沒有無效資產路徑。

---

### Task 5: 瀏覽器與 iPad 尺寸驗證

**Files:**
- Modify only if the following checks reveal a home-specific defect: `src/components/RainbowHome.jsx`, `src/index.css`

**Interfaces:**
- Consumes: Tasks 1–4 的可執行首頁。
- Produces: 可驗證的桌機、iPad 與小尺寸橫式結果；不改 practice 頁行為。

- [ ] **Step 1: 啟動專用開發服務**

Run:

```powershell
npm run dev -- --host 0.0.0.0 --port 5174
```

Expected: Vite 顯示 Local `http://localhost:5174/` 與 LAN URL，沒有改用 5173。

- [ ] **Step 2: 以瀏覽器工具檢查四種 viewport**

逐一檢查：

```text
1920 × 1080  desktop landscape
1180 × 820   iPad Air 4 landscape
844 × 390    small landscape
820 × 1180   portrait fallback
```

每個尺寸都確認：

- 沒有水平頁面溢出。
- 1920×1080 與 1180×820 顯示完整 3＋2 卡片。
- 844×390 與 820×1180 顯示可滑動卡片，箭頭不遮住卡片文字。
- 聲音與家長模式按鈕在安全區內。
- 熊兔沒有覆蓋注音或數字卡片。
- 背景保持 cover，重要彩虹、草地與小徑仍可辨識。

- [ ] **Step 3: 驗證首頁導航與未開放狀態**

依序執行：

1. 點「注音學習」，確認進入既有注音頁，再返回首頁。
2. 點「數字學習」，確認進入既有數字頁，再返回首頁。
3. 點「家長模式」，確認進入既有家長頁，再返回首頁。
4. 切換聲音按鈕，確認 `aria-pressed` 與圖示狀態更新。
5. 檢查英文、形狀與邏輯卡片皆為 disabled、顯示「即將開放」，不進入空白頁。
6. 在 844×390 點左右箭頭，確認卡片滑軌位置改變；用觸控拖曳時 scroll snap 正常停在卡片中心。

- [ ] **Step 4: 檢查 console 與 regression**

確認瀏覽器 console：

```text
0 uncaught exceptions
0 failed asset requests
0 React key warnings
0 invalid DOM nesting warnings
```

再執行：

```powershell
node scripts/test-trace-progress.mjs
npm run test:home
npm run build
```

Expected: 所有命令 PASS，既有書寫進度測試不因首頁改版失敗。

- [ ] **Step 5: 實機交付檢查事項**

提供 `http://<LAN-IP>:5174/` 給使用者在 iPad Air 4 測試，要求確認：

- 加到主畫面後預設以橫向使用。
- 1180×820 可看到完整 3＋2 卡片，不需上下捲動才能點擊。
- Home Indicator 不裁切下排卡片。
- 注音與數字入口可點擊。
- 若裝置維持直式，仍不會出現強制遮罩或白畫面。
