// 所有 Regex 常數 — 效果文本解析引擎的核心

export const SINGLE_TARGET = "(?:機體替代卡|替代卡|機體卡牌|機體卡|機體|機師卡牌|機師卡|機師|角色卡牌|角色卡|角色|駕駛員卡牌|駕駛員卡|駕駛員|指令卡牌|指令卡|指令|據點卡牌|據點卡|據點|基地卡牌|基地卡|基地|UNIT\\s*TOKEN|UNIT|PILOT|COMMAND|BASE|TOKEN|代幣|資源卡牌|資源卡|資源|RESOURCE|EX\\s*BASE|EX\\s*據點|EX\\s*RESOURCE|EX\\s*資源|卡牌(?!名稱)|卡(?!組|牌名稱|名稱))";
export const TARGET_TYPES = `(?:(?:共鳴)?${SINGLE_TARGET}(?:\\s*[/／]\\s*(?:共鳴)?${SINGLE_TARGET}(?!\\s*名稱))*)`;
export const TRAIT_GROUP = "(?:〔[^〕]+〕(?:\\s*[\\/／]\\s*〔[^〕]+〕)*)";
export const STAT_COND = "(?:(?:HP|AP|Lv\\.?|COST|等級)\\s*(?:為)?\\s*(?:不大於|不高於|不超過|小於等於|不小於|不低於|大於等於|<=|>=|<|>|=)?\\s*(?:Lv\\.?\\s*)?\\d+\\s*(?:或更高等級|或高等級|或更高|或更低|或以下|或以上|以下|以上)?)";
export const NAME_COND = "(?:卡牌名稱中(?:包含|不包含)「[^」]+」(?:的\\s*|之\\s*)?)";
export const KEYWORD_COND = "(?:擁有《[^》]+》效果(?:的\\s*|之\\s*|且\\s*)?)"; 
export const STATUS_WORD_COND = "(?:擁有【[^】]+】效果(?:的\\s*|之\\s*|且\\s*)?)"; 
export const COLOR_COND = "(?:(?:藍|紅|綠|黃|紫|白|黑)介的?\\s*|(?:藍|紅|綠|黃|紫|白|黑)色的?\\s*)"; 
export const FACTION_COND = "(?:(?:我方|對方|雙方|友方|敵方)\\s*)"; 
export const EXCLUDE_COND = `(?:(?:[^，。、]+此(?:機體|角色|卡|卡牌)以外[的且]|${TARGET_TYPES}以外[的且])\\s*)`; 
export const RIDING_COND = "(?:搭乘(?:此|該)(?:機體|角色|卡牌|卡)的\\s*)";
export const PLAYER_LV_COND = "(?:若)?(?:我方|對方)(?:的等級)?(?:為)?\\s*(?:Lv\\.?\\s*)?\\d+\\s*(?:或更高等級|或高等級|或更高|或更低|或以下|或以上|以下|以上)?";
export const SMART_PREFIX = `(?:(?:${TRAIT_GROUP}\\s*的?\\s*)?${STAT_COND}\\s*(?:的\\s*)?|${NAME_COND}|${KEYWORD_COND}|${STATUS_WORD_COND}|${COLOR_COND}|${FACTION_COND}|${RIDING_COND}|${TRAIT_GROUP}\\s*(?:的\\s*)?|${EXCLUDE_COND})`;
export const SMART_COND_STR = `(?:${SMART_PREFIX}+${TARGET_TYPES}(?:共鳴)?)`;
export const SELF_COMPLEX_COND_STR = `此${SINGLE_TARGET}(?:受到過傷害且|在戰鬥中且)${STAT_COND}`;
export const PURE_RESONANCE_TARGET = `(?:共鳴${SINGLE_TARGET}(?:\\s*[/／]\\s*(?:共鳴)?${SINGLE_TARGET})*|${SINGLE_TARGET}共鳴)`;
export const SELF_RESONANCE_STR = `此(?:機體|機師|角色|指令|卡牌|卡(?!組))(?:為|作為)共鳴(?:機體|機師|角色|指令|卡牌|卡(?!組))?`;
export const SELF_TRAIT_STR = `(?:若)?此(?:${SINGLE_TARGET})(?:為|變成|擁有|具有)?\\s*${TRAIT_GROUP}`;
export const SELF_COLOR_STR = `此(?:${SINGLE_TARGET})(?:若為|為)(?:藍色|紅色|綠色|黃色|紫色|白色|黑色)`;
export const TOKEN_REGEX = `「[^」]+」[（\\(][^）\\)]+[）\\)](?:的機體替代卡)?`;

export const MASTER_SPLIT_REGEX = new RegExp(`(${SMART_COND_STR}|${SELF_COMPLEX_COND_STR}|${SELF_RESONANCE_STR}|${SELF_TRAIT_STR}|${SELF_COLOR_STR}|${PURE_RESONANCE_TARGET}|${TOKEN_REGEX}|「[^」]+」|【[^】]+】|《[^》]+》|〔[^〕]+〕|${PLAYER_LV_COND}|${STAT_COND})`, 'gi');
export const INNER_SPLIT_REGEX = new RegExp(`(${SMART_COND_STR}|${SELF_COMPLEX_COND_STR}|${SELF_RESONANCE_STR}|${SELF_TRAIT_STR}|${SELF_COLOR_STR}|${PURE_RESONANCE_TARGET}|${TOKEN_REGEX}|「[^」]+」|【[^】]+】|《[^》]+》|〔[^〕]+〕|${PLAYER_LV_COND}|${STAT_COND})`, 'gi');
export const IS_SMART_REGEX = new RegExp(`^${SMART_COND_STR}$`, 'i');
export const IS_PURE_RESONANCE_REGEX = new RegExp(`^${PURE_RESONANCE_TARGET}$`, 'i');
export const IS_SELF_RESONANCE_REGEX = new RegExp(`^${SELF_RESONANCE_STR}$`, 'i');
export const IS_SELF_TRAIT_REGEX = new RegExp(`^${SELF_TRAIT_STR}$`, 'i');
export const IS_SELF_COLOR_REGEX = new RegExp(`^${SELF_COLOR_STR}$`, 'i');
export const IS_SELF_COMPLEX_REGEX = new RegExp(`^${SELF_COMPLEX_COND_STR}$`, 'i');
export const IS_STAT_COND_REGEX = new RegExp(`^${STAT_COND}$`, 'i');
export const IS_PLAYER_LV_REGEX = new RegExp(`^${PLAYER_LV_COND}$`, 'i');
