const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// 🌟 1. 讀取並建立作品譯名字典
const seriesDictWorkbook = xlsx.readFile('./excel_data/series_dict.xlsx');
const seriesDictSheet = seriesDictWorkbook.Sheets[seriesDictWorkbook.SheetNames[0]];
const seriesDictData = xlsx.utils.sheet_to_json(seriesDictSheet);

const seriesMap = {};
seriesDictData.forEach(row => {
    if (row['日文原名']) {
        seriesMap[row['日文原名'].trim()] = {
            sort: row['排序'] || 999,
            hk: row['港譯'] || row['日文原名'],
            tw: row['台譯'] || row['日文原名']
        };
    }
});

// 🌟 2. 讀取日文卡表作為「出自作品」的 fallback 來源
const JP_MASTER_PATH = './excel_data/GCG_cardlist_jp.xlsx';
const jpSeriesLookup = {};
if (fs.existsSync(JP_MASTER_PATH)) {
    const jpWb = xlsx.readFile(JP_MASTER_PATH);
    const jpWs = jpWb.Sheets[jpWb.SheetNames[0]];
    const jpData = xlsx.utils.sheet_to_json(jpWs);
    jpData.forEach(row => {
        const id = row['カード番号'];
        const series = row['出典タイトル'];
        if (id && series) jpSeriesLookup[String(id).trim()] = String(series).trim();
    });
    console.log(`📚 日文卡表載入完成：${Object.keys(jpSeriesLookup).length} 筆作品映射`);
} else {
    console.warn(`⚠️ 找不到日文卡表: ${JP_MASTER_PATH}，登場作品將僅依賴 Excel 的「出自作品」欄位`);
}

const HK_EXCEL_PATH = './excel_data/gcg_cardlist_hk.xlsx';
const TW_EXCEL_PATH = './excel_data/gcg_cardlist_tw.xlsx';
const BETA_HK_EXCEL_PATH = './excel_data/gcg_cardlist_beta_hk.xlsx';
const BETA_TW_EXCEL_PATH = './excel_data/gcg_cardlist_beta_tw.xlsx';

const LIMITED_EXCEL_PATH = './excel_data/gcg_cardlist_limited.xlsx';
const PROMO_EXCEL_PATH = './excel_data/gcg_cardlist_promo.xlsx'; 
const YT_EXCEL_PATH = './excel_data/youtube_links.xlsx'; 

const baseMapping = { '卡牌編號': 'id', '稀有度': 'rarity', 'Lv.': 'lv', 'COST': 'cost', '顏色': 'color', '類型': 'type', '地形': 'terrain', 'AP': 'ap', 'HP': 'hp', '收錄彈': 'set' };
const localizedMapping = { '卡牌名稱': 'name', '卡牌效果': 'effect', '特徵': 'traits', '共鳴': 'link' };

function readExcel(filePath, langPrefix, isBeta = false) {
  if (!fs.existsSync(filePath)) { console.warn(`⚠️ 找不到檔案: ${filePath}`); return []; }
  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawJson = xlsx.utils.sheet_to_json(worksheet);

  return rawJson.map(row => {
    let newRow = {};
    
    // 基礎欄位與本地化欄位映射
    for (const key in row) {
      if (baseMapping[key]) newRow[baseMapping[key]] = row[key];
      else if (localizedMapping[key]) newRow[`${localizedMapping[key]}_${langPrefix}`] = row[key];
    }

    // 🌟 查字典並寫入雙語作品名與排序
    // 優先：Excel「出自作品」欄位 → fallback：日文卡表「出典タイトル」
    let sourceSeries = row['出自作品'] ? String(row['出自作品']).trim() : '';
    if ((!sourceSeries || sourceSeries === '-' || sourceSeries === '0') && newRow.id) {
        // 從日文卡表 fallback（用原始 id，不含 _BETA 後綴）
        const lookupId = newRow.id.replace('_BETA', '');
        const jpSeries = jpSeriesLookup[lookupId];
        if (jpSeries) sourceSeries = jpSeries;
    }
    if (sourceSeries && sourceSeries !== '-' && sourceSeries !== '0') {
        newRow.series_source = sourceSeries;
        if (seriesMap[sourceSeries]) {
            newRow.series_hk = seriesMap[sourceSeries].hk;
            newRow.series_tw = seriesMap[sourceSeries].tw;
            newRow.series_sort = seriesMap[sourceSeries].sort;
        } else {
            newRow.series_hk = sourceSeries;
            newRow.series_tw = sourceSeries;
            newRow.series_sort = 999;
        }
    } else {
        newRow.series_source = 'その他';
        newRow.series_hk = '其他';
        newRow.series_tw = '其他';
        newRow.series_sort = 999;
    }

    if (isBeta && newRow.id) {
      newRow.id = `${newRow.id}_BETA`;
      newRow.isBetaCard = true; 
    }
    return newRow;
  });
}

const hkData = readExcel(HK_EXCEL_PATH, 'hk', false);
const twData = readExcel(TW_EXCEL_PATH, 'tw', false);
const betaHkData = readExcel(BETA_HK_EXCEL_PATH, 'hk', true);
const betaTwData = readExcel(BETA_TW_EXCEL_PATH, 'tw', true);

const cardMap = {};
hkData.forEach(card => { if (card.id) cardMap[card.id] = { ...card }; });
twData.forEach(card => {
  if (card.id && cardMap[card.id]) {
    cardMap[card.id].name_tw = card.name_tw; cardMap[card.id].effect_tw = card.effect_tw;
    cardMap[card.id].traits_tw = card.traits_tw; cardMap[card.id].link_tw = card.link_tw;
  }
});
betaHkData.forEach(card => { if (card.id) cardMap[card.id] = { ...card }; });
betaTwData.forEach(card => {
  if (card.id && cardMap[card.id]) {
    cardMap[card.id].name_tw = card.name_tw; cardMap[card.id].effect_tw = card.effect_tw;
    cardMap[card.id].traits_tw = card.traits_tw; cardMap[card.id].link_tw = card.link_tw;
  }
});

// 🌟 核心：讀取 YouTube 連結並寫入本體
if (fs.existsSync(YT_EXCEL_PATH)) {
  const workbook = xlsx.readFile(YT_EXCEL_PATH);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const ytData = xlsx.utils.sheet_to_json(worksheet);
  let ytCount = 0;

  ytData.forEach(row => {
    const id = row['卡牌編號'];
    const url = row['YouTube連結'];
    if (id && url && cardMap[id]) {
      cardMap[id].youtube_url = url;
      ytCount++;
    }
  });
  console.log(`▶️ 成功載入 ${ytCount} 筆 YouTube 卡牌講座連結！`);
} else {
  console.log(`ℹ️ 尚未建立 youtube_links.xlsx，跳過 YT 連結綁定。`);
}

function processSpecialCards(filePath, specialTag) {
  if (!fs.existsSync(filePath)) return;
  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawJson = xlsx.utils.sheet_to_json(worksheet);

  rawJson.forEach(row => {
    const id = row['序號'];             
    const originalRefId = row['卡牌編號']; 
    const rarity = row['稀有度'];       
    const setHk = row['入手情報 [HK]'] || row['入手情報[HK]'] || row['入手情報'];
    const setTw = row['入手情報 [TW]'] || row['入手情報[TW]'] || row['入手情報'];
    // 🌟 擷取 PR/LTD 專屬的覆寫作品
    const overrideSeries = row['出自作品'] ? String(row['出自作品']).trim() : '';

    if (!id || !originalRefId) return;

    let lookupId = originalRefId;
    if (lookupId.startsWith('RP-')) lookupId = 'R-001';
    else if (lookupId.startsWith('EXRP-')) lookupId = 'EXR-001';
    else if (lookupId.startsWith('EXBP-')) lookupId = 'EXB-001';

    const baseCard = cardMap[lookupId];
    if (!baseCard) return;

    const specialCard = {
      ...baseCard, // 先完美繼承母卡的所有資料 (包含母卡的登場作品)
      id: id,
      displayId: originalRefId, 
      rarity: rarity,
      set_hk: setHk,    
      set_tw: setTw,    
      isBetaCard: false 
    };

    // 🌟 覆寫魔法：如果在 PR/LTD 的 Excel 有填寫「出自作品」，就查字典並覆寫母卡資料
    if (overrideSeries && overrideSeries !== '-' && overrideSeries !== '0') {
        specialCard.series_source = overrideSeries;
        if (seriesMap[overrideSeries]) {
            specialCard.series_hk = seriesMap[overrideSeries].hk;
            specialCard.series_tw = seriesMap[overrideSeries].tw;
            specialCard.series_sort = seriesMap[overrideSeries].sort;
        } else {
            specialCard.series_hk = overrideSeries;
            specialCard.series_tw = overrideSeries;
            specialCard.series_sort = 999;
        }
    }

    if (specialTag === 'limited') specialCard.isLimitedCard = true;
    if (specialTag === 'promo') specialCard.isPromoCard = true;

    cardMap[id] = specialCard;
  });
}

processSpecialCards(LIMITED_EXCEL_PATH, 'limited');
processSpecialCards(PROMO_EXCEL_PATH, 'promo');

const finalData = Object.values(cardMap).map(card => {
  if (!card.name_tw) card.name_tw = card.name_hk || '';
  if (!card.effect_tw) card.effect_tw = card.effect_hk || '';
  if (!card.traits_tw) card.traits_tw = card.traits_hk || '';
  if (!card.link_tw) card.link_tw = card.link_hk || '';
  return card;
});

fs.writeFileSync('cards.json', JSON.stringify(finalData, null, 2));
console.log(`✅ 大成功！常規、BETA、特別卡已全數整合完畢，共處理了 ${finalData.length} 張卡片！`);

// 🌟 讀取重印卡作品覆寫表，輸出為 JSON 供 cardDatabase.js 使用
const REPRINT_SERIES_PATH = './excel_data/reprint_series.xlsx';
if (fs.existsSync(REPRINT_SERIES_PATH)) {
  const wb = xlsx.readFile(REPRINT_SERIES_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws);
  const reprintMap = {};
  rows.forEach(row => {
    const imgId = row['重印卡圖片ID'];
    const jpSeries = row['實際重印作品(日文)'];
    if (imgId && jpSeries) {
      const entry = { series_source: jpSeries };
      if (seriesMap[jpSeries]) {
        entry.series_hk = seriesMap[jpSeries].hk;
        entry.series_tw = seriesMap[jpSeries].tw;
        entry.series_sort = seriesMap[jpSeries].sort;
      } else {
        entry.series_hk = jpSeries;
        entry.series_tw = jpSeries;
        entry.series_sort = 999;
      }
      reprintMap[imgId] = entry;
    }
  });
  fs.writeFileSync('./src/data/reprintSeries.json', JSON.stringify(reprintMap, null, 2));
  console.log(`📎 重印卡作品覆寫表已輸出：${Object.keys(reprintMap).length} 筆`);
}