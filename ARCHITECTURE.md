# GCG Web — 架構重構紀錄 (2026-06-26)

## 概要

原本整個網站的前端邏輯全部集中在單一 `App.js`（2083 行），已完成模組化拆分。
**功能零改變**，純結構重組。Build 驗證通過（`npx expo export --platform web` ✅）。

## 新的檔案結構

```
gundam-card-web/
├── App.js                      ← 主元件 (1509 行，含 App function + 所有 state/handler/JSX)
│
├── src/
│   ├── constants/
│   │   └── index.js            ← 所有篩選選項常數 (100 行)
│   │       COLOR_OPTIONS, TYPE_OPTIONS, RARITY_OPTIONS, VERSION_OPTIONS,
│   │       RESONANCE_OPTIONS, KEYWORD_OPTIONS, TIMING_OPTIONS,
│   │       STATUS_COLORS_JSON, STATUS_THEME_STYLES,
│   │       COLOR_TRANSLATION_MAP, TYPE_NAME_MAP, OPTIMAL_CARD_WIDTH
│   │
│   ├── data/
│   │   └── cardDatabase.js     ← 卡牌資料生成引擎 (169 行)
│   │       generateFullCardDatabase()  — 異畫卡/重印卡/Beta卡自動解構
│   │       cardsData (排序後的完整卡牌陣列)
│   │       AVAILABLE_SETS (收錄彈選單)
│   │       re-export: cardImages, keywordImages, rawCardsData
│   │
│   ├── logic/
│   │   ├── regexPatterns.js    ← 效果文本 Regex 引擎 (33 行)
│   │   │   MASTER_SPLIT_REGEX, INNER_SPLIT_REGEX,
│   │   │   IS_SMART_REGEX, IS_SELF_RESONANCE_REGEX 等所有 pattern
│   │   │
│   │   └── searchHelpers.js    ← 搜尋輔助函數 (25 行)
│   │       resolveCardTypes(rawTypeStr)  — 中文類型名 → 內部類型值
│   │       getAliasNames(cardObj, lang)  — 取得卡牌別名
│   │
│   ├── components/
│   │   ├── CardGridItem.js     ← 單張卡牌縮圖元件 (37 行)
│   │   └── RangeTrack.js       ← Lv/Cost/AP/HP 數值滑軌元件 (56 行)
│   │
│   └── styles/
│       └── index.js            ← StyleSheet.create 樣式定義 (202 行)
│
├── cards.json                  ← excelToJson.js 生成的卡牌資料
├── imageDictionary.js          ← generateDict.js 生成的卡圖 URL 字典
├── excelToJson.js              ← Excel → JSON 資料管線 (未變動)
├── excel_data/                 ← 原始 Excel 資料 (未變動)
├── public/assets/cards/        ← 卡圖素材 (未變動)
└── App.js.bak                  ← 重構前的完整備份
```

## Import 依賴關係

```
App.js
  ├── src/styles/index.js           (StyleSheet)
  ├── src/constants/index.js        (篩選選項常數)
  ├── src/data/cardDatabase.js      (cardsData, cardImages, AVAILABLE_SETS)
  │     ├── ../../cards.json
  │     └── ../../imageDictionary.js
  ├── src/logic/regexPatterns.js    (效果文本 Regex)
  ├── src/logic/searchHelpers.js    (resolveCardTypes, getAliasNames)
  │     └── src/constants/index.js
  ├── src/components/CardGridItem.js
  │     ├── src/data/cardDatabase.js (cardImages)
  │     └── src/styles/index.js
  └── src/components/RangeTrack.js
        └── src/styles/index.js
```

## 各模組職責

| 模組 | 職責 | 修改時機 |
|------|------|----------|
| `src/constants/` | 篩選器的選項定義（顏色、種類、稀有度等） | 新增篩選選項時 |
| `src/data/cardDatabase.js` | 卡牌資料載入、異畫/重印解構、排序 | 修改卡牌資料結構時 |
| `src/logic/regexPatterns.js` | 效果文本解析 Regex | 新增中文語法解析時 |
| `src/logic/searchHelpers.js` | 類型名稱映射、別名解析 | 新增卡牌類型或別名規則時 |
| `src/components/CardGridItem.js` | 卡牌網格縮圖 | 修改縮圖顯示邏輯時 |
| `src/components/RangeTrack.js` | 數值範圍選擇器 | 修改滑軌 UI 時 |
| `src/styles/` | 所有 StyleSheet 定義 | 修改樣式時 |
| `App.js` | 主元件：state 管理、篩選邏輯、Modal、搜尋、JSX 組裝 | 功能變更時 |

## 未變動的部分

- `excelToJson.js` — Excel → JSON 資料管線
- `generateDict.js` / `generateImageDict.js` — 圖片字典生成
- `cleanImages.js` / `compressImages.js` — 圖片處理工具
- `excel_data/` — 所有 Excel 資料來源
- `public/assets/` — 所有圖片素材
- `package.json` — 依賴與腳本
- `app.json` — Expo 設定
- `index.js` — 入口點

## 補充說明

- `App.js` 仍然保留了所有 useState、handler、篩選邏輯和 JSX。
  未來可以進一步拆分為 `hooks/useFilterState.js`（state 管理）、
  `components/FilterPanel.js`（篩選面板）、`components/CardDetailModal.js`（詳細 Modal）等。
- `App.js.bak` 是重構前的完整備份，確認穩定後可刪除。
