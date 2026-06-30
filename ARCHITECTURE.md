# GCG Web — 架構文件 (更新: 2026-06-27)

## 檔案結構

```
gundam-card-web/
├── App.js                          ← 主元件 (1463 行) — state/handler/filter/JSX
├── index.js                        ← Expo 入口
├── app.json                        ← Expo 設定
├── package.json                    ← 依賴 (Expo 56 + React 19 + RN Web)
├── vercel.json                     ← Vercel rewrites (/card/:id → /)
│
├── src/
│   ├── constants/
│   │   └── index.js                ← 篩選選項常數 (100 行)
│   │       COLOR_OPTIONS, TYPE_OPTIONS, RARITY_OPTIONS, VERSION_OPTIONS,
│   │       RESONANCE_OPTIONS, KEYWORD_OPTIONS, TIMING_OPTIONS,
│   │       STATUS_COLORS_JSON, STATUS_THEME_STYLES, COLOR_TRANSLATION_MAP,
│   │       TYPE_NAME_MAP, OPTIMAL_CARD_WIDTH
│   │
│   ├── data/
│   │   ├── cardDatabase.js         ← 卡牌資料引擎 (201 行)
│   │   │   generateFullCardDatabase() — 異畫/重印/Beta 自動解構
│   │   │   cardsData, AVAILABLE_SETS, cardImages, keywordImages
│   │   └── prices.json             ← 市價資料 (fetchPrices.js 生成)
│   │
│   ├── logic/
│   │   ├── regexPatterns.js        ← 效果文本 Regex 引擎 (33 行)
│   │   │   MASTER_SPLIT_REGEX, IS_SMART_REGEX 等
│   │   └── searchHelpers.js        ← 搜尋輔助 (25 行)
│   │       resolveCardTypes(), getAliasNames()
│   │
│   ├── components/
│   │   ├── InteractiveText.js      ← 效果文本互動渲染引擎 (170 行) ⭐ NEW
│   │   │   renderInteractiveText(text, cardId, actions)
│   │   │   shouldShowResonanceButton(card, language)
│   │   │   接受 actions={ handleKeywordHexClick, handleTokenClick,
│   │   │                  handleExactTokenClick, applyCondition,
│   │   │                  triggerResonanceDirectSearch }
│   │   ├── CardGridItem.js         ← 卡牌縮圖元件 (66 行)
│   │   ├── CardPriceWidget.js      ← 市價顯示元件 (44 行)
│   │   └── RangeTrack.js           ← Lv/Cost/AP/HP 滑軌 (56 行)
│   │
│   └── styles/
│       └── index.js                ← StyleSheet (231 行)
│
├── 資料管線 (Node.js 腳本)
│   ├── excelToJson.js              ← Excel → cards.json
│   ├── fetchPrices.js              ← 爬取駿河屋市價 → yuyu_raw_data.json
│   ├── priceScanner.js             ← 整理市價 → src/data/prices.json
│   ├── generateDict.js             ← 生成 imageDictionary.js
│   ├── compressImages.js           ← Sharp 壓縮卡圖
│   ├── cleanImages.js              ← 清理過期圖片
│   └── fixNames.js                 ← 修正檔名
│
├── excel_data/                     ← 資料來源 (Excel)
│   ├── gcg_cardlist_hk.xlsx        ← 港譯卡表
│   ├── gcg_cardlist_tw.xlsx        ← 台譯卡表
│   ├── gcg_cardlist_beta_hk/tw.xlsx ← Beta 卡
│   ├── gcg_cardlist_limited.xlsx   ← 限定卡
│   ├── gcg_cardlist_promo.xlsx     ← PR 卡
│   ├── fetchprice_links.xlsx       ← 市價爬取連結
│   ├── historical_prices.xlsx      ← 歷史市價
│   ├── series_dict.xlsx            ← 作品譯名字典
│   ├── youtube_links.xlsx          ← YT 影片連結
│   └── reprint_series.xlsx         ← 重印系列
│
├── public/
│   ├── assets/cards/               ← 卡圖 (webp, 按彈分資料夾)
│   ├── assets/special/             ← 限定/PR 卡圖
│   ├── data/                       ← 靜態 JSON (備用, 未來懶加載用)
│   │   ├── cards.json              ← 完整卡牌資料副本
│   │   ├── cards-index.json        ← 輕量索引 (無效果文本)
│   │   └── sets/*.json             ← 按收錄彈拆分的資料
│   └── index.html
│
├── cards.json                      ← 生成物 (excelToJson.js 輸出)
├── imageDictionary.js              ← 生成物 (generateDict.js 輸出)
└── yuyu_raw_data.json              ← 生成物 (fetchPrices.js 輸出)
```

## 功能特點

### 路由
- `/card/:id` — 單卡永久連結 (vercel.json rewrite → SPA, App.js 讀 URL)
- `window.history.replaceState` 更新 URL

### 市價系統
- `fetchPrices.js` — 爬取駿河屋 (axios + cheerio)
- `priceScanner.js` — 整理為 `src/data/prices.json`
- `CardPriceWidget.js` — 顯示 ￥ 價格

### 資料管線指令
```bash
npm run update-data      # Excel → cards.json
npm run update-assets    # 修名 + 壓縮 + 生成字典
npm run update-prices    # 爬取 + 整理市價
npm run build            # expo export --platform web
```

## Import 依賴圖

```
App.js
  ├── src/styles/
  ├── src/constants/
  ├── src/data/cardDatabase.js
  │     ├── ../../cards.json (static import, bundled)
  │     └── ../../imageDictionary.js
  ├── src/data/prices.json (via CardPriceWidget)
  ├── src/logic/regexPatterns.js
  ├── src/logic/searchHelpers.js
  │     └── src/constants/
  ├── src/components/InteractiveText.js  ⭐
  │     ├── src/styles/
  │     ├── src/constants/ (STATUS_COLORS_JSON)
  │     └── src/logic/regexPatterns.js
  ├── src/components/CardGridItem.js
  ├── src/components/CardPriceWidget.js
  └── src/components/RangeTrack.js
```

## 未來拆分建議

App.js 還有 1463 行，可繼續拆出：
1. **FilterPanel.js** (~315 行) — 篩選面板 UI，需傳入 20+ state/setter
2. **CardDetailModal.js** (~190 行) — 卡牌詳細 Modal
3. **useFilterState.js** — 自訂 hook 整合所有篩選 state

建議先建立 React Context 或 useReducer 整合 state，再拆分 UI 元件。
