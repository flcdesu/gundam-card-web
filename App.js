import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, SafeAreaView, FlatList, TouchableOpacity, Image, Modal, ScrollView, Dimensions, Linking, TouchableWithoutFeedback } from 'react-native';
import rawCardsData from './cards.json'; 
import { cardImages, keywordImages } from './imageDictionary'; 
const safeKeywordImages = keywordImages || {};

// ====================================================
// 🌟 核心魔法：異畫卡與重印卡全自動解構分身術
// ====================================================
const generateFullCardDatabase = () => {
  const baseCards = rawCardsData.map(card => {
      let isAlt = false;
      if ((card.isLimitedCard || card.isPromoCard) && card.rarity) {
          if (card.rarity.includes('+') || card.rarity.toUpperCase().includes('SP')) {
              isAlt = true;
          }
      }
      return { 
          ...card, 
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

const AVAILABLE_SETS = ['all', ...sortedSets];
const OPTIMAL_CARD_WIDTH = 220;

const STATUS_COLORS_JSON = Object.freeze({
  "搭乘時": "status_bg_pink", "搭乘中": "status_bg_pink", "共鳴中": "status_bg_yellow", "共鳴時": "status_bg_yellow",
  "攻擊時": "status_bg_lightblue", "破壞時": "status_bg_lightblue", "配置時": "status_bg_lightblue",
  "啟動・主要": "status_bg_blue", "啟動・瞬動": "status_bg_blue", "每回合1次": "status_bg_red", "爆發": "status_bg_orange",
  "主要": "status_bg_blue", "瞬動": "status_bg_blue", "啟動": "status_bg_blue", "DEFAULT": "status_bg_DEFAULT"
});
const STATUS_THEME_STYLES = Object.freeze({
  "status_bg_pink": { bg: '#cd6e99' }, "status_bg_yellow": { bg: '#faee01' }, "status_bg_lightblue": { bg: '#77b8bb' }, 
  "status_bg_blue": { bg: '#68ade1' }, "status_bg_red": { bg: '#a2131d' }, "status_bg_orange": { bg: '#d78604' }, "status_bg_DEFAULT": { bg: '#f1f5f9' }   
});

const COLOR_OPTIONS = Object.freeze([
  { label: '全部', value: 'all', activeBg: '#334155', activeText: '#fff' },
  { label: '藍', value: 'Blue', activeBg: '#0070b9', activeText: '#fff' },
  { label: '綠', value: 'Green', activeBg: '#63a63d', activeText: '#fff' },
  { label: '紅', value: 'Red', activeBg: '#be0453', activeText: '#fff' },
  { label: '紫', value: 'Purple', activeBg: '#744b92', activeText: '#fff' },
  { label: '白', value: 'White', activeBg: '#cbd5e1', activeText: '#0f172a' }, 
]);
const COLOR_TRANSLATION_MAP = Object.freeze({ 'Blue': '藍', 'Red': '紅', 'Green': '綠', 'Yellow': '黃', 'Purple': '紫', 'White': '白', 'Black': '黑' });

const TYPE_OPTIONS = Object.freeze([
  { label: '全部', value: 'all', activeBg: '#334155', activeText: '#fff' },
  { label: 'UNIT', value: 'UNIT', activeBg: '#334155', activeText: '#fff' },
  { label: 'PILOT', value: 'PILOT', activeBg: '#334155', activeText: '#fff' },
  { label: 'COMMAND', value: 'COMMAND', activeBg: '#334155', activeText: '#fff' },
  { label: 'COMMAND【PILOT】', value: 'COMMAND_PILOT', activeBg: '#334155', activeText: '#fff' }, 
  { label: 'BASE', value: 'BASE', activeBg: '#334155', activeText: '#fff' },
  { label: 'UNIT TOKEN', value: 'TOKEN', activeBg: '#334155', activeText: '#fff' }, 
  { label: 'RESOURCE', value: 'RESOURCE', activeBg: '#334155', activeText: '#fff' }, 
  { label: 'EX BASE', value: 'EX BASE', activeBg: '#334155', activeText: '#fff' }, 
  { label: 'EX RESOURCE', value: 'EX RESOURCE', activeBg: '#334155', activeText: '#fff' }, 
]);

const RARITY_OPTIONS = Object.freeze([
  { label: '全部', value: 'all', activeBg: '#334155', activeText: '#fff' },
  { label: 'C', value: 'C', activeBg: '#64748b', activeText: '#fff' },
  { label: 'U', value: 'U', activeBg: '#10b981', activeText: '#fff' },
  { label: 'R', value: 'R', activeBg: '#3b82f6', activeText: '#fff' },
  { label: 'LR', value: 'LR', activeBg: '#8b5cf6', activeText: '#fff' },
  { label: 'P', value: 'P', activeBg: '#f59e0b', activeText: '#fff' },
]);

const VERSION_OPTIONS = Object.freeze([
  { label: '全部', value: 'all', activeBg: '#334155', activeText: '#fff' },
  { label: '普畫', value: 'Normal', activeBg: '#2563eb', activeText: '#fff' }, 
  { label: '異畫 (全開)', value: 'Alt', activeBg: '#d97706', activeText: '#fff' },   
  { label: '異畫 +', value: 'Alt_Plus', activeBg: '#b45309', activeText: '#fff' },   
  { label: '異畫 ++', value: 'Alt_PlusPlus', activeBg: '#92400e', activeText: '#fff' },   
  { label: '異畫 (SP)', value: 'Alt_SP', activeBg: '#78350f', activeText: '#fff' },   
]);

const RESONANCE_OPTIONS = Object.freeze([
  { label: '全部', value: 'all', activeBg: '#334155', activeText: '#fff' },
  { label: '有', value: 'yes', activeBg: '#334155', activeText: '#fff' },
  { label: '無', value: 'no', activeBg: '#334155', activeText: '#fff' },
]);

const KEYWORD_OPTIONS = Object.freeze([
  { label: '全部', value: 'all', activeBg: '#334155', activeText: '#fff' },
  { label: '爆發', value: '爆發', activeBg: '#334155', activeText: '#fff' },
  { label: '修復', value: '修復', activeBg: '#334155', activeText: '#fff' },
  { label: '阻擋者', value: '阻擋者', activeBg: '#334155', activeText: '#fff' },
  { label: '突破', value: '突破', activeBg: '#334155', activeText: '#fff' },
  { label: '高機動', value: '高機動', activeBg: '#334155', activeText: '#fff' },
  { label: '支援', value: '支援', activeBg: '#334155', activeText: '#fff' },
  { label: '先制攻擊', value: '先制攻擊', activeBg: '#334155', activeText: '#fff' },
  { label: '壓制', value: '壓制', activeBg: '#334155', activeText: '#fff' },
]);

const TIMING_OPTIONS = Object.freeze([
  { label: '全部', value: 'all', activeBg: '#334155', activeText: '#fff' },
  { label: '配置時', value: '配置時', activeBg: '#77b8bb', activeText: '#000' },
  { label: '搭乘時', value: '搭乘時', activeBg: '#cd6e99', activeText: '#000' },
  { label: '搭乘中', value: '搭乘中', activeBg: '#cd6e99', activeText: '#000' },
  { label: '共鳴時', value: '共鳴時', activeBg: '#faee01', activeText: '#000' },
  { label: '共鳴中', value: '共鳴中', activeBg: '#faee01', activeText: '#000' },
  { label: '啟動', value: '啟動', activeBg: '#68ade1', activeText: '#000' },
  { label: '攻擊時', value: '攻擊時', activeBg: '#77b8bb', activeText: '#000' },
  { label: '破壞時', value: '破壞時', activeBg: '#77b8bb', activeText: '#000' },
]);

const TYPE_NAME_MAP = Object.freeze({ 
  '機體': ['UNIT'], 'unit': ['UNIT'],
  '機師': ['PILOT', 'COMMAND_PILOT'], 'pilot': ['PILOT', 'COMMAND_PILOT'],
  '指令': ['COMMAND'], 'command': ['COMMAND'],
  '據點': ['BASE'], 'base': ['BASE'],
  '代幣': ['TOKEN'], 'token': ['TOKEN'],
  '資源': ['RESOURCE'], 'resource': ['RESOURCE'],
  'ex據點': ['EX BASE'], 'ex base': ['EX BASE'],
  'ex資源': ['EX RESOURCE'], 'ex resource': ['EX RESOURCE'],
  '卡牌': ['UNIT', 'PILOT', 'COMMAND', 'BASE'], 
  '卡': ['UNIT', 'PILOT', 'COMMAND', 'BASE'] 
});

const resolveCardTypes = (rawTypeStr) => {
  const s = rawTypeStr.toLowerCase().replace(/共鳴/g, '').trim();
  if (s === '機師' || s === 'pilot' || s === '駕駛員') return ['PILOT', 'COMMAND_PILOT'];
  if (s === '機師卡' || s === '機師卡牌' || s === 'pilot卡' || s === 'pilot卡牌' || s === '駕駛員卡' || s === '駕駛員卡牌') return ['PILOT'];
  if (s === '機體' || s === 'unit') return ['UNIT', 'TOKEN'];
  if (s === '機體卡' || s === '機體卡牌' || s === 'unit卡' || s === 'unit卡牌') return ['UNIT'];
  if (s === '指令卡' || s === '指令卡牌' || s === 'command卡' || s === 'command卡牌') return ['COMMAND'];
  if (s === '基地卡' || s === '基地卡牌' || s === '據點卡' || s === '據點卡牌') return ['BASE'];
  if (s === '機體替代卡' || s === '替代卡' || s === '代幣' || s === 'token') return ['TOKEN'];
  return TYPE_NAME_MAP[s] || [s.toUpperCase()];
};

const getAliasNames = (cardObj, lang) => {
  const names = [];
  if (cardObj[`name_${lang}`]) names.push(cardObj[`name_${lang}`]);
  const effect = cardObj[`effect_${lang}`] || '';
  const match = effect.match(/【機師】([^\s\n\r、。，！：:（\(]+)/);
  if (match) names.push(match[1].trim());
  const aliasMatch = effect.match(/卡牌名也可視為「([^」]+)」/);
  if (aliasMatch) names.push(aliasMatch[1].trim());
  return names;
};

const SINGLE_TARGET = "(?:機體替代卡|替代卡|機體卡牌|機體卡|機體|機師卡牌|機師卡|機師|角色卡牌|角色卡|角色|駕駛員卡牌|駕駛員卡|駕駛員|指令卡牌|指令卡|指令|據點卡牌|據點卡|據點|基地卡牌|基地卡|基地|UNIT\\s*TOKEN|UNIT|PILOT|COMMAND|BASE|TOKEN|代幣|資源卡牌|資源卡|資源|RESOURCE|EX\\s*BASE|EX\\s*據點|EX\\s*RESOURCE|EX\\s*資源|卡牌(?!名稱)|卡(?!組|牌名稱|名稱))";
const TARGET_TYPES = `(?:(?:共鳴)?${SINGLE_TARGET}(?:\\s*[/／]\\s*(?:共鳴)?${SINGLE_TARGET}(?!\\s*名稱))*)`;
const TRAIT_GROUP = "(?:〔[^〕]+〕(?:\\s*[\\/／]\\s*〔[^〕]+〕)*)";
const STAT_COND = "(?:(?:HP|AP|Lv\\.?|COST|等級)\\s*(?:為)?\\s*(?:不大於|不高於|不超過|小於等於|不小於|不低於|大於等於|<=|>=|<|>|=)?\\s*(?:Lv\\.?\\s*)?\\d+\\s*(?:或更高等級|或高等級|或更高|或更低|或以下|或以上|以下|以上)?)";
const NAME_COND = "(?:卡牌名稱中(?:包含|不包含)「[^」]+」(?:的\\s*|之\\s*)?)";
const KEYWORD_COND = "(?:擁有《[^》]+》效果(?:的\\s*|之\\s*|且\\s*)?)"; 
const STATUS_WORD_COND = "(?:擁有【[^】]+】效果(?:的\\s*|之\\s*|且\\s*)?)"; 
const COLOR_COND = "(?:(?:藍|紅|綠|黃|紫|白|黑)介的?\\s*|(?:藍|紅|綠|黃|紫|白|黑)色的?\\s*)"; 
const FACTION_COND = "(?:(?:我方|對方|雙方|友方|敵方)\\s*)"; 
const EXCLUDE_COND = `(?:(?:[^，。、]+此(?:機體|角色|卡|卡牌)以外[的且]|${TARGET_TYPES}以外[的且])\\s*)`; 
const RIDING_COND = "(?:搭乘(?:此|該)(?:機體|角色|卡牌|卡)的\\s*)";
const PLAYER_LV_COND = "(?:若)?(?:我方|對方)(?:的等級)?(?:為)?\\s*(?:Lv\\.?\\s*)?\\d+\\s*(?:或更高等級|或高等級|或更高|或更低|或以下|或以上|以下|以上)?";
const SMART_PREFIX = `(?:(?:${TRAIT_GROUP}\\s*的?\\s*)?${STAT_COND}\\s*(?:的\\s*)?|${NAME_COND}|${KEYWORD_COND}|${STATUS_WORD_COND}|${COLOR_COND}|${FACTION_COND}|${RIDING_COND}|${TRAIT_GROUP}\\s*(?:的\\s*)?|${EXCLUDE_COND})`;
const SMART_COND_STR = `(?:${SMART_PREFIX}+${TARGET_TYPES}(?:共鳴)?)`;
const SELF_COMPLEX_COND_STR = `此${SINGLE_TARGET}(?:受到過傷害且|在戰鬥中且)${STAT_COND}`;
const PURE_RESONANCE_TARGET = `(?:共鳴${SINGLE_TARGET}(?:\\s*[/／]\\s*(?:共鳴)?${SINGLE_TARGET})*|${SINGLE_TARGET}共鳴)`;
const SELF_RESONANCE_STR = `此(?:機體|機師|角色|指令|卡牌|卡(?!組))(?:為|作為)共鳴(?:機體|機師|角色|指令|卡牌|卡(?!組))?`;
const SELF_TRAIT_STR = `(?:若)?此(?:${SINGLE_TARGET})(?:為|變成|擁有|具有)?\\s*${TRAIT_GROUP}`;
const SELF_COLOR_STR = `此(?:${SINGLE_TARGET})(?:若為|為)(?:藍色|紅色|綠色|黃色|紫色|白色|黑色)`;
const TOKEN_REGEX = `「[^」]+」[（\\(][^）\\)]+[）\\)](?:的機體替代卡)?`;

const MASTER_SPLIT_REGEX = new RegExp(`(${SMART_COND_STR}|${SELF_COMPLEX_COND_STR}|${SELF_RESONANCE_STR}|${SELF_TRAIT_STR}|${SELF_COLOR_STR}|${PURE_RESONANCE_TARGET}|${TOKEN_REGEX}|「[^」]+」|【[^】]+】|《[^》]+》|〔[^〕]+〕|${PLAYER_LV_COND}|${STAT_COND})`, 'gi');
const INNER_SPLIT_REGEX = new RegExp(`(${SMART_COND_STR}|${SELF_COMPLEX_COND_STR}|${SELF_RESONANCE_STR}|${SELF_TRAIT_STR}|${SELF_COLOR_STR}|${PURE_RESONANCE_TARGET}|${TOKEN_REGEX}|「[^」]+」|【[^】]+】|《[^》]+》|〔[^〕]+〕|${PLAYER_LV_COND}|${STAT_COND})`, 'gi');
const IS_SMART_REGEX = new RegExp(`^${SMART_COND_STR}$`, 'i');
const IS_PURE_RESONANCE_REGEX = new RegExp(`^${PURE_RESONANCE_TARGET}$`, 'i');
const IS_SELF_RESONANCE_REGEX = new RegExp(`^${SELF_RESONANCE_STR}$`, 'i');
const IS_SELF_TRAIT_REGEX = new RegExp(`^${SELF_TRAIT_STR}$`, 'i');
const IS_SELF_COLOR_REGEX = new RegExp(`^${SELF_COLOR_STR}$`, 'i');
const IS_SELF_COMPLEX_REGEX = new RegExp(`^${SELF_COMPLEX_COND_STR}$`, 'i');
const IS_STAT_COND_REGEX = new RegExp(`^${STAT_COND}$`, 'i');
const IS_PLAYER_LV_REGEX = new RegExp(`^${PLAYER_LV_COND}$`, 'i'); 

const CardGridItem = ({ item, dynamicCardWidth, language, onPress, isMobile }) => {
  const [isHovered, setIsHovered] = useState(false);
  const displayName = item[`name_${language}`] || '名稱未定';
  const infoBackgroundColor = item.color === 'Blue' ? '#e6f3ff' : item.color === 'Red' ? '#fff1f1' : item.color === 'Green' ? '#f0fff4' : '#fff'; 
  const displayId = item.displayId || item.id;

  return (
    <TouchableOpacity 
      style={[styles.gridCard, { width: dynamicCardWidth }, isMobile && { margin: 3 }, isHovered && styles.gridCardHovered]} 
      onPress={() => onPress(item)} activeOpacity={0.9} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
    >
      <View style={[styles.imageWrapper, { height: dynamicCardWidth * 1.39 }]}>
        {cardImages[item.id] ? <Image source={{ uri: cardImages[item.id] }} style={styles.gridImage} resizeMode="cover" /> : <View style={styles.gridNoImage}><Text style={styles.gridNoImageText}>圖片準備中</Text></View>}
      </View>
      <View style={[styles.gridCardInfo, { backgroundColor: infoBackgroundColor, padding: isMobile ? 4 : 6 }]}>
        <View style={styles.gridIdRow}>
          <Text style={[styles.gridCardId, isMobile && { fontSize: 9 }]} numberOfLines={1}>{displayId}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {item.isBetaCard && <Text style={[styles.gridBetaBadge, isMobile && { fontSize: 7, paddingHorizontal: 2 }]}>BETA</Text>}
            {item.isLimitedCard && <Text style={[styles.gridLimitedBadge, isMobile && { fontSize: 7, paddingHorizontal: 2 }, item.isBetaCard && { marginLeft: 4 }]}>LTD</Text>}
            {item.isPromoCard && <Text style={[styles.gridPromoBadge, isMobile && { fontSize: 7, paddingHorizontal: 2 }, (item.isBetaCard || item.isLimitedCard) && { marginLeft: 4 }]}>PR</Text>}
            {item._isReprint && <Text style={[styles.gridReprintBadge, isMobile && { fontSize: 7, paddingHorizontal: 2 }, (item.isBetaCard || item.isLimitedCard || item.isPromoCard) && { marginLeft: 4 }]}>RE</Text>}
            {item._isAltArt && <Text style={[styles.gridAltBadge, isMobile && { fontSize: 7, paddingHorizontal: 2 }, (item._isReprint || item.isBetaCard || item.isLimitedCard || item.isPromoCard) && { marginLeft: 4 }]}>異</Text>}
          </View>
        </View>
        <Text style={[styles.gridCardName, isMobile && { fontSize: 10 }]} numberOfLines={1}>{displayName}</Text>
      </View>
    </TouchableOpacity>
  );
};

const RangeTrack = ({ label, range, setRange, minVal = 0, maxVal = 9, onReset, isMobile }) => {
  const numbers = Array.from({ length: maxVal - minVal + 1 }, (_, i) => minVal + i);
  const isOffset = !numbers.includes(0);
  const isFullRange = range[0] === minVal && range[1] === maxVal;

  const handleNumberClick = (num) => {
    if (isFullRange) setRange([minVal, num]);
    else if (range[0] === minVal && range[1] === num) setRange([num, num]);
    else if (range[0] === num && range[1] === num) setRange([num, num]);
    else if (range[0] === range[1] && num !== range[0]) setRange([Math.min(range[0], num), Math.max(range[0], num)]);
    else if (range[0] === minVal && range[1] !== maxVal) setRange([minVal, num]);
    else setRange([minVal, num]);
  };

  return (
    <View style={styles.rangeTrackContainer}>
      <Text style={styles.rangeTrackLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
        {isMobile ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.rangeTrackBox, isOffset && { marginLeft: 28 }]}>
            {numbers.map(num => {
              const inRange = !isFullRange && (num >= range[0] && num <= range[1]);
              const isFirstActive = !isFullRange && (num === range[0]);
              const isLastActive = !isFullRange && (num === range[1]);
              return (
                <TouchableOpacity key={num} style={[styles.rangeNumberCell, inRange && styles.rangeNumberCellActive, isFirstActive && styles.rangeCellFirst, isLastActive && styles.rangeCellLast]} onPress={() => handleNumberClick(num)} activeOpacity={0.8}>
                  <Text style={[styles.rangeNumberText, inRange && styles.rangeNumberTextActive]}>{num}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={[styles.rangeTrackBox, isOffset && { marginLeft: 28 }]}>
            {numbers.map(num => {
              const inRange = !isFullRange && (num >= range[0] && num <= range[1]);
              const isFirstActive = !isFullRange && (num === range[0]);
              const isLastActive = !isFullRange && (num === range[1]);
              return (
                <TouchableOpacity key={num} style={[styles.rangeNumberCell, inRange && styles.rangeNumberCellActive, isFirstActive && styles.rangeCellFirst, isLastActive && styles.rangeCellLast]} onPress={() => handleNumberClick(num)} activeOpacity={0.8}>
                  <Text style={[styles.rangeNumberText, inRange && styles.rangeNumberTextActive]}>{num}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.trackResetBtn} onPress={onReset} activeOpacity={0.7}><Text style={styles.trackResetBtnText}>↺</Text></TouchableOpacity>
    </View>
  );
};

export default function App() {
  const [searchText, setSearchText] = useState('');
  const [selectedSet, setSelectedSet] = useState('all'); 
  const [isSetDropdownOpen, setIsSetDropdownOpen] = useState(false); 

  const [selectedCard, setSelectedCard] = useState(null);
  const [lastState, setLastState] = useState(null);

  const flatListRef = useRef(null);
  const modalScrollRef = useRef(null); 
  const [currentScrollY, setCurrentScrollY] = useState(0);
  const [pendingScrollY, setPendingScrollY] = useState(null);
  
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const panelSwipeStartY = useRef(null);
  // 🌟 新增：用於面板底部拉把的手勢偵測
  const bottomSwipeStartY = useRef(null);

  const [language, setLanguage] = useState('hk'); 
  const [selectedColors, setSelectedColors] = useState(['all']);
  const [selectedTypes, setSelectedTypes] = useState(['all']);
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [selectedVersions, setSelectedVersions] = useState(['Normal']); 
  
  const [includeRegular, setIncludeRegular] = useState(true);
  const [includeBeta, setIncludeBeta] = useState(false);
  const [includeReprint, setIncludeReprint] = useState(false);
  const [includeLimited, setIncludeLimited] = useState(false);
  const [includePromo, setIncludePromo] = useState(false);

  const [selectedResonance, setSelectedResonance] = useState('all'); 
  const [resonanceMatchId, setResonanceMatchId] = useState('');
  
  const [selectedKeywords, setSelectedKeywords] = useState(['all']); 
  const [selectedTimings, setSelectedTimings] = useState(['all']); 

  const [supportValue, setSupportValue] = useState('');     
  const [breakthroughValue, setBreakthroughValue] = useState(''); 
  const [repairValue, setRepairValue] = useState(''); 
  const [traitSearchText, setTraitSearchText] = useState(''); 
  const [isTraitExactMatch, setIsTraitExactMatch] = useState(false); 

  const [lvRange, setLvRange] = useState([0, 9]);
  const [costRange, setCostRange] = useState([0, 9]);
  const [apRange, setApRange] = useState([0, 9]); 
  const [hpRange, setHpRange] = useState([0, 9]); 

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => setScreenWidth(window.width));
    return () => subscription?.remove();
  }, []);

  const isMobile = screenWidth < 768;
  const numColumns = isMobile ? 4 : Math.max(2, Math.floor(screenWidth / OPTIMAL_CARD_WIDTH));
  const paddingSpace = isMobile ? 10 : 20;
  const marginSpace = isMobile ? (numColumns * 6) : (numColumns * 10);
  const dynamicCardWidth = (screenWidth - paddingSpace - marginSpace) / numColumns;

  useEffect(() => {
    if (selectedCard && modalScrollRef.current) {
      modalScrollRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [selectedCard]);

  const handleResetSearch = () => {
    setSearchText(''); setSelectedSet('all');
  };
  
  const handleResetFilters = () => {
    setLvRange([0, 9]); setCostRange([0, 9]); setApRange([0, 9]); setHpRange([0, 9]);
    setSelectedColors(['all']); setSelectedTypes(['all']); setSelectedRarity('all'); 
    setSelectedVersions(['Normal']); 
    setIncludeRegular(true); setIncludeBeta(false); setIncludeReprint(false); setIncludeLimited(false); setIncludePromo(false);
    setSelectedKeywords(['all']); setSelectedTimings(['all']); 
    setSelectedResonance('all'); setResonanceMatchId(''); 
    setSupportValue(''); setBreakthroughValue(''); setRepairValue(''); 
    setTraitSearchText(''); setIsTraitExactMatch(false); 
  };

  const handleResetEverything = () => {
    handleResetSearch();
    handleResetFilters();
    if (flatListRef.current) flatListRef.current.scrollToOffset({ offset: 0, animated: true });
  };

  const restoreHistoryState = () => {
    if (lastState) {
      setSearchText(lastState.searchText); setSelectedSet(lastState.selectedSet);
      setSelectedColors(lastState.selectedColors); setSelectedTypes(lastState.selectedTypes);
      setSelectedRarity(lastState.selectedRarity); setSelectedVersions(lastState.selectedVersions);
      setIncludeRegular(lastState.includeRegular !== undefined ? lastState.includeRegular : true);
      setIncludeBeta(lastState.includeBeta || false); setIncludeReprint(lastState.includeReprint || false); 
      setIncludeLimited(lastState.includeLimited || false); setIncludePromo(lastState.includePromo || false);
      setSelectedResonance(lastState.selectedResonance); setResonanceMatchId(lastState.resonanceMatchId || '');
      setSelectedKeywords(lastState.selectedKeywords); setSelectedTimings(lastState.selectedTimings || ['all']); 
      setSupportValue(lastState.supportValue); setBreakthroughValue(lastState.breakthroughValue); setRepairValue(lastState.repairValue);
      setTraitSearchText(lastState.traitSearchText); setIsTraitExactMatch(lastState.isTraitExactMatch || false);
      setLvRange(lastState.lvRange); setCostRange(lastState.costRange); setApRange(lastState.apRange); setHpRange(lastState.hpRange);
      setSelectedCard(lastState.card); setPendingScrollY(lastState.scrollY || 0); setLastState(null);
    }
  };

  const executeRedirect = () => {
    if (selectedCard) setLastState({
        card: selectedCard, searchText, selectedSet, selectedColors, selectedTypes, selectedRarity, selectedVersions, includeRegular, includeBeta, includeReprint, includeLimited, includePromo, selectedResonance, resonanceMatchId,
        selectedKeywords, selectedTimings, supportValue, breakthroughValue, repairValue, traitSearchText, isTraitExactMatch, lvRange, costRange, apRange, hpRange,
        scrollY: currentScrollY 
    });
    setSelectedCard(null);
    if (flatListRef.current) flatListRef.current.scrollToOffset({ offset: 0, animated: false });
  };

  useEffect(() => {
    if (pendingScrollY !== null && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToOffset({ offset: pendingScrollY, animated: false });
        setPendingScrollY(null);
      }, 50);
    }
  }, [selectedCard, pendingScrollY]);

  const triggerResonanceDirectSearch = (targetCardId) => {
    if (!targetCardId) return;
    const baseMatchCard = cardsData.find(c => (c.displayId || c.id).toLowerCase() === targetCardId.trim().toLowerCase());
    
    executeRedirect(); handleResetSearch(); handleResetFilters();
    setResonanceMatchId(targetCardId);

    if (baseMatchCard) {
       const type = baseMatchCard.type || '';
       const effect = baseMatchCard[`effect_${language}`] || '';
       const traits = baseMatchCard[`traits_${language}`] || '';
       const isCommandPilot = type === 'COMMAND' && (effect.includes('【機師】') || traits.includes('【機師】') || traits.includes('機師'));

       if (['UNIT', 'UNIT TOKEN', 'TOKEN'].includes(type)) setSelectedTypes(['PILOT', 'COMMAND_PILOT']);
       else if (type === 'PILOT' || isCommandPilot) setSelectedTypes(['UNIT', 'TOKEN']);
    }
  };

  const processSmartSearch = () => {
    let text = searchText;
    let newHp = [...hpRange]; let newAp = [...apRange];
    let newLv = [...lvRange]; let newCost = [...costRange];
    let newTypes = [...selectedTypes];

    const traitRegex = /〔([^〕]+)〕/g;
    let traitMatch;
    while ((traitMatch = traitRegex.exec(text)) !== null) {
      setTraitSearchText(traitMatch[1].trim()); setIsTraitExactMatch(true); 
    }
    text = text.replace(traitRegex, '');

    const statRegex = /(hp|ap|lv|cost|等級)\s*(為)?\s*(不大於|不高於|不超過|<=|小於等於|不小於|不低於|>=|大於等於|大於|>|小於|<|等於|=)?\s*(?:Lv\.?\s*)?(\d+)\s*(或更低|或更高|或高等級|或更等級|或以下|或以上)?/gi;
    text = text.replace(statRegex, (match, stat, isBe, opFront, val, opBack) => {
      const num = parseInt(val, 10);
      let statKey = stat.toLowerCase(); if (statKey === '等級') statKey = 'lv';
      let min = 0, max = 9;
      const op = (opFront || '') + (opBack || '');

      if (op) {
         if (['或更低', '或以下', '不大於', '不高於', '不超過', '<=', '小於等於', '以下', '<', '小於'].some(o => op.includes(o))) { min = 0; max = num; if (['<', '小於'].includes(op)) max = num - 1; }
         else if (['或更高', '或更高等級', '或高等級', '或以上', '不小於', '不低於', '>=', '大於等於', '以上', '>', '大於'].some(o => op.includes(o))) { min = num; max = 9; if (['>', '大於'].includes(op)) min = num + 1; }
         else { min = num; max = num; }
      } else { min = num; max = num; }

      if (statKey === 'hp') newHp = [Math.max(0, min), Math.min(9, max)];
      if (statKey === 'ap') newAp = [Math.max(0, min), Math.min(9, max)];
      if (statKey === 'lv') newLv = [Math.max(0, min), Math.min(9, max)];
      if (statKey === 'cost') newCost = [Math.max(0, min), Math.min(9, max)];
      return ''; 
    });

    const searchTypeRegex = new RegExp(`(?:共鳴)?(?:機體替代卡|替代卡|機體|機師|角色|駕駛員|指令|據點|基地|token|代幣|unit|pilot|command|base|資源|resource|ex\\s*base|ex\\s*據點|ex\\s*resource|ex\\s*資源|卡牌|卡)(?:卡牌|卡)?(?:[/／](?:共鳴)?(?:機體替代卡|替代卡|機體|機師|角色|駕駛員|指令|據點|基地|token|代幣|unit|pilot|command|base|資源|resource|ex\\s*base|ex\\s*據點|ex\\s*resource|ex\\s*資源|卡牌|卡)(?:卡牌|卡)?)*`, 'gi');
    const matchedTypes = text.match(searchTypeRegex);
    if (matchedTypes) {
       matchedTypes.forEach(tFull => {
          if (tFull.includes('共鳴')) setSelectedResonance('yes');
          const parts = tFull.replace(/共鳴/g, '').split(/[\/／]/);
          parts.forEach(t => {
             const cleanT = t.trim();
             if (cleanT) {
                 const mapped = resolveCardTypes(cleanT);
                 if (newTypes.includes('all') && mapped.length > 0) newTypes = [];
                 if (mapped.length > 0) newTypes = [...new Set([...newTypes, ...mapped])];
             }
          });
       });
       text = text.replace(searchTypeRegex, ''); 
    }

    text = text.replace(/^[的、\s]+|[的、\s]+$/g, '').trim();

    setHpRange(newHp); setApRange(newAp); setLvRange(newLv); setCostRange(newCost);
    if (newTypes.length > 0 && !newTypes.includes('all')) setSelectedTypes([...new Set(newTypes)]);
    setSearchText(text); 
  };

  const toggleSelection = (value, currentState, setStateFunc) => {
    if (value === 'all') setStateFunc(['all']);
    else {
      let newState = currentState.filter(v => v !== 'all');
      if (newState.includes(value)) {
        newState = newState.filter(v => v !== value);
        if (newState.length === 0) newState = ['all'];
      } else newState.push(value);
      setStateFunc(newState);
    }
  };

  const toggleVersionSelection = (val) => {
    if (val === 'all') { setSelectedVersions(['all']); return; }
    let newSet = new Set(selectedVersions.filter(v => v !== 'all'));
    if (val === 'Alt') {
      if (newSet.has('Alt')) newSet.delete('Alt');
      else { newSet.add('Alt'); newSet.delete('Alt_Plus'); newSet.delete('Alt_PlusPlus'); newSet.delete('Alt_SP'); }
    } else if (['Alt_Plus', 'Alt_PlusPlus', 'Alt_SP'].includes(val)) {
      if (newSet.has(val)) newSet.delete(val); else newSet.add(val);
      if (newSet.has('Alt')) newSet.delete('Alt');
      if (newSet.has('Alt_Plus') && newSet.has('Alt_PlusPlus') && newSet.has('Alt_SP')) {
        newSet.delete('Alt_Plus'); newSet.delete('Alt_PlusPlus'); newSet.delete('Alt_SP'); newSet.add('Alt');
      }
    } else {
      if (newSet.has(val)) newSet.delete(val); else newSet.add(val);
    }
    let finalArray = Array.from(newSet);
    if (finalArray.length === 0) finalArray = ['all'];
    setSelectedVersions(finalArray);
  };

  const filteredCards = cardsData.filter((card) => {
    const isRegular = !card.isBetaCard && !card._isReprint && !card.isLimitedCard && !card.isPromoCard;
    if (isRegular && !includeRegular) return false;
    if (card.isBetaCard && !includeBeta) return false;
    if (card._isReprint && !includeReprint) return false;
    if (card.isLimitedCard && !includeLimited) return false;
    if (card.isPromoCard && !includePromo) return false;

    const safeId = card.id ? card.id.toLowerCase() : '';
    const safeDisplayId = card.displayId ? card.displayId.toLowerCase() : '';
    const currentName = card[`name_${language}`] || '';
    const currentTraits = card[`traits_${language}`] || '';
    const currentEffect = card[`effect_${language}`] || '';
    
    const currentSetHk = (card.set_hk || '').toLowerCase();
    const currentSetTw = (card.set_tw || '').toLowerCase();
    const currentSet = (card.set || '').toLowerCase();
    const allValidNames = getAliasNames(card, language).map(n => n.toLowerCase());
    
    if (resonanceMatchId.trim() !== '') {
       const targetId = resonanceMatchId.trim().toLowerCase();
       const baseMatchCard = cardsData.find(c => (c.displayId || c.id).toLowerCase() === targetId);
       if (!baseMatchCard) return false; 

       const isTypeUnit = (type) => ['UNIT', 'UNIT TOKEN', 'TOKEN'].includes(type);
       const isTypePilot = (cardObj) => {
           if (cardObj.type === 'PILOT') return true;
           if (cardObj.type === 'COMMAND') {
               const effect = cardObj[`effect_${language}`] || '';
               const traits = cardObj[`traits_${language}`] || '';
               return effect.includes('【機師】') || traits.includes('【機師】') || traits.includes('機師');
           }
           return false;
       };

       const baseIsUnit = isTypeUnit(baseMatchCard.type);
       const baseIsPilot = isTypePilot(baseMatchCard);
       const targetIsUnit = isTypeUnit(card.type);
       const targetIsPilot = isTypePilot(card);

       const linkRaw = language === 'tw' ? card.link_tw : card.link_hk;
       const baseLinkRaw = language === 'tw' ? baseMatchCard.link_tw : baseMatchCard.link_hk;
       const traitRaw = language === 'tw' ? card.traits_tw : card.traits_hk;
       const baseTraitRaw = language === 'tw' ? baseMatchCard.traits_tw : baseMatchCard.traits_hk;

       let isResonanceMatch = false;

       const evaluateResonance = (linkToParse, pilotCardObj, pilotTraitRaw) => {
           if (!linkToParse || linkToParse === '-') return false;
           const nameConditions = [...linkToParse.matchAll(/「([^」]+)」/g)].map(m => m[1].trim());
           const traitConditions = [...linkToParse.matchAll(/〔([^〕]+)〕/g)].map(m => m[1].trim());
           const pilotAliases = getAliasNames(pilotCardObj, language);
           const pilotTraits = ((pilotTraitRaw || '').match(/〔([^〕]+)〕/g) || []).map(t => t.replace(/[〔〕]/g, '').trim());

           const hasNameMatch = nameConditions.length > 0 && pilotAliases.some(alias => 
               nameConditions.some(n => alias.includes(n) || n.includes(alias))
           );
           const hasTraitMatch = traitConditions.length > 0 && pilotTraits.some(t => 
               traitConditions.includes(t)
           );
           return hasNameMatch || hasTraitMatch;
       };

       if (baseIsUnit && targetIsPilot) {
           isResonanceMatch = evaluateResonance(baseLinkRaw, card, traitRaw);
       } else if (baseIsPilot && targetIsUnit) {
           isResonanceMatch = evaluateResonance(linkRaw, baseMatchCard, baseTraitRaw);
       } else return false; 
       
       if (!isResonanceMatch) return false;
    }

    const isApFiltered = apRange[0] !== 0 || apRange[1] !== 9;
    const isHpFiltered = hpRange[0] !== 0 || hpRange[1] !== 9;
    if ((isApFiltered || isHpFiltered) && (card.type === 'PILOT' || card.type === 'COMMAND' || card.type === 'RESOURCE' || card.type === 'EX RESOURCE')) return false;

    let matchesSearch = true;
    const lowerSearchText = searchText.trim().toLowerCase();
    const isExactSetMatch = lowerSearchText !== '' && (currentSetHk.includes(lowerSearchText) || currentSetTw.includes(lowerSearchText) || currentSet.includes(lowerSearchText));

    if (isExactSetMatch) matchesSearch = true;
    else if (searchText.trim() !== '') {
        const searchTerms = searchText.trim().split(/\s+/);
        for (const term of searchTerms) {
            if (!term) continue;
            let isEx = term.startsWith('-'); let q = isEx ? term.substring(1).toLowerCase() : term.toLowerCase();
            if (!q) continue;

            const hasText = safeId.includes(q) || safeDisplayId.includes(q) || allValidNames.some(n => n.includes(q)) || 
                            (card.type === 'COMMAND' && currentEffect.toLowerCase().includes(q)) || currentSetHk.includes(q) || currentSetTw.includes(q) || currentSet.includes(q);
            if (isEx) { if (hasText) { matchesSearch = false; break; } } else { if (!hasText) { matchesSearch = false; break; } }
        }
    }
    
    const matchesSet = selectedSet === 'all' || card.set === selectedSet; 
    const matchesColor = selectedColors.includes('all') || selectedColors.includes(card.color);
    
    let matchesType = false;
    if (selectedTypes.includes('all')) matchesType = true;
    else {
      if (selectedTypes.includes(card.type)) matchesType = true;
      if (selectedTypes.includes('TOKEN') && (card.type === 'UNIT TOKEN' || card.type === 'TOKEN')) matchesType = true;
      if (selectedTypes.includes('PILOT') && card.type === 'PILOT') matchesType = true; 
      if (selectedTypes.includes('COMMAND_PILOT') && card.type === 'COMMAND' && (currentEffect.includes('【機師】') || currentTraits.includes('【機師】') || currentTraits.includes('機師'))) matchesType = true; 
    }
    
    let matchesRarity = true;
    if (selectedRarity !== 'all') matchesRarity = (card.rarity || '').replace(/[^a-zA-Z]/g, '').toUpperCase() === selectedRarity;

    let matchesTrait = true;
    if (traitSearchText.trim() !== '') {
       const targetTraits = traitSearchText.split(/[\s\/／,，]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
       if (isTraitExactMatch) {
          const cardTraitsArray = (currentTraits.match(/〔([^〕]+)〕/g) || []).map(t => t.replace(/[〔〕]/g, '').toLowerCase().trim());
          matchesTrait = targetTraits.some(target => cardTraitsArray.includes(target));
       } else matchesTrait = targetTraits.some(target => currentTraits.toLowerCase().includes(target));
    }
    
    let matchesKeyword = true;
    if (!selectedKeywords.includes('all') && selectedKeywords.length > 0) {
      matchesKeyword = selectedKeywords.some(kw => {
        if (kw === '支援' && supportValue) return currentEffect.includes(`支援${supportValue}`) || currentEffect.includes(`支援 ${supportValue}`);
        if (kw === '突破' && breakthroughValue) return currentEffect.includes(`突破${breakthroughValue}`) || currentEffect.includes(`突破 ${breakthroughValue}`);
        if (kw === '修復' && repairValue) return currentEffect.includes(`修復${repairValue}`) || currentEffect.includes(`修復 ${repairValue}`);
        return currentEffect.includes(kw);
      });
    }

    let matchesTiming = true;
    if (!selectedTimings.includes('all') && selectedTimings.length > 0) matchesTiming = selectedTimings.some(timing => new RegExp(`【${timing}(?:】|・)`).test(currentEffect));
    
    let matchesVersion = false;
    if (selectedVersions.includes('all')) matchesVersion = true;
    else {
      if (selectedVersions.includes('Normal') && !card._isAltArt) matchesVersion = true;
      if (card._isAltArt) {
        const r = card.rarity || '';
        if (selectedVersions.includes('Alt') || (selectedVersions.includes('Alt_Plus') && r.includes('+') && !r.includes('++')) || (selectedVersions.includes('Alt_PlusPlus') && r.includes('++')) || (selectedVersions.includes('Alt_SP') && r.includes('SP'))) matchesVersion = true;
      }
    }

    let matchesLv = true;
    if (lvRange[0] !== 0 || lvRange[1] !== 9) {
      const val = (!card.lv || card.lv === '-') ? 0 : parseInt(card.lv);
      matchesLv = !isNaN(val) && val >= lvRange[0] && val <= lvRange[1];
    }
    let matchesCost = true;
    if (costRange[0] !== 0 || costRange[1] !== 9) {
      const val = (!card.cost || card.cost === '-') ? 0 : parseInt(card.cost);
      matchesCost = !isNaN(val) && val >= costRange[0] && val <= costRange[1];
    }
    let matchesAp = true;
    if (isApFiltered) {
      const apRaw = card.ap || ''; const val = (!apRaw || apRaw === '-' || apRaw.includes('+') || apRaw.includes('-')) ? 0 : parseInt(apRaw, 10);
      matchesAp = !isNaN(val) && val >= apRange[0] && val <= apRange[1];
    }
    let matchesHp = true;
    if (isHpFiltered) {
      const hpRaw = card.hp || ''; const val = (!hpRaw || hpRaw === '-' || hpRaw.includes('+') || hpRaw.includes('-')) ? 0 : parseInt(hpRaw, 10);
      matchesHp = !isNaN(val) && val >= hpRange[0] && val <= hpRange[1];
    }

    let matchesResonance = true;
    if (selectedResonance !== 'all') {
       const linkVal = card[`link_${language}`] || ''; const hasLink = linkVal.trim() !== '-' && linkVal.trim() !== '';
       if (selectedResonance === 'yes') matchesResonance = hasLink;
       if (selectedResonance === 'no') matchesResonance = !hasLink;
    }

    return matchesSearch && matchesSet && matchesColor && matchesType && matchesRarity && matchesTrait && matchesKeyword && matchesTiming && matchesVersion && matchesLv && matchesCost && matchesAp && matchesHp && matchesResonance;
  });

  const currentCardIndex = filteredCards.findIndex(c => c.id === selectedCard?.id);
  const hasPrev = currentCardIndex > 0;
  const hasNext = currentCardIndex !== -1 && currentCardIndex < filteredCards.length - 1;

  const handlePrevCard = () => { if (hasPrev) setSelectedCard(filteredCards[currentCardIndex - 1]); };
  const handleNextCard = () => { if (hasNext) setSelectedCard(filteredCards[currentCardIndex + 1]); };

  const minSwipeDistance = 50;
  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.nativeEvent.pageX); };
  const onTouchMove = (e) => setTouchEnd(e.nativeEvent.pageX);
  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && hasNext) handleNextCard();
    if (isRightSwipe && hasPrev) handlePrevCard();
  };

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (!selectedCard) return; 
      if (event.key === 'ArrowLeft') handlePrevCard();
      else if (event.key === 'ArrowRight') handleNextCard();
      else if (event.key === 'Escape') { setLastState(null); setSelectedCard(null); }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedCard, currentCardIndex, filteredCards]);

  const handleTokenClick = (clickedText, isTraitSymbol) => {
    executeRedirect(); handleResetSearch(); handleResetFilters();
    if (isTraitSymbol) { setTraitSearchText(clickedText); setIsTraitExactMatch(true); } else setSearchText(clickedText);
  };
  
  const handleExactTokenClick = (name, attributesRaw) => {
    executeRedirect(); handleResetSearch(); handleResetFilters();
    setSearchText(name); setSelectedTypes(['TOKEN']);
    const traitsFound = []; const trRegex = /〔([^〕]+)〕/g; let m;
    while ((m = trRegex.exec(attributesRaw)) !== null) traitsFound.push(m[1].trim());
    if (traitsFound.length > 0) { setTraitSearchText(traitsFound.join('/')); setIsTraitExactMatch(true); }
    const apMatch = attributesRaw.match(/AP(\d+)/i); if (apMatch) setApRange([parseInt(apMatch[1], 10), parseInt(apMatch[1], 10)]);
    const hpMatch = attributesRaw.match(/HP(\d+)/i); if (hpMatch) setHpRange([parseInt(hpMatch[1], 10), parseInt(hpMatch[1], 10)]);
  };

  const handleKeywordHexClick = (keywordText) => {
    executeRedirect(); handleResetSearch(); handleResetFilters();
    const kwMatch = keywordText.match(/^(爆發|修復|阻擋者|突破|高機動|支援|先制攻擊|壓制)(\d+)?$/);
    if (kwMatch) {
      const baseKw = kwMatch[1]; const num = kwMatch[2]; setSelectedKeywords([baseKw]);
      if (num) {
        if (baseKw === '支援') setSupportValue(num); if (baseKw === '突破') setBreakthroughValue(num); if (baseKw === '修復') setRepairValue(num);
      }
    } else setSelectedKeywords([keywordText]);
  };

  const handleAcquisitionClick = (card) => {
    if (!card) return;
    executeRedirect(); handleResetEverything();
    if (card.isLimitedCard || card.isPromoCard) {
      const acqText = card[`set_${language}`] || card.set || '';
      if (acqText && acqText !== '-') {
        setSearchText(acqText); setIncludeRegular(false); setIncludeBeta(false); setIncludeReprint(false); setIncludeLimited(true); setIncludePromo(true);   
        setSelectedVersions(['Normal', 'Alt']); 
      }
    } else {
      if (card.set && card.set !== '-') { setSelectedSet(card.set); setIncludeRegular(true); }
    }
  };

  const applyCondition = (partText, cardId) => {
    executeRedirect(); handleResetSearch(); handleResetFilters();
    if (partText.match(/(?:搭乘(?:此|該)|此(?:機體|角色|卡牌|卡|機師)(?:為|作為)共鳴)/) && cardId) setResonanceMatchId(cardId);

    const excludeRegex = /([^，。、]+)以外的/; const exMatch = partText.match(excludeRegex);
    let excludedTypes = [];
    if (exMatch) {
       const exText = exMatch[1];
       if (!exText.includes('此機體') && !exText.includes('此角色') && !exText.includes('此卡')) {
           const exTypeMatch = exText.match(new RegExp(`(${TARGET_TYPES})`, 'i'));
           if (exTypeMatch) {
               let tArr = exTypeMatch[1].replace(/共鳴/g, '').split(/[\/／]/);
               tArr.forEach(t => { let cleanT = t.trim(); if (cleanT) excludedTypes.push(...resolveCardTypes(cleanT)); });
           }
       }
    }

    const typeRegex = new RegExp(`(${TARGET_TYPES}(?:共鳴)?)$`, 'i'); const typeMatch = partText.match(typeRegex);
    const selfTraitTypeRegex = new RegExp(`(?:若)?此(${SINGLE_TARGET})(?:為|變成|擁有|具有)?\\s*${TRAIT_GROUP}`, 'i'); const selfTraitMatch = partText.match(selfTraitTypeRegex);
    const selfColorTypeRegex = new RegExp(`此(${SINGLE_TARGET})(?:若為|為)(藍色|紅色|綠色|黃色|紫色|白色|黑色)`, 'i'); const selfColorMatch = partText.match(selfColorTypeRegex);

    let typeStr = null;
    if (typeMatch) typeStr = typeMatch[1]; else if (selfTraitMatch) typeStr = selfTraitMatch[1]; else if (selfColorMatch) typeStr = selfColorMatch[1];
    else { const selfTargetRegex = new RegExp(`^此(${SINGLE_TARGET})`, 'i'); const selfTargetMatch = partText.match(selfTargetRegex); if (selfTargetMatch) typeStr = selfTargetMatch[1]; }

    let mappedTypes = [];
    if (typeStr) {
       if (typeStr.includes('共鳴')) { setSelectedResonance('yes'); typeStr = typeStr.replace(/共鳴/g, ''); }
       let tArr = typeStr.split(/[\/／]/);
       tArr.forEach(t => { let cleanT = t.trim(); if (cleanT === '基地' || cleanT === '基地卡' || cleanT === '基地卡牌') mappedTypes.push('BASE'); else if (cleanT) mappedTypes.push(...resolveCardTypes(cleanT)); });
    }

    if (mappedTypes.length === 0) {
        const sourceCard = cardsData.find(c => c.id === cardId || c.displayId === cardId);
        if (sourceCard) {
            const fullEffect = sourceCard[`effect_${language}`] || ''; const partIndex = fullEffect.indexOf(partText);
            if (partIndex !== -1) {
                const afterPart = fullEffect.substring(partIndex + partText.length, partIndex + partText.length + 20);
                const nextNounMatch = afterPart.match(/(機體|機師|角色|駕駛員|指令|據點|基地|卡牌|卡)/);
                if (nextNounMatch) mappedTypes.push(...resolveCardTypes(nextNounMatch[1]));
            }
        }
    }

    if(mappedTypes.length > 0) {
        mappedTypes = mappedTypes.filter(t => !excludedTypes.includes(t));
        if (selfColorMatch && mappedTypes.includes('UNIT') && mappedTypes.includes('TOKEN')) mappedTypes = mappedTypes.filter(t => t !== 'TOKEN');
        if(mappedTypes.length === 0) mappedTypes = ['all'];
        setSelectedTypes([...new Set(mappedTypes)]);
    }

    let targetColorStr = null;
    if (selfColorMatch) targetColorStr = selfColorMatch[2].replace('色', '');
    else { const genColorMatch = partText.match(/(藍|紅|綠|黃|紫|白|黑)色的?/); if (genColorMatch) targetColorStr = genColorMatch[1]; }

    if (targetColorStr) {
        const colorMap = { '藍': 'Blue', '紅': 'Red', '綠': 'Green', '黃': 'Yellow', '紫': 'Purple', '白': 'White', '黑': 'Black' };
        const colorKey = colorMap[targetColorStr]; if (colorKey) setSelectedColors([colorKey]);
    }

    const traitsFound = []; const traitRegexGlobal = /〔([^〕]+)〕/g; let traitMatch;
    while ((traitMatch = traitRegexGlobal.exec(partText)) !== null) traitsFound.push(traitMatch[1].trim());
    if (traitsFound.length > 0) { setTraitSearchText(traitsFound.join('/')); setIsTraitExactMatch(true); }

    const kwMatchRegex = /擁有《([^》]+)》效果(?:的\s*|之\s*|且\s*)?/i; const kwMatch = partText.match(kwMatchRegex);
    if (kwMatch) setSelectedKeywords([kwMatch[1].trim()]);

    const statusMatchRegex = /擁有【([^】]+)】效果(?:的\s*|之\s*|且\s*)?/i; const statusMatch = partText.match(statusMatchRegex);
    if (statusMatch) setSelectedTimings([statusMatch[1].trim().split('・')[0]]);

    const nameMatchRegex = /卡牌名稱中(不包含|包含)「([^」]+)」/i; const nMatch = partText.match(nameMatchRegex);
    if (nMatch) setSearchText(nMatch[1] === '不包含' ? `-${nMatch[2].trim()}` : nMatch[2].trim());

    const parseRegex = /(HP|AP|Lv\.?|COST|等級)\s*(為)?\s*(不大於|不高於|不超過|<=|小於等於|不小於|不低於|>=|大於等於|大於|>|小於|<|等於|=)?\s*(?:Lv\.?\s*)?(\d+)\s*(或更高等級|或高等級|或更高|或更低|或以下|或以上|以下|以上)?/i;
    const match = partText.match(parseRegex);
    if (match) {
        let statRaw = match[1].toLowerCase().replace('.', ''); if (statRaw === '等級') statRaw = 'lv';
        const num = parseInt(match[4], 10); const op = (match[3] || '') + (match[5] || ''); let min = 0, max = 9;
        if (['或更低', '或以下', '不大於', '不高於', '不超過', '<=', '小於等於', '以下', '<', '小於'].some(o => op.includes(o))) { min = 0; max = num; if (['<', '小於'].includes(op)) max = num - 1; } 
        else if (['或更高', '或更高等級', '或高等級', '或以上', '不小於', '不低於', '>=', '大於等於', '以上', '>', '大於'].some(o => op.includes(o))) { min = num; max = 9; if (['>', '大於'].includes(op)) min = num + 1; } 
        else { min = num; max = num; }
        
        if (statRaw === 'hp') setHpRange([Math.max(0, min), Math.min(9, max)]);
        if (statRaw === 'ap') setApRange([Math.max(0, min), Math.min(9, max)]);
        if (statRaw === 'lv') setLvRange([Math.max(0, min), Math.min(9, max)]);
        if (statRaw === 'cost') setCostRange([Math.max(0, min), Math.min(9, max)]);
    }
  };

  const handleSetClick = (setStr) => {
    if (!setStr || setStr === '-') return;
    executeRedirect(); handleResetEverything(); setSelectedSet(setStr);
  };

  const MobileScrollWrapper = ({ children, style }) => {
    if (isMobile) {
      return (
        <View style={styles.mobileGradientContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[style, styles.mobileHorizontalScroll]}>
            {children}
          </ScrollView>
        </View>
      );
    }
    return <View style={style}>{children}</View>;
  };

  const renderKeywordChip = (opt) => {
    const isActive = selectedKeywords.includes(opt.value);
    const isInputKw = opt.value === '支援' || opt.value === '突破' || opt.value === '修復';

    if (!isInputKw) {
      return (
        <TouchableOpacity key={opt.value} style={[styles.filterChip, isActive && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => toggleSelection(opt.value, selectedKeywords, setSelectedKeywords)}>
          <Text style={[styles.chipText, isActive && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
        </TouchableOpacity>
      );
    } else {
      const val = opt.value === '支援' ? supportValue : opt.value === '突破' ? breakthroughValue : repairValue;
      const setVal = opt.value === '支援' ? setSupportValue : opt.value === '突破' ? setBreakthroughValue : setRepairValue;
      return (
        <View key={opt.value} style={[styles.filterChipWithInput, isActive && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]}>
          <TouchableOpacity style={styles.filterChipInner} onPress={() => toggleSelection(opt.value, selectedKeywords, setSelectedKeywords)}>
            <Text style={[styles.chipText, isActive && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.keywordValInput, isActive && styles.keywordValInputActive]} maxLength={1} keyboardType="numeric" placeholder="X" placeholderTextColor={isActive ? '#94a3b8' : '#cbd5e1'} value={val}
            onChangeText={(t) => {
              const clean = t.replace(/[^0-9]/g, ''); setVal(clean);
              if (clean !== '' && !isActive) toggleSelection(opt.value, selectedKeywords, setSelectedKeywords);
            }}
          />
        </View>
      );
    }
  };

  const renderRichText = (text, onPressAction, baseStyle) => {
      const subParts = text.split(/(《[^》]+》|【[^】]+】)/g);
      return subParts.map((sub, j) => {
          if (/^《[^》]+》$/.test(sub)) {
              const cleanText = sub.replace(/[《》]/g, '').trim();
              return (
                <TouchableOpacity key={j} style={styles.hexWrapperText} onPress={(e) => { e.stopPropagation(); handleKeywordHexClick(cleanText); }} activeOpacity={0.7}>
                  <Text style={styles.hexInnerText}>{cleanText}</Text>
                </TouchableOpacity>
              );
          }
          if (/^【[^】]+】$/.test(sub)) {
              const cleanText = sub.replace(/[【】]/g, '').trim();
              let matchedKey = "DEFAULT";
              for (const key of Object.keys(STATUS_COLORS_JSON)) { 
                  if (key !== "DEFAULT" && cleanText.startsWith(key)) { matchedKey = key; break; } 
              }
              const bgStyleClass = STATUS_COLORS_JSON[matchedKey];
              const theme = STATUS_THEME_STYLES[bgStyleClass] || STATUS_THEME_STYLES["status_bg_DEFAULT"];
              const textColor = (matchedKey === "每回合1次" || matchedKey === "爆發") ? "#ffffff" : "#000000";
              return <Text key={j} style={[styles.statusWordBadge, { backgroundColor: theme.bg, color: textColor, marginHorizontal: 2 }]} onPress={onPressAction}>{cleanText}</Text>;
          }
          return <Text key={j} style={baseStyle} onPress={onPressAction}>{sub}</Text>;
      });
  };

  const renderVisualCutoff = (textPart, onPressAction, baseStyle) => {
      let unclickablePrefix1 = ""; let clickableCore = textPart;
      const excludeKeywordIndex = clickableCore.search(/以外[的且]/);
      if (excludeKeywordIndex !== -1 && (clickableCore.includes('此機體') || clickableCore.includes('此角色') || clickableCore.includes('此卡'))) {
          const cutIndex = excludeKeywordIndex + 3; unclickablePrefix1 = clickableCore.substring(0, cutIndex); clickableCore = clickableCore.substring(cutIndex).trim();
      }
      let unclickablePrefix2 = ""; const factionMatch = clickableCore.match(/^(我方|對方|友方|敵方|雙方)(?:的)?\s*/);
      if (factionMatch) { unclickablePrefix2 = factionMatch[0]; clickableCore = clickableCore.substring(factionMatch[0].length).trim(); }
      let unclickablePrefix3 = ""; const ridingMatch = clickableCore.match(/^搭乘(?:此|該)(?:機體|角色|卡牌|卡)的\s*/);
      if (ridingMatch) { unclickablePrefix3 = ridingMatch[0]; clickableCore = clickableCore.substring(ridingMatch[0].length).trim(); }
      if (/^(?:我方|對方|友方|敵方|雙方)?(?:的)?(?:機體|機師|角色|駕駛員|指令|據點|基地|卡牌|卡|機體卡牌|機師卡牌)$/.test(clickableCore.trim())) return renderRichText(textPart, undefined, undefined); 
      const finalUnclickable = unclickablePrefix1 + unclickablePrefix2 + unclickablePrefix3;
      if (finalUnclickable) return <Text>{renderRichText(finalUnclickable, undefined, undefined)}{renderRichText(clickableCore, onPressAction, baseStyle)}</Text>;
      return renderRichText(textPart, onPressAction, baseStyle);
  };

  const renderInteractiveText = (text, cardId = null) => {
    if (!text || text.trim() === '' || text.trim() === '-') return <Text style={styles.sectionBodyText}>-</Text>;
    let processedText = text.replace(/\/卡牌名稱/g, ' / 卡牌名稱');
    const parts = processedText.split(MASTER_SPLIT_REGEX);
    return (
      <Text style={styles.sectionBodyText}>
        {parts.map((part, index) => {
          if (!part) return null;
          if (part === '此機體以外的機體' || part === '此角色以外的角色' || part === '此卡以外的卡' || part === '此卡牌以外的卡牌') return <Text key={index}>{part}</Text>;
          if (IS_PLAYER_LV_REGEX.test(part)) return <Text key={index}>{part}</Text>;

          if (/^[【].*[】]$/.test(part)) {
            const cleanText = part.replace(/[【】]/g, '').trim();
            let matchedKey = "DEFAULT";
            for (const key of Object.keys(STATUS_COLORS_JSON)) { if (key !== "DEFAULT" && cleanText.startsWith(key)) { matchedKey = key; break; } }
            const bgStyleClass = STATUS_COLORS_JSON[matchedKey];
            const theme = STATUS_THEME_STYLES[bgStyleClass] || STATUS_THEME_STYLES["status_bg_DEFAULT"];
            const textColor = (matchedKey === "每回合1次" || matchedKey === "爆發") ? "#ffffff" : "#000000";
            const isBurst = cleanText === '爆發';
            const innerParts = cleanText.split(INNER_SPLIT_REGEX);
            const renderBadgeInner = innerParts.map((bp, i) => {
              if (!bp) return null;
              if (IS_PLAYER_LV_REGEX.test(bp)) return <Text key={i}>{bp}</Text>;
              if (bp === '此機體以外的機體' || bp === '此角色以外的角色' || bp === '此卡以外的卡' || bp === '此卡牌以外的卡牌') return <Text key={i}>{bp}</Text>;
              if (IS_SELF_RESONANCE_REGEX.test(bp)) return <Text key={i} style={{ color: textColor, fontWeight: '900', cursor: 'pointer' }} onPress={() => triggerResonanceDirectSearch(cardId)}>{bp}</Text>;
              if (IS_SELF_TRAIT_REGEX.test(bp)) {
                  const match = bp.match(/^(若?)(.*)$/);
                  if (match && match[1]) return <Text key={i}>{match[1]}<Text style={{ color: textColor, fontWeight: '900', cursor: 'pointer' }} onPress={() => applyCondition(bp, cardId)}>{match[2]}</Text></Text>;
                  return <Text key={i} style={{ color: textColor, fontWeight: '900', cursor: 'pointer' }} onPress={() => applyCondition(bp, cardId)}>{bp}</Text>;
              }
              if (IS_SELF_COLOR_REGEX.test(bp)) return <Text key={i} style={{ color: textColor, fontWeight: '900', cursor: 'pointer' }} onPress={() => applyCondition(bp, cardId)}>{bp}</Text>;
              if (IS_SMART_REGEX.test(bp) || IS_PURE_RESONANCE_REGEX.test(bp) || IS_SELF_COMPLEX_REGEX.test(bp)) return <Text key={i}>{renderVisualCutoff(bp, () => applyCondition(bp, cardId), { color: textColor, fontWeight: '900', cursor: 'pointer' })}</Text>;
              if (IS_STAT_COND_REGEX.test(bp)) return <Text key={i} style={{ color: textColor, fontWeight: '900', cursor: 'pointer' }} onPress={() => applyCondition(bp, cardId)}>{bp}</Text>;
              if (/^「([^」]+)」[（\(]([^）\)]+)[）\)](?:的機體替代卡)?$/.test(bp)) {
                  const m = bp.match(/^「([^」]+)」[（\(]([^）\)]+)[）\)](?:的機體替代卡)?$/);
                  const subParts = bp.split(/(《[^》]+》)/g);
                  return (
                      <Text key={i}>
                          {subParts.map((sub, j) => {
                              if (/^《[^》]+》$/.test(sub)) {
                                  const cleanText = sub.replace(/[《》]/g, '').trim();
                                  return <TouchableOpacity key={j} style={styles.hexWrapperText} onPress={() => handleKeywordHexClick(cleanText)} activeOpacity={0.7}><Text style={styles.hexInnerText}>{cleanText}</Text></TouchableOpacity>;
                              }
                              return <Text key={j} style={{ color: textColor, fontWeight: '900', cursor: 'pointer' }} onPress={() => handleExactTokenClick(m[1], m[2])}>{sub}</Text>;
                          })}
                      </Text>
                  );
              }
              if (/^〔[^〕]+〕$/.test(bp) || /^「[^」]+」$/.test(bp)) return <Text key={i} style={{ color: textColor, fontWeight: '900', cursor: 'pointer' }} onPress={() => handleTokenClick(bp.replace(/[〔〕長裝」]/g, '').replace(/[〔〕「」]/g, '').trim(), bp.startsWith('〔'))}>{bp}</Text>;
              return <Text key={i}>{bp}</Text>;
            });

            return (
              <Text key={index} style={styles.badgeWrapperText}>
                <Text style={[styles.statusWordBadge, { backgroundColor: theme.bg, color: textColor }, isBurst && { cursor: 'pointer' }]} onPress={isBurst ? () => handleKeywordHexClick('爆發') : undefined}>{renderBadgeInner}</Text>
              </Text>
            );
          }

          if (IS_SELF_RESONANCE_REGEX.test(part)) return <Text key={index} style={styles.interactiveBoldToken} onPress={() => triggerResonanceDirectSearch(cardId)}>{part}</Text>;
          if (IS_SELF_TRAIT_REGEX.test(part)) {
              const match = part.match(/^(若?)(.*)$/);
              if (match && match[1]) return <Text key={index}>{match[1]}<Text style={styles.interactiveBoldToken} onPress={() => applyCondition(part, cardId)}>{match[2]}</Text></Text>;
              return <Text key={index} style={styles.interactiveBoldToken} onPress={() => applyCondition(part, cardId)}>{part}</Text>;
          }
          if (IS_SELF_COLOR_REGEX.test(part)) return <Text key={index} style={styles.interactiveBoldToken} onPress={() => applyCondition(part, cardId)}>{part}</Text>;

          const tokenCardMatch = part.match(/^「([^」]+)」[（\(]([^）\)]+)[）\)](?:的機體替代卡)?$/);
          if (tokenCardMatch) {
              const subParts = part.split(/(《[^》]+》)/g);
              return (
                  <Text key={index}>
                      {subParts.map((sub, i) => {
                          if (/^《[^》]+》$/.test(sub)) {
                              const cleanText = sub.replace(/[《》]/g, '').trim();
                              return <TouchableOpacity key={i} style={styles.hexWrapperText} onPress={() => handleKeywordHexClick(cleanText)} activeOpacity={0.7}><Text style={styles.hexInnerText}>{cleanText}</Text></TouchableOpacity>;
                          }
                          return <Text key={i} style={styles.interactiveBoldToken} onPress={() => handleExactTokenClick(tokenCardMatch[1], tokenCardMatch[2])}>{sub}</Text>;
                      })}
                  </Text>
              );
          }
          
          if (IS_SMART_REGEX.test(part) || IS_PURE_RESONANCE_REGEX.test(part) || IS_SELF_COMPLEX_REGEX.test(part)) return <Text key={index}>{renderVisualCutoff(part, () => applyCondition(part, cardId), styles.interactiveBoldToken)}</Text>;
          if (IS_STAT_COND_REGEX.test(part)) return <Text key={index} style={styles.interactiveBoldToken} onPress={() => applyCondition(part, cardId)}>{part}</Text>;
          const isClickableBracket = /^〔[^〕]+〕$/.test(part) || /^「[^」]+」$/.test(part);
          if (isClickableBracket) return <Text key={index} style={styles.interactiveBoldToken} onPress={() => handleTokenClick(part.replace(/[〔〕長裝」]/g, '').replace(/[〔〕「」]/g, '').trim(), part.startsWith('〔'))}>{part}</Text>;
          if (/^[《].*[》]$/.test(part)) {
            const cleanText = part.replace(/[《》]/g, '').trim();
            return <TouchableOpacity key={index} style={styles.hexWrapperText} onPress={() => handleKeywordHexClick(cleanText)} activeOpacity={0.7}><Text style={styles.hexInnerText}>{cleanText}</Text></TouchableOpacity>;
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  const renderResonanceText = (text) => {
    if (!text || text.trim() === '' || text.trim() === '-') return <Text style={styles.sectionBodyText}>-</Text>;
    let processedText = text;
    if (processedText.includes('特徵') || processedText.includes('特徴')) {
       const matchedTrait = processedText.match(/〔([^〕]+)〕/);
       if (matchedTrait) {
          const trait = matchedTrait[1];
          return (
             <Text style={styles.interactiveBoldToken} onPress={() => { executeRedirect(); handleResetSearch(); handleResetFilters(); setTraitSearchText(trait); setSelectedTypes(['PILOT', 'COMMAND_PILOT']); setIsTraitExactMatch(true); }}>
                特徴〔{trait}〕
             </Text>
          );
       }
    }
    if (!processedText.includes('〔') && !processedText.includes('「') && !processedText.includes('〕') && !processedText.includes('」')) processedText = `「${processedText}」`;
    const parts = processedText.split(/(〔[^〕]+〕|「[^」]+」)/g);
    return (
      <Text style={styles.sectionBodyText}>
         {parts.map((part, index) => {
             if (part.startsWith('〔') && part.endsWith('〕')) {
                 const trait = part.slice(1, -1);
                 return <Text key={index} style={styles.interactiveBoldToken} onPress={() => { executeRedirect(); handleResetSearch(); handleResetFilters(); setTraitSearchText(trait); setSelectedTypes(['PILOT', 'COMMAND_PILOT']); setIsTraitExactMatch(true); }}>{part}</Text>;
             } else if (part.startsWith('「') && part.endsWith('」')) {
                 const name = part.slice(1, -1);
                 return <Text key={index} style={styles.interactiveBoldToken} onPress={() => { executeRedirect(); handleResetSearch(); handleResetFilters(); setSearchText(name); setSelectedTypes(['PILOT', 'COMMAND_PILOT']); }}>{part}</Text>;
             }
             return <Text key={index}>{part}</Text>;
         })}
      </Text>
    );
  };

  const shouldShowResonanceButton = (card) => {
    if (!card) return false;
    const type = card.type || ''; const effect = card[`effect_${language}`] || ''; const traits = card[`traits_${language}`] || ''; const link = card[`link_${language}`] || '';
    if (type === 'UNIT' || type === 'UNIT TOKEN' || type === 'TOKEN') return link.trim() !== '' && link.trim() !== '-';
    if (type === 'PILOT') return true;
    if (type === 'COMMAND') return effect.includes('【機師】') || traits.includes('【機師】') || traits.includes('機師');
    return false;
  };

  return (
    <SafeAreaView style={styles.container}>
      {isSetDropdownOpen && (
        <TouchableWithoutFeedback onPress={() => setIsSetDropdownOpen(false)}>
          <View style={styles.fullScreenOverlay} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.header}>
        <TouchableOpacity style={styles.titleContainer} onPress={() => Linking.openURL('https://www.youtube.com/@FLCdesu')} activeOpacity={0.8}>
          <Text style={[styles.titleTextMain, isMobile && { fontSize: 16 }]} numberOfLines={1} adjustsFontSizeToFit>
             {isMobile ? "GCG中文資料庫 by " : "GUNDAM CARD GAME中文卡效資料庫 by "}
          </Text>
          <Text style={[styles.titleLink, isMobile && { fontSize: 16 }]}>FLC</Text>
          <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' }} style={styles.youtubeLogo} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.headerLangContainer}>
          <View style={styles.langButtonGroup}>
            <TouchableOpacity style={[styles.langBtn, language === 'hk' ? styles.langBtnActive : styles.langBtnInactive]} onPress={() => setLanguage('hk')} activeOpacity={0.8}><Text style={styles.langBtnText}>港譯</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.langBtn, language === 'tw' ? styles.langBtnActive : styles.langBtnInactive]} onPress={() => setLanguage('tw')} activeOpacity={0.8}><Text style={styles.langBtnText}>台譯</Text></TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.searchBarSection, isMobile && { paddingVertical: 10, paddingHorizontal: 12 }]}>
        <View style={styles.mainControlContainer}>
          <View style={[styles.topSearchSection, isMobile && { flexDirection: 'column', alignItems: 'stretch', gap: 8, paddingVertical: 10, paddingHorizontal: 15 }]}>
            {!isMobile && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                 <Text style={styles.searchBarMainTitle}>卡牌搜索</Text>
                 <View style={styles.verticalDivider} />
              </View>
            )}
            
            <View style={[styles.topSearchInputs, isMobile && { flexDirection: 'row', flexWrap: 'wrap', width: '100%', gap: 8, zIndex: 10005 }]}>
              <View style={[styles.dropdownWrapper, isMobile && { flex: 1, zIndex: 10006 }]}>
                <TouchableOpacity style={[styles.dropdownBtn, isMobile && { width: '100%', height: 34 }]} onPress={() => setIsSetDropdownOpen(!isSetDropdownOpen)} activeOpacity={0.8}>
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>{selectedSet === 'all' ? '收錄彈' : selectedSet}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {isSetDropdownOpen && (
                  <View style={[styles.dropdownList, isMobile && { width: '100%' }]}>
                    <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                      {AVAILABLE_SETS.map((setOpt) => (
                        <TouchableOpacity key={setOpt} style={[styles.dropdownItem, selectedSet === setOpt && styles.dropdownItemActive]} onPress={() => { setSelectedSet(setOpt); setIsSetDropdownOpen(false); }}>
                          <Text style={[styles.dropdownItemText, selectedSet === setOpt && { color: '#fff', fontWeight: 'bold' }]}>{setOpt === 'all' ? '收錄彈' : setOpt}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <TouchableOpacity style={[styles.officialResetButton, isMobile && { width: 65, height: 34 }]} activeOpacity={0.8} onPress={handleResetSearch}>
                <Text style={styles.officialResetButtonText}>重置</Text>
              </TouchableOpacity>

              <View style={[styles.searchInputWrapper, isMobile && { flexBasis: '100%', height: 36, zIndex: 1 }]}>
                <TextInput style={styles.officialSearchInput} placeholder="卡牌編號、卡牌名稱" placeholderTextColor="#8899a6" value={searchText} onChangeText={setSearchText} onSubmitEditing={processSmartSearch} />
                <TouchableOpacity style={[styles.searchIconButton, isMobile && { height: 26 }]} activeOpacity={0.8} onPress={processSmartSearch}><Text style={styles.searchIconText}>搜尋</Text></TouchableOpacity>
              </View>
            </View>
            
            <View style={[styles.masterResetContainer, isMobile && { marginLeft: 0, justifyContent: 'space-between', width: '100%', gap: 6, zIndex: 1 }]}>
              {lastState && (
                <TouchableOpacity style={[styles.backToCardBtn, isMobile && { height: 32, paddingHorizontal: 10 }]} onPress={restoreHistoryState} activeOpacity={0.8}>
                  <Text style={[styles.backToCardBtnText, isMobile && { fontSize: 11 }]}>🔙 返回 ({lastState.card.displayId || lastState.card.id})</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.scrollToTopBtn, isMobile && { height: 32, paddingHorizontal: 12, flex: 1 }]} onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}>
                <Text style={[styles.scrollToTopBtnText, isMobile && { fontSize: 11 }]}>⬆ 回頂端</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.masterResetBtn, isMobile && { height: 32, paddingHorizontal: 12, flex: 1 }]} onPress={handleResetEverything}>
                <Text style={[styles.masterResetBtnText, isMobile && { fontSize: 11 }]}>重置全部</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View 
            style={[styles.bottomFilterSection, !isFilterPanelOpen && { paddingVertical: 10 }]}
            onTouchStart={(e) => { panelSwipeStartY.current = e.nativeEvent.pageY; }}
            onTouchEnd={(e) => {
              if (!panelSwipeStartY.current || !isFilterPanelOpen) return;
              const distance = e.nativeEvent.pageY - panelSwipeStartY.current;
              if (distance > 40) setIsFilterPanelOpen(false);
              panelSwipeStartY.current = null;
            }}
          >
            {isFilterPanelOpen && isMobile && (
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandlePill} />
              </View>
            )}
            <View style={[styles.panelHeaderRow, isFilterPanelOpen && { marginBottom: 12 }]}>
              <TouchableOpacity style={styles.panelTitleToggleClickable} onPress={() => setIsFilterPanelOpen(!isFilterPanelOpen)} activeOpacity={0.7}>
                <Text style={styles.panelMainTitle}>篩選卡牌</Text>
                <Text style={styles.panelToggleIndicatorText}>{isFilterPanelOpen ? '▲ 收起' : '▼ 展開'}</Text>
              </TouchableOpacity>
              
              {isFilterPanelOpen && (
                <TouchableOpacity style={styles.panelResetBtn} onPress={handleResetFilters}>
                  <Text style={styles.panelResetBtnText}>重置面板</Text>
                </TouchableOpacity>
              )}
            </View>

            {isFilterPanelOpen && (
              <ScrollView style={isMobile ? styles.mobilePanelVerticalContainer : null} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                <View style={styles.filterColumnsContainer}>
                  <View style={[styles.filterLeftColumn, screenWidth > 900 && styles.filterLeftColumnBorder]}>
                    <View style={styles.panelRow}>
                      <Text style={styles.panelLabel}>顏色</Text>
                      {isMobile ? (
                        <View style={styles.mobileGradientContainer}>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileHorizontalScroll}>
                            {COLOR_OPTIONS.map((opt) => (
                              <TouchableOpacity key={opt.value} style={[styles.filterChip, selectedColors.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => toggleSelection(opt.value, selectedColors, setSelectedColors)}>
                                <Text style={[styles.chipText, selectedColors.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      ) : (
                        <View style={styles.chipContainerRow}>
                          {COLOR_OPTIONS.map((opt) => (
                            <TouchableOpacity key={opt.value} style={[styles.filterChip, selectedColors.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => toggleSelection(opt.value, selectedColors, setSelectedColors)}>
                              <Text style={[styles.chipText, selectedColors.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={styles.panelRow}>
                      <Text style={styles.panelLabel}>種類</Text>
                      {isMobile ? (
                        <View style={styles.mobileGradientContainer}>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileHorizontalScroll}>
                            {TYPE_OPTIONS.map((opt) => (
                              <TouchableOpacity key={opt.value} style={[styles.filterChip, selectedTypes.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => toggleSelection(opt.value, selectedTypes, setSelectedTypes)}>
                                <Text style={[styles.chipText, selectedTypes.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      ) : (
                        <View style={styles.typeRowsContainer}>
                          <View style={[styles.chipContainerRow, { marginBottom: 6 }]}>
                            {TYPE_OPTIONS.slice(0, 5).map((opt) => (
                              <TouchableOpacity key={opt.value} style={[styles.filterChip, selectedTypes.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => toggleSelection(opt.value, selectedTypes, setSelectedTypes)}>
                                <Text style={[styles.chipText, selectedTypes.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          <View style={styles.chipContainerRow}>
                            {TYPE_OPTIONS.slice(5).map((opt) => (
                              <TouchableOpacity key={opt.value} style={[styles.filterChip, selectedTypes.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => toggleSelection(opt.value, selectedTypes, setSelectedTypes)}>
                                <Text style={[styles.chipText, selectedTypes.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>

                    <View style={styles.panelRow}>
                      <Text style={styles.panelLabel}>稀有</Text>
                      {isMobile ? (
                        <View style={styles.mobileGradientContainer}>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileHorizontalScroll}>
                            {RARITY_OPTIONS.map((opt) => (
                              <TouchableOpacity key={opt.value} style={[styles.filterChip, selectedRarity === opt.value && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => setSelectedRarity(opt.value)}>
                                <Text style={[styles.chipText, selectedRarity === opt.value && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      ) : (
                        <View style={styles.chipContainerRow}>
                          {RARITY_OPTIONS.map((opt) => (
                            <TouchableOpacity key={opt.value} style={[styles.filterChip, selectedRarity === opt.value && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => setSelectedRarity(opt.value)}>
                              <Text style={[styles.chipText, selectedRarity === opt.value && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={styles.panelRow}>
                      <Text style={styles.panelLabel}>卡圖</Text>
                      {isMobile ? (
                        <View style={styles.mobileGradientContainer}>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileHorizontalScroll}>
                            {VERSION_OPTIONS.map((opt) => (
                              <TouchableOpacity key={opt.value} style={[styles.filterChip, selectedVersions.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => toggleVersionSelection(opt.value)}>
                                <Text style={[styles.chipText, selectedVersions.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      ) : (
                        <View style={styles.chipContainerRow}>
                          {VERSION_OPTIONS.map((opt) => (
                            <TouchableOpacity key={opt.value} style={[styles.filterChip, selectedVersions.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => toggleVersionSelection(opt.value)}>
                              <Text style={[styles.chipText, selectedVersions.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.panelRow}>
                      <Text style={styles.panelLabel}>入手</Text>
                      {isMobile ? (
                        <View style={styles.mobileGradientContainer}>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileHorizontalScroll}>
                            <TouchableOpacity style={[styles.reprintTickbox, includeRegular && styles.reprintTickboxActive]} onPress={() => setIncludeRegular(!includeRegular)} activeOpacity={0.8}><Text style={[styles.reprintTickboxText, includeRegular && styles.reprintTickboxTextActive]}>{includeRegular ? '☑' : '☐'} 常規</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.reprintTickbox, includeBeta && styles.reprintTickboxActive]} onPress={() => setIncludeBeta(!includeBeta)} activeOpacity={0.8}><Text style={[styles.reprintTickboxText, includeBeta && styles.reprintTickboxTextActive]}>{includeBeta ? '☑' : '☐'} BETA</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.reprintTickbox, includeReprint && styles.reprintTickboxActive]} onPress={() => setIncludeReprint(!includeReprint)} activeOpacity={0.8}><Text style={[styles.reprintTickboxText, includeReprint && styles.reprintTickboxTextActive]}>{includeReprint ? '☑' : '☐'} 重印</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.reprintTickbox, includeLimited && styles.reprintTickboxActive]} onPress={() => setIncludeLimited(!includeLimited)} activeOpacity={0.8}><Text style={[styles.reprintTickboxText, includeLimited && styles.reprintTickboxTextActive]}>{includeLimited ? '☑' : '☐'} 限定</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.reprintTickbox, includePromo && styles.reprintTickboxActive]} onPress={() => setIncludePromo(!includePromo)} activeOpacity={0.8}><Text style={[styles.reprintTickboxText, includePromo && styles.reprintTickboxTextActive]}>{includePromo ? '☑' : '☐'} 推廣</Text></TouchableOpacity>
                          </ScrollView>
                        </View>
                      ) : (
                        <View style={styles.chipContainerRow}>
                          <TouchableOpacity style={[styles.reprintTickbox, includeRegular && styles.reprintTickboxActive]} onPress={() => setIncludeRegular(!includeRegular)} activeOpacity={0.8}><Text style={[styles.reprintTickboxText, includeRegular && styles.reprintTickboxTextActive]}>{includeRegular ? '☑' : '☐'} 常規</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.reprintTickbox, includeBeta && styles.reprintTickboxActive]} onPress={() => setIncludeBeta(!includeBeta)} activeOpacity={0.8}><Text style={[styles.reprintTickboxText, includeBeta && styles.reprintTickboxTextActive]}>{includeBeta ? '☑' : '☐'} BETA</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.reprintTickbox, includeReprint && styles.reprintTickboxActive]} onPress={() => setIncludeReprint(!includeReprint)} activeOpacity={0.8}><Text style={[styles.reprintTickboxText, includeReprint && styles.reprintTickboxTextActive]}>{includeReprint ? '☑' : '☐'} 重印</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.reprintTickbox, includeLimited && styles.reprintTickboxActive]} onPress={() => setIncludeLimited(!includeLimited)} activeOpacity={0.8}><Text style={[styles.reprintTickboxText, includeLimited && styles.reprintTickboxTextActive]}>{includeLimited ? '☑' : '☐'} 限定</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.reprintTickbox, includePromo && styles.reprintTickboxActive]} onPress={() => setIncludePromo(!includePromo)} activeOpacity={0.8}><Text style={[styles.reprintTickboxText, includePromo && styles.reprintTickboxTextActive]}>{includePromo ? '☑' : '☐'} 推廣</Text></TouchableOpacity>
                        </View>
                      )}
                    </View>

                    <View style={styles.panelRow}>
                      <Text style={styles.panelLabel}>共鳴</Text>
                      {isMobile ? (
                        <View style={styles.mobileGradientContainer}>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileHorizontalScroll}>
                            {RESONANCE_OPTIONS.map((opt) => (
                              <TouchableOpacity key={opt.value} style={[styles.filterChip, selectedResonance === opt.value && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => setSelectedResonance(opt.value)}>
                                <Text style={[styles.chipText, selectedResonance === opt.value && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      ) : (
                        <View style={styles.chipContainerRow}>
                          {RESONANCE_OPTIONS.map((opt) => (
                            <TouchableOpacity key={opt.value} style={[styles.filterChip, selectedResonance === opt.value && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => setSelectedResonance(opt.value)}>
                              <Text style={[styles.chipText, selectedResonance === opt.value && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={[styles.panelRow, { marginTop: 4 }]}>
                      <Text style={styles.panelLabel}>符合共鳴</Text>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <TextInput style={[styles.traitShortInput, { width: 140 }]} placeholder="卡牌編號" placeholderTextColor="#94a3b8" value={resonanceMatchId} onChangeText={setResonanceMatchId} />
                        <TouchableOpacity style={styles.traitResetButton} activeOpacity={0.8} onPress={() => setResonanceMatchId('')}>
                          <Text style={styles.traitResetButtonText}>重置</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.filterRightColumn}>
                    <View style={styles.panelRow}>
                      <Text style={styles.panelLabel}>特徵</Text>
                      <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6}}>
                        <TextInput style={[styles.traitShortInput, { width: 160, marginRight: 0 }]} placeholder="輸入特徵 (例：地球聯邦)" placeholderTextColor="#94a3b8" value={traitSearchText} onChangeText={setTraitSearchText} />
                        <TouchableOpacity style={styles.traitResetButton} activeOpacity={0.8} onPress={() => { setTraitSearchText(''); setIsTraitExactMatch(false); }}>
                          <Text style={styles.traitResetButtonText}>重置</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.exactMatchBtn, isTraitExactMatch && styles.exactMatchBtnActive, {marginLeft: 0}]} onPress={() => setIsTraitExactMatch(!isTraitExactMatch)} activeOpacity={0.8}><Text style={[styles.exactMatchBtnText, isTraitExactMatch && styles.exactMatchBtnTextActive]}>✓ 完全符合</Text></TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.panelRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', width: 75, flexShrink: 0 }}>
                        <Text style={[styles.panelLabel, { width: 'auto' }]}>關鍵字</Text>
                        <TouchableOpacity style={[styles.trackResetBtn, { marginLeft: 4, width: 20, height: 20 }]} onPress={() => { setSelectedKeywords(['all']); setSupportValue(''); setBreakthroughValue(''); setRepairValue(''); }} activeOpacity={0.7}><Text style={{fontSize: 12, fontWeight: 'bold'}}>↺</Text></TouchableOpacity>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
                        {isMobile ? (
                          <View style={styles.mobileGradientContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileHorizontalScroll}>
                              {KEYWORD_OPTIONS.map(renderKeywordChip)}
                            </ScrollView>
                          </View>
                        ) : (
                          <View style={styles.typeRowsContainer}>
                            <View style={[styles.chipContainerRow, { marginBottom: 6 }]}>
                              {KEYWORD_OPTIONS.slice(0, 5).map(renderKeywordChip)}
                            </View>
                            <View style={styles.chipContainerRow}>
                              {KEYWORD_OPTIONS.slice(5).map(renderKeywordChip)}
                            </View>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.panelRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', width: 75, flexShrink: 0 }}>
                        <Text style={[styles.panelLabel, { width: 'auto' }]}>時機</Text>
                        <TouchableOpacity style={[styles.trackResetBtn, { marginLeft: 4, width: 20, height: 20 }]} onPress={() => { setSelectedTimings(['all']); }} activeOpacity={0.7}><Text style={{fontSize: 12, fontWeight: 'bold'}}>↺</Text></TouchableOpacity>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
                        {isMobile ? (
                          <View style={styles.mobileGradientContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileHorizontalScroll}>
                              {TIMING_OPTIONS.map((opt) => (
                                <TouchableOpacity key={opt.value} style={[styles.filterChip, selectedTimings.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => toggleSelection(opt.value, selectedTimings, setSelectedTimings)}>
                                  <Text style={[styles.chipText, selectedTimings.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        ) : (
                          <View style={styles.typeRowsContainer}>
                            <View style={[styles.chipContainerRow, { marginBottom: 6 }]}>
                              {TIMING_OPTIONS.slice(0, 5).map((opt) => (
                                <TouchableOpacity key={opt.value} style={[styles.filterChip, selectedTimings.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => toggleSelection(opt.value, selectedTimings, setSelectedTimings)}>
                                  <Text style={[styles.chipText, selectedTimings.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                            <View style={styles.chipContainerRow}>
                              {TIMING_OPTIONS.slice(5).map((opt) => (
                                <TouchableOpacity key={opt.value} style={[styles.filterChip, selectedTimings.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => toggleSelection(opt.value, selectedTimings, setSelectedTimings)}>
                                  <Text style={[styles.chipText, selectedTimings.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.rangeTracksWrapper}>
                      <RangeTrack label="Lv." range={lvRange} setRange={setLvRange} minVal={0} maxVal={9} onReset={() => setLvRange([0, 9])} isMobile={isMobile} />
                      <RangeTrack label="COST" range={costRange} setRange={setCostRange} minVal={0} maxVal={9} onReset={() => setCostRange([0, 9])} isMobile={isMobile} />
                      <RangeTrack label="AP" range={apRange} setRange={setApRange} minVal={0} maxVal={9} onReset={() => setApRange([0, 9])} isMobile={isMobile} />
                      <RangeTrack label="HP" range={hpRange} setRange={setHpRange} minVal={0} maxVal={9} onReset={() => setHpRange([0, 9])} isMobile={isMobile} />
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* 🌟 修正：把小灰線移出 ScrollView，讓它永遠貼在白色面板的最底部 */}
            {isFilterPanelOpen && isMobile && (
              <View 
                style={styles.bottomDragSpace} 
                onTouchStart={(e) => { panelSwipeStartY.current = e.nativeEvent.pageY; }}
                onTouchEnd={(e) => {
                  if (!panelSwipeStartY.current || !isFilterPanelOpen) return;
                  const distance = e.nativeEvent.pageY - panelSwipeStartY.current;
                  if (distance < 40) setIsFilterPanelOpen(false); // 🌟 向上滑動(負數)超過 40px 收起
                  panelSwipeStartY.current = null;
                }}
              >
                <View style={styles.dragHandlePill} />
              </View>
            )}
          </View>

        </View>
      </View>

      <View style={[styles.content, isMobile && { padding: 5 }]}>
        <FlatList
          ref={flatListRef}
          onScroll={(e) => setCurrentScrollY(e.nativeEvent.contentOffset.y)}
          onScrollBeginDrag={() => {
            // 🌟 捲動即收起魔法
            if (isMobile && isFilterPanelOpen) setIsFilterPanelOpen(false); 
          }}
          scrollEventThrottle={16}
          key={numColumns} data={filteredCards} keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item }) => <CardGridItem item={item} dynamicCardWidth={dynamicCardWidth} language={language} onPress={(i) => { setLastState(null); setSelectedCard(i); }} isMobile={isMobile} />}
          numColumns={numColumns} ListEmptyComponent={<Text style={styles.emptyText}>找不到符合的卡片</Text>} contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>

      <Modal visible={selectedCard !== null} animationType="fade" transparent={true}>
        {selectedCard && (
          <View style={[styles.modalOverlay, isMobile && { padding: 10 }]} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEndHandler}>
            
            {!isMobile && <TouchableOpacity style={[styles.floatingArrowButton, styles.leftArrowPosition, !hasPrev && styles.arrowDisabled]} onPress={handlePrevCard} disabled={!hasPrev}><Text style={styles.floatingArrowText}>&lt;</Text></TouchableOpacity>}
            
            <TouchableOpacity activeOpacity={1} style={[styles.modalContentBox, isMobile && { maxHeight: '96%' }]}>
              
              <View style={[styles.modalTopBar, isMobile && { paddingHorizontal: 8, paddingVertical: 8, flexWrap: 'nowrap', gap: 4 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 4 : 8, flexShrink: 1 }}>
                  <View style={[styles.langButtonGroup, isMobile && { padding: 2 }]}>
                    <TouchableOpacity style={[styles.langBtn, language === 'hk' ? styles.langBtnActive : styles.langBtnInactive, isMobile && { paddingHorizontal: 8, paddingVertical: 4 }]} onPress={() => setLanguage('hk')} activeOpacity={0.8}><Text style={[styles.langBtnText, isMobile && { fontSize: 11 }]}>港譯</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.langBtn, language === 'tw' ? styles.langBtnActive : styles.langBtnInactive, isMobile && { paddingHorizontal: 8, paddingVertical: 4 }]} onPress={() => setLanguage('tw')} activeOpacity={0.8}><Text style={[styles.langBtnText, isMobile && { fontSize: 11 }]}>台譯</Text></TouchableOpacity>
                  </View>
                </View>

                {!isMobile && (
                  <View style={styles.modalHeaderIdBox}>
                    <Text style={styles.modalHeaderId}>{selectedCard.displayId}</Text>
                    <Text style={styles.modalHeaderRarity}>{selectedCard.rarity || 'C'}</Text>
                    {selectedCard.isBetaCard && <Text style={styles.modalHeaderBetaBadge}>BETA</Text>}
                    {selectedCard.isLimitedCard && <Text style={styles.modalHeaderLimitedBadge}>LIMITED</Text>}
                    {selectedCard.isPromoCard && <Text style={styles.modalHeaderPromoBadge}>PROMO</Text>}
                    {selectedCard._isReprint && <Text style={styles.modalHeaderReprintBadge}>重印</Text>}
                    {selectedCard._isAltArt && <Text style={styles.modalHeaderAltBadge}>異畫</Text>}
                  </View>
                )}
                
                <View style={[styles.modalTopRightControls, isMobile && { gap: 4, flexShrink: 0 }]}>
                  {selectedCard.youtube_url && (
                    <TouchableOpacity style={[styles.ytPromoButton, isMobile && { paddingHorizontal: 6, paddingVertical: 4 }]} onPress={() => Linking.openURL(selectedCard.youtube_url)} activeOpacity={0.8}>
                      <Text style={[styles.ytPromoIcon, isMobile && { fontSize: 10, marginRight: 2 }]}>▶</Text>
                      <Text style={[styles.ytPromoText, isMobile && { fontSize: 10 }]}>卡牌講座</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.closeButton, isMobile && { width: 28, height: 28 }]} onPress={() => { setLastState(null); setSelectedCard(null); }}><Text style={[styles.closeButtonText, isMobile && { fontSize: 14 }]}>X</Text></TouchableOpacity>
                </View>
              </View>

              {isMobile && (
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fafafa', flexWrap: 'wrap', gap: 6 }}>
                  <Text style={styles.modalHeaderId}>{selectedCard.displayId}</Text>
                  <Text style={styles.modalHeaderRarity}>{selectedCard.rarity || 'C'}</Text>
                  {selectedCard.isBetaCard && <Text style={[styles.modalHeaderBetaBadge, { marginLeft: 0 }]}>BETA</Text>}
                  {selectedCard.isLimitedCard && <Text style={[styles.modalHeaderLimitedBadge, { marginLeft: 0 }]}>LIMITED</Text>}
                  {selectedCard.isPromoCard && <Text style={[styles.modalHeaderPromoBadge, { marginLeft: 0 }]}>PROMO</Text>}
                  {selectedCard._isReprint && <Text style={[styles.modalHeaderReprintBadge, { marginLeft: 0 }]}>重印</Text>}
                  {selectedCard._isAltArt && <Text style={[styles.modalHeaderAltBadge, { marginLeft: 0 }]}>異畫</Text>}
                </View>
              )}

              <ScrollView ref={modalScrollRef} contentContainerStyle={[styles.modalScrollBody, isMobile && { padding: 16 }]} showsVerticalScrollIndicator={true}>
                <View style={[styles.modalFlexRow, isMobile && { flexDirection: 'column', alignItems: 'center' }]}>
                  <View style={[styles.modalLeftColumn, isMobile && { marginRight: 0, marginBottom: 15 }]}>
                    
                    {isMobile && <TouchableOpacity style={[styles.floatingArrowButton, styles.mobileFloatingLeftArrow, !hasPrev && styles.arrowDisabled]} onPress={handlePrevCard} disabled={!hasPrev}><Text style={[styles.floatingArrowText, {fontSize: 18}]}>&lt;</Text></TouchableOpacity>}
                    
                    {cardImages[selectedCard.id] ? 
                      <Image source={{ uri: cardImages[selectedCard.id] }} style={[styles.cardImage, isMobile && { width: 250, height: 347 }]} resizeMode="contain" /> 
                      : <View style={[styles.cardImage, styles.noImagePlaceholder, isMobile && { width: 250, height: 347 }]}><Text style={styles.noImageText}>圖片準備中</Text></View>}
                      
                    {isMobile && <TouchableOpacity style={[styles.floatingArrowButton, styles.mobileFloatingRightArrow, !hasNext && styles.arrowDisabled]} onPress={handleNextCard} disabled={!hasNext}><Text style={[styles.floatingArrowText, {fontSize: 18}]}>&gt;</Text></TouchableOpacity>}
                  </View>

                  <View style={[styles.modalRightColumn, isMobile && { minWidth: '100%' }]}>
                    <Text style={[styles.officialNameMain, isMobile && { fontSize: 22 }]}>{selectedCard[`name_${language}`]}</Text>
                    
                    <View style={styles.officialSpecsRow}>
                      <Text style={styles.specItem}><Text style={styles.specLabel}>Lv.</Text> {selectedCard.lv || '-'}</Text>
                      <Text style={styles.specItem}><Text style={styles.specLabel}>COST</Text> {selectedCard.cost || '0'}</Text>
                      <Text style={styles.specItem}><Text style={styles.specLabel}>色</Text> {COLOR_TRANSLATION_MAP[selectedCard.color] || selectedCard.color || '-'}</Text>
                      <Text style={styles.specItem}><Text style={styles.specLabel}>類型</Text> {selectedCard.type || '-'}</Text>
                    </View>
                    <View style={styles.officialSectionDivider}>{renderInteractiveText(selectedCard[`effect_${language}`], selectedCard.displayId || selectedCard.id)}</View>
                    <View style={styles.officialSectionDivider}><Text style={styles.sectionTitle}>地形</Text><Text style={styles.sectionBodyText}>{selectedCard.terrain || '-'}</Text></View>
                    <View style={styles.officialSectionDivider}>
                      <Text style={styles.sectionTitle}>特徵</Text>
                      {renderInteractiveText(selectedCard[`traits_${language}`] && selectedCard[`traits_${language}`].trim() !== '-' ? selectedCard[`traits_${language}`].split(/\s+/).map(t => `〔${t.replace(/[〔〕]/g, '')}〕`).join(' ') : '-')}
                    </View>
                    <View style={styles.officialSectionDivider}>
                      <Text style={styles.sectionTitle}>共鳴</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        {(() => {
                           const text = selectedCard[`link_${language}`];
                           if (!text || text.trim() === '' || text.trim() === '-') return <Text style={styles.sectionBodyText}>-</Text>;
                           let processedText = text;
                           if (processedText.includes('特徵') || processedText.includes('特徴')) {
                              const matchedTrait = processedText.match(/〔([^〕]+)〕/);
                              if (matchedTrait) {
                                 const trait = matchedTrait[1];
                                 return (
                                    <Text style={styles.interactiveBoldToken} onPress={() => {
                                        executeRedirect(); handleResetSearch(); handleResetFilters();
                                        setTraitSearchText(trait); setSelectedTypes(['PILOT', 'COMMAND_PILOT']);
                                        setIsTraitExactMatch(true); 
                                    }}>
                                       特徴〔{trait}〕
                                    </Text>
                                 );
                              }
                           }
                           if (!processedText.includes('〔') && !processedText.includes('「') && !processedText.includes('〕') && !processedText.includes('」')) {
                               processedText = `「${processedText}」`;
                           }
                           const parts = processedText.split(/(〔[^〕]+〕|「[^」]+」)/g);
                           return (
                             <Text style={styles.sectionBodyText}>
                                {parts.map((part, index) => {
                                    if (part.startsWith('〔') && part.endsWith('〕')) {
                                        const trait = part.slice(1, -1);
                                        return (
                                            <Text key={index} style={styles.interactiveBoldToken} onPress={() => {
                                                executeRedirect(); handleResetSearch(); handleResetFilters();
                                                setTraitSearchText(trait); setSelectedTypes(['PILOT', 'COMMAND_PILOT']);
                                                setIsTraitExactMatch(true); 
                                            }}>
                                                {part}
                                            </Text>
                                        );
                                    } else if (part.startsWith('「') && part.endsWith('」')) {
                                        const name = part.slice(1, -1);
                                        return (
                                            <Text key={index} style={styles.interactiveBoldToken} onPress={() => {
                                                executeRedirect(); handleResetSearch(); handleResetFilters();
                                                setSearchText(name); setSelectedTypes(['PILOT', 'COMMAND_PILOT']);
                                            }}>
                                                {part}
                                            </Text>
                                        );
                                    }
                                    return <Text key={index}>{part}</Text>;
                                })}
                             </Text>
                           );
                        })()}
                        {shouldShowResonanceButton(selectedCard) && (
                          <TouchableOpacity 
                            style={styles.checkResonanceBtn} 
                            onPress={() => triggerResonanceDirectSearch(selectedCard.displayId || selectedCard.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.checkResonanceBtnText}>共鳴卡牌</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <View style={styles.officialSectionDivider}>
                      <View style={styles.statsRow}>
                        <Text style={styles.specItem}><Text style={styles.specLabel}>AP</Text> {selectedCard.ap || '-'}</Text>
                        <Text style={styles.specItem}><Text style={styles.specLabel}>HP</Text> {selectedCard.hp || '-'}</Text>
                      </View>
                    </View>
                    <View style={styles.officialSectionDivider}>
                      <Text style={styles.sectionTitle}>入手情報</Text>
                      <TouchableOpacity activeOpacity={0.7} onPress={() => handleAcquisitionClick(selectedCard)}>
                        <Text style={[styles.sectionBodyText, styles.interactiveBoldToken]}>{selectedCard[`set_${language}`] || selectedCard.set || '-'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </TouchableOpacity>
            
            {!isMobile && <TouchableOpacity style={[styles.floatingArrowButton, styles.rightArrowPosition, !hasNext && styles.arrowDisabled]} onPress={handleNextCard} disabled={!hasNext}><Text style={styles.floatingArrowText}>&gt;</Text></TouchableOpacity>}
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreenOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }, 
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  
  header: { backgroundColor: '#20353f', paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, flexWrap: 'nowrap' },
  titleContainer: { flexDirection: 'row', alignItems: 'center', cursor: 'pointer', flex: 1, marginRight: 10, overflow: 'hidden' },
  titleTextMain: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', letterSpacing: 0.5, flexShrink: 1 },
  titleLink: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', flexShrink: 0, marginLeft: 4 },
  youtubeLogo: { width: 22, height: 22, marginLeft: 8, resizeMode: 'contain', flexShrink: 0 },
  headerLangContainer: { flexShrink: 0 },

  langButtonGroup: { flexDirection: 'row', backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: 20, padding: 3 },
  langBtn: { paddingVertical: 5, paddingHorizontal: 16, borderRadius: 17, justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  langBtnActive: { backgroundColor: '#376171' }, langBtnInactive: { backgroundColor: 'transparent', opacity: 0.45 },
  langBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
  content: { flex: 1, padding: 10, zIndex: 1 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888', cursor: 'default' },
  
  searchBarSection: { paddingHorizontal: 20, paddingVertical: 20, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eaeaea', zIndex: 9999 },
  mainControlContainer: { width: '100%', maxWidth: 1400, flexDirection: 'column', gap: 16 },
  
  topSearchSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(211, 224, 227, 0.45)', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 25, zIndex: 10000, flexWrap: 'wrap', gap: 10 },
  searchBarMainTitle: { fontSize: 17, fontWeight: 'bold', color: '#1a2a3a', letterSpacing: 1, cursor: 'default' },
  verticalDivider: { width: 1, height: 24, backgroundColor: '#b4c4c7', marginHorizontal: 16 },
  topSearchInputs: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12, flexWrap: 'wrap' },
  
  dropdownWrapper: { position: 'relative', zIndex: 10001 },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, height: 38, borderWidth: 1, borderColor: '#e2e8f0', minWidth: 160, cursor: 'pointer' },
  dropdownBtnText: { fontSize: 13, color: '#1e293b', fontWeight: '500', flex: 1 },
  dropdownArrow: { fontSize: 10, color: '#94a3b8', marginLeft: 8 },
  dropdownList: { position: 'absolute', top: 42, left: 0, width: 220, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, paddingVertical: 6, borderWidth: 1, borderColor: '#e2e8f0', zIndex: 10002 },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 14, cursor: 'pointer' },
  dropdownItemActive: { backgroundColor: '#376171' },
  dropdownItemText: { fontSize: 13, color: '#475569' },

  searchInputWrapper: { flex: 1, minWidth: 260, maxWidth: 350, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingLeft: 14, paddingRight: 6, height: 38, borderWidth: 1, borderColor: '#e2e8f0' },
  officialSearchInput: { flex: 1, height: '100%', fontSize: 16, color: '#1e293b', outlineWidth: 0 },
  searchIconButton: { paddingHorizontal: 12, height: 28, borderRadius: 14, backgroundColor: '#376171', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  searchIconText: { fontSize: 11, color: '#fff', fontWeight: 'bold' },
  officialResetButton: { paddingHorizontal: 16, height: 38, borderRadius: 19, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', borderWidth: 1, borderColor: '#374151' },
  officialResetButtonText: { fontSize: 12, color: '#ffffff', fontWeight: 'bold', letterSpacing: 0.5 },

  masterResetContainer: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  masterResetBtn: { paddingHorizontal: 16, height: 38, borderRadius: 19, backgroundColor: '#be0453', borderWidth: 1, borderColor: '#be0453', cursor: 'pointer', justifyContent: 'center', alignItems: 'center' },
  masterResetBtnText: { fontSize: 12, color: '#ffffff', fontWeight: 'bold', letterSpacing: 0.5 },
  
  scrollToTopBtn: { paddingHorizontal: 16, height: 38, borderRadius: 19, backgroundColor: '#111827', borderWidth: 1, borderColor: '#000', cursor: 'pointer', justifyContent: 'center', alignItems: 'center' },
  scrollToTopBtnText: { fontSize: 12, color: '#ffffff', fontWeight: 'bold', letterSpacing: 0.5 },

  backToCardBtn: { paddingHorizontal: 16, height: 38, borderRadius: 19, backgroundColor: '#0f766e', borderWidth: 1, borderColor: '#0d9488', cursor: 'pointer', justifyContent: 'center', alignItems: 'center' },
  backToCardBtnText: { fontSize: 12, color: '#ffffff', fontWeight: 'bold', letterSpacing: 0.5 },

  bottomFilterSection: { backgroundColor: 'rgba(211, 224, 227, 0.45)', borderRadius: 24, paddingVertical: 16, paddingHorizontal: 25, zIndex: 900 },
  
  dragHandleContainer: { width: '100%', alignItems: 'center', paddingBottom: 10, paddingTop: 0, marginTop: -6 },
  dragHandlePill: { width: 40, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3 },
  // 🌟 底部新增拉把空間樣式
  bottomDragSpace: { width: '100%', alignItems: 'center', paddingTop: 10, paddingBottom: 0, cursor: 'pointer' },
  
  panelHeaderRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', paddingRight: 4 },
  
  panelTitleToggleClickable: { flexDirection: 'row', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, paddingVertical: 4 },
  panelMainTitle: { fontSize: 17, fontWeight: 'bold', color: '#1a2a3a', letterSpacing: 1 }, 
  panelToggleIndicatorText: { fontSize: 13, color: '#475569', fontWeight: '600' },

  panelResetBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#111827', borderWidth: 1, borderColor: '#000000', cursor: 'pointer', marginLeft: 16 },
  panelResetBtnText: { fontSize: 12, color: '#ffffff', fontWeight: 'bold', letterSpacing: 0.5 },

  mobilePanelVerticalContainer: { maxHeight: 250, overflowY: 'auto' },
  filterColumnsContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 20 },
  
  filterLeftColumn: { flex: 1, minWidth: 280 },
  filterLeftColumnBorder: { borderRightWidth: 1, borderRightColor: '#cbd5e1', paddingRight: 20 },
  filterRightColumn: { flex: 1, minWidth: 280 },

  rangeTracksWrapper: { paddingLeft: 4, gap: 4, marginTop: 8 },
  rangeTrackContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  
  panelLabel: { fontSize: 13, fontWeight: 'bold', color: '#475569', width: 75, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'default' },
  rangeTrackLabel: { width: 50, fontSize: 13, fontWeight: 'bold', color: '#475569', cursor: 'default', flexShrink: 0 },
  rangeTrackBox: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 15, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  rangeNumberCell: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  rangeNumberCellActive: { backgroundColor: '#376171' }, 
  rangeCellFirst: { borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
  rangeCellLast: { borderTopRightRadius: 14, borderBottomRightRadius: 14 },
  rangeNumberText: { fontSize: 13, color: '#64748b', fontWeight: 'bold' },
  rangeNumberTextActive: { color: '#ffffff' },
  trackResetBtn: { marginLeft: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  trackResetBtnText: { fontSize: 14, color: '#475569', fontWeight: 'bold', lineHeight: 24 },

  panelRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, width: '100%' },
  typeRowsContainer: { flexDirection: 'column' },
  chipContainerRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  filterChip: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', cursor: 'pointer', whiteSpace: 'nowrap' },
  chipText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  
  reprintTickbox: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', flexDirection: 'row', alignItems: 'center', cursor: 'pointer', whiteSpace: 'nowrap' },
  reprintTickboxActive: { backgroundColor: '#10b981', borderColor: '#059669' },
  reprintTickboxText: { fontSize: 12, color: '#475569', fontWeight: 'bold' },
  reprintTickboxTextActive: { color: '#ffffff' },

  filterChipWithInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  filterChipInner: { paddingHorizontal: 11, paddingVertical: 5, cursor: 'pointer' },
  keywordValInput: { width: 24, height: '100%', fontSize: 16, textAlign: 'center', color: '#1e293b', borderLeftWidth: 1, borderLeftColor: '#cbd5e1', outlineWidth: 0 },
  keywordValInputActive: { color: '#ffffff', borderLeftColor: '#475569' },

  traitShortInput: { width: 180, height: 32, backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: '#cbd5e1', fontSize: 16, outlineWidth: 0, color: '#1e293b', marginRight: 8 },
  traitResetButton: { paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', borderWidth: 1, borderColor: '#000000' },
  traitResetButtonText: { fontSize: 11, color: '#ffffff', fontWeight: 'bold', letterSpacing: 0.5 },

  exactMatchBtn: { marginLeft: 8, paddingHorizontal: 8, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', cursor: 'pointer', whiteSpace: 'nowrap' },
  exactMatchBtnActive: { backgroundColor: '#111827', borderColor: '#000000' },
  exactMatchBtnText: { fontSize: 11, color: '#475569', fontWeight: 'bold', letterSpacing: 0.5 },
  exactMatchBtnTextActive: { color: '#ffffff' },

  mobileGradientContainer: { position: 'relative', flex: 1, overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, #000 8px, #000 calc(100% - 8px), transparent)', webkitMaskImage: 'linear-gradient(to right, transparent, #000 8px, #000 calc(100% - 8px), transparent)' },
  mobileHorizontalScroll: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  
  gridCard: { backgroundColor: 'white', borderRadius: 8, margin: 5, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease', transform: [{ translateY: 0 }] },
  gridCardHovered: { transform: [{ translateY: -4 }], shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  imageWrapper: { width: '100%', backgroundColor: '#eaeaea', position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  gridNoImage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gridNoImageText: { color: '#9ca3af', fontSize: 10, fontWeight: 'bold', cursor: 'default' },
  gridCardInfo: { padding: 6 },
  gridIdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  gridCardId: { flex: 1, fontSize: 11, fontWeight: 'bold', color: '#666', cursor: 'default' },
  gridBetaBadge: { fontSize: 9, fontWeight: 'bold', backgroundColor: '#ea580c', color: '#ffffff', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, overflow: 'hidden' },
  gridAltBadge: { fontSize: 9, fontWeight: 'bold', backgroundColor: '#fef08a', color: '#854d0e', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, overflow: 'hidden' },
  gridReprintBadge: { fontSize: 9, fontWeight: 'bold', backgroundColor: '#a7f3d0', color: '#065f46', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, overflow: 'hidden' },
  gridLimitedBadge: { fontSize: 9, fontWeight: 'bold', backgroundColor: '#374151', color: '#e5e7eb', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, overflow: 'hidden' },
  gridPromoBadge: { fontSize: 9, fontWeight: 'bold', backgroundColor: '#7e22ce', color: '#fef08a', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, overflow: 'hidden' },
  gridCardName: { fontSize: 13, fontWeight: 'bold', color: '#111', cursor: 'default' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(10px)', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 20, position: 'relative' },
  modalContentBox: { backgroundColor: '#fff', width: '100%', maxWidth: 920, maxHeight: '92%', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 15, elevation: 10, mx: 20, display: 'flex', flexDirection: 'column', flexShrink: 1 },
  
  floatingArrowButton: { position: 'absolute', top: '50%', marginTop: -27, width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 999999 },
  leftArrowPosition: { left: 40 },
  rightArrowPosition: { right: 40 },
  mobileFloatingLeftArrow: { left: -15, width: 44, height: 44, borderRadius: 22, marginTop: -22 },
  mobileFloatingRightArrow: { right: -15, width: 44, height: 44, borderRadius: 22, marginTop: -22 },

  floatingArrowText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', letterSpacing: -1 },
  arrowDisabled: { opacity: 0.15, cursor: 'default' },
  
  modalTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fafafa', flexShrink: 0 },
  
  modalHeaderIdBox: { flexDirection: 'row', alignItems: 'center' },
  modalHeaderId: { fontSize: 14, color: '#666', marginRight: 10, fontFamily: 'monospace', cursor: 'default' },
  modalHeaderRarity: { fontSize: 12, fontWeight: 'bold', backgroundColor: '#e5e7eb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, color: '#374151', cursor: 'default' },
  modalHeaderBetaBadge: { fontSize: 12, fontWeight: 'bold', backgroundColor: '#ea580c', color: '#ffffff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6, cursor: 'default' },
  modalHeaderAltBadge: { fontSize: 12, fontWeight: 'bold', backgroundColor: '#fef08a', color: '#854d0e', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6, cursor: 'default' },
  modalHeaderReprintBadge: { fontSize: 12, fontWeight: 'bold', backgroundColor: '#a7f3d0', color: '#065f46', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6, cursor: 'default' },
  modalHeaderLimitedBadge: { fontSize: 12, fontWeight: 'bold', backgroundColor: '#374151', color: '#e5e7eb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6, cursor: 'default' },
  modalHeaderPromoBadge: { fontSize: 12, fontWeight: 'bold', backgroundColor: '#7e22ce', color: '#fef08a', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6, cursor: 'default' },
  
  modalTopRightControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ytPromoButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, shadowColor: '#ef4444', shadowOpacity: 0.4, shadowRadius: 6, elevation: 3, cursor: 'pointer' },
  ytPromoIcon: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginRight: 6 },
  ytPromoText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
  
  closeButton: { width: 34, height: 34, backgroundColor: '#e5e7eb', borderRadius: 17, justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  closeButtonText: { fontSize: 16, fontWeight: 'bold', color: '#4b5563' },
  
  modalScrollBody: { padding: 30, flexGrow: 1 },
  modalFlexRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  modalLeftColumn: { marginRight: 35, alignItems: 'center', marginBottom: 20, position: 'relative' },
  modalRightColumn: { flex: 1, minWidth: 280 },
  cardImage: { width: 320, height: 445, borderRadius: 12 },
  noImagePlaceholder: { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  noImageText: { color: '#9ca3af', fontSize: 18, fontWeight: 'bold', cursor: 'default' },
  
  officialNameMain: { fontSize: 28, fontWeight: 'bold', color: '#111214', marginBottom: 15, letterSpacing: 0.5, cursor: 'default' },
  
  officialSpecsRow: { flexDirection: 'row', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#d1d5db', marginBottom: 15 },
  specItem: { fontSize: 15, color: '#1f2937', marginRight: 25, fontWeight: '500', cursor: 'default' },
  specLabel: { color: '#6b7280', fontWeight: 'normal', marginRight: 4 },
  officialSectionDivider: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f766e', marginBottom: 6, letterSpacing: 0.5, cursor: 'default' }, 
  sectionBodyText: { fontSize: 15, color: '#1f2937', lineHeight: 24, cursor: 'default' }, 
  statsRow: { flexDirection: 'row' },
  
  interactiveBoldToken: { fontWeight: 'bold', color: '#376171', cursor: 'pointer' }, 
  
  badgeWrapperText: { display: 'inline-block', marginVertical: 2, marginRight: 4 },
  statusWordBadge: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 3, fontSize: 12, fontWeight: 'bold', overflow: 'hidden', cursor: 'default' },
  hexWrapperText: { display: 'inline-block', marginLeft: 2, marginRight: 4, filter: 'drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.35))', transform: [{ translateY: -1 }], cursor: 'pointer' },
  hexInnerText: { display: 'inline-block', backgroundColor: '#ffffff', color: '#000000', fontWeight: '900', fontSize: 11, lineHeight: 15, paddingHorizontal: 10, paddingVertical: 1, clipPath: 'polygon(6px 0%, calc(100% - 6px) 0%, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0% 50%)', cursor: 'pointer' },

  checkResonanceBtn: { paddingHorizontal: 7, paddingVertical: 1, backgroundColor: '#faee01', borderRadius: 3, marginLeft: 8, filter: 'drop-shadow(0px 0px 1.5px rgba(0, 0, 0, 0.25))', cursor: 'pointer' },
  checkResonanceBtnText: { color: '#000000', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 }
});