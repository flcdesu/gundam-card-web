import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, ScrollView, TextInput, Modal } from 'react-native';
import { getStyles } from '../styles';
import { cardImages, AVAILABLE_SETS } from '../data/cardDatabase';
import { 
  COLOR_TRANSLATION_MAP, COLOR_OPTIONS, TYPE_OPTIONS, RARITY_OPTIONS
} from '../constants';

// 🌟 將 Token 類卡片徹底排除出構築器
const EXCLUDED_TYPES = ['RESOURCE', 'EX BASE', 'EX RESOURCE', 'UNIT TOKEN', 'TOKEN'];
const colorEmoji = { Blue: '🔵', Green: '🟢', Red: '🔴', Purple: '🟣', White: '⚪' };
const chipBtnStyle = (active, dm, activeBg) => ({
  paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginRight: 4, marginBottom: 4,
  backgroundColor: active ? (activeBg || (dm ? '#38bdf8' : '#334155')) : (dm ? '#334155' : '#f1f5f9'),
  borderWidth: 1, borderColor: active ? (activeBg || (dm ? '#38bdf8' : '#334155')) : (dm ? '#475569' : '#e2e8f0'),
});
const chipTxtStyle = (active, dm, activeText) => ({
  fontSize: 10, fontWeight: 'bold',
  color: active ? (activeText || (dm ? '#0f172a' : '#fff')) : (dm ? '#94a3b8' : '#475569'),
});

