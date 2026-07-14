import { useMemo, useState } from 'react'
import TraceWritingArea from './components/TraceWritingArea'
import RainbowHome from './components/RainbowHome'
import { ZHUYIN_FONT_STROKE_PATHS as ZHUYIN_STROKE_PATHS } from './data/zhuyinFontStrokePaths'
import { NUMBER_STROKE_PATHS } from './data/numberStrokePaths'
import baoziImage from './assets/images/baozi.png'

const STROKE_COLORS = ['#ff6f9f', '#ffb347', '#4da8f5', '#9b7bea']
const ZHUYIN_COLORS = ['#ff6f9f', '#9b79e8', '#ff9a55', '#57bda3', '#5da8ed', '#ef7bb4', '#e88a4d', '#58b6c8']

const DEFAULT_STROKE_MARKERS = {
  1: [{ x: 43, y: 34, direction: '↓' }],
  2: [{ x: 40, y: 34, direction: '→' }, { x: 58, y: 58, direction: '↓' }],
  3: [{ x: 38, y: 31, direction: '→' }, { x: 50, y: 48, direction: '↓' }, { x: 62, y: 64, direction: '→' }],
  4: [{ x: 36, y: 29, direction: '→' }, { x: 45, y: 41, direction: '↓' }, { x: 55, y: 54, direction: '→' }, { x: 64, y: 67, direction: '↓' }],
}

const createStrokes = (count, markers = DEFAULT_STROKE_MARKERS[count] ?? []) => Array.from({ length: count }, (_, index) => ({
  id: index + 1,
  color: STROKE_COLORS[index % STROKE_COLORS.length],
  label: String(index + 1),
  marker: markers[index] ?? { x: 26 + index * 18, y: 25 + index * 18 },
  direction: markers[index]?.direction ?? ['↓', '→', '↘', '↙'][index % 4],
  path: null,
}))

// 教育部《國語注音符號手冊》的標準排列。
const ZHUYIN_STANDARD_ORDER = [
  'ㄅ', 'ㄆ', 'ㄇ', 'ㄈ',
  'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ',
  'ㄍ', 'ㄎ', 'ㄏ',
  'ㄐ', 'ㄑ', 'ㄒ',
  'ㄓ', 'ㄔ', 'ㄕ', 'ㄖ',
  'ㄗ', 'ㄘ', 'ㄙ',
  'ㄧ', 'ㄨ', 'ㄩ',
  'ㄚ', 'ㄛ', 'ㄜ', 'ㄝ',
  'ㄞ', 'ㄟ', 'ㄠ', 'ㄡ',
  'ㄢ', 'ㄣ', 'ㄤ', 'ㄥ',
  'ㄦ',
]

const ZHUYIN_ITEMS = [
  { id: 'b', symbol: 'ㄅ', sound: 'ㄅㄠ', word: '包子', imageLabel: '🥟', imageSrc: baoziImage, color: '#ff6f9f', strokeHint: '一筆完成', strokes: createStrokes(1, [{ x: 43, y: 34, direction: '↓' }]) },
  { id: 'p', symbol: 'ㄆ', sound: 'ㄆㄨ', word: '葡萄', imageLabel: '🍇', color: '#9b79e8', strokeHint: '共二畫，末筆不捺', strokes: createStrokes(2, [{ x: 42, y: 34, direction: '→' }, { x: 57, y: 58, direction: '↙' }]) },
  { id: 'm', symbol: 'ㄇ', sound: 'ㄇㄠ', word: '貓咪', imageLabel: '🐱', color: '#ff9a55', strokeHint: '共二畫', strokes: createStrokes(2, [{ x: 41, y: 34, direction: '↓' }, { x: 58, y: 58, direction: '→' }]) },
  { id: 'f', symbol: 'ㄈ', sound: 'ㄈㄢ', word: '米飯', imageLabel: '🍚', color: '#57bda3', strokeHint: '第二筆與第一筆起筆相接', strokes: createStrokes(2, [{ x: 42, y: 34, direction: '↓' }, { x: 57, y: 58, direction: '↘' }]) },
  { id: 'd', symbol: 'ㄉ', sound: 'ㄉㄠ', word: '刀子', imageLabel: '🔪', color: '#5da8ed', strokeHint: '共二畫', strokes: createStrokes(2, [{ x: 41, y: 35, direction: '→' }, { x: 58, y: 58, direction: '↓' }]) },
  { id: 't', symbol: 'ㄊ', sound: 'ㄊㄡ', word: '吐舌頭', imageLabel: '😛', color: '#ef7bb4', strokeHint: '共三畫，中筆斜貫而下', strokes: createStrokes(3, [{ x: 39, y: 34, direction: '→' }, { x: 50, y: 49, direction: '↘' }, { x: 61, y: 63, direction: '→' }]) },
  { id: 'n', symbol: 'ㄋ', sound: 'ㄋㄧㄠ', word: '小鳥', imageLabel: '🐦', color: ZHUYIN_COLORS[6], strokeHint: '一筆完成', strokes: createStrokes(1) },
  { id: 'l', symbol: 'ㄌ', sound: 'ㄌㄧ', word: '梨子', imageLabel: '🍐', color: ZHUYIN_COLORS[7], strokeHint: '共二畫', strokes: createStrokes(2) },
  { id: 'g', symbol: 'ㄍ', sound: 'ㄍㄡ', word: '小狗', imageLabel: '🐶', color: ZHUYIN_COLORS[0], strokeHint: '共二畫', strokes: createStrokes(2) },
  { id: 'k', symbol: 'ㄎ', sound: 'ㄎㄜ', word: '蝌蚪', imageLabel: '🐸', color: ZHUYIN_COLORS[1], strokeHint: '共二畫', strokes: createStrokes(2) },
  { id: 'h', symbol: 'ㄏ', sound: 'ㄏㄨㄚ', word: '花朵', imageLabel: '🌸', color: ZHUYIN_COLORS[2], strokeHint: '共二畫，兩筆起筆相接', strokes: createStrokes(2) },
  { id: 'j', symbol: 'ㄐ', sound: 'ㄐㄧ', word: '雞蛋', imageLabel: '🥚', color: ZHUYIN_COLORS[3], strokeHint: '共二畫，豎挑不超過第二筆', strokes: createStrokes(2) },
  { id: 'q', symbol: 'ㄑ', sound: 'ㄑㄧㄡ', word: '皮球', imageLabel: '⚽', color: ZHUYIN_COLORS[4], strokeHint: '一筆完成', strokes: createStrokes(1) },
  { id: 'x', symbol: 'ㄒ', sound: 'ㄒㄧ', word: '西瓜', imageLabel: '🍉', color: ZHUYIN_COLORS[5], strokeHint: '共二畫', strokes: createStrokes(2) },
  { id: 'zh', symbol: 'ㄓ', sound: 'ㄓㄨ', word: '小豬', imageLabel: '🐷', color: ZHUYIN_COLORS[6], strokeHint: '共四畫，也可省作三畫', strokes: createStrokes(4) },
  { id: 'ch', symbol: 'ㄔ', sound: 'ㄔㄜ', word: '車子', imageLabel: '🚗', color: ZHUYIN_COLORS[7], strokeHint: '共三畫', strokes: createStrokes(3) },
  { id: 'sh', symbol: 'ㄕ', sound: 'ㄕㄨ', word: '書本', imageLabel: '📚', color: ZHUYIN_COLORS[0], strokeHint: '共三畫，末筆與第二筆起筆相接', strokes: createStrokes(3) },
  { id: 'r', symbol: 'ㄖ', sound: 'ㄖㄧ', word: '日曆', imageLabel: '📅', color: ZHUYIN_COLORS[1], strokeHint: '共四畫，中間為一點', strokes: createStrokes(4) },
  { id: 'z', symbol: 'ㄗ', sound: 'ㄗㄨ', word: '足球', imageLabel: '⚽', color: ZHUYIN_COLORS[2], strokeHint: '共二畫', strokes: createStrokes(2) },
  { id: 'c', symbol: 'ㄘ', sound: 'ㄘㄠ', word: '青草', imageLabel: '🌱', color: ZHUYIN_COLORS[3], strokeHint: '共二畫，末筆不鉤', strokes: createStrokes(2) },
  { id: 's', symbol: 'ㄙ', sound: 'ㄙㄢ', word: '雨傘', imageLabel: '☂️', color: ZHUYIN_COLORS[4], strokeHint: '共二畫', strokes: createStrokes(2) },
  { id: 'yi', symbol: 'ㄧ', sound: 'ㄧ', word: '衣服', imageLabel: '👕', color: ZHUYIN_COLORS[5], strokeHint: '一筆完成', strokes: createStrokes(1) },
  { id: 'wu', symbol: 'ㄨ', sound: 'ㄨ', word: '烏龜', imageLabel: '🐢', color: ZHUYIN_COLORS[6], strokeHint: '共二畫，第二筆不捺', strokes: createStrokes(2) },
  { id: 'yu', symbol: 'ㄩ', sound: 'ㄩ', word: '魚兒', imageLabel: '🐟', color: ZHUYIN_COLORS[7], strokeHint: '共二畫', strokes: createStrokes(2) },
  { id: 'a', symbol: 'ㄚ', sound: 'ㄚ', word: '阿姨', imageLabel: '👩', color: ZHUYIN_COLORS[0], strokeHint: '共三畫', strokes: createStrokes(3) },
  { id: 'o', symbol: 'ㄛ', sound: 'ㄛ', word: '喔喔叫', imageLabel: '🐓', color: ZHUYIN_COLORS[1], strokeHint: '共二畫', strokes: createStrokes(2) },
  { id: 'e', symbol: 'ㄜ', sound: 'ㄜ', word: '白鵝', imageLabel: '🪿', color: ZHUYIN_COLORS[2], strokeHint: '共二畫', strokes: createStrokes(2) },
  { id: 'eh', symbol: 'ㄝ', sound: 'ㄉㄧㄝ', word: '蝴蝶', imageLabel: '🦋', color: ZHUYIN_COLORS[3], strokeHint: '共三畫，末筆不鉤', strokes: createStrokes(3) },
  { id: 'ai', symbol: 'ㄞ', sound: 'ㄞ', word: '矮人', imageLabel: '🧒', color: ZHUYIN_COLORS[4], strokeHint: '共三畫，右下不鉤', strokes: createStrokes(3) },
  { id: 'ei', symbol: 'ㄟ', sound: 'ㄈㄟ', word: '飛機', imageLabel: '✈️', color: ZHUYIN_COLORS[5], strokeHint: '一筆完成', strokes: createStrokes(1) },
  { id: 'ao', symbol: 'ㄠ', sound: 'ㄠ', word: '凹洞', imageLabel: '🕳️', color: ZHUYIN_COLORS[6], strokeHint: '共三畫', strokes: createStrokes(3) },
  { id: 'ou', symbol: 'ㄡ', sound: 'ㄡ', word: '海鷗', imageLabel: '🐦', color: ZHUYIN_COLORS[7], strokeHint: '共二畫，末筆不捺，左上不封口', strokes: createStrokes(2) },
  { id: 'an', symbol: 'ㄢ', sound: 'ㄢ', word: '安全', imageLabel: '🦺', color: ZHUYIN_COLORS[0], strokeHint: '共二畫，末筆不鉤', strokes: createStrokes(2) },
  { id: 'en', symbol: 'ㄣ', sound: 'ㄙㄣ', word: '森林', imageLabel: '🌲', color: ZHUYIN_COLORS[1], strokeHint: '一筆完成', strokes: createStrokes(1) },
  { id: 'ang', symbol: 'ㄤ', sound: 'ㄧㄤ', word: '綿羊', imageLabel: '🐑', color: ZHUYIN_COLORS[2], strokeHint: '共三畫，末筆不鉤', strokes: createStrokes(3) },
  { id: 'eng', symbol: 'ㄥ', sound: 'ㄈㄥ', word: '風箏', imageLabel: '🪁', color: ZHUYIN_COLORS[3], strokeHint: '一筆完成', strokes: createStrokes(1) },
  { id: 'er', symbol: 'ㄦ', sound: 'ㄦ', word: '耳朵', imageLabel: '👂', color: ZHUYIN_COLORS[4], strokeHint: '共二畫，末筆不鉤', strokes: createStrokes(2) },
]

const PRACTICE_ZHUYIN_ITEMS = ZHUYIN_STANDARD_ORDER
  .map((symbol) => {
    const item = ZHUYIN_ITEMS.find((candidate) => candidate.symbol === symbol)
    const pathData = ZHUYIN_STROKE_PATHS[symbol]
    if (!item || pathData?.length !== item.strokes.length) return item

    return {
      ...item,
      strokes: item.strokes.map((stroke, index) => ({
        ...stroke,
        ...pathData[index],
      })),
    }
  })
  .filter(Boolean)

const ZHUYIN_PAGE_SIZE = 6
const ZHUYIN_PAGE_COUNT = Math.ceil(PRACTICE_ZHUYIN_ITEMS.length / ZHUYIN_PAGE_SIZE)

const NUMBER_ITEMS = [
  { number: 0, color: '#7b8798', strokeCount: 1 },
  { number: 1, color: '#48a9ef', strokeCount: 1 },
  { number: 2, color: '#60bd9c', strokeCount: 1 },
  { number: 3, color: '#ff8d69', strokeCount: 1 },
  { number: 4, color: '#9b7bdc', strokeCount: 2 },
  { number: 5, color: '#ef74aa', strokeCount: 2 },
  { number: 6, color: '#45b7a8', strokeCount: 1 },
  { number: 7, color: '#f19b45', strokeCount: 1 },
  { number: 8, color: '#7f86e8', strokeCount: 1 },
  { number: 9, color: '#ec6f8f', strokeCount: 1 },
].map(({ strokeCount, ...item }) => ({
  ...item,
  strokes: createStrokes(strokeCount).map((stroke, index) => ({
    ...stroke,
    ...NUMBER_STROKE_PATHS[item.number][index],
  })),
}))

const NUMBER_PAGE_SIZE = 5
const NUMBER_PAGE_COUNT = Math.ceil(NUMBER_ITEMS.length / NUMBER_PAGE_SIZE)

function SoundButton({ soundOn, onToggle, compact = false }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={soundOn ? '關閉聲音' : '開啟聲音'}
      className={`icon-button bg-[#ffc928] text-white ${compact ? 'h-12 w-12 text-xl' : 'h-14 w-14 text-2xl'}`}
    >
      {soundOn ? '🔊' : '🔇'}
    </button>
  )
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="返回首頁"
      className="icon-button h-12 w-12 bg-[#ff7fa2] text-2xl text-white"
    >
      ←
    </button>
  )
}

function Home({ onNavigate, soundOn, onToggleSound }) {
  return (
    <RainbowHome
      onNavigate={onNavigate}
      soundOn={soundOn}
      onToggleSound={onToggleSound}
    />
  )
}

function PageHeader({ title, onBack, soundOn, onToggleSound, accent = 'pink' }) {
  return (
    <header className="practice-header relative z-10 grid grid-cols-[1fr_auto_1fr] items-center px-5 py-4 sm:px-8">
      <div className="justify-self-start">
        <BackButton onClick={onBack} />
      </div>
      <div className="text-center">
        <p className={`mb-1 text-xs font-black tracking-[0.3em] ${accent === 'pink' ? 'text-[#ff7b9b]' : 'text-[#369ee7]'}`}>
          LEARNING TIME
        </p>
        <h1 className="text-2xl font-black tracking-wide text-slate-700 sm:text-3xl">{title}</h1>
      </div>
      <div className="justify-self-end">
        <SoundButton soundOn={soundOn} onToggle={onToggleSound} compact />
      </div>
    </header>
  )
}

function BottomActions({ onClear, onRewrite, onNext }) {
  return (
    <div className="practice-action-bar flex flex-wrap items-center justify-center gap-3 px-4 pb-5 pt-4 sm:gap-5">
      <button type="button" onClick={onClear} className="action-button bg-[#ffd33d] text-[#815900] shadow-[#eab514]">
        <span aria-hidden="true">🧹</span> 清除
      </button>
      <button type="button" onClick={onRewrite} className="action-button bg-[#4cb9f2] text-white shadow-[#258dca]">
        <span aria-hidden="true">✏️</span> 重寫
      </button>
      <button type="button" onClick={onNext} className="action-button action-button-primary bg-[#ff7399] text-white shadow-[#df4f77]">
        下一題 <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}

function ZhuyinPractice({ onBack, onComplete, soundOn, onToggleSound, speak }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [strokeStep, setStrokeStep] = useState(0)
  const [canvasRevision, setCanvasRevision] = useState(0)
  const current = PRACTICE_ZHUYIN_ITEMS[currentIndex]
  const currentPage = Math.floor(currentIndex / ZHUYIN_PAGE_SIZE)
  const pageStartIndex = currentPage * ZHUYIN_PAGE_SIZE
  const visibleZhuyinItems = PRACTICE_ZHUYIN_ITEMS.slice(pageStartIndex, pageStartIndex + ZHUYIN_PAGE_SIZE)

  const selectItem = (index) => {
    setCurrentIndex(index)
    setStrokeStep(0)
    setCanvasRevision((revision) => revision + 1)
    speak(`${PRACTICE_ZHUYIN_ITEMS[index].sound}，${PRACTICE_ZHUYIN_ITEMS[index].word}`)
  }

  const selectPage = (page) => {
    const nextPage = Math.min(Math.max(page, 0), ZHUYIN_PAGE_COUNT - 1)
    selectItem(nextPage * ZHUYIN_PAGE_SIZE)
  }

  const next = () => {
    if (currentIndex === PRACTICE_ZHUYIN_ITEMS.length - 1) {
      onComplete('zhuyin')
      return
    }
    selectItem(currentIndex + 1)
  }

  const advanceStroke = () => {
    setStrokeStep((step) => Math.min(step + 1, current.strokes.length))
  }

  const clear = () => {
    setCanvasRevision((revision) => revision + 1)
  }

  const rewrite = () => {
    setStrokeStep(0)
    setCanvasRevision((revision) => revision + 1)
  }

  return (
    <main className="practice-screen practice-pink screen-shell">
      <PageHeader title="注音學習" onBack={onBack} soundOn={soundOn} onToggleSound={onToggleSound} />

      <section className="practice-layout relative z-10 mx-auto grid min-h-0 w-full max-w-[1320px] flex-1 grid-cols-[112px_minmax(0,1fr)_310px] gap-5 px-5 sm:px-7">
        <nav className="side-picker" aria-label="注音選單">
          <div className="picker-list">
            {visibleZhuyinItems.map((item, pageIndex) => {
              const itemIndex = pageStartIndex + pageIndex
              return (
                <button
                  type="button"
                  key={item.symbol}
                  onClick={() => selectItem(itemIndex)}
                  aria-current={currentIndex === itemIndex ? 'true' : undefined}
                  className={`picker-button bpmf-font ${currentIndex === itemIndex ? 'picker-button-active-pink' : ''}`}
                >
                  {item.symbol}
                </button>
              )
            })}
          </div>
          <div className="picker-page-controls" aria-label="注音選單分頁">
            <button
              type="button"
              className="picker-page-button"
              onClick={() => selectPage(currentPage - 1)}
              disabled={currentPage === 0}
              aria-label="上一組注音"
            >
              ‹
            </button>
            <span className="picker-page-label">{currentPage + 1} / {ZHUYIN_PAGE_COUNT}</span>
            <button
              type="button"
              className="picker-page-button"
              onClick={() => selectPage(currentPage + 1)}
              disabled={currentPage === ZHUYIN_PAGE_COUNT - 1}
              aria-label="下一組注音"
            >
              ›
            </button>
          </div>
        </nav>

        <TraceWritingArea
          item={current}
          strokeStep={strokeStep}
          clearSignal={canvasRevision}
          onAdvance={advanceStroke}
        />

        <aside className="word-card">
          <span className="rounded-full bg-[#fff1f5] px-4 py-1 text-sm font-black text-[#ef6f94]">今天的詞語</span>
          <div className="my-auto flex flex-col items-center">
            <div className="emoji-picture" aria-hidden="true">
              {current.imageSrc
                ? <img className="word-picture-image" src={current.imageSrc} alt="" />
                : current.imageLabel}
            </div>
            <button
              type="button"
              onClick={() => speak(`${current.sound}，${current.word}`)}
              className="word-sound-button mt-3 bg-[#ff7e9f] shadow-md"
              aria-label={`播放${current.word}讀音`}
            >
              🔊
            </button>
            <div className="mt-4 text-center text-black">
              <p className="word-reading bpmf-font">{current.sound}</p>
              <p className="word-name">{current.word}</p>
              <p className="mt-3 text-sm font-bold text-slate-400">{current.strokeHint}</p>
            </div>
          </div>
          <div className="progress-dots" aria-label={`第 ${currentIndex + 1} 題，共 ${PRACTICE_ZHUYIN_ITEMS.length} 題`}>
            {Array.from({ length: ZHUYIN_PAGE_COUNT }, (_, pageIndex) => (
              <span key={pageIndex} className={pageIndex <= currentPage ? 'bg-[#ff789c]' : 'bg-slate-200'} />
            ))}
          </div>
        </aside>
      </section>

      <BottomActions
        onClear={clear}
        onRewrite={rewrite}
        onNext={next}
      />
    </main>
  )
}

function AppleGroup({ count }) {
  if (count === 0) {
    return (
      <div className="flex flex-col items-center text-slate-400">
        <span className="text-8xl opacity-60">🧺</span>
        <span className="mt-3 text-lg font-black">籃子裡沒有蘋果</span>
      </div>
    )
  }

  return (
    <div className="flex h-60 w-full max-w-[280px] flex-wrap content-center justify-center gap-x-1 gap-y-1" aria-label={`${count} 顆蘋果`}>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className="flex w-[30%] justify-center text-5xl drop-shadow-sm">🍎</span>
      ))}
    </div>
  )
}

function NumberPractice({ onBack, onComplete, soundOn, onToggleSound, speak }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [strokeStep, setStrokeStep] = useState(0)
  const [canvasRevision, setCanvasRevision] = useState(0)
  const current = NUMBER_ITEMS[currentIndex]
  const currentPage = Math.floor(currentIndex / NUMBER_PAGE_SIZE)
  const pageStartIndex = currentPage * NUMBER_PAGE_SIZE
  const visibleNumberItems = NUMBER_ITEMS.slice(pageStartIndex, pageStartIndex + NUMBER_PAGE_SIZE)

  const selectItem = (index) => {
    setCurrentIndex(index)
    setStrokeStep(0)
    setCanvasRevision((revision) => revision + 1)
    speak(`${NUMBER_ITEMS[index].number}`)
  }

  const next = () => {
    if (currentIndex === NUMBER_ITEMS.length - 1) {
      onComplete('number')
      return
    }
    selectItem(currentIndex + 1)
  }

  const selectPage = (page) => {
    const nextPage = Math.min(Math.max(page, 0), NUMBER_PAGE_COUNT - 1)
    selectItem(nextPage * NUMBER_PAGE_SIZE)
  }

  const advanceStroke = () => {
    setStrokeStep((step) => Math.min(step + 1, current.strokes.length))
  }

  const clear = () => {
    setCanvasRevision((revision) => revision + 1)
  }

  const rewrite = () => {
    setStrokeStep(0)
    setCanvasRevision((revision) => revision + 1)
  }

  return (
    <main className="practice-screen practice-blue screen-shell">
      <PageHeader title="數字學習" onBack={onBack} soundOn={soundOn} onToggleSound={onToggleSound} accent="blue" />

      <section className="practice-layout relative z-10 mx-auto grid min-h-0 w-full max-w-[1320px] flex-1 grid-cols-[112px_minmax(0,1fr)_310px] gap-5 px-5 sm:px-7">
        <nav className="side-picker number-side-picker" aria-label="數字選單">
          <div className="picker-list">
            {visibleNumberItems.map((item, pageIndex) => {
              const itemIndex = pageStartIndex + pageIndex
              return (
                <button
                  type="button"
                  key={item.number}
                  onClick={() => selectItem(itemIndex)}
                  aria-current={currentIndex === itemIndex ? 'true' : undefined}
                  className={`picker-button ${currentIndex === itemIndex ? 'picker-button-active-blue' : ''}`}
                >
                  {item.number}
                </button>
              )
            })}
          </div>
          <div className="picker-page-controls picker-page-controls-blue" aria-label="數字選單分頁">
            <button
              type="button"
              className="picker-page-button"
              onClick={() => selectPage(currentPage - 1)}
              disabled={currentPage === 0}
              aria-label="上一組數字"
            >
              ‹
            </button>
            <span className="picker-page-label">{currentPage + 1} / {NUMBER_PAGE_COUNT}</span>
            <button
              type="button"
              className="picker-page-button"
              onClick={() => selectPage(currentPage + 1)}
              disabled={currentPage === NUMBER_PAGE_COUNT - 1}
              aria-label="下一組數字"
            >
              ›
            </button>
          </div>
        </nav>

        <TraceWritingArea
          item={current}
          strokeStep={strokeStep}
          clearSignal={canvasRevision}
          onAdvance={advanceStroke}
          type="number"
        />

        <aside className="word-card">
          <span className="rounded-full bg-[#eaf7ff] px-4 py-1 text-sm font-black text-[#359fe7]">數一數</span>
          <div className="my-auto flex w-full flex-col items-center">
            <AppleGroup count={current.number} />
            <div className="mt-3 flex items-end gap-3 text-black">
              <span className="text-7xl font-black text-[#2d99e2]">{current.number}</span>
              <span className="pb-2 text-2xl font-black">顆蘋果</span>
            </div>
          </div>
          <div className="progress-dots" aria-label={`第 ${currentIndex + 1} 題，共 ${NUMBER_ITEMS.length} 題`}>
            {NUMBER_ITEMS.map((item, index) => (
              <span key={item.number} className={index <= currentIndex ? 'bg-[#45adeb]' : 'bg-slate-200'} />
            ))}
          </div>
        </aside>
      </section>

      <BottomActions
        onClear={clear}
        onRewrite={rewrite}
        onNext={next}
      />
    </main>
  )
}

function SuccessScreen({ mode, onHome, onReplay }) {
  const isZhuyin = mode === 'zhuyin'
  return (
    <main className="success-screen screen-shell flex items-center justify-center overflow-hidden px-5 py-8">
      <div className="confetti" aria-hidden="true">✦</div>
      <section className="success-card relative z-10 w-full max-w-2xl text-center">
        <div className="success-ribbon">恭喜你！</div>
        <div className="relative mx-auto mt-4 h-40 w-48">
          <span className="absolute left-0 top-4 animate-float text-4xl">🎈</span>
          <span className="absolute right-0 top-6 animate-float-delay text-4xl">🎉</span>
          <span className="absolute left-1/2 top-0 -translate-x-1/2 text-9xl drop-shadow-lg">🐻</span>
        </div>
        <h1 className="mt-1 text-3xl font-black text-slate-700 sm:text-4xl">你真棒！完成練習囉！</h1>
        <p className="mt-3 font-bold text-slate-500">你完成了全部{isZhuyin ? '注音' : '數字'}題目</p>
        <div className="my-5 flex justify-center gap-3 text-6xl" aria-label="獲得三顆星星">
          <span className="star-pop">⭐</span>
          <span className="star-pop star-delay-1">⭐</span>
          <span className="star-pop star-delay-2">⭐</span>
        </div>

        <div className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-[#f4bd54] bg-[#fff9e9] p-4">
          <span className="text-5xl">🏅</span>
          <div className="text-left">
            <p className="text-sm font-black text-[#e49b24]">今日貼紙獎勵</p>
            <p className="mt-1 font-black text-slate-700">勇敢學習小達人</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <button type="button" onClick={onReplay} className="action-button bg-[#53b8ee] text-white shadow-[#288fca]">再玩一次</button>
          <button type="button" onClick={onHome} className="action-button bg-[#ff7f9f] text-white shadow-[#df5578]">回到首頁</button>
        </div>
      </section>
    </main>
  )
}

function StatBox({ icon, label, value, tone }) {
  return (
    <div className={`rounded-3xl p-4 ${tone}`}>
      <div className="text-2xl" aria-hidden="true">{icon}</div>
      <p className="mt-2 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-700">{value}</p>
    </div>
  )
}

function ParentDashboard({ onBack }) {
  return (
    <main className="parent-screen screen-shell overflow-auto">
      <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center bg-white/65 px-5 py-4 backdrop-blur-md sm:px-8">
        <BackButton onClick={onBack} />
        <div className="text-center">
          <p className="text-xs font-black tracking-[0.3em] text-[#5376a9]">FOR PARENTS</p>
          <h1 className="text-2xl font-black text-slate-700 sm:text-3xl">家長模式</h1>
        </div>
        <div />
      </header>

      <div className="mx-auto grid w-full max-w-5xl gap-5 px-5 pb-8 pt-3 sm:px-8">
        <section className="parent-card flex items-center gap-4 p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#dff3ff] text-4xl">👦🏻</div>
          <div>
            <p className="text-sm font-bold text-slate-400">孩子名稱</p>
            <h2 className="text-2xl font-black text-slate-700">小明</h2>
          </div>
          <span className="ml-auto rounded-full bg-[#e8f7ef] px-4 py-2 text-sm font-black text-[#43a976]">本週持續學習中</span>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="parent-card p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#ef7397]">LEARNING OVERVIEW</p>
                <h2 className="text-2xl font-black text-slate-700">學習總覽</h2>
              </div>
              <div className="accuracy-ring" aria-label="正確率 80%">
                <div><strong>80%</strong><span>正確率</span></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatBox icon="✅" label="已完成題數" value="16 題" tone="bg-[#eef9f2]" />
              <StatBox icon="💡" label="錯誤題數" value="4 題" tone="bg-[#fff2f1]" />
              <StatBox icon="📝" label="總題數" value="20 題" tone="bg-[#eef6ff]" />
            </div>
          </section>

          <section className="parent-card p-5 sm:p-6">
            <p className="text-sm font-bold text-[#a17bd5]">KEEP PRACTICING</p>
            <h2 className="text-xl font-black text-slate-700">需要加強練習</h2>
            <div className="mt-6 flex justify-center gap-3">
              {['ㄇ', 'ㄈ', 'ㄉ'].map((symbol, index) => (
                <div key={symbol} className="bpmf-font flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-[#f4d8e5] bg-[#fff7fa] text-4xl font-black text-[#ed739b] shadow-sm">
                  {symbol}
                </div>
              ))}
            </div>
            <p className="mt-5 text-center text-sm font-bold text-slate-400">多聽幾次，再慢慢練習就好</p>
          </section>
        </div>

        <section className="parent-card flex items-start gap-4 p-5 sm:p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fff5c9] text-3xl">💡</div>
          <div>
            <h2 className="text-xl font-black text-slate-700">學習建議</h2>
            <p className="mt-2 font-bold leading-relaxed text-slate-500">建議每天練習 5–10 分鐘，持續進步喔！</p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [soundOn, setSoundOn] = useState(true)
  const [completedMode, setCompletedMode] = useState('zhuyin')

  const voicesSupported = useMemo(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
    [],
  )

  const speak = (text) => {
    if (!soundOn || !voicesSupported) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-TW'
    utterance.rate = 0.75
    utterance.pitch = 1.2
    window.speechSynthesis.speak(utterance)
  }

  const navigate = (nextScreen) => {
    setScreen(nextScreen)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const complete = (mode) => {
    setCompletedMode(mode)
    navigate('success')
  }

  const shared = {
    soundOn,
    onToggleSound: () => setSoundOn((value) => !value),
  }

  if (screen === 'zhuyin') {
    return <ZhuyinPractice {...shared} onBack={() => navigate('home')} onComplete={complete} speak={speak} />
  }
  if (screen === 'number') {
    return <NumberPractice {...shared} onBack={() => navigate('home')} onComplete={complete} speak={speak} />
  }
  if (screen === 'success') {
    return (
      <SuccessScreen
        mode={completedMode}
        onHome={() => navigate('home')}
        onReplay={() => navigate(completedMode)}
      />
    )
  }
  if (screen === 'parent') {
    return <ParentDashboard onBack={() => navigate('home')} />
  }
  return <Home {...shared} onNavigate={navigate} />
}
