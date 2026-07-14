# 字嗨注音字型整合 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將所有一般注音文字改用 `BpmfZihiOnly-R.ttf`，且不影響逐筆 SVG 描寫及 Canvas。

**Architecture:** 將字型與授權文件存放在 `src/assets/fonts/`，由全域 CSS 宣告單一 `@font-face`。React 元件只對實際包含注音的元素加入 `bpmf-font`，避免中文詞語與數字受影響。

**Tech Stack:** React、Vite、Tailwind CSS、TrueType/OpenType Web Font

## Global Constraints

- 只使用 `BpmfZihiOnly-R.ttf`，不使用 `BpmfZihiBox-R.ttf`。
- 不修改逐筆 SVG path、Canvas 輸入或筆順狀態；中央換字型需另行重畫並校準 37 組 path。
- 保存 ZIP 內 Apache 2.0、SIL OFL 與 NOTICE 文件。
- 不安裝新套件。

---

### Task 1: 匯入字型與授權

**Files:**
- Create: `src/assets/fonts/BpmfZihiOnly-R.ttf`
- Create: `src/assets/fonts/LICENSE-2.0.txt`
- Create: `src/assets/fonts/LICENSE-Gen.txt`
- Create: `src/assets/fonts/NOTICE.txt`

- [ ] 從 `C:/Users/user/Downloads/BpmfSpecial.zip` 只解出上述四個檔案。
- [ ] 確認 TTF 大小為 1,748,076 bytes，授權文件不是空檔案。

### Task 2: 套用注音專用字型

**Files:**
- Modify: `src/index.css`
- Modify: `src/App.jsx`

- [ ] 在 `src/index.css` 宣告 `Bpmf Zihi Only`，使用 `font-display: swap`。
- [ ] 建立 `.bpmf-font` class，並套用到首頁注音、選單符號、小注音讀音與家長模式注音。
- [ ] 以輕量文字描邊補足 Regular 字型沒有粗體字重的問題。
- [ ] 保留中文字詞、標題、按鈕與數字的現有字型。

### Task 3: 驗證

**Files:**
- Verify: `src/components/TraceWritingArea.jsx`
- Verify: `dist/`

- [ ] 執行 Vite production build，預期 exit code 0。
- [ ] 以瀏覽器確認字型資源成功載入，且注音元素 computed `font-family` 為 `Bpmf Zihi Only`。
- [ ] 確認 Canvas `touch-action: none`、逐筆 path 與頁面無水平溢位。
