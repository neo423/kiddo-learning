# Complete Zhuyin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將注音練習擴充為標準順序完整 37 題，加入每頁六題的幼兒友善選單。

**Architecture:** 在 `src/App.jsx` 以硬編碼 JavaScript data constants 補齊題目，沿用既有 `TraceWritingArea`。選單根據 `currentIndex` 衍生目前頁、頁首 index 與六題切片，不新增同步 page state，避免頁碼與題目不同步。

**Tech Stack:** React、Vite、Tailwind CSS、Canvas Pointer Events、原生 CSS

## Global Constraints

- 注音使用正確 Unicode，不使用 AI 圖片。
- 順序固定為 ㄅ 至 ㄦ的標準 37 符號。
- 筆畫數依教育部《國語注音符號手冊》。
- 前六題詞語與讀音不得變更。
- 不新增資料庫、後端、登入或依賴。
- 不執行 Git commit。

---

### Task 1: 建立完整流程失敗基準

**Files:**
- Test: temporary Chrome CDP script outside repository

**Interfaces:**
- Consumes: 現有首頁與注音下一題按鈕
- Produces: 第六次下一題仍應顯示注音學習、目前符號應為 ㄋ的失敗證據

- [ ] **Step 1: 執行目前六題流程**

在首頁進入注音學習，連按六次下一題。

Expected before implementation: 錯誤地進入成功畫面，證明完整 37 題功能尚未存在。

### Task 2: 補齊 37 題資料

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `createStrokes(count, markers)`、`ZHUYIN_STANDARD_ORDER`
- Produces: `PRACTICE_ZHUYIN_ITEMS` 共 37 個完整項目

- [ ] **Step 1: 建立標準筆畫資料物件**

每題提供 `strokeCount` 與教育部筆畫提示，轉換為現有 `strokes` 陣列。

- [ ] **Step 2: 加入剩餘 31 題詞語資料**

所有 `symbol` 必須與標準順序一一對應；`sound` 使用包含目標符號的無聲調注音音節。

- [ ] **Step 3: 移除六題 slice 限制**

將 `PRACTICE_ZHUYIN_ITEMS` 改為映射完整 `ZHUYIN_STANDARD_ORDER`。

### Task 3: 加入每頁六題選單

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `currentIndex`、`PRACTICE_ZHUYIN_ITEMS`
- Produces: `currentPage`、`pageStartIndex`、`visibleZhuyinItems`、上一組／下一組操作

- [ ] **Step 1: 衍生分頁資料**

使用 `Math.floor(currentIndex / 6)`，不建立額外 React page state。

- [ ] **Step 2: 重構選單 DOM**

新增 `.picker-list` 與 `.picker-page-controls`；分頁操作呼叫既有 `selectItem`。

- [ ] **Step 3: 將右側進度改為七段**

進度 aria-label 保留目前題號與總題數 37。

- [ ] **Step 4: 加入桌機、iPad、手機 CSS**

桌機直排六格，899px 以下橫排六格，640px 以下 3×2，分頁按鈕不造成水平溢出。

### Task 4: 回歸與建置驗證

**Files:**
- Verify: `src/App.jsx`
- Verify: `src/index.css`
- Verify: `src/components/TraceWritingArea.jsx`

**Interfaces:**
- Consumes: 完整資料與分頁選單
- Produces: 37 題流程、響應式與 build 證據

- [ ] **Step 1: 驗證第六題跨頁**

Expected: 第六次下一題顯示 ㄋ與第二組。

- [ ] **Step 2: 驗證最後一題**

Expected: 第 36 次下一題顯示 ㄦ；再按一次顯示成功畫面。

- [ ] **Step 3: 驗證資料與選單**

Expected: 37 個唯一符號、標準順序正確、ㄇㄠ／貓咪不變、分頁共七組。

- [ ] **Step 4: 驗證響應式與 Canvas**

Expected: 820×1180、390×844 無水平溢出，Canvas `touch-action` 為 `none`。

- [ ] **Step 5: 執行 production build**

Run: bundled Node 執行 `node_modules/vite/bin/vite.js build`

Expected: exit code 0，Vite 顯示 `built`。
