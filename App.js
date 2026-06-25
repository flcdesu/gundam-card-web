import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, SafeAreaView, FlatList, TouchableOpacity, Image, Modal, ScrollView, Dimensions, Linking, TouchableWithoutFeedback } from 'react-native';

// ====== 從模組化檔案 import ======
import styles from './src/styles';
import {
  OPTIMAL_CARD_WIDTH, STATUS_COLORS_JSON, STATUS_THEME_STYLES,
  COLOR_OPTIONS, COLOR_TRANSLATION_MAP, TYPE_OPTIONS, RARITY_OPTIONS,
  VERSION_OPTIONS, RESONANCE_OPTIONS, KEYWORD_OPTIONS, TIMING_OPTIONS,
  TYPE_NAME_MAP
} from './src/constants';
import { cardsData, cardImages, keywordImages, AVAILABLE_SETS } from './src/data/cardDatabase';
import {
  SINGLE_TARGET, TARGET_TYPES, TRAIT_GROUP, STAT_COND, NAME_COND,
  KEYWORD_COND, STATUS_WORD_COND, COLOR_COND, FACTION_COND,
  EXCLUDE_COND, RIDING_COND, PLAYER_LV_COND, SMART_PREFIX,
  SMART_COND_STR, SELF_COMPLEX_COND_STR, PURE_RESONANCE_TARGET,
  SELF_RESONANCE_STR, SELF_TRAIT_STR, SELF_COLOR_STR, TOKEN_REGEX,
  MASTER_SPLIT_REGEX, INNER_SPLIT_REGEX,
  IS_SMART_REGEX, IS_PURE_RESONANCE_REGEX, IS_SELF_RESONANCE_REGEX,
  IS_SELF_TRAIT_REGEX, IS_SELF_COLOR_REGEX, IS_SELF_COMPLEX_REGEX,
  IS_STAT_COND_REGEX, IS_PLAYER_LV_REGEX
} from './src/logic/regexPatterns';
import { resolveCardTypes, getAliasNames } from './src/logic/searchHelpers';
import CardGridItem from './src/components/CardGridItem';
import RangeTrack from './src/components/RangeTrack';

const safeKeywordImages = keywordImages || {};

// 🌟 強制注入 Web 專用的客製化捲軸樣式
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9; 
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #cbd5e1; 
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: #94a3b8; 
    }
  `;
  document.head.appendChild(style);
}

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
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isPanelScrolledToBottom, setIsPanelScrolledToBottom] = useState(false);
  
  // 🌟 新增：登場作品狀態
  const [selectedSeries, setSelectedSeries] = useState('全部');
  const [isSeriesExpanded, setIsSeriesExpanded] = useState(false);

  // 🌟 新增：動態生成登場作品清單 (並自動依照 series_sort 排序)
  const seriesOptions = useMemo(() => {
    const options = ['全部'];
    const seriesMap = new Map();
    cardsData.forEach(c => {
      const name = c[`series_${language}`] || '其他';
      const sort = c.series_sort || 999;
      if (name !== '-' && !seriesMap.has(name)) seriesMap.set(name, sort);
    });
    Array.from(seriesMap.entries())
      .sort((a, b) => a[1] - b[1])
      .forEach(e => options.push(e[0]));
    return options;
  }, [language]);

  const [apRange, setApRange] = useState([0, 9]); 
  const [hpRange, setHpRange] = useState([0, 9]); 

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

  // 🌟 新功能 1：網頁初次載入時，攔截 URL 並精準分流常規與分身卡片
  useEffect(() => {
    if (typeof window !== 'undefined' && cardsData.length > 0) {
      const path = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      let targetId = urlParams.get('card');

      if (path.startsWith('/card/')) {
        targetId = path.split('/card/')[1];
      }

      if (targetId) {
        const decodedTargetId = decodeURIComponent(targetId).toUpperCase();

        // 🔍 第一步：先嘗試「精準匹配」卡片 ID (包含帶有後綴的分身 ID，如 ST09-010_C-PLUS 或 PROMO001)
        let targetCard = cardsData.find(c => c.id && c.id.toUpperCase() === decodedTargetId);

        // 🔍 第二步：如果第一步找不到，代表玩家輸入的是「純卡號」(例如網址輸入 /card/ST01-001)
        if (!targetCard) {
          // 撈出所有 displayId 或是純 id 符合該卡號的所有分身
          const matches = cardsData.filter(c => 
            (c.displayId && c.displayId.toUpperCase() === decodedTargetId) ||
            (c.id && c.id.toUpperCase() === decodedTargetId)
          );
          
          if (matches.length > 0) {
            // 🌟 核心防呆：從這一堆分身中，優先挑選出「非異畫」且「非重印」且「非BETA」的【常規卡本體】
            targetCard = matches.find(c => 
              !c._isAltArt && !c._isReprint && !c.isBetaCard && !c.isPromoCard && !c.isLimitedCard
            ) || matches[0]; // 如果這張卡本質上就只有出過 PROMO 版，就拿陣列第一張保底
          }
        }

        if (targetCard) {
          setSelectedCard(targetCard);
        }
      }
    }
  }, [cardsData]); // 監聽 cardsData，確保資料庫載入完畢後才會出動

  // 🌟 新功能 2：當玩家點開卡片詳情時，將最精準的卡片 ID 靜默同步到網址列
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedCard) {
        // 直接使用 selectedCard.id，它在普卡時是 "ST01-001"，在異畫時是 "ST09-010_C-PLUS"，極度精準！
        const slug = selectedCard.id;
        window.history.replaceState(null, '', `/card/${slug}`);
      } else {
        // 關閉卡片彈窗，網址乾淨回到首頁
        window.history.replaceState(null, '', '/');
      }
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
    // 🌟 新增：重置作品篩選
    setSelectedSeries('全部'); setIsSeriesExpanded(false);
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
      setSelectedSeries(lastState.selectedSeries || '全部'); // 🌟 歷史還原
      setSelectedCard(lastState.card); setPendingScrollY(lastState.scrollY || 0); setLastState(null);
    }
  };

  const executeRedirect = () => {
    if (selectedCard) setLastState({
        card: selectedCard, searchText, selectedSet, selectedColors, selectedTypes, selectedRarity, selectedVersions, includeRegular, includeBeta, includeReprint, includeLimited, includePromo, selectedResonance, resonanceMatchId,
        selectedKeywords, selectedTimings, supportValue, breakthroughValue, repairValue, traitSearchText, isTraitExactMatch, lvRange, costRange, apRange, hpRange,
        selectedSeries, // 🌟 跳轉時記錄當前作品
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

    // 🌟 新增：登場作品篩選邏輯
    const cardSeries = card[`series_${language}`] || card.series_source || '其他';
    const matchesSeries = selectedSeries === '全部' || cardSeries === selectedSeries;

    return matchesSearch && matchesSet && matchesColor && matchesType && matchesRarity && matchesTrait && matchesKeyword && matchesTiming && matchesVersion && matchesLv && matchesCost && matchesAp && matchesHp && matchesResonance && matchesSeries;
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
      else if (event.key === 'Escape') { setSelectedCard(null); }
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

  // 🌟 新增：點擊作品直接觸發篩選
  const handleSeriesClick = (seriesName) => {
    if (!seriesName || seriesName === '-' || seriesName === '全部') return;
    executeRedirect(); 
    handleResetEverything();
    setSelectedSeries(seriesName);
  };

  // 🌟 新增：監聽語言切換，同步更新作品篩選器的藍字與狀態
  useEffect(() => {
    if (selectedSeries !== '全部') {
      const matchedCard = cardsData.find(c => c.series_hk === selectedSeries || c.series_tw === selectedSeries || c.series_source === selectedSeries);
      if (matchedCard) {
        const newSeriesName = matchedCard[`series_${language}`] || matchedCard.series_source || '全部';
        setSelectedSeries(newSeriesName);
      }
    }
  }, [language]);


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
                    <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true} persistentScrollbar={true} className="custom-scrollbar">
                      {AVAILABLE_SETS.map((setOpt) => (
                        <TouchableOpacity 
                          key={setOpt} 
                          style={[styles.dropdownItem, selectedSet === setOpt && styles.dropdownItemActive]} 
                          onPress={() => { 
                            setSelectedSet(setOpt); 
                            setIsSetDropdownOpen(false);
                            
                            if (setOpt && setOpt.includes('Ver.β')) {
                              setIncludeRegular(false);
                              setIncludeBeta(true);
                            } else {
                              setIncludeRegular(true);
                              setIncludeBeta(false);
                            }
                          }}
                        >
                          <Text style={[styles.dropdownItemText, selectedSet === setOpt && { color: '#fff', fontWeight: 'bold' }]}>{setOpt === 'all' ? '收錄彈' : setOpt}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* 🌟 方案 B：手機版專屬下拉提示漸層與箭頭 */}
                    {isMobile && (
                      <View style={styles.dropdownScrollHint} pointerEvents="none">
                        <Text style={styles.dropdownScrollHintText}>▼ 向下滑動</Text>
                      </View>
                    )}
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
                    
                    {/* 🌟 登場作品篩選 (自訂摺疊下拉式) */}
                    <View style={[styles.panelRow, {flexDirection: 'column', alignItems: 'stretch'}]}>
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 10 }}
                        onPress={() => setIsSeriesExpanded(!isSeriesExpanded)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.panelLabel}>登場作品 : <Text style={{color: '#007BFF'}}>{selectedSeries}</Text></Text>
                        <Text style={{ fontSize: 16, color: '#666', fontWeight: 'bold' }}>{isSeriesExpanded ? '▲' : '▼'}</Text>
                      </TouchableOpacity>
                      
                      {isSeriesExpanded && (
                        <View style={styles.chipContainerRow}>
                          {seriesOptions.map(series => (
                            <TouchableOpacity
                              key={series}
                              style={[styles.filterChip, selectedSeries === series && { backgroundColor: '#334155', borderColor: '#334155' }]}
                              onPress={() => { setSelectedSeries(series); setIsSeriesExpanded(false); }}
                            >
                              <Text style={[styles.chipText, selectedSeries === series && { color: '#fff', fontWeight: 'bold' }]}>
                                {series}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

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

            {/* 🌟 修正：將底部小灰條改為「點擊收起」，加大判定範圍，防呆且直覺 */}
            {isFilterPanelOpen && isMobile && (
              <TouchableOpacity 
                style={[styles.bottomDragSpace, { paddingBottom: 15, paddingTop: 15 }]} 
                activeOpacity={0.6}
                onPress={() => setIsFilterPanelOpen(false)}
              >
                <View style={styles.dragHandlePill} />
              </TouchableOpacity>
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
          renderItem={({ item }) => <CardGridItem item={item} dynamicCardWidth={dynamicCardWidth} language={language} onPress={(i) => { setSelectedCard(i); }} isMobile={isMobile} />}
          numColumns={numColumns} ListEmptyComponent={<Text style={styles.emptyText}>找不到符合的卡片</Text>} contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>

      <Modal visible={selectedCard !== null} animationType="fade" transparent={true}>
        {selectedCard && (
          <View style={[styles.modalOverlay, isMobile && { padding: 10 }]}>
            {/* 🌟 左箭嘴：強制固定在左側 4px 處 */}
            <TouchableOpacity style={[styles.floatingArrowButton, isMobile ? { left: 4, width: 42, height: 42, borderRadius: 21, marginTop: -21, backgroundColor: 'rgba(0,0,0,0.7)' } : styles.leftArrowPosition, !hasPrev && styles.arrowDisabled]} onPress={handlePrevCard} disabled={!hasPrev}>
              <Text style={[styles.floatingArrowText, isMobile && {fontSize: 18}]}>&lt;</Text>
            </TouchableOpacity>
            

            <TouchableOpacity activeOpacity={1} style={[styles.modalContentBox, isMobile && { maxHeight: '96%' }]}>
              
              <View style={[styles.modalTopBar, isMobile && { paddingHorizontal: 8, paddingVertical: 8, flexWrap: 'nowrap', gap: 4 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 4 : 8, flexShrink: 1 }}>
                  
                  {/* 🌟 終極 UX 升級：在卡片詳情裡直接顯示返回上一層的按鈕 */}
                  {lastState && (
                    <TouchableOpacity 
                      style={[styles.backToCardBtn, { backgroundColor: '#334155', marginRight: 4 }, isMobile && { height: 28, paddingHorizontal: 8 }]} 
                      onPress={restoreHistoryState} 
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.backToCardBtnText, { color: '#fff' }, isMobile && { fontSize: 10 }]}>
                        🔙 返回 ({lastState.card.displayId || lastState.card.id})
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* 🌟 修復的語系按鈕區塊 (已經移除重複的標籤) */}
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
                  {/* 🌟 已經修復失憶咒的關閉按鈕 */}
                  <TouchableOpacity style={[styles.closeButton, isMobile && { width: 28, height: 28 }]} onPress={() => { setSelectedCard(null); }}><Text style={[styles.closeButtonText, isMobile && { fontSize: 14 }]}>X</Text></TouchableOpacity>
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
                    {cardImages[selectedCard.id] ? 
                      <Image source={{ uri: cardImages[selectedCard.id] }} style={[styles.cardImage, isMobile && { width: 250, height: 347 }]} resizeMode="contain" /> 
                      : <View style={[styles.cardImage, styles.noImagePlaceholder, isMobile && { width: 250, height: 347 }]}><Text style={styles.noImageText}>圖片準備中</Text></View>}
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
                    
                    <View style={styles.officialSectionDivider}>
                      <Text style={styles.sectionTitle}>登場作品</Text>
                      <TouchableOpacity activeOpacity={0.7} onPress={() => handleSeriesClick(selectedCard[`series_${language}`] || selectedCard.series_source)}>
                        <Text style={[styles.sectionBodyText, styles.interactiveBoldToken]}>
                          {selectedCard[`series_${language}`] || selectedCard.series_source || '-'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                  </View>
                </View>
              </ScrollView>
            </TouchableOpacity>
            
            {/* 🌟 右箭嘴：強制固定在右側 4px 處 */}
            <TouchableOpacity style={[styles.floatingArrowButton, isMobile ? { right: 4, width: 42, height: 42, borderRadius: 21, marginTop: -21, backgroundColor: 'rgba(0,0,0,0.7)' } : styles.rightArrowPosition, !hasNext && styles.arrowDisabled]} onPress={handleNextCard} disabled={!hasNext}>
              <Text style={[styles.floatingArrowText, isMobile && {fontSize: 18}]}>&gt;</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}