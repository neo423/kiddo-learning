# Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓幼兒學習 App 在桌機、iPad Air 橫直向與手機尺寸都沒有水平溢出，且主要操作按鈕保持可點擊。

**Architecture:** 保留現有 React DOM 與互動邏輯，只在 `src/index.css` 建立 desktop、compact tablet、stacked tablet/mobile 三層 CSS reflow。使用 Grid、Flex、`clamp()`、`dvh` 與 `min-width: 0`，避免使用 JavaScript 尺寸監聽或整頁縮放。

**Tech Stack:** React、Vite、Tailwind CSS、原生 CSS Grid/Flexbox

## Global Constraints

- 不修改 Canvas 書寫與字形遮罩邏輯。
- 不改注音／數字資料與頁面流程。
- 觸控按鈕高度至少 56px。
- 不新增依賴。
- 不執行 Git commit。

---

### Task 1: 建立修改前響應式失敗基準

**Files:**
- Inspect: `src/index.css`
- Test: localhost port 5174

**Interfaces:**
- Consumes: 現有 `.practice-layout`、`.side-picker`、`.stroke-practice-card`、`.word-card`、`.practice-action-bar`
- Produces: 四個 viewport 的溢出問題清單

- [ ] **Step 1: 啟動 5174 測試服務**

Run: bundled Node 執行 `vite --host 0.0.0.0 --port 5174 --strictPort`

Expected: `0.0.0.0:5174` 回應 HTTP 200。

- [ ] **Step 2: 量測修改前失敗狀態**

在 1180×820、820×1180、390×844 檢查頁面寬度與按鈕矩形。

Expected: 至少一個尺寸存在水平溢出或按鈕超出 viewport，證明測試可捕捉本次問題。

### Task 2: CSS 響應式重排

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Consumes: Task 1 的失敗尺寸與現有 class names
- Produces: 1200px、900–1199px、899px 以下與 539px 以下的響應式版面

- [ ] **Step 1: 修正根容器與桌機高度策略**

將練習頁固定最小高度改為 `100dvh`，為主要 Grid child 加入 `min-width: 0`，並限制水平 overflow。

- [ ] **Step 2: 新增緊湊平板規則**

在 900–1199px 縮減三欄寬度、gap、picker、word card 與操作按鈕尺寸。

- [ ] **Step 3: 新增直向堆疊規則**

在 899px 以下把 picker 改為上方六欄／三欄網格，描寫區與詞語卡依序堆疊。

- [ ] **Step 4: 新增手機規則**

在 539px 以下把首頁入口上下排列，練習操作列改為三等分且按鈕最小高度 56px。

### Task 3: 回歸與建置驗證

**Files:**
- Verify: `src/index.css`
- Verify: `src/components/TraceWritingArea.jsx`

**Interfaces:**
- Consumes: Task 2 的 CSS
- Produces: 響應式、互動與 build 結果

- [ ] **Step 1: 重新量測四個 viewport**

Expected: `scrollWidth <= clientWidth` 且所有可見主要按鈕保持在 viewport 寬度內。

- [ ] **Step 2: 測試首頁到注音／數字與返回**

Expected: 頁面切換正常，選題、下一題、清除、重寫均可操作。

- [ ] **Step 3: 檢查 Canvas 樣式**

Expected: `.drawing-canvas` 保持 `touch-action: none`，描寫區存在且沒有座標縮放 transform。

- [ ] **Step 4: 執行 production build**

Run: bundled Node 執行 `node_modules/vite/bin/vite.js build`

Expected: exit code 0，Vite 顯示 `built`。
