const xlsx = require('xlsx');
const fs = require('fs');

const HK_EXCEL_PATH = './excel_data/gcg_cardlist_hk.xlsx';
const TW_EXCEL_PATH = './excel_data/gcg_cardlist_tw.xlsx';
const BETA_HK_EXCEL_PATH = './excel_data/gcg_cardlist_beta_hk.xlsx';
const BETA_TW_EXCEL_PATH = './excel_data/gcg_cardlist_beta_tw.xlsx';

const LIMITED_EXCEL_PATH = './excel_data/gcg_cardlist_limited.xlsx';
const PROMO_EXCEL_PATH = './excel_data/gcg_cardlist_promo.xlsx'; 
// 🌟 新增 YouTube 連結 Excel 路徑
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
    for (const key in row) {
      if (baseMapping[key]) newRow[baseMapping[key]] = row[key];
      else if (localizedMapping[key]) newRow[`${localizedMapping[key]}_${langPrefix}`] = row[key];
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
    // 支援直接綁定常規卡，也支援明確綁定 Beta 卡
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

    if (!id || !originalRefId) return;

    let lookupId = originalRefId;
    if (lookupId.startsWith('RP-')) lookupId = 'R-001';
    else if (lookupId.startsWith('EXRP-')) lookupId = 'EXR-001';
    else if (lookupId.startsWith('EXBP-')) lookupId = 'EXB-001';

    const baseCard = cardMap[lookupId];
    if (!baseCard) return;

    const specialCard = {
      ...baseCard, // 這裡會連同 youtube_url 一起完美拷貝！
      id: id,
      displayId: originalRefId, 
      rarity: rarity,
      set_hk: setHk,    
      set_tw: setTw,    
      isBetaCard: false 
    };

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