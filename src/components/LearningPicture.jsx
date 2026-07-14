const PICTURES = {
  baozi: (
    <svg viewBox="0 0 140 140" aria-hidden="true">
      <ellipse cx="70" cy="105" rx="48" ry="14" fill="#d99a52" />
      <path d="M26 96h88l-8 21H34z" fill="#f1b967" stroke="#b97738" strokeWidth="4" />
      <g fill="#fff7df" stroke="#e9cda2" strokeWidth="3">
        <path d="M30 86c0-17 11-30 25-30s25 13 25 30c0 10-8 17-25 17S30 96 30 86z" />
        <path d="M62 82c0-19 12-34 27-34s27 15 27 34c0 12-9 20-27 20S62 94 62 82z" />
      </g>
      <g fill="none" stroke="#e2b97f" strokeLinecap="round" strokeWidth="3">
        <path d="M55 58v15M48 61l7 12M62 61l-7 12" />
        <path d="M89 50v17M81 54l8 13M97 54l-8 13" />
      </g>
      <path d="M51 39c-6-8 5-11 0-20M76 35c-6-8 5-11 0-20M101 40c-6-8 5-11 0-20" fill="none" stroke="#ffb8c9" strokeLinecap="round" strokeWidth="4" />
    </svg>
  ),
  tadpole: (
    <svg viewBox="0 0 140 140" aria-hidden="true">
      <g fill="none" stroke="#5e7595" strokeLinecap="round" strokeWidth="8">
        <path d="M47 47c25 3 31 25 16 40-9 9-5 21 7 25" />
        <path d="M88 31c22 11 18 31 2 40-13 8-12 22 1 29" />
        <path d="M95 83c17 2 25 15 17 28" />
      </g>
      <g fill="#344965">
        <circle cx="40" cy="46" r="15" /><circle cx="84" cy="28" r="14" /><circle cx="91" cy="82" r="13" />
      </g>
      <g fill="#a9ddf5" opacity=".8"><circle cx="28" cy="89" r="8" /><circle cx="47" cy="111" r="5" /><circle cx="112" cy="51" r="7" /></g>
    </svg>
  ),
  ball: (
    <svg viewBox="0 0 140 140" aria-hidden="true">
      <defs><clipPath id="ballClip"><circle cx="70" cy="70" r="47" /></clipPath></defs>
      <circle cx="70" cy="70" r="47" fill="#fff8e8" stroke="#466580" strokeWidth="5" />
      <g clipPath="url(#ballClip)">
        <path d="M70 70L16 44 30 9 77 28z" fill="#ff7fa3" />
        <path d="M70 70l7-42 49-8 6 42z" fill="#65c6ef" />
        <path d="M70 70l62-8-13 57-48 2z" fill="#ffd05a" />
        <path d="M70 70l1 51-54-4-5-43z" fill="#83d69a" />
      </g>
      <circle cx="70" cy="70" r="47" fill="none" stroke="#466580" strokeWidth="5" />
      <circle cx="70" cy="70" r="8" fill="#fff8e8" stroke="#466580" strokeWidth="4" />
    </svg>
  ),
  seagull: (
    <svg viewBox="0 0 140 140" aria-hidden="true">
      <path d="M18 99c22-10 39-9 52 2 17-14 35-14 53-3" fill="none" stroke="#72c8ea" strokeLinecap="round" strokeWidth="6" />
      <path d="M30 73c17-28 35-34 40-5 10-22 29-23 42 0-18-9-29-5-42 13-12-16-25-19-40-8z" fill="#fff" stroke="#53677e" strokeLinejoin="round" strokeWidth="5" />
      <path d="M70 68c-4 11-3 21 1 30" fill="none" stroke="#53677e" strokeLinecap="round" strokeWidth="5" />
      <path d="M112 68l14 5-15 6" fill="#ffbf47" stroke="#d98a35" strokeLinejoin="round" strokeWidth="3" />
      <circle cx="105" cy="65" r="3" fill="#26384f" />
    </svg>
  ),
  dwarf: (
    <svg viewBox="0 0 140 140" aria-hidden="true">
      <path d="M38 52c5-27 26-39 51-31 12 4 21 14 25 27z" fill="#ef6d83" stroke="#9e4961" strokeLinejoin="round" strokeWidth="4" />
      <circle cx="73" cy="66" r="34" fill="#ffd3ac" stroke="#855d4f" strokeWidth="4" />
      <path d="M42 69c9 2 14 14 14 27 8-8 13-10 17-4 5-8 11-5 16 3 4-12 9-20 17-24 2 30-9 48-33 48S39 100 42 69z" fill="#fff3dc" stroke="#855d4f" strokeLinejoin="round" strokeWidth="4" />
      <circle cx="61" cy="64" r="4" fill="#38485c" /><circle cx="86" cy="64" r="4" fill="#38485c" />
      <path d="M67 76c4 4 9 4 13 0" fill="none" stroke="#b96863" strokeLinecap="round" strokeWidth="3" />
    </svg>
  ),
}

export default function LearningPicture({ pictureKey, fallback }) {
  return PICTURES[pictureKey] ?? <span aria-hidden="true">{fallback}</span>
}
