// 卡牌資料生成引擎 — 異畫卡與重印卡全自動解構
import rawCardsData from '../../cards.json';
import { cardImages, keywordImages } from '../../imageDictionary';

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

      generatedCards.push({
        ...baseCard,
        id: imageKey,                               
        displayId: baseCard.displayId, 
        set: isReprint ? targetSetFull : baseCard.set, 
        rarity: finalRarity,
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
