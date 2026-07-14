# 字嗨注音字型整合設計

## 目標

將 App 內所有一般注音文字統一改用使用者提供的 `BpmfZihiOnly-R.ttf`，保留現有兒童介面、逐筆 SVG 描寫路徑、Canvas 書寫與筆順遮罩。

## 字型使用方式

- 從 `BpmfSpecial.zip` 取出 `BpmfZihiOnly-R.ttf`。
- 字型放在 `src/assets/fonts/`，以本機 `@font-face` 載入，不依賴外部 CDN。
- 注音專用 font family 命名為 `Bpmf Zihi Only`。
- 套用範圍包括首頁注音符號、注音選單、小注音讀音、家長模式注音，以及其他程式文字呈現的注音符號。
- 一般中文詞語、標題、按鈕與數字維持現有字型。

## 描寫練習區

- 中央描寫字形繼續使用目前 37 個符號的逐筆 SVG center path。
- 不以字型 glyph 取代 SVG path，避免破壞筆順、獨立筆畫遮罩、防溢色及 Apple Pencil 填色功能。
- `BpmfZihiBox-R.ttf` 本次不匯入、不使用。

## 授權

- 將 ZIP 內 `LICENSE-2.0.txt`、`LICENSE-Gen.txt`、`NOTICE.txt` 一併保存於字型資產目錄。
- 不修改字型檔內容或字型名稱。

## 驗證

- Vite production build 成功。
- 瀏覽器確認 `Bpmf Zihi Only` 已實際載入。
- 檢查首頁、注音選單、右側小注音及家長模式。
- 檢查 Canvas、逐筆切換與 `touch-action: none` 未受影響。
