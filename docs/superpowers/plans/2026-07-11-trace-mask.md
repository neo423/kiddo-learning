# Trace Mask Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將注音與數字 Canvas 改成只在字形粗框內顯示彩色筆跡的描寫模式。

**Architecture:** 在共用 `DrawingCanvas` 的每個繪圖動作後，以相同 Unicode glyph 建立 Canvas 遮罩，透過 `destination-in` 裁切筆跡。沿用現有高 DPI、Pointer Events、clear signal 與共用元件架構，不新增依賴。

**Tech Stack:** React、Canvas 2D、Pointer Events、Vite、Tailwind CSS

## Global Constraints

- Apple Pencil、touch、mouse 都必須可書寫。
- Canvas 保持 `touch-action: none`。
- 筆跡只能顯示在注音或數字字形內。
- 不加入手寫辨識、AI、後端或資料庫。
- 不修改與描寫區無關的頁面。

---

### Task 1: 字形遮罩與描寫筆刷

**Files:**
- Modify: `src/components/TraceWritingArea.jsx`
- Test: in-app browser at `http://127.0.0.1:5174`

**Interfaces:**
- Consumes: `glyph`, `color`, `clearSignal`, `item.strokes`, Pointer Events
- Produces: `DrawingCanvas` 中被 glyph 遮罩裁切的彩色筆跡

- [ ] **Step 1: 確認現有失敗行為**

在目前頁面把滑鼠從字形框內拖到框外。預期目前框外仍有彩色像素，與需求不符。

- [ ] **Step 2: 加入遮罩幾何計算**

依 `.trace-guide-svg` 的 `inset: 9% 8% 12%`、SVG `viewBox="0 0 400 400"`、文字座標 `x=200`、`y=292`、字級 `270` 計算 Canvas 上相同的文字位置與尺寸。

- [ ] **Step 3: 加入 Canvas 合成裁切**

每次 `drawDot`、`drawSegment` 後，以 `globalCompositeOperation = 'destination-in'` 繪製 Unicode glyph 實心遮罩，再恢復 `source-over`。

- [ ] **Step 4: 調整幼兒描寫筆刷**

滑鼠與 touch 使用能覆蓋粗框的固定筆寬；pen pressure 在較寬範圍內調整，保留 `round` line cap 與 join。

- [ ] **Step 5: 驗證共用流程**

測試注音及數字頁的框內／框外書寫、清除、重寫與下一題，並確認 console 無 error。

- [ ] **Step 6: 建置驗證**

Run: bundled Node 執行 `node_modules/vite/bin/vite.js build`

Expected: exit code 0，Vite 顯示 `built`。

不執行 commit；此資料夾不是 Git repository，且使用者未授權 commit。
