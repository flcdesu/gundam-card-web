// src/data/siteContent.js
// 結構化內容 — 方便頁面分段渲染

export const ABOUT_SECTIONS = [
  {
    type: 'intro',
    text: '歡迎來到 gcg.flcdesu.com！這是一個由資深玩家 FLC 自發性建立的非官方社群平台。',
  },
  {
    type: 'paragraph',
    text: '由 Bandai Namco 推出的《Gundam Card Game》（集換式卡牌遊戲），將經典的高達宇宙與極具深度的戰略玩法完美結合，不僅席捲亞洲，更風靡全球。然而，官方卡牌主要以日文發行，這無形中成為許多華語玩家享受遊戲的一大阻礙。',
  },
  {
    type: 'paragraph',
    text: '為了打破語言隔閡，本站應運而生。我們的目標很單純：提供最即時、精確的繁體中文在地化資訊，並貼心兼顧香港與台灣兩地的譯名習慣，讓每一位玩家都能毫無負擔地投入這款精彩的卡牌對戰世界中。',
  },
  {
    type: 'heading',
    text: '網站特色功能',
  },
  {
    type: 'feature',
    title: '全方位卡牌檢索與雙語翻譯',
    text: '完整收錄《Gundam Card Game》的各式卡牌，並提供詳盡的繁體中文（港譯／台譯）翻譯。透過多條件的便捷篩選系統，您可以秒速鎖定需要的卡片；此外，我們特別在卡牌效果視窗內建了「智能關聯連結」，只需點擊敘述內的對象卡牌，即可無縫跳轉頁面，讓查閱資料變得前所未有地直覺。',
  },
  {
    type: 'feature',
    title: '專屬牌組構築模擬器',
    text: '專為玩家量身打造的線上組牌介面。無論是日常構思戰術、賽前備牌，還是單純想測試全新的套路，這套直覺易用的工具都能成為您的最佳得力助手。支援匯入／匯出牌組清單，方便與朋友分享。',
  },
  {
    type: 'heading',
    text: '知識財產權聲明',
  },
  {
    type: 'paragraph',
    text: '本站為純粹基於粉絲熱愛而建立的非官方網站，與 Bandai Namco 及其任何相關企業不存在任何官方授權或合作關係。',
  },
  {
    type: 'paragraph',
    text: '《Gundam Card Game》的卡牌名稱、圖像、效果說明、商標及所有相關之智慧財產權，均完全歸屬於 Bandai Namco 及其合法授權方。本站所提供的所有翻譯、資料庫彙整及輔助工具皆為無償的公益性創作，宗旨在於推廣遊戲與促進同好交流，絕無任何直接商業營利或侵權意圖。',
  },
  {
    type: 'heading',
    text: '聯絡資訊',
  },
  {
    type: 'paragraph',
    text: '網站的成長需要大家的支持與指教！如果您有任何新功能建議、發現翻譯上的錯誤，或是希望進行版權相關的溝通，都非常歡迎透過以下平台與 FLC 聯繫：',
  },
  {
    type: 'contacts',
    items: [
      { label: 'Email', value: 'chunchunflc@gmail.com' },
      { label: 'Instagram', value: '@flcdesu' },
      { label: 'YouTube', value: 'youtube.com/@FLCdesu' },
    ],
  },
];

export const DISCLAIMER_SECTIONS = [
  {
    type: 'meta',
    text: '最後更新日期：2026 年 7 月',
  },
  {
    type: 'heading',
    text: '非官方聲明',
  },
  {
    type: 'paragraph',
    text: 'gcg.flcdesu.com（以下簡稱「本站」）是一個由玩家自發建立的非官方粉絲網站，與 Bandai Namco 及其任何關聯企業均無任何官方合作、授權或關聯關係。',
  },
  {
    type: 'paragraph',
    text: '所有 Gundam Card Game 的相關知識財產，包含但不限於：',
  },
  {
    type: 'list',
    items: [
      '卡片名稱、卡片圖片、效果文字、觸發能力說明',
      '系列名稱、系列代碼、系列主視覺圖像',
      '角色名稱及其相關視覺設計',
      'Gundam Card Game 商標及相關品牌識別',
    ],
  },
  {
    type: 'paragraph',
    text: '上述所有知識財產權均歸 Bandai Namco 及其授權方所有，本站不主張對上述內容擁有任何所有權。',
  },
  {
    type: 'heading',
    text: '使用目的聲明',
  },
  {
    type: 'paragraph',
    text: '本站提供的所有服務與內容，目前包含卡牌翻譯、卡牌搜尋及牌組工具，均純屬玩家社群的公益性創作，旨在：',
  },
  {
    type: 'list',
    items: [
      '協助繁體中文玩家克服語言障礙，更好地理解與享受 Gundam Card Game',
      '促進 Gundam Card Game 港台及華語玩家社群的交流與成長',
      '提供非商業性質的輔助工具，支援玩家的日常備牌與賽前練習',
    ],
  },
  {
    type: 'paragraph',
    text: '本站不以任何形式販售卡片、牌組或任何版權商品。本站的運作不以直接商業侵權為目的，若有任何版權持有方認為本站內容侵害其權益，請立即與我們聯繫，我們將迅速處理。',
  },
  {
    type: 'heading',
    text: '翻譯準確性',
  },
  {
    type: 'paragraph',
    text: '本站提供的所有中文翻譯（包含港譯與台譯版本）均由本站志願者完成，翻譯品質以社群維護為主，可能存在不精確、過時或錯誤的情況。我們鼓勵玩家以官方日文原文為最終依據。',
  },
  {
    type: 'paragraph',
    text: '本站不對因參考本站翻譯內容而導致的賽事誤判、規則理解偏差或其他損失承擔任何法律責任。如發現翻譯錯誤，歡迎回報，我們將盡快修正。',
  },
  {
    type: 'heading',
    text: '廣告服務聲明',
  },
  {
    type: 'paragraph',
    text: '本站使用 Google AdSense 顯示第三方廣告，以支持網站的日常維護費用。廣告內容由 Google 根據訪客的瀏覽習慣自動投放，本站不對廣告內容負責。',
  },
  {
    type: 'paragraph',
    text: 'Google 可能使用 Cookie 收集與廣告相關的資訊。訪客可透過 Google 廣告設定管理個人化廣告偏好。詳情請參閱本站隱私權政策。',
  },
  {
    type: 'heading',
    text: '外部連結',
  },
  {
    type: 'paragraph',
    text: '本站可能包含指向外部網站的連結（如 YouTube、官方資訊管道等）。這些外部連結的內容由各自網站負責，本站不對外部網站的內容、隱私政策或服務準確性負責。',
  },
  {
    type: 'heading',
    text: '服務變更與中止',
  },
  {
    type: 'paragraph',
    text: '本站保留在不事先通知的情況下，隨時修改、增加、暫停或終止全部或部分服務（包含網站功能更新）的權利。本站不對服務中斷、資料遺失或任何因使用本站而造成的直接或間接損失承擔責任。',
  },
  {
    type: 'heading',
    text: '價格參考聲明',
  },
  {
    type: 'paragraph',
    text: '本站網頁上所顯示的任何卡片價格或相關資訊，只作參考用途。實際市場價格可能因時間、地區或玩家間的交易狀況而隨時變動。本站並非交易平台，不保證所顯示價格的即時性與絕對準確性，亦不對玩家因參考本站價格資訊而衍生的任何交易糾紛或經濟損失承擔責任。',
  },
  {
    type: 'heading',
    text: '聯繫本站',
  },
  {
    type: 'paragraph',
    text: '如對本免責聲明有任何疑問，或希望就版權問題進行溝通，請透過電子郵件與我們聯繫：chunchunflc@gmail.com。本站承諾以善意且積極的態度回應所有合理的版權關切。',
  },
];

// 保留原始純文本 export 作為 fallback
export const ABOUT_US_TEXT = ABOUT_SECTIONS.filter(s => s.type !== 'contacts').map(s => {
  if (s.type === 'heading') return `\n${s.text}`;
  if (s.type === 'feature') return `${s.title}\n${s.text}`;
  if (s.type === 'list') return s.items.map(i => `• ${i}`).join('\n');
  return s.text;
}).join('\n\n');

export const DISCLAIMER_TEXT = DISCLAIMER_SECTIONS.map(s => {
  if (s.type === 'heading') return `\n${s.text}`;
  if (s.type === 'list') return s.items.map(i => `• ${i}`).join('\n');
  return s.text;
}).join('\n\n');
