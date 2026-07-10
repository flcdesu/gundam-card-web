// 卡牌資料生成引擎 — 異畫卡與重印卡全自動解構
import rawCardsData from '../../cards.json';
import { cardImages, keywordImages } from '../../imageDictionary';
import reprintSeriesData from './reprintSeries.json';

const generateFullCardDatabase = () => {
  const baseCards = rawCardsData.map(card => {
      let isAlt = false;
      if ((card.isLimitedCard || card.isPromoCard) && card.rarity) {
          if (card.rarity.includes('+') || card.rarity.toUpperCase().includes('SP')) {
              isAlt = true;
          }
      }

      // 🌟 Beta卡完美繼承母卡登場作品邏輯
      let series_hk = card.series_hk;
      let series_tw = card.series_tw;
      let series_source = card.series_source;
      let series_sort = card.series_sort;
      
      if (card.isBetaCard) {
          const baseId = card.id.replace('_BETA', '');
          const baseCard = rawCardsData.find(c => c.id === baseId);
          if (baseCard && (!series_source || series_source === '-' || series_source === '其他' || series_source === 'その他')) {
              series_hk = baseCard.series_hk;
              series_tw = baseCard.series_tw;
              series_source = baseCard.series_source;
              series_sort = baseCard.series_sort;
          }
      }

      return { 
          ...card, 
          series_hk,
          series_tw,
          series_source,
          series_sort,
          _isAltArt: isAlt, 
          _isReprint: false,
          displayId: card.displayId || card.id.replace('_BETA', '')
      };
  });
  
  const generatedCards = [];

  Object.keys(cardImages).forEach(imageKey => {
    if (baseCards.some(c => c.id === imageKey)) return;

    const isReprintToken = imageKey.includes('_RE_');
    let baseId = imageKey;
    let targetSetShort = null;
    let targetSetFull = null; 
    let raritySuffix = null;
    let isAltArt = false;
    let isReprint = false;

    if (isReprintToken) {
      isReprint = true;
      const parts = imageKey.split('_RE_'); 
      baseId = parts[0];
      const rightPart = parts[1]; 
      
      if (rightPart.includes('_')) {
        const subParts = rightPart.split('_'); 
        targetSetShort = subParts[0];
        raritySuffix = subParts.slice(1).join(' '); 
        isAltArt = true;
      } else {
        targetSetShort = rightPart;
      }

      const referenceCard = baseCards.find(c => c.id && c.id.startsWith(`${targetSetShort}-`));
      targetSetFull = referenceCard && referenceCard.set ? referenceCard.set : targetSetShort;
    } 
    else {
      if (imageKey.includes('_BETA_')) {
          isAltArt = true;
          const parts = imageKey.split('_BETA_');
          baseId = parts[0] + '_BETA'; 
          raritySuffix = parts[1].replace(/_/g, ' '); 
      } 
      else if (imageKey.includes('_')) {
        isAltArt = true;
        const parts = imageKey.split('_');
        baseId = parts[0];
        raritySuffix = parts.slice(1).join(' '); 
      }
    }

    const baseCard = baseCards.find(c => c.id === baseId);
    if (baseCard) {
      let finalRarity = baseCard.rarity || "C";
      if (isAltArt && raritySuffix) {
        let displaySuffix = raritySuffix.toUpperCase();
        if (displaySuffix.includes('PLUSPLUS')) displaySuffix = displaySuffix.replace('PLUSPLUS', ' ++');
        else if (displaySuffix.includes('PLUS')) displaySuffix = displaySuffix.replace('PLUS', ' +');
        finalRarity = `${displaySuffix}`;
      }

      // 🌟 終極資料夾覆蓋魔法：從圖片的真實路徑，反查這張卡的實際出處
      let finalSet = isReprint && targetSetFull ? targetSetFull : baseCard.set;
      let finalSetHk = baseCard.set_hk;
      let finalSetTw = baseCard.set_tw;

      const imgPath = cardImages[imageKey];
      // 嘗試從 "/assets/cards/EB01/..." 中精準抓出 "EB01"
      const folderMatch = imgPath ? imgPath.match(/\/cards\/([^\/]+)\//) : null;
      
      if (folderMatch && folderMatch[1]) {
         const folderCode = folderMatch[1]; // 例如 "EB01"
         const basePrefix = baseId.split('-')[0]; // 例如 "ST10"
         
         // 如果這張分身卡，被放在了跟本體不同編號的資料夾裡 (例如 ST10 放在了 EB01 資料夾)
         if (folderCode !== basePrefix) {
            // 找出那個資料夾裡的隨便一張常規卡，完美繼承它的「入手情報」與「中港台譯名」！
            const refCard = baseCards.find(c => c.id && c.id.startsWith(`${folderCode}-`));
            if (refCard) {
               finalSet = refCard.set;
               finalSetHk = refCard.set_hk || refCard.set;
               finalSetTw = refCard.set_tw || refCard.set;
            } else {
               // 萬一這是全新的一彈還沒有常規卡，就直接顯示彈數編號
               finalSet = `[${folderCode}]`;
               finalSetHk = `[${folderCode}]`;
               finalSetTw = `[${folderCode}]`;
            }
         }
      }

      // 🌟 重印卡作品覆寫：查 reprintSeries.json
      const reprintOverride = reprintSeriesData[imageKey];
      const finalSeriesSource = reprintOverride ? reprintOverride.series_source : baseCard.series_source;
      const finalSeriesHk = reprintOverride ? reprintOverride.series_hk : baseCard.series_hk;
      const finalSeriesTw = reprintOverride ? reprintOverride.series_tw : baseCard.series_tw;
      const finalSeriesSort = reprintOverride ? reprintOverride.series_sort : baseCard.series_sort;

      generatedCards.push({
        ...baseCard,
        id: imageKey,                               
        displayId: baseCard.displayId, 
        set: finalSet,
        set_hk: finalSetHk,
        set_tw: finalSetTw,
        rarity: finalRarity,
        series_source: finalSeriesSource,
        series_hk: finalSeriesHk,
        series_tw: finalSeriesTw,
        series_sort: finalSeriesSort,
        _isAltArt: isAltArt,
        _isReprint: isReprint,
        isBetaCard: baseCard.isBetaCard || false,
        isLimitedCard: baseCard.isLimitedCard || false,
        isPromoCard: baseCard.isPromoCard || false
      });
    }
  });

  return [...baseCards, ...generatedCards];
};

const getPrefixOrder = (id) => {
  const match = id.match(/^([A-Za-z]+)/); 
  if (!match) return 999;
  const prefix = match[1].toUpperCase();
  const orderPriority = ['ST', 'GD', 'EB', 'T']; 
  const index = orderPriority.indexOf(prefix);
  return index === -1 ? 999 : index; 
};

const baseCardsData = generateFullCardDatabase();
const cardsData = [...baseCardsData].sort((a, b) => {
  const idA = a.displayId || a.id;
  const idB = b.displayId || b.id;
  if (getPrefixOrder(idA) !== getPrefixOrder(idB)) return getPrefixOrder(idA) - getPrefixOrder(idB);
  
  const idCompare = idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
  if (idCompare !== 0) return idCompare;

  if (a.isBetaCard !== b.isBetaCard) return a.isBetaCard ? 1 : -1;
  if (a._isAltArt !== b._isAltArt) return a._isAltArt ? 1 : -1;
  if (a._isReprint !== b._isReprint) return a._isReprint ? 1 : -1;
  return 0;
});

const rawSets = Array.from(new Set(cardsData.map(c => c.set).filter(Boolean)));
const sortedSets = rawSets.sort((a, b) => {
  const getCode = (str) => {
    const m = str.match(/\[([A-Za-z0-9-]+)\]/);
    return m ? m[1] : str;
  };
  const codeA = getCode(a);
  const codeB = getCode(b);
  
  const prefixOrder = ['ST', 'GD', 'EB', 'T'];
  const getPrefixWeight = (code) => {
    const m = code.match(/^([A-Za-z]+)/);
    if (!m) return 999;
    const idx = prefixOrder.indexOf(m[1].toUpperCase());
    return idx === -1 ? 999 : idx;
  };
  
  const weightA = getPrefixWeight(codeA);
  const weightB = getPrefixWeight(codeB);
  
  if (weightA !== weightB) {
    return weightA - weightB;
  }
  return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
});

export const AVAILABLE_SETS = ['all', ...sortedSets];

export { cardsData, cardImages, keywordImages, rawCardsData };
