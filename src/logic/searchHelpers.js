// 搜尋輔助函數
import { TYPE_NAME_MAP } from '../constants';

export const resolveCardTypes = (rawTypeStr) => {
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

export const getAliasNames = (cardObj, lang) => {
  const names = [];
  if (cardObj[`name_${lang}`]) names.push(cardObj[`name_${lang}`]);
  const effect = cardObj[`effect_${lang}`] || '';
  const match = effect.match(/【機師】([^\s\n\r、。，！：:（\(]+)/);
  if (match) names.push(match[1].trim());
  const aliasMatch = effect.match(/卡牌名也可視為「([^」]+)」/);
  if (aliasMatch) names.push(aliasMatch[1].trim());
  return names;
};
