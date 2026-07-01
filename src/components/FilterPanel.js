// 篩選面板 — 從 App.js 抽出，主頁和構築器共用
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { getStyles } from '../styles';
import RangeTrack from './RangeTrack';
import {
  COLOR_OPTIONS, TYPE_OPTIONS, RARITY_OPTIONS, VERSION_OPTIONS,
  RESONANCE_OPTIONS, KEYWORD_OPTIONS, TIMING_OPTIONS
} from '../constants';

/**
 * filterState = {
 *   selectedColors, selectedTypes, selectedRarity, selectedVersions,
 *   includeRegular, includeBeta, includeReprint, includeLimited, includePromo,
 *   selectedResonance, resonanceMatchId,
 *   selectedKeywords, selectedTimings,
 *   supportValue, breakthroughValue, repairValue,
 *   traitSearchText, isTraitExactMatch,
 *   lvRange, costRange, apRange, hpRange,
 *   selectedSeries, isSeriesExpanded, seriesOptions,
 *   isFilterPanelOpen,
 * }
 *
 * filterActions = {
 *   setSelectedColors, setSelectedTypes, setSelectedRarity, setSelectedVersions,
 *   setIncludeRegular, setIncludeBeta, setIncludeReprint, setIncludeLimited, setIncludePromo,
 *   setSelectedResonance, setResonanceMatchId,
 *   setSelectedKeywords, setSelectedTimings,
 *   setSupportValue, setBreakthroughValue, setRepairValue,
 *   setTraitSearchText, setIsTraitExactMatch,
 *   setLvRange, setCostRange, setApRange, setHpRange,
 *   setSelectedSeries, setIsSeriesExpanded,
 *   setIsFilterPanelOpen,
 *   toggleSelection, toggleVersionSelection, handleResetFilters,
 * }
 */

