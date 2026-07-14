# 描寫區字形遮罩設計

## 目標

讓 Apple Pencil、手指與滑鼠的彩色筆跡只顯示在目前注音或數字的粗框筆畫範圍內。使用者寫到哪裡，框內就顯示到哪裡；超出字形的筆跡立即被裁掉。

## 架構

- 保留現有 `TraceWritingArea` 的背景、十字線、SVG 輪廓、提示點與 Canvas 圖層。
- `DrawingCanvas` 仍接收 Pointer Events，並在每個筆跡片段完成後套用字形遮罩。
- 現階段遮罩以與 SVG guide 相同的 Unicode 字形、字型、尺寸與位置繪製；若題目未來提供 SVG `path`，同一遮罩函式可改用 path。
- Canvas 內部維持高 DPI 縮放，遮罩以 CSS 像素座標計算，避免 iPad Retina 畫面偏移。

## 書寫行為

- Pointer Events、pointer capture、pressure 與 `touch-action: none` 保持不變。
- 筆刷改為較寬的描寫筆刷，滑鼠／手指使用固定寬度，Apple Pencil 依壓力在適合填滿粗框的範圍內變化。
- 每次畫點或線段後使用 Canvas `destination-in` 合成模式，把所有彩色筆跡裁切到字形實心區域。
- `clearSignal`、題目 key 變更與 resize 後的 Canvas 重設仍清除或保存正確內容。

## 驗證

- 框外拖曳後，框外像素保持透明。
- 框內拖曳後，框內像素顯示題目主色。
- 清除、重寫、下一題均清空 Canvas。
- 注音頁與數字頁共用同一行為。
- Vite production build 成功且瀏覽器無相關 console error。

## 範圍

- 不做手寫辨識、正誤判定、後端或資料庫。
- 不建立 AI 圖片字形。
- 不調整首頁、右側圖卡或其他頁面視覺。
