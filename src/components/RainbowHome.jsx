import { useRef } from 'react'
import { HOME_LEARNING_ITEMS } from '../data/homeLearningItems'
import titleImage from '../assets/images/home/rainbow-home-title.webp'
import bearImage from '../assets/images/home/rainbow-home-bear.webp'
import rabbitImage from '../assets/images/home/rainbow-home-rabbit.webp'


function SpeakerIcon({ muted }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path d="M5 12h6l7-6v20l-7-6H5z" fill="currentColor" />
      {muted ? (
        <path
          d="m22 12 7 8m0-8-7 8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
      ) : (
        <path
          d="M22 11c2.8 2.8 2.8 7.2 0 10M25 8c4.4 4.4 4.4 11.6 0 16"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
      )}
    </svg>
  )
}

function GearIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path
        d="M14 3h4l1 4 3 1 4-2 3 4-3 3v3l3 3-3 4-4-2-3 1-1 4h-4l-1-4-3-1-4 2-3-4 3-3v-3L3 10l3-4 4 2 3-1z"
        fill="currentColor"
      />
      <circle cx="16" cy="15" r="4" fill="white" />
    </svg>
  )
}

function RainbowHomeTitle() {
  return (
    <h1 className="rainbow-home-title">
      <img
        src={titleImage}
        alt="彩虹探索樂園，玩一玩，學會新本領！"
        draggable="false"
      />
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
      {item.enabled ? null : (
        <span className="coming-soon-badge">即將開放</span>
      )}
    </button>
  )
}

function HomeLearningGrid({ onNavigate }) {
  const railRef = useRef(null)

  const scrollCards = (direction) => {
    const rail = railRef.current
    if (!rail) return

    rail.scrollBy({
      left: direction * rail.clientWidth * 0.72,
      behavior: 'smooth',
    })
  }

  return (
    <div className="rainbow-card-area">
      <button
        type="button"
        className="rainbow-rail-button rainbow-rail-prev"
        onClick={() => scrollCards(-1)}
        aria-label="上一張學習卡"
      >
        ‹
      </button>

      <div ref={railRef} className="rainbow-learning-grid">
        {HOME_LEARNING_ITEMS.map((item) => (
          <HomeLearningCard
            key={item.id}
            item={item}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <button
        type="button"
        className="rainbow-rail-button rainbow-rail-next"
        onClick={() => scrollCards(1)}
        aria-label="下一張學習卡"
      >
        ›
      </button>
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

      <button
        type="button"
        className="rainbow-parent-button"
        onClick={() => onNavigate('parent')}
      >
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
