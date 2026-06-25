import { StyleSheet } from 'react-native';

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

  // 🌟 新增：方案 B 的漸層提示樣式
  dropdownScrollHint: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 35, backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 100%)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 6, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  dropdownScrollHintText: { fontSize: 10, color: '#64748b', fontWeight: 'bold', letterSpacing: 1 },

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
  // 🌟 修正：讓手機版箭頭靠緊螢幕最邊緣，拉開距離，永遠固定
  mobileFloatingLeftArrow: { left: 4, width: 38, height: 38, borderRadius: 19, marginTop: -19, backgroundColor: 'rgba(0, 0, 0, 0.75)' },
  mobileFloatingRightArrow: { right: 4, width: 38, height: 38, borderRadius: 19, marginTop: -19, backgroundColor: 'rgba(0, 0, 0, 0.75)' },

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

export default styles;
