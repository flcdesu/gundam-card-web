// 所有 Object.freeze 常數 — 從 App.js 原封不動搬出

export const OPTIMAL_CARD_WIDTH = 220;

export const STATUS_COLORS_JSON = Object.freeze({
  "搭乘時": "status_bg_pink", "搭乘中": "status_bg_pink", "共鳴中": "status_bg_yellow", "共鳴時": "status_bg_yellow",
  "攻擊時": "status_bg_lightblue", "破壞時": "status_bg_lightblue", "配置時": "status_bg_lightblue",
  "啟動・主要": "status_bg_blue", "啟動・瞬動": "status_bg_blue", "每回合1次": "status_bg_red", "爆發": "status_bg_orange",
  "主要": "status_bg_blue", "瞬動": "status_bg_blue", "啟動": "status_bg_blue", "DEFAULT": "status_bg_DEFAULT"
});

export const STATUS_THEME_STYLES = Object.freeze({
  "status_bg_pink": { bg: '#cd6e99' }, "status_bg_yellow": { bg: '#faee01' }, "status_bg_lightblue": { bg: '#77b8bb' }, 
  "status_bg_blue": { bg: '#68ade1' }, "status_bg_red": { bg: '#a2131d' }, "status_bg_orange": { bg: '#d78604' }, "status_bg_DEFAULT": { bg: '#f1f5f9' }   
});

export const COLOR_OPTIONS = Object.freeze([
  { label: '全部', value: 'all', activeBg: '#334155', activeText: '#fff' },
  { label: '藍', value: 'Blue', activeBg: '#0070b9', activeText: '#fff' },
  { label: '綠', value: 'Green', activeBg: '#63a63d', activeText: '#fff' },
  { label: '紅', value: 'Red', activeBg: '#be0453', activeText: '#fff' },
  { label: '紫', value: 'Purple', activeBg: '#744b92', activeText: '#fff' },
  { label: '白', value: 'White', activeBg: '#cbd5e1', activeText: '#0f172a' }, 
]);

export const COLOR_TRANSLATION_MAP = Object.freeze({ 'Blue': '藍', 'Red': '紅', 'Green': '綠', 'Yellow': '黃', 'Purple': '紫', 'White': '白', 'Black': '黑' });

export const TYPE_OPTIONS = Object.freeze([
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

export const RARITY_OPTIONS = Object.freeze([
  { label: '全部', value: 'all', activeBg: '#334155', activeText: '#fff' },
  { label: 'C', value: 'C', activeBg: '#64748b', activeText: '#fff' },
  { label: 'U', value: 'U', activeBg: '#10b981', activeText: '#fff' },
  { label: 'R', value: 'R', activeBg: '#3b82f6', activeText: '#fff' },
  { label: 'LR', value: 'LR', activeBg: '#8b5cf6', activeText: '#fff' },
  { label: 'P', value: 'P', activeBg: '#f59e0b', activeText: '#fff' },
]);

export const VERSION_OPTIONS = Object.freeze([
  { label: '全部', value: 'all', activeBg: '#334155', activeText: '#fff' },
  { label: '普畫', value: 'Normal', activeBg: '#2563eb', activeText: '#fff' }, 
  { label: '異畫 (全開)', value: 'Alt', activeBg: '#d97706', activeText: '#fff' },   
  { label: '異畫 +', value: 'Alt_Plus', activeBg: '#b45309', activeText: '#fff' },   
  { label: '異畫 ++', value: 'Alt_PlusPlus', activeBg: '#92400e', activeText: '#fff' },   
  { label: '異畫 (SP)', value: 'Alt_SP', activeBg: '#78350f', activeText: '#fff' },   
]);

export const RESONANCE_OPTIONS = Object.freeze([
  { label: '全部', value: 'all', activeBg: '#334155', activeText: '#fff' },
  { label: '有', value: 'yes', activeBg: '#334155', activeText: '#fff' },
  { label: '無', value: 'no', activeBg: '#334155', activeText: '#fff' },
]);

export const KEYWORD_OPTIONS = Object.freeze([
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

export const TIMING_OPTIONS = Object.freeze([
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

export const TYPE_NAME_MAP = Object.freeze({ 
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
