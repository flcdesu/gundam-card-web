// 效果文本互動渲染引擎 — 從 App.js 抽出
// 所有 handler 透過 actions 參數傳入，保持無狀態
// styles 也透過 actions.styles 傳入，確保 dark mode 正確
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import defaultStyles from '../styles';
import { STATUS_COLORS_JSON, STATUS_THEME_STYLES } from '../constants';
import {
  MASTER_SPLIT_REGEX, INNER_SPLIT_REGEX,
  IS_SMART_REGEX, IS_PURE_RESONANCE_REGEX, IS_SELF_RESONANCE_REGEX,
  IS_SELF_TRAIT_REGEX, IS_SELF_COLOR_REGEX, IS_SELF_COMPLEX_REGEX,
  IS_STAT_COND_REGEX, IS_PLAYER_LV_REGEX
} from '../logic/regexPatterns';

/**
 * actions = {
 *   handleKeywordHexClick: (keywordText) => void,
 *   handleTokenClick: (text, isTrait) => void,
 *   handleExactTokenClick: (name, attrs) => void,
 *   applyCondition: (partText, cardId) => void,
 *   triggerResonanceDirectSearch: (cardId) => void,
 * }
 */

export const renderRichText = (text, onPressAction, baseStyle, actions) => {
    const styles = (actions && actions.styles) || defaultStyles;
    const subParts = text.split(/(《[^》]+》|【[^】]+】)/g);
    return subParts.map((sub, j) => {
        if (/^《[^》]+》$/.test(sub)) {
            const cleanText = sub.replace(/[《》]/g, '').trim();
            return (
              <TouchableOpacity key={j} style={styles.hexWrapperText} onPress={(e) => { e.stopPropagation(); actions.handleKeywordHexClick(cleanText); }} activeOpacity={0.7}>
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

export const renderVisualCutoff = (textPart, onPressAction, baseStyle, actions) => {
    const styles = (actions && actions.styles) || defaultStyles;
    let unclickablePrefix1 = ""; let clickableCore = textPart;
    const excludeKeywordIndex = clickableCore.search(/以外[的且]/);
    if (excludeKeywordIndex !== -1 && (clickableCore.includes('此機體') || clickableCore.includes('此角色') || clickableCore.includes('此卡'))) {
        const cutIndex = excludeKeywordIndex + 3; unclickablePrefix1 = clickableCore.substring(0, cutIndex); clickableCore = clickableCore.substring(cutIndex).trim();
    }
    let unclickablePrefix2 = ""; const factionMatch = clickableCore.match(/^(我方|對方|友方|敵方|雙方)(?:的)?\s*/);
    if (factionMatch) { unclickablePrefix2 = factionMatch[0]; clickableCore = clickableCore.substring(factionMatch[0].length).trim(); }
    let unclickablePrefix3 = ""; const ridingMatch = clickableCore.match(/^搭乘(?:此|該)(?:機體|角色|卡牌|卡)的\s*/);
    if (ridingMatch) { unclickablePrefix3 = ridingMatch[0]; clickableCore = clickableCore.substring(ridingMatch[0].length).trim(); }
    if (/^(?:我方|對方|友方|敵方|雙方)?(?:的)?(?:機體|機師|角色|駕駛員|指令|據點|基地|卡牌|卡|機體卡牌|機師卡牌)$/.test(clickableCore.trim())) return renderRichText(textPart, undefined, undefined, actions); 
    const finalUnclickable = unclickablePrefix1 + unclickablePrefix2 + unclickablePrefix3;
    if (finalUnclickable) return <Text>{renderRichText(finalUnclickable, undefined, undefined, actions)}{renderRichText(clickableCore, onPressAction, baseStyle, actions)}</Text>;
    return renderRichText(textPart, onPressAction, baseStyle, actions);
};

export const renderInteractiveText = (text, cardId = null, actions = {}) => {
  const styles = actions.styles || defaultStyles;
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
            if (IS_SELF_RESONANCE_REGEX.test(bp)) return <Text key={i} style={{ color: textColor, fontWeight: '900', cursor: 'pointer' }} onPress={() => actions.triggerResonanceDirectSearch(cardId)}>{bp}</Text>;
            if (IS_SELF_TRAIT_REGEX.test(bp)) {
                const match = bp.match(/^(若?)(.*)$/);
                if (match && match[1]) return <Text key={i}>{match[1]}<Text style={{ color: textColor, fontWeight: '900', cursor: 'pointer' }} onPress={() => actions.applyCondition(bp, cardId)}>{match[2]}</Text></Text>;
                return <Text key={i} style={{ color: textColor, fontWeight: '900', cursor: 'pointer' }} onPress={() => actions.applyCondition(bp, cardId)}>{bp}</Text>;
            }
            if (IS_SELF_COLOR_REGEX.test(bp)) return <Text key={i} style={{ color: textColor, fontWeight: '900', cursor: 'pointer' }} onPress={() => actions.applyCondition(bp, cardId)}>{bp}</Text>;
            if (IS_SMART_REGEX.test(bp) || IS_PURE_RESONANCE_REGEX.test(bp) || IS_SELF_COMPLEX_REGEX.test(bp)) return <Text key={i}>{renderVisualCutoff(bp, () => actions.applyCondition(bp, cardId), { color: textColor, fontWeight: '900', cursor: 'pointer' }, actions)}</Text>;
            if (IS_STAT_COND_REGEX.test(bp)) return <Text key={i} style={{ color: textColor, fontWeight: '900', cursor: 'pointer' }} onPress={() => actions.applyCondition(bp, cardId)}>{bp}</Text>;
            if (/^「([^」]+)」[（\(]([^）\)]+)[）\)](?:的機體替代卡)?$/.test(bp)) {
                const m = bp.match(/^「([^」]+)」[（\(]([^）\)]+)[）\)](?:的機體替代卡)?$/);
                const subParts = bp.split(/(《[^》]+》)/g);
                return (
                    <Text key={i}>
                        {subParts.map((sub, j) => {
                            if (/^《[^》]+》$/.test(sub)) {
                                const ct = sub.replace(/[《》]/g, '').trim();
                                return <TouchableOpacity key={j} style={styles.hexWrapperText} onPress={() => actions.handleKeywordHexClick(ct)} activeOpacity={0.7}><Text style={styles.hexInnerText}>{ct}</Text></TouchableOpacity>;
                            }
                            return <Text key={j} style={{ color: textColor, fontWeight: '900', cursor: 'pointer' }} onPress={() => actions.handleExactTokenClick(m[1], m[2])}>{sub}</Text>;
                        })}
                    </Text>
                );
            }
            if (/^〔[^〕]+〕$/.test(bp) || /^「[^」]+」$/.test(bp)) return <Text key={i} style={{ color: textColor, fontWeight: '900', cursor: 'pointer' }} onPress={() => actions.handleTokenClick(bp.replace(/[〔〕長裝」]/g, '').replace(/[〔〕「」]/g, '').trim(), bp.startsWith('〔'))}>{bp}</Text>;
            return <Text key={i}>{bp}</Text>;
          });

          return (
            <Text key={index} style={styles.badgeWrapperText}>
              <Text style={[styles.statusWordBadge, { backgroundColor: theme.bg, color: textColor }, isBurst && { cursor: 'pointer' }]} onPress={isBurst ? () => actions.handleKeywordHexClick('爆發') : undefined}>{renderBadgeInner}</Text>
            </Text>
          );
        }

        if (IS_SELF_RESONANCE_REGEX.test(part)) return <Text key={index} style={styles.interactiveBoldToken} onPress={() => actions.triggerResonanceDirectSearch(cardId)}>{part}</Text>;
        if (IS_SELF_TRAIT_REGEX.test(part)) {
            const match = part.match(/^(若?)(.*)$/);
            if (match && match[1]) return <Text key={index}>{match[1]}<Text style={styles.interactiveBoldToken} onPress={() => actions.applyCondition(part, cardId)}>{match[2]}</Text></Text>;
            return <Text key={index} style={styles.interactiveBoldToken} onPress={() => actions.applyCondition(part, cardId)}>{part}</Text>;
        }
        if (IS_SELF_COLOR_REGEX.test(part)) return <Text key={index} style={styles.interactiveBoldToken} onPress={() => actions.applyCondition(part, cardId)}>{part}</Text>;

        const tokenCardMatch = part.match(/^「([^」]+)」[（\(]([^）\)]+)[）\)](?:的機體替代卡)?$/);
        if (tokenCardMatch) {
            const subParts = part.split(/(《[^》]+》)/g);
            return (
                <Text key={index}>
                    {subParts.map((sub, i) => {
                        if (/^《[^》]+》$/.test(sub)) {
                            const ct = sub.replace(/[《》]/g, '').trim();
                            return <TouchableOpacity key={i} style={styles.hexWrapperText} onPress={() => actions.handleKeywordHexClick(ct)} activeOpacity={0.7}><Text style={styles.hexInnerText}>{ct}</Text></TouchableOpacity>;
                        }
                        return <Text key={i} style={styles.interactiveBoldToken} onPress={() => actions.handleExactTokenClick(tokenCardMatch[1], tokenCardMatch[2])}>{sub}</Text>;
                    })}
                </Text>
            );
        }
        
        if (IS_SMART_REGEX.test(part) || IS_PURE_RESONANCE_REGEX.test(part) || IS_SELF_COMPLEX_REGEX.test(part)) return <Text key={index}>{renderVisualCutoff(part, () => actions.applyCondition(part, cardId), styles.interactiveBoldToken, actions)}</Text>;
        if (IS_STAT_COND_REGEX.test(part)) return <Text key={index} style={styles.interactiveBoldToken} onPress={() => actions.applyCondition(part, cardId)}>{part}</Text>;
        const isClickableBracket = /^〔[^〕]+〕$/.test(part) || /^「[^」]+」$/.test(part);
        if (isClickableBracket) return <Text key={index} style={styles.interactiveBoldToken} onPress={() => actions.handleTokenClick(part.replace(/[〔〕長裝」]/g, '').replace(/[〔〕「」]/g, '').trim(), part.startsWith('〔'))}>{part}</Text>;
        if (/^[《].*[》]$/.test(part)) {
          const cleanText = part.replace(/[《》]/g, '').trim();
          return <TouchableOpacity key={index} style={styles.hexWrapperText} onPress={() => actions.handleKeywordHexClick(cleanText)} activeOpacity={0.7}><Text style={styles.hexInnerText}>{cleanText}</Text></TouchableOpacity>;
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
};

export const shouldShowResonanceButton = (card, language) => {
  if (!card) return false;
  const type = card.type || ''; const effect = card[`effect_${language}`] || ''; const traits = card[`traits_${language}`] || ''; const link = card[`link_${language}`] || '';
  if (type === 'UNIT' || type === 'UNIT TOKEN' || type === 'TOKEN') return link.trim() !== '' && link.trim() !== '-';
  if (type === 'PILOT') return true;
  if (type === 'COMMAND') return effect.includes('【機師】') || traits.includes('【機師】') || traits.includes('機師');
  return false;
};