const FilterPanel = ({ filterState: fs, filterActions: fa, isMobile, isDarkMode, screenWidth }) => {
  const styles = getStyles(isDarkMode);
  const panelSwipeStartY = useRef(null);

  const renderKeywordChip = (opt) => {
    const isActive = fs.selectedKeywords.includes(opt.value);
    const isInputKw = opt.value === '支援' || opt.value === '突破' || opt.value === '修復';
    if (!isInputKw) {
      return (
        <TouchableOpacity key={opt.value} style={[styles.filterChip, isActive && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => fa.toggleSelection(opt.value, fs.selectedKeywords, fa.setSelectedKeywords)}>
          <Text style={[styles.chipText, isActive && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
        </TouchableOpacity>
      );
    } else {
      const val = opt.value === '支援' ? fs.supportValue : opt.value === '突破' ? fs.breakthroughValue : fs.repairValue;
      const setVal = opt.value === '支援' ? fa.setSupportValue : opt.value === '突破' ? fa.setBreakthroughValue : fa.setRepairValue;
      return (
        <View key={opt.value} style={[styles.filterChipWithInput, isActive && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]}>
          <TouchableOpacity style={styles.filterChipInner} onPress={() => fa.toggleSelection(opt.value, fs.selectedKeywords, fa.setSelectedKeywords)}>
            <Text style={[styles.chipText, isActive && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.keywordValInput, isActive && styles.keywordValInputActive]} maxLength={1} keyboardType="numeric" placeholder="X" placeholderTextColor={isActive ? '#94a3b8' : '#cbd5e1'} value={val}
            onChangeText={(t) => {
              const clean = t.replace(/[^0-9]/g, ''); setVal(clean);
              if (clean !== '' && !isActive) fa.toggleSelection(opt.value, fs.selectedKeywords, fa.setSelectedKeywords);
            }}
          />
        </View>
      );
    }
  };

  // Helper to render a chip row (handles mobile horizontal scroll)
  const ChipRow = ({ label, options, selected, onSelect, isMulti = true }) => (
    <View style={styles.panelRow}>
      <Text style={styles.panelLabel}>{label}</Text>
      {isMobile ? (
        <View style={styles.mobileGradientContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileHorizontalScroll}>
            {options.map((opt) => {
              const active = isMulti ? selected.includes(opt.value) : selected === opt.value;
              return (
                <TouchableOpacity key={opt.value} style={[styles.filterChip, active && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => onSelect(opt.value)}>
                  <Text style={[styles.chipText, active && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.chipContainerRow}>
          {options.map((opt) => {
            const active = isMulti ? selected.includes(opt.value) : selected === opt.value;
            return (
              <TouchableOpacity key={opt.value} style={[styles.filterChip, active && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => onSelect(opt.value)}>
                <Text style={[styles.chipText, active && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <View 
      style={[styles.bottomFilterSection, !fs.isFilterPanelOpen && { paddingVertical: 10 }]}
      onTouchStart={(e) => { panelSwipeStartY.current = e.nativeEvent.pageY; }}
      onTouchEnd={(e) => {
        if (!panelSwipeStartY.current || !fs.isFilterPanelOpen) return;
        const distance = e.nativeEvent.pageY - panelSwipeStartY.current;
        if (distance > 40) fa.setIsFilterPanelOpen(false);
        panelSwipeStartY.current = null;
      }}
    >
      {fs.isFilterPanelOpen && isMobile && (
        <View style={styles.dragHandleContainer}><View style={styles.dragHandlePill} /></View>
      )}

      <View style={[styles.panelHeaderRow, fs.isFilterPanelOpen && { marginBottom: 12 }]}>
        <TouchableOpacity style={styles.panelTitleToggleClickable} onPress={() => fa.setIsFilterPanelOpen(!fs.isFilterPanelOpen)} activeOpacity={0.7}>
          <Text style={styles.panelMainTitle}>篩選卡牌</Text>
          <Text style={styles.panelToggleIndicatorText}>{fs.isFilterPanelOpen ? '▲ 收起' : '▼ 展開'}</Text>
        </TouchableOpacity>
        {fs.isFilterPanelOpen && (
          <TouchableOpacity style={styles.panelResetBtn} onPress={fa.handleResetFilters}>
            <Text style={styles.panelResetBtnText}>重置面板</Text>
          </TouchableOpacity>
        )}
      </View>

      {fs.isFilterPanelOpen && (
        <ScrollView style={isMobile ? styles.mobilePanelVerticalContainer : null} nestedScrollEnabled showsVerticalScrollIndicator>
          <View style={styles.filterColumnsContainer}>
            {/* ====== Left Column ====== */}
            <View style={[styles.filterLeftColumn, screenWidth > 900 && styles.filterLeftColumnBorder]}>
              
              {/* 登場作品 */}
              <View style={[styles.panelRow, { flexDirection: 'column', alignItems: 'stretch' }]}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#475569' : '#eee', marginBottom: 10 }}
                  onPress={() => fa.setIsSeriesExpanded(!fs.isSeriesExpanded)} activeOpacity={0.7}
                >
                  <Text style={styles.panelLabel}>登場作品 : <Text style={{ color: isDarkMode ? '#38bdf8' : '#007BFF' }}>{fs.selectedSeries}</Text></Text>
                  <Text style={{ fontSize: 16, color: isDarkMode ? '#94a3b8' : '#666', fontWeight: 'bold' }}>{fs.isSeriesExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {fs.isSeriesExpanded && (
                  <View style={styles.chipContainerRow}>
                    {fs.seriesOptions.map(series => (
                      <TouchableOpacity key={series}
                        style={[styles.filterChip, fs.selectedSeries === series && { backgroundColor: isDarkMode ? '#38bdf8' : '#334155', borderColor: isDarkMode ? '#38bdf8' : '#334155' }]}
                        onPress={() => { fa.setSelectedSeries(series); fa.setIsSeriesExpanded(false); }}>
                        <Text style={[styles.chipText, fs.selectedSeries === series && { color: isDarkMode ? '#0f172a' : '#fff', fontWeight: 'bold' }]}>{series}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* 顏色 */}
              <ChipRow label="顏色" options={COLOR_OPTIONS} selected={fs.selectedColors} onSelect={(v) => fa.toggleSelection(v, fs.selectedColors, fa.setSelectedColors)} />

              {/* 種類 */}
              <View style={styles.panelRow}>
                <Text style={styles.panelLabel}>種類</Text>
                {isMobile ? (
                  <View style={styles.mobileGradientContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileHorizontalScroll}>
                      {TYPE_OPTIONS.map((opt) => (
                        <TouchableOpacity key={opt.value} style={[styles.filterChip, fs.selectedTypes.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => fa.toggleSelection(opt.value, fs.selectedTypes, fa.setSelectedTypes)}>
                          <Text style={[styles.chipText, fs.selectedTypes.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <View style={styles.typeRowsContainer}>
                    <View style={[styles.chipContainerRow, { marginBottom: 6 }]}>
                      {TYPE_OPTIONS.slice(0, 5).map((opt) => (
                        <TouchableOpacity key={opt.value} style={[styles.filterChip, fs.selectedTypes.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => fa.toggleSelection(opt.value, fs.selectedTypes, fa.setSelectedTypes)}>
                          <Text style={[styles.chipText, fs.selectedTypes.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.chipContainerRow}>
                      {TYPE_OPTIONS.slice(5).map((opt) => (
                        <TouchableOpacity key={opt.value} style={[styles.filterChip, fs.selectedTypes.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => fa.toggleSelection(opt.value, fs.selectedTypes, fa.setSelectedTypes)}>
                          <Text style={[styles.chipText, fs.selectedTypes.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* 稀有 */}
              <ChipRow label="稀有" options={RARITY_OPTIONS} selected={fs.selectedRarity} isMulti={false} onSelect={(v) => fa.setSelectedRarity(v)} />

              {/* 卡圖 */}
              <ChipRow label="卡圖" options={VERSION_OPTIONS} selected={fs.selectedVersions} onSelect={(v) => fa.toggleVersionSelection(v)} />

              {/* 入手 */}
              <View style={styles.panelRow}>
                <Text style={styles.panelLabel}>入手</Text>
                {isMobile ? (
                  <View style={styles.mobileGradientContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileHorizontalScroll}>
                      {renderAcquisitionCheckboxes(fs, fa, styles)}
                    </ScrollView>
                  </View>
                ) : (
                  <View style={styles.chipContainerRow}>
                    {renderAcquisitionCheckboxes(fs, fa, styles)}
                  </View>
                )}
              </View>

              {/* 共鳴 */}
              <ChipRow label="共鳴" options={RESONANCE_OPTIONS} selected={fs.selectedResonance} isMulti={false} onSelect={(v) => fa.setSelectedResonance(v)} />

              {/* 符合共鳴 */}
              <View style={[styles.panelRow, { marginTop: 4 }]}>
                <Text style={styles.panelLabel}>符合共鳴</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput style={[styles.traitShortInput, { width: 140 }]} placeholder="卡牌編號" placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'} value={fs.resonanceMatchId} onChangeText={fa.setResonanceMatchId} />
                  <TouchableOpacity style={styles.traitResetButton} activeOpacity={0.8} onPress={() => fa.setResonanceMatchId('')}>
                    <Text style={styles.traitResetButtonText}>重置</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ====== Right Column ====== */}
            <View style={styles.filterRightColumn}>
              {/* 特徵 */}
              <View style={styles.panelRow}>
                <Text style={styles.panelLabel}>特徵</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <TextInput style={[styles.traitShortInput, { width: 160, marginRight: 0 }]} placeholder="輸入特徵 (例：地球聯邦)" placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'} value={fs.traitSearchText} onChangeText={fa.setTraitSearchText} />
                  <TouchableOpacity style={styles.traitResetButton} activeOpacity={0.8} onPress={() => { fa.setTraitSearchText(''); fa.setIsTraitExactMatch(false); }}>
                    <Text style={styles.traitResetButtonText}>重置</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.exactMatchBtn, fs.isTraitExactMatch && styles.exactMatchBtnActive, { marginLeft: 0 }]} onPress={() => fa.setIsTraitExactMatch(!fs.isTraitExactMatch)} activeOpacity={0.8}>
                    <Text style={[styles.exactMatchBtnText, fs.isTraitExactMatch && styles.exactMatchBtnTextActive]}>✓ 完全符合</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 關鍵字 */}
              <View style={styles.panelRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: 75, flexShrink: 0 }}>
                  <Text style={[styles.panelLabel, { width: 'auto' }]}>關鍵字</Text>
                  <TouchableOpacity style={[styles.trackResetBtn, { marginLeft: 4, width: 20, height: 20 }]} onPress={() => { fa.setSelectedKeywords(['all']); fa.setSupportValue(''); fa.setBreakthroughValue(''); fa.setRepairValue(''); }} activeOpacity={0.7}><Text style={{ fontSize: 12, fontWeight: 'bold' }}>↺</Text></TouchableOpacity>
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
                      <View style={[styles.chipContainerRow, { marginBottom: 6 }]}>{KEYWORD_OPTIONS.slice(0, 5).map(renderKeywordChip)}</View>
                      <View style={styles.chipContainerRow}>{KEYWORD_OPTIONS.slice(5).map(renderKeywordChip)}</View>
                    </View>
                  )}
                </View>
              </View>

              {/* 時機 */}
              <View style={styles.panelRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: 75, flexShrink: 0 }}>
                  <Text style={[styles.panelLabel, { width: 'auto' }]}>時機</Text>
                  <TouchableOpacity style={[styles.trackResetBtn, { marginLeft: 4, width: 20, height: 20 }]} onPress={() => fa.setSelectedTimings(['all'])} activeOpacity={0.7}><Text style={{ fontSize: 12, fontWeight: 'bold' }}>↺</Text></TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
                  {isMobile ? (
                    <View style={styles.mobileGradientContainer}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileHorizontalScroll}>
                        {TIMING_OPTIONS.map((opt) => (
                          <TouchableOpacity key={opt.value} style={[styles.filterChip, fs.selectedTimings.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => fa.toggleSelection(opt.value, fs.selectedTimings, fa.setSelectedTimings)}>
                            <Text style={[styles.chipText, fs.selectedTimings.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ) : (
                    <View style={styles.typeRowsContainer}>
                      <View style={[styles.chipContainerRow, { marginBottom: 6 }]}>
                        {TIMING_OPTIONS.slice(0, 5).map((opt) => (
                          <TouchableOpacity key={opt.value} style={[styles.filterChip, fs.selectedTimings.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => fa.toggleSelection(opt.value, fs.selectedTimings, fa.setSelectedTimings)}>
                            <Text style={[styles.chipText, fs.selectedTimings.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.chipContainerRow}>
                        {TIMING_OPTIONS.slice(5).map((opt) => (
                          <TouchableOpacity key={opt.value} style={[styles.filterChip, fs.selectedTimings.includes(opt.value) && { backgroundColor: opt.activeBg, borderColor: opt.activeBg }]} onPress={() => fa.toggleSelection(opt.value, fs.selectedTimings, fa.setSelectedTimings)}>
                            <Text style={[styles.chipText, fs.selectedTimings.includes(opt.value) && { color: opt.activeText, fontWeight: 'bold' }]}>{opt.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Range Tracks */}
              <View style={styles.rangeTracksWrapper}>
                <RangeTrack label="Lv." range={fs.lvRange} setRange={fa.setLvRange} minVal={0} maxVal={9} onReset={() => fa.setLvRange([0, 9])} isMobile={isMobile} isDarkMode={isDarkMode} />
                <RangeTrack label="COST" range={fs.costRange} setRange={fa.setCostRange} minVal={0} maxVal={9} onReset={() => fa.setCostRange([0, 9])} isMobile={isMobile} isDarkMode={isDarkMode} />
                <RangeTrack label="AP" range={fs.apRange} setRange={fa.setApRange} minVal={0} maxVal={9} onReset={() => fa.setApRange([0, 9])} isMobile={isMobile} isDarkMode={isDarkMode} />
                <RangeTrack label="HP" range={fs.hpRange} setRange={fa.setHpRange} minVal={0} maxVal={9} onReset={() => fa.setHpRange([0, 9])} isMobile={isMobile} isDarkMode={isDarkMode} />
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {fs.isFilterPanelOpen && isMobile && (
        <TouchableOpacity style={[styles.bottomDragSpace, { paddingBottom: 15, paddingTop: 15 }]} activeOpacity={0.6} onPress={() => fa.setIsFilterPanelOpen(false)}>
          <View style={styles.dragHandlePill} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ====== Helper: Acquisition checkboxes ======
const renderAcquisitionCheckboxes = (fs, fa, styles) => {
  const items = [
    { key: 'includeRegular', label: '常規', val: fs.includeRegular, set: fa.setIncludeRegular },
    { key: 'includeBeta', label: 'BETA', val: fs.includeBeta, set: fa.setIncludeBeta },
    { key: 'includeReprint', label: '重印', val: fs.includeReprint, set: fa.setIncludeReprint },
    { key: 'includeLimited', label: '限定', val: fs.includeLimited, set: fa.setIncludeLimited },
    { key: 'includePromo', label: '推廣', val: fs.includePromo, set: fa.setIncludePromo },
  ];
  return items.map(item => (
    <TouchableOpacity key={item.key} style={[styles.reprintTickbox, item.val && styles.reprintTickboxActive]} onPress={() => item.set(!item.val)} activeOpacity={0.8}>
      <Text style={[styles.reprintTickboxText, item.val && styles.reprintTickboxTextActive]}>{item.val ? '☑' : '☐'} {item.label}</Text>
    </TouchableOpacity>
  ));
};

export default FilterPanel;