const DeckBuilder = ({ 
  language, isDarkMode, isMobile, screenWidth, onClose, cardsData, onNavigate
}) => {
  const styles = getStyles(isDarkMode);
  const dm = isDarkMode;
  
  // ====== Deck State ======
  const [deckMap, setDeckMap] = useState(new Map());
  const [validationEnabled, setValidationEnabled] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTextExportModal, setShowTextExportModal] = useState(false);
  const [importText, setImportText] = useState('');

  // ====== Filter State (構築器專用) ======
  const [searchText, setSearchText] = useState('');
  const [filterColors, setFilterColors] = useState(['all']);
  const [filterTypes, setFilterTypes] = useState(['all']);
  const [filterRarity, setFilterRarity] = useState('all');
  
  // 🌟 新增的進階篩選狀態 (預設只顯示普畫與常規入手卡牌)
  const [filterVersions, setFilterVersions] = useState(['Normal']);
  const [filterAcq, setFilterAcq] = useState(['Regular']);
  const [selectedSet, setSelectedSet] = useState('all');
  const [isSetDropdownOpen, setIsSetDropdownOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ====== Derived ======
  const deckEntries = useMemo(() => Array.from(deckMap.values()), [deckMap]);
  const totalCards = useMemo(() => deckEntries.reduce((s, e) => s + e.count, 0), [deckEntries]);
  const colorsInDeck = useMemo(() => {
    const c = new Set();
    deckEntries.forEach(e => { if (e.card.color && e.card.color !== '-') c.add(e.card.color); });
    return Array.from(c);
  }, [deckEntries]);

  // ====== Validation ======
  const violations = useMemo(() => {
    if (!validationEnabled) return [];
    const v = [];
    if (totalCards > 50) v.push(`卡牌數量超過上限 (${totalCards}/50)`);
    if (colorsInDeck.length > 2) v.push(`顏色超過2色 (${colorsInDeck.map(c => COLOR_TRANSLATION_MAP[c] || c).join('、')})`);
    deckEntries.forEach(e => {
      if (e.count > 4) v.push(`「${e.card[`name_${language}`] || e.card.displayId}」超過4張 (${e.count}張)`);
    });
    return v;
  }, [validationEnabled, totalCards, colorsInDeck, deckEntries, language]);

  // ====== Filtered Card Pool ======
  const availableCards = useMemo(() => {
    let cards = cardsData.filter(c => !EXCLUDED_TYPES.includes(c.type));
    
    // 🌟 1. 卡圖 (Versions) 與 入手 (Acquisition)
    const noVersionFilter = filterVersions.includes('all');
    const noAcqFilter = filterAcq.includes('all');
    const noSetFilter = selectedSet === 'all';

    if (noVersionFilter && noAcqFilter && noSetFilter) {
        cards = cards.filter(c => !c._isAltArt && !c._isReprint);
    } else {
        if (!noVersionFilter) {
            cards = cards.filter(c => {
                if (filterVersions.includes('Normal') && !c._isAltArt) return true;
                if (filterVersions.includes('Alt') && c._isAltArt) return true;
                if (filterVersions.includes('Alt+') && (c.id || '').includes('_PLUS') && !(c.id || '').includes('_PLUSPLUS')) return true;
                if (filterVersions.includes('Alt++') && (c.id || '').includes('_PLUSPLUS')) return true;
                if (filterVersions.includes('Alt_SEC') && (c.id || '').includes('_SEC')) return true;
                return false;
            });
        }
        if (!noAcqFilter) {
            cards = cards.filter(c => {
                const isRegular = !c.isBetaCard && !c._isReprint && !c.isLimitedCard && !c.isPromoCard;
                if (filterAcq.includes('Regular') && isRegular) return true;
                if (filterAcq.includes('Beta') && c.isBetaCard) return true;
                if (filterAcq.includes('Reprint') && c._isReprint) return true;
                if (filterAcq.includes('Limited') && c.isLimitedCard) return true;
                if (filterAcq.includes('Promo') && c.isPromoCard) return true;
                return false;
            });
        }
    }

    // 🌟 2. 收錄彈 (Set)
    if (!noSetFilter) {
        cards = cards.filter(c => {
            const normSet = (c.set || '').replace(/\[beta\]/gi, 'LIMITED BOX Ver.β');
            return normSet === selectedSet;
        });
    }

    // 3. 原本的篩選 (顏色、種類、稀有度、搜尋)
    if (!filterColors.includes('all')) cards = cards.filter(c => filterColors.includes(c.color));
    if (!filterTypes.includes('all')) {
      cards = cards.filter(c => {
        if (filterTypes.includes(c.type)) return true;
        if (filterTypes.includes('TOKEN') && (c.type === 'UNIT TOKEN' || c.type === 'TOKEN')) return true;
        if (filterTypes.includes('COMMAND_PILOT') && c.type === 'COMMAND') {
          const eff = c[`effect_${language}`] || '';
          const tr = c[`traits_${language}`] || '';
          return eff.includes('【機師】') || tr.includes('【機師】') || tr.includes('機師');
        }
        return false;
      });
    }
    if (filterRarity !== 'all') cards = cards.filter(c => (c.rarity || '').replace(/[^a-zA-Z]/g, '').toUpperCase() === filterRarity);
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      cards = cards.filter(c => {
        const name = (c[`name_${language}`] || '').toLowerCase();
        const id = (c.displayId || c.id || '').toLowerCase();
        const eff = (c[`effect_${language}`] || '').toLowerCase();
        return name.includes(q) || id.includes(q) || eff.includes(q);
      });
    }
    return cards;
  }, [cardsData, filterColors, filterTypes, filterRarity, filterVersions, filterAcq, selectedSet, searchText, language]);

  // ====== Deck Actions ======
  const addCard = useCallback((card) => {
    const key = card.displayId || card.id;
    setDeckMap(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(key);
      const currentTotal = Array.from(prev.values()).reduce((s, e) => s + e.count, 0);
      if (existing) {
        if (validationEnabled && existing.count >= 4) return prev;
        if (validationEnabled && currentTotal >= 50) return prev;
        newMap.set(key, { card: existing.card, count: existing.count + 1 });
      } else {
        if (validationEnabled && currentTotal >= 50) return prev;
        const currentColors = new Set();
        prev.forEach(e => { if (e.card.color && e.card.color !== '-') currentColors.add(e.card.color); });
        if (validationEnabled && currentColors.size >= 2 && card.color && !currentColors.has(card.color) && card.color !== '-') return prev;
        newMap.set(key, { card, count: 1 });
      }
      return newMap;
    });
  }, [validationEnabled]);

  const removeCard = useCallback((displayId) => {
    setDeckMap(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(displayId);
      if (existing) {
        if (existing.count > 1) newMap.set(displayId, { card: existing.card, count: existing.count - 1 });
        else newMap.delete(displayId);
      }
      return newMap;
    });
  }, []);

  const removeAll = useCallback((displayId) => {
    setDeckMap(prev => { const n = new Map(prev); n.delete(displayId); return n; });
  }, []);

  const clearDeck = () => setDeckMap(new Map());

  // ====== Toggle helpers ======
  const toggleFilter = (val, state, setter) => {
    if (val === 'all') { setter(['all']); return; }
    let next = state.filter(v => v !== 'all');
    if (next.includes(val)) next = next.filter(v => v !== val);
    else next.push(val);
    setter(next.length === 0 ? ['all'] : next);
  };

  // ====== Text Export ======
  const exportTextList = useMemo(() => {
    return sortedDeckFn(deckEntries).map(e => `${e.count}x ${e.card.displayId || e.card.id}`).join('\n');
  }, [deckEntries]);

  // ====== Text Import ======
  const handleImport = () => {
    const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
    const newMap = new Map();
    lines.forEach(line => {
      const match = line.match(/^(\d+)x?\s+(.+)$/i);
      if (!match) return;
      const count = Math.min(parseInt(match[1], 10), 4);
      const targetId = match[2].trim().toUpperCase();
      if (count <= 0) return;
      
      // 🌟 嚴格尋找最基礎的版本 (排除異畫、重印、Beta、限定卡、PR卡)
      const card = cardsData.find(c => {
        const did = (c.displayId || c.id || '').toUpperCase();
        return did === targetId && !c._isAltArt && !c._isReprint && !c.isBetaCard && !c.isLimitedCard && !c.isPromoCard;
      }) || cardsData.find(c => (c.displayId || c.id || '').toUpperCase() === targetId);
      
      if (card && !EXCLUDED_TYPES.includes(card.type)) {
        const key = card.displayId || card.id;
        newMap.set(key, { card, count });
      }
    });
    setDeckMap(newMap);
    setShowImportModal(false);
    setImportText('');
  };

  // ====== Screenshot ======
  const handleScreenshot = async () => {
    setShowExport(true);
    setTimeout(async () => {
      try {
        const html2canvas = (await import('html2canvas')).default;
        const el = document.getElementById('deck-export-area');
        if (!el) return;
        const canvas = await html2canvas(el, { backgroundColor: dm ? '#0f172a' : '#ffffff', scale: 2, useCORS: true });
        const link = document.createElement('a');
        link.download = `GCG_Deck_${new Date().toISOString().slice(0,10)}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (err) { console.error('Export failed:', err); }
      setShowExport(false);
    }, 300);
  };

  // ====== Layout ======
  const isWide = screenWidth > 900;
  const poolColumns = isMobile ? 3 : Math.max(2, Math.floor((isWide ? screenWidth * 0.55 : screenWidth) / 180));
  const poolCardWidth = isMobile ? (screenWidth - 30) / 3 - 8 : 160;
  const deckCardSize = isMobile ? 70 : 90;

  // ====== Sorted deck ======
  const sortedDeck = useMemo(() => sortedDeckFn(deckEntries), [deckEntries]);

  // ====== Filter types for builder (no Resource/EX/Token) ======
  const builderTypeOptions = TYPE_OPTIONS.filter(t => !EXCLUDED_TYPES.includes(t.value));
  
  // 🌟 給新篩選器用的常數陣列 (濾掉底層自帶的 'all')
  const displaySets = useMemo(() => ['all', ...new Set((AVAILABLE_SETS || []).filter(s => s !== 'all').map(s => (s || '').replace(/\[beta\]/gi, 'LIMITED BOX Ver.β')))], []);
  const ACQ_OPTIONS = [ { value: 'Regular', label: '常規' }, { value: 'Beta', label: 'BETA', activeBg: '#f97316', activeText: '#fff' }, { value: 'Reprint', label: '重印' }, { value: 'Limited', label: '限定' }, { value: 'Promo', label: '推廣' } ];
  const VERSION_OPTIONS = [ { value: 'Normal', label: '普畫', activeBg: '#2563eb', activeText: '#fff' }, { value: 'Alt', label: '異畫 (全開)', activeBg: '#d97706', activeText: '#fff' }, { value: 'Alt+', label: '異畫+' }, { value: 'Alt++', label: '異畫++' }, { value: 'Alt_SEC', label: '異畫 (SP)' } ];

  // ====== Compact chip renderer ======
  const Chip = ({ label, active, onPress, activeBg, activeText }) => (
    <TouchableOpacity style={chipBtnStyle(active, dm, activeBg)} onPress={onPress} activeOpacity={0.7}>
      <Text style={chipTxtStyle(active, dm, activeText)}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: dm ? '#0f172a' : '#f0f2f5' }}>
      {/* ====== Toolbar ====== */}
      <View style={{
        backgroundColor: dm ? '#1e293b' : '#ffffff',
        borderBottomWidth: 1, borderBottomColor: dm ? '#334155' : '#e2e8f0',
        paddingHorizontal: isMobile ? 10 : 20, paddingVertical: 8,
        flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: totalCards === 50 ? '#10b981' : totalCards > 50 ? '#ef4444' : dm ? '#f8fafc' : '#1e293b' }}>
            {totalCards}/50
          </Text>
          {colorsInDeck.length > 0 && (
            <Text style={{ fontSize: 13 }}>
              {colorsInDeck.map(c => colorEmoji[c] || '⬜').join('')} {colorsInDeck.length}色
            </Text>
          )}
        </View>

        <TouchableOpacity style={{ ...btnBase(dm), backgroundColor: validationEnabled ? (dm ? '#10b981' : '#059669') : (dm ? '#334155' : '#e2e8f0') }} onPress={() => setValidationEnabled(!validationEnabled)}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: validationEnabled ? '#fff' : (dm ? '#94a3b8' : '#64748b') }}>{validationEnabled ? '☑ 驗證' : '☐ 驗證'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={btnBase(dm)} onPress={handleScreenshot} disabled={totalCards === 0}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: totalCards === 0 ? (dm ? '#475569' : '#94a3b8') : (dm ? '#f8fafc' : '#1e293b') }}>截圖</Text>
        </TouchableOpacity>

        <TouchableOpacity style={btnBase(dm)} onPress={() => setShowTextExportModal(true)} disabled={totalCards === 0}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: totalCards === 0 ? (dm ? '#475569' : '#94a3b8') : (dm ? '#f8fafc' : '#1e293b') }}>匯出</Text>
        </TouchableOpacity>

        <TouchableOpacity style={btnBase(dm)} onPress={() => setShowImportModal(true)}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: dm ? '#f8fafc' : '#1e293b' }}>匯入</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ ...btnBase(dm), backgroundColor: '#ef4444', borderColor: '#ef4444' }} onPress={clearDeck}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#fff' }}>清空</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ ...btnBase(dm), marginLeft: 'auto' }} onPress={onClose}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: dm ? '#f8fafc' : '#1e293b' }}>✕ 返回</Text>
        </TouchableOpacity>
      </View>

      {/* ====== Violations ====== */}
      {violations.length > 0 && (
        <View style={{ backgroundColor: dm ? '#450a0a' : '#fef2f2', borderBottomWidth: 1, borderBottomColor: dm ? '#7f1d1d' : '#fecaca', paddingHorizontal: 16, paddingVertical: 6 }}>
          {violations.map((v, i) => <Text key={i} style={{ fontSize: 11, color: '#ef4444', fontWeight: 'bold' }}>⚠️ {v}</Text>)}
        </View>
      )}

      {/* ====== Main Content ====== */}
      <View style={{ flex: 1, flexDirection: isWide ? 'row' : 'column' }}>
        
        {/* ====== Deck Preview ====== */}
        <View style={{
          width: isWide ? '40%' : '100%', height: isWide ? '100%' : (isMobile ? 180 : 260),
          borderRightWidth: isWide ? 1 : 0, borderBottomWidth: isWide ? 0 : 1,
          borderColor: dm ? '#334155' : '#e2e8f0', backgroundColor: dm ? '#0f172a' : '#f8fafc',
        }}>
          <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: dm ? '#334155' : '#e2e8f0' }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: dm ? '#94a3b8' : '#64748b' }}>牌組 ({totalCards} 張)</Text>
          </View>
          <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', padding: 6, gap: 4 }}>
            {sortedDeck.map((entry) => {
              const key = entry.card.displayId || entry.card.id;
              const cBar = { Blue: '#0070b9', Green: '#63a63d', Red: '#be0453', Purple: '#744b92', White: '#94a3b8' };
              return (
                <TouchableOpacity key={key} style={{ width: deckCardSize, borderRadius: 5, overflow: 'hidden', borderWidth: 2, borderColor: cBar[entry.card.color] || (dm ? '#475569' : '#cbd5e1'), backgroundColor: dm ? '#1e293b' : '#fff' }}
                  onPress={() => removeCard(key)} onLongPress={() => removeAll(key)} activeOpacity={0.7}>
                  <View style={{ width: '100%', height: deckCardSize * 1.2, backgroundColor: dm ? '#334155' : '#eaeaea' }}>
                    {cardImages[entry.card.id] ? <Image source={{ uri: cardImages[entry.card.id] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 7, color: '#999' }}>No img</Text></View>}
                    <View style={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 8, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: '#fff' }}>×{entry.count}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 7, fontWeight: 'bold', color: dm ? '#cbd5e1' : '#374151', paddingHorizontal: 2, paddingVertical: 1 }} numberOfLines={1}>{entry.card[`name_${language}`] || key}</Text>
                </TouchableOpacity>
              );
            })}
            {totalCards === 0 && <Text style={{ fontSize: 12, color: dm ? '#475569' : '#94a3b8', padding: 16 }}>點擊下方卡牌加入牌組</Text>}
          </ScrollView>
        </View>

        {/* ====== Card Pool ====== */}
        <View style={{ flex: 1 }}>
          {/* Search bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, gap: 6, borderBottomWidth: 1, borderBottomColor: dm ? '#334155' : '#e2e8f0', backgroundColor: dm ? '#1e293b' : '#fff' }}>
            <TextInput
              style={{ flex: 1, height: 32, backgroundColor: dm ? '#0f172a' : '#f1f5f9', borderRadius: 16, paddingHorizontal: 12, fontSize: 12, color: dm ? '#f8fafc' : '#1e293b', borderWidth: 1, borderColor: dm ? '#334155' : '#e2e8f0' }}
              placeholder="搜尋卡牌名稱、編號或效果..."
              placeholderTextColor={dm ? '#64748b' : '#94a3b8'}
              value={searchText} onChangeText={setSearchText}
            />
            {searchText !== '' && <TouchableOpacity onPress={() => setSearchText('')}><Text style={{ fontSize: 14, color: dm ? '#94a3b8' : '#64748b' }}>✕</Text></TouchableOpacity>}
            <TouchableOpacity style={{ ...btnBase(dm), backgroundColor: isFilterOpen ? (dm ? '#38bdf8' : '#0ea5e9') : (dm ? '#334155' : '#e2e8f0') }} onPress={() => setIsFilterOpen(!isFilterOpen)}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: isFilterOpen ? (dm ? '#000' : '#fff') : (dm ? '#94a3b8' : '#64748b') }}>{isFilterOpen ? '▲ 篩選' : '▼ 篩選'}</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 10, color: dm ? '#475569' : '#94a3b8' }}>{availableCards.length}張</Text>
          </View>

          {/* Collapsible Filter */}
          {isFilterOpen && (
            <View style={{ backgroundColor: dm ? '#1e293b' : '#f8fafc', borderBottomWidth: 1, borderBottomColor: dm ? '#334155' : '#e2e8f0' }}>
              {/* 🌟 換成 ScrollView 並強制顯示捲軸 */}
              <ScrollView 
                style={{ maxHeight: isMobile ? 260 : undefined }} // 微調一下箱子高度，視覺更俐落
                contentContainerStyle={{ 
                  paddingHorizontal: 10, 
                  paddingVertical: 8, 
                  paddingBottom: isMobile ? 120 : 20 // 🌟 魔法氣墊：手機版底部加入超大留白，讓面板「永遠可以往上推」！
                }} 
                nestedScrollEnabled={true} 
                showsVerticalScrollIndicator={true} 
                persistentScrollbar={true} 
              >
                {/* 收錄彈 (下拉式選單) */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, zIndex: 50 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: dm ? '#94a3b8' : '#64748b', width: 45, marginTop: 8 }}>收錄彈</Text>
                  <View style={{ width: isMobile ? '80%' : 240 }}>
                    {/* 下拉按鈕 */}
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                        backgroundColor: dm ? '#0f172a' : '#f1f5f9',
                        borderWidth: 1, borderColor: dm ? '#334155' : '#e2e8f0',
                        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
                      }}
                      onPress={() => setIsSetDropdownOpen(!isSetDropdownOpen)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: dm ? '#cbd5e1' : '#334155' }} numberOfLines={1}>
                        {selectedSet === 'all' ? '全部收錄彈' : selectedSet}
                      </Text>
                      <Text style={{ fontSize: 10, color: dm ? '#64748b' : '#94a3b8' }}>
                        {isSetDropdownOpen ? '▲' : '▼'}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* 下拉選單列表 */}
                    {isSetDropdownOpen && (
                      <View style={{
                        marginTop: 4, backgroundColor: dm ? '#1e293b' : '#ffffff',
                        borderWidth: 1, borderColor: dm ? '#334155' : '#e2e8f0',
                        borderRadius: 8, overflow: 'hidden', maxHeight: 200,
                      }}>
                        <ScrollView nestedScrollEnabled={true}>
                          {displaySets.map(opt => (
                            <TouchableOpacity
                              key={opt}
                              style={{
                                paddingHorizontal: 12, paddingVertical: 8,
                                backgroundColor: selectedSet === opt ? (dm ? '#38bdf8' : '#e0f2fe') : 'transparent',
                                borderBottomWidth: 1, borderBottomColor: dm ? '#334155' : '#f1f5f9',
                              }}
                              onPress={() => {
                                setSelectedSet(opt);
                                setIsSetDropdownOpen(false);
                              }}
                            >
                              <Text style={{
                                fontSize: 11,
                                fontWeight: selectedSet === opt ? 'bold' : 'normal',
                                color: selectedSet === opt ? (dm ? '#0f172a' : '#0369a1') : (dm ? '#cbd5e1' : '#475569')
                              }}>
                                {opt === 'all' ? '全部收錄彈' : opt}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>
                {/* 卡圖 */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: dm ? '#94a3b8' : '#64748b', width: 45 }}>卡圖</Text>
                  {VERSION_OPTIONS.map(o => <Chip key={o.value} label={o.label} active={filterVersions.includes(o.value)} activeBg={o.activeBg} activeText={o.activeText} onPress={() => toggleFilter(o.value, filterVersions, setFilterVersions)} />)}
                </View>
                {/* 入手 */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: dm ? '#94a3b8' : '#64748b', width: 45 }}>入手</Text>
                  {ACQ_OPTIONS.map(o => <Chip key={o.value} label={o.label} active={filterAcq.includes(o.value)} activeBg={o.activeBg} activeText={o.activeText} onPress={() => toggleFilter(o.value, filterAcq, setFilterAcq)} />)}
                </View>
                {/* Color */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: dm ? '#94a3b8' : '#64748b', width: 45 }}>顏色</Text>
                  {COLOR_OPTIONS.map(o => <Chip key={o.value} label={o.label} active={filterColors.includes(o.value)} activeBg={o.activeBg} activeText={o.activeText} onPress={() => toggleFilter(o.value, filterColors, setFilterColors)} />)}
                </View>
                {/* Type */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: dm ? '#94a3b8' : '#64748b', width: 45 }}>種類</Text>
                  {builderTypeOptions.map(o => <Chip key={o.value} label={o.label} active={filterTypes.includes(o.value)} onPress={() => toggleFilter(o.value, filterTypes, setFilterTypes)} />)}
                </View>
                {/* Rarity */}
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: dm ? '#94a3b8' : '#64748b', width: 45 }}>稀有</Text>
                  {RARITY_OPTIONS.map(o => <Chip key={o.value} label={o.label} active={filterRarity === o.value} activeBg={o.activeBg} activeText={o.activeText} onPress={() => setFilterRarity(o.value)} />)}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Card grid */}
          <FlatList
            data={availableCards} keyExtractor={(item) => item.id}
            numColumns={poolColumns} key={poolColumns}
            contentContainerStyle={{ padding: 6 }}
            renderItem={({ item }) => {
              const key = item.displayId || item.id;
              const inDeck = deckMap.get(key);
              const count = inDeck ? inDeck.count : 0;
              const isMaxed = validationEnabled && count >= 4;
              const cBar = { Blue: '#0070b9', Green: '#63a63d', Red: '#be0453', Purple: '#744b92', White: '#94a3b8' };
              return (
                <TouchableOpacity
                  style={{ width: poolCardWidth, margin: 3, borderRadius: 5, overflow: 'hidden', backgroundColor: dm ? '#1e293b' : '#fff', opacity: isMaxed ? 0.35 : 1, borderWidth: count > 0 ? 2 : 1, borderColor: count > 0 ? '#10b981' : (dm ? '#334155' : '#e2e8f0') }}
                  onPress={() => addCard(item)} activeOpacity={0.7} disabled={isMaxed && validationEnabled}>
                  <View style={{ width: '100%', height: poolCardWidth * 1.39, backgroundColor: dm ? '#334155' : '#eaeaea', position: 'relative' }}>
                    {cardImages[item.id] ? <Image source={{ uri: cardImages[item.id] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 8, color: '#999' }}>圖片準備中</Text></View>}
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: cBar[item.color] || 'transparent' }} />
                    {count > 0 && <View style={{ position: 'absolute', top: 3, right: 3, backgroundColor: '#10b981', borderRadius: 9, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 10, fontWeight: '900', color: '#fff' }}>×{count}</Text></View>}
                  </View>
                  <View style={{ padding: 3 }}>
                    <Text style={{ fontSize: 8, color: dm ? '#64748b' : '#94a3b8', fontWeight: 'bold' }} numberOfLines={1}>{item.displayId || item.id}</Text>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: dm ? '#cbd5e1' : '#374151' }} numberOfLines={1}>{item[`name_${language}`] || '名稱未定'}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>

      {/* ====== Footer Links ====== */}
      {onNavigate && (
        <View style={{
          flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20,
          paddingVertical: 10, borderTopWidth: 1,
          borderTopColor: dm ? '#1e293b' : '#e2e8f0',
          backgroundColor: dm ? '#0f172a' : '#f8fafc',
        }}>
          <TouchableOpacity onPress={() => onNavigate('about')}>
            <Text style={{ color: dm ? '#64748b' : '#94a3b8', fontWeight: 'bold', fontSize: 11 }}>關於本網</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate('disclaimer')}>
            <Text style={{ color: dm ? '#64748b' : '#94a3b8', fontWeight: 'bold', fontSize: 11 }}>免責聲明</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ====== Text Export Modal ====== */}
      <Modal visible={showTextExportModal} transparent animationType="fade">
        <View style={modalOverlay}>
          <View style={{ ...modalBox(dm), width: isMobile ? '90%' : 420 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: dm ? '#f8fafc' : '#1e293b', marginBottom: 12 }}>匯出牌組</Text>
            <View style={{ backgroundColor: dm ? '#0f172a' : '#f1f5f9', borderRadius: 8, padding: 12, marginBottom: 12, maxHeight: 300 }}>
              <ScrollView><Text style={{ fontSize: 13, color: dm ? '#cbd5e1' : '#374151', fontFamily: 'monospace', lineHeight: 22 }} selectable>{exportTextList || '(空牌組)'}</Text></ScrollView>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, ...btnBase(dm), justifyContent: 'center', alignItems: 'center', paddingVertical: 8, backgroundColor: dm ? '#38bdf8' : '#0ea5e9', borderColor: dm ? '#38bdf8' : '#0ea5e9' }}
                onPress={() => { navigator.clipboard.writeText(exportTextList); setShowTextExportModal(false); }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: dm ? '#000' : '#fff' }}>複製</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, ...btnBase(dm), justifyContent: 'center', alignItems: 'center', paddingVertical: 8 }} onPress={() => setShowTextExportModal(false)}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: dm ? '#f8fafc' : '#1e293b' }}>關閉</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ====== Import Modal ====== */}
      <Modal visible={showImportModal} transparent animationType="fade">
        <View style={modalOverlay}>
          <View style={{ ...modalBox(dm), width: isMobile ? '90%' : 420 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: dm ? '#f8fafc' : '#1e293b', marginBottom: 8 }}>匯入牌組</Text>
            <Text style={{ fontSize: 11, color: dm ? '#64748b' : '#94a3b8', marginBottom: 8 }}>每行格式：4x ST01-001</Text>
            <TextInput
              style={{ height: 200, backgroundColor: dm ? '#0f172a' : '#f1f5f9', borderRadius: 8, padding: 12, fontSize: 13, color: dm ? '#cbd5e1' : '#374151', fontFamily: 'monospace', borderWidth: 1, borderColor: dm ? '#334155' : '#e2e8f0', textAlignVertical: 'top' }}
              multiline placeholder={'4x ST01-001\n4x ST01-010\n2x GD01-035\n...'}
              placeholderTextColor={dm ? '#475569' : '#cbd5e1'}
              value={importText} onChangeText={setImportText}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity style={{ flex: 1, ...btnBase(dm), justifyContent: 'center', alignItems: 'center', paddingVertical: 8, backgroundColor: '#10b981', borderColor: '#10b981' }} onPress={handleImport}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>載入</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, ...btnBase(dm), justifyContent: 'center', alignItems: 'center', paddingVertical: 8 }} onPress={() => { setShowImportModal(false); setImportText(''); }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: dm ? '#f8fafc' : '#1e293b' }}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ====== Screenshot Export View ====== */}
      {showExport && (
        <View style={{ position: 'absolute', left: -9999, top: 0 }}>
          <div id="deck-export-area" style={{ width: 800, padding: 24, backgroundColor: dm ? '#0f172a' : '#ffffff', fontFamily: 'sans-serif' }}>
            <div style={{ marginBottom: 16, borderBottom: `2px solid ${dm ? '#334155' : '#e2e8f0'}`, paddingBottom: 12 }}>
              <div style={{ fontSize: 20, fontWeight: '900', color: dm ? '#f8fafc' : '#1e293b' }}>
                GCG 牌組 — {totalCards}/50 張 {colorsInDeck.map(c => colorEmoji[c] || '').join(' ')}
              </div>
              <div style={{ fontSize: 11, color: dm ? '#64748b' : '#94a3b8', marginTop: 4 }}>gcg.flcdesu.com</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {sortedDeck.map((entry) => {
                const key = entry.card.displayId || entry.card.id;
                const imgSrc = cardImages[entry.card.id];
                const cBar = { Blue: '#0070b9', Green: '#63a63d', Red: '#be0453', Purple: '#744b92', White: '#94a3b8' };
                return (
                  <div key={key} style={{ width: 100, borderRadius: 6, overflow: 'hidden', border: `2px solid ${cBar[entry.card.color] || '#cbd5e1'}`, backgroundColor: dm ? '#1e293b' : '#fff' }}>
                    <div style={{ position: 'relative', width: 100, height: 139 }}>
                      {imgSrc && <img src={imgSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />}
                      <div style={{ position: 'absolute', top: 3, right: 3, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 8, width: 22, height: 22, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 11, fontWeight: '900', color: '#fff' }}>×{entry.count}</div>
                    </div>
                    <div style={{ padding: '3px 4px', fontSize: 8, fontWeight: 'bold', color: dm ? '#94a3b8' : '#64748b' }}>{key}</div>
                    <div style={{ padding: '0 4px 4px', fontSize: 9, fontWeight: 'bold', color: dm ? '#cbd5e1' : '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.card[`name_${language}`] || key}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </View>
      )}
    </View>
  );
};

// ====== Helpers (outside component) ======
const btnBase = (dm) => ({
  paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  backgroundColor: dm ? '#334155' : '#e2e8f0', borderWidth: 1,
  borderColor: dm ? '#475569' : '#cbd5e1',
});
const modalOverlay = { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' };
const modalBox = (dm) => ({
  backgroundColor: dm ? '#1e293b' : '#ffffff', borderRadius: 16, padding: 20,
  shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
});
const sortedDeckFn = (entries) => [...entries].sort((a, b) => {
  const typeOrder = { UNIT: 0, PILOT: 1, COMMAND: 2, BASE: 3 };
  const ta = typeOrder[a.card.type] ?? 99;
  const tb = typeOrder[b.card.type] ?? 99;
  if (ta !== tb) return ta - tb;
  return (a.card.displayId || a.card.id).localeCompare(b.card.displayId || b.card.id, undefined, { numeric: true });
});

export default DeckBuilder;