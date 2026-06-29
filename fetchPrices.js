const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

// ==========================================
// 🌟 檔案路徑設定
// ==========================================
const LINKS_EXCEL_PATH = path.join(__dirname, 'excel_data', 'fetchprice_links.xlsx');
const PROMO_EXCEL_PATH = path.join(__dirname, 'excel_data', 'gcg_cardlist_promo.xlsx');
const LIMITED_EXCEL_PATH = path.join(__dirname, 'excel_data', 'gcg_cardlist_limited.xlsx');
const HISTORY_EXCEL_PATH = path.join(__dirname, 'excel_data', 'historical_prices.xlsx');
const OUTPUT_JSON_PATH = path.join(__dirname, 'src', 'data', 'prices.json');

// 🌟 無敵字串清洗機 (消除人為命名差異)
const normalizeForDict = (str) => {
    if (!str) return '';
    return str
        .replace(/\[.*?\]/g, '') // 移除 [代號] 及其內容
        .replace(/【.*?】/g, '') // 移除 【代號】 及其內容
        .replace(/[()（）《》]/g, '') // 移除各種括號外殼
        .replace(/[\s\u3000・]/g, '') // 移除全半形空白、斷行與中點
        .replace(/カード/g, '') // 移除 "カード" (卡)
        .replace(/記念品/g, '') // 移除 "記念品"
        .replace(/参加/g, '')   // 🌟 移除 "参加" (解決 ST04-002 / 010 問題)
        .replace(/賞/g, '')     // 🌟 移除 "賞" (解決優勝賞、参加賞等問題)
        .toLowerCase(); // 統一轉小寫 (防呆 SEASON vs season)
};

async function scrapeYuyutei() {
    console.log('🚀 [啟動] 遊々亭 (Yuyu-tei) 歷史報價爬蟲系統...');

    // ==========================================
    // 0. 建立 Promo / Limited 翻譯字典
    // ==========================================
    let promoMapping = [];
    const loadDictionary = (filePath, typeName) => {
        try {
            if (fs.existsSync(filePath)) {
                const wb = xlsx.readFile(filePath);
                const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                
                data.forEach(row => {
                    const seqKey = Object.keys(row).find(k => k.includes('序號'));
                    const baseKey = Object.keys(row).find(k => k.includes('卡牌編號'));
                    const infoKey = Object.keys(row).find(k => k.includes('入手情報 [JP]'));

                    if (seqKey && baseKey && infoKey && row[seqKey] && row[baseKey]) {
                        promoMapping.push({
                            finalId: row[seqKey].toString().trim(),
                            baseId: row[baseKey].toString().trim(),
                            jpInfo: (row[infoKey] || '').toString().trim()
                        });
                    }
                });
                console.log(`📚 成功載入 ${typeName} 字典，共 ${data.length} 筆對照資料。`);
            } else {
                console.log(`⚠️ 找不到 ${typeName} 字典檔 (${filePath})，將跳過此部分比對。`);
            }
        } catch (e) {
            console.error(`❌ 讀取 ${typeName} 字典失敗:`, e.message);
        }
    };

    loadDictionary(PROMO_EXCEL_PATH, 'PROMO');
    loadDictionary(LIMITED_EXCEL_PATH, 'LIMITED');

    // ==========================================
    // 1. 從 Excel 讀取目標網址
    // ==========================================
    let targetUrls = [];
    try {
        if (!fs.existsSync(LINKS_EXCEL_PATH)) {
            console.error(`❌ 找不到網址設定檔: ${LINKS_EXCEL_PATH}`);
            return;
        }
        const workbook = xlsx.readFile(LINKS_EXCEL_PATH);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        targetUrls = sheetData
            .map(row => row['爬蟲連結'])
            .filter(url => url && typeof url === 'string' && url.startsWith('http'));
            
        console.log(`📋 成功從 Excel 讀取到 ${targetUrls.length} 條目標網址！\n`);
    } catch (error) {
        console.error('❌ 讀取 fetchprice_links.xlsx 失敗:', error.message);
        return;
    }

    let finalPrices = {}; 

    // ==========================================
    // 2. 開始逐條網址進行爬取
    // ==========================================
    for (let i = 0; i < targetUrls.length; i++) {
        const baseUrl = targetUrls[i];
        console.log(`\n🔗 [${i + 1}/${targetUrls.length}] 準備爬取任務: ${baseUrl.substring(0, 60)}...`);
        
        let page = 1;
        let hasNextPage = true;

        while (hasNextPage) {
            console.log(`   📄 正在讀取該任務的第 ${page} 頁...`);
            try {
                const targetUrl = `${baseUrl}&page=${page}`;
                const response = await axios.get(targetUrl);
                const $ = cheerio.load(response.data);
                const products = $('.card-product');

                if (products.length === 0) {
                    hasNextPage = false;
                    break;
                }

                products.each((idx, el) => {
                    const baseId = $(el).find('span.d-block.border').text().trim();
                    const altText = $(el).find('.product-img img').attr('alt') || '';
                    const priceText = $(el).find('strong.text-end').text().trim();
                    const priceJpy = parseInt(priceText.replace(/[,円\s]/g, ''), 10);

                    if (baseId && !isNaN(priceJpy)) {
                        let targetFinalIds = []; 
                        let isDictionaryMatched = false;

                        // 🌟 套用無敵清洗機
                        const cleanAltText = normalizeForDict(altText); 
                        const isSpecialPrefix = /^(RP|EXBP|EXRP)-/i.test(baseId);

                        const matchedPromos = promoMapping.filter(m => {
                            // 🌟 字典內的日文也套用無敵清洗機
                            const cleanJpInfo = normalizeForDict(m.jpInfo);
                            
                            const isExactMatch = m.baseId === baseId && cleanJpInfo !== '' && cleanAltText.includes(cleanJpInfo);
                            const isSpecialMatch = isSpecialPrefix && m.baseId === baseId;

                            return isExactMatch || isSpecialMatch;
                        });

                        if (matchedPromos.length > 0) {
                            targetFinalIds = matchedPromos.map(m => m.finalId);
                            isDictionaryMatched = true;
                        }

                        if (!isDictionaryMatched) {
                            let singleFinalId = baseId;

                            const isBeta = altText.includes('Ver.β収録');
                            if (isBeta) {
                                singleFinalId = `${singleFinalId}_BETA`;
                            }

                            if (!isBeta) {
                                const reprintMatch = altText.match(/\(([A-Za-z0-9]+)収録\)/);
                                if (reprintMatch) {
                                    const reprintSet = reprintMatch[1].toUpperCase();
                                    const basePrefix = baseId.split('-')[0].toUpperCase();
                                    if (reprintSet !== basePrefix) {
                                        singleFinalId = `${singleFinalId}_RE_${reprintSet}`;
                                    }
                                }
                            }

                            if (altText.includes('パラレル') || altText.includes('++') || altText.includes('+') || altText.includes('異画')) {
                                const parts = altText.split(' ');
                                // 順便加入了 SEC (機密稀有) 以防萬一官方以後出這種卡
                                let rarityMatch = parts.find(p => p.includes('LR') || p.includes('U') || p.includes('C') || p.includes('R') || p.includes('SR') || p.includes('SEC'));
                                if (rarityMatch) {
                                    let suffix = rarityMatch.toUpperCase();
                                    // 🌟 修正為底線 (_PLUS)，精準對齊你的前端路由系統！
                                    if (suffix.includes('++')) suffix = suffix.replace('++', '_PLUSPLUS');
                                    else if (suffix.includes('+')) suffix = suffix.replace('+', '_PLUS');
                                    singleFinalId = `${singleFinalId}_${suffix}`;
                                }
                            }
                            targetFinalIds = [singleFinalId];
                        }

                        targetFinalIds.forEach(id => {
                            if (!finalPrices[id] || priceJpy < finalPrices[id]) {
                                finalPrices[id] = priceJpy;
                            }
                        });
                    }
                });

                page++;
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`   ❌ 第 ${page} 頁爬取失敗:`, error.message);
                hasNextPage = false;
            }
        }
    }

    console.log(`\n🎉 所有網址爬取完畢！共收集到 ${Object.keys(finalPrices).length} 筆卡牌報價。`);

    // ==========================================
    // 輸出 JSON 與 History Excel
    // ==========================================
    try {
        fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(finalPrices, null, 2), 'utf-8');
        console.log(`✅ 前端資料庫已更新: ${OUTPUT_JSON_PATH}`);
    } catch (e) {
        console.error('❌ 寫入 prices.json 失敗:', e.message);
    }

    try {
        const dateObj = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Hong_Kong" }));
        const today = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        
        let historyData = [];
        let historyMap = {};

        if (fs.existsSync(HISTORY_EXCEL_PATH)) {
            const histWb = xlsx.readFile(HISTORY_EXCEL_PATH);
            const histSheet = histWb.Sheets[histWb.SheetNames[0]];
            historyData = xlsx.utils.sheet_to_json(histSheet);
            historyData.forEach(row => { if (row['Card ID']) historyMap[row['Card ID']] = row; });
        }

        for (const [cardId, price] of Object.entries(finalPrices)) {
            if (!historyMap[cardId]) {
                historyMap[cardId] = { 'Card ID': cardId }; 
            }
            historyMap[cardId][today] = price; 
        }

        const newHistoryArray = Object.values(historyMap);
        const newSheet = xlsx.utils.json_to_sheet(newHistoryArray);
        const newWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Historical Prices');
        
        xlsx.writeFile(newWorkbook, HISTORY_EXCEL_PATH);
        console.log(`📈 歷史價格庫已更新！(欄位: ${today}) -> ${HISTORY_EXCEL_PATH}\n`);
    } catch (e) {
        console.error('❌ 寫入歷史 Excel 失敗:', e.message);
    }
}

scrapeYuyutei();