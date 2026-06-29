const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// ==========================================
// 🌟 檔案路徑設定
// ==========================================
const EXCEL_DIR = path.join(__dirname, 'excel_data');
const PRICES_JSON_PATH = path.join(__dirname, 'src', 'data', 'prices.json');
const OUTPUT_EXCEL_PATH = path.join(__dirname, 'excel_data', 'missing_prices.xlsx');

function scanMissingPrices() {
    console.log('🔍 [啟動] 卡牌價格遺漏掃描器 (Price Scanner)...');

    // ==========================================
    // 1. 讀取最新的價格資料庫
    // ==========================================
    if (!fs.existsSync(PRICES_JSON_PATH)) {
        console.error('❌ 找不到 prices.json，請先執行 fetchPrices.js！');
        return;
    }
    const pricesData = JSON.parse(fs.readFileSync(PRICES_JSON_PATH, 'utf-8'));
    const pricedCardIds = new Set(Object.keys(pricesData));
    console.log(`✅ 成功讀取 prices.json，目前共有 ${pricedCardIds.size} 筆報價。\n`);

    // ==========================================
    // 2. 掃描所有卡牌 Excel 清單
    // ==========================================
    const files = fs.readdirSync(EXCEL_DIR);
    const cardListFiles = files.filter(f => f.startsWith('gcg_cardlist_') && f.endsWith('.xlsx'));

    if (cardListFiles.length === 0) {
        console.error('❌ 找不到任何 gcg_cardlist_ 開頭的 Excel 檔案！');
        return;
    }

    let missingCards = [];
    let totalCardsScanned = 0;

    cardListFiles.forEach(file => {
        const filePath = path.join(EXCEL_DIR, file);
        const wb = xlsx.readFile(filePath);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        data.forEach(row => {
            // 🌟 更嚴格的 ID 抓取：優先找 "序號"，找不到才用 "卡牌編號"
            const seqKey = Object.keys(row).find(k => k.includes('序號'));
            const baseKey = Object.keys(row).find(k => k.includes('卡牌編號'));
            const infoKey = Object.keys(row).find(k => k.includes('入手情報 [JP]'));
            const rarityKey = Object.keys(row).find(k => k.includes('稀有度'));
            
            let finalId = '';
            let baseId = '';

            if (seqKey && row[seqKey]) finalId = row[seqKey].toString().trim();
            if (baseKey && row[baseKey]) baseId = row[baseKey].toString().trim();
            
            // 如果沒有獨立的序號，就拿卡牌編號當作最終 ID
            if (!finalId) finalId = baseId;

            // 排除空行或分隔線
            if (finalId && finalId !== '-') {
                totalCardsScanned++;
                
                // 如果這個 ID 在 prices.json 裡面找不到
                if (!pricedCardIds.has(finalId)) {
                    missingCards.push({
                        '來源 Excel': file,
                        '系統最終 ID': finalId,
                        '基礎卡號': baseId,
                        '稀有度': rarityKey && row[rarityKey] ? row[rarityKey] : '-',
                        '入手情報 [JP]': infoKey && row[infoKey] ? row[infoKey] : '-',
                        '需要人工校對': '' // 留給人工填寫的空白欄位
                    });
                }
            }
        });
    });

    console.log(`📊 交叉比對完畢！共檢查了 ${totalCardsScanned} 張實體建檔卡片。`);

    // ==========================================
    // 3. 產出遺漏報表 (Missing Report)
    // ==========================================
    if (missingCards.length > 0) {
        const newSheet = xlsx.utils.json_to_sheet(missingCards);
        const newWorkbook = xlsx.utils.book_new();
        
        // 設定欄位寬度讓 Excel 打開時比較好看
        newSheet['!cols'] = [
            { wch: 25 }, // 來源 Excel
            { wch: 20 }, // 系統最終 ID
            { wch: 15 }, // 基礎卡號
            { wch: 10 }, // 稀有度
            { wch: 45 }, // 入手情報 [JP]
            { wch: 20 }  // 需要人工校對
        ];

        xlsx.utils.book_append_sheet(newWorkbook, newSheet, '缺漏名單');
        xlsx.writeFile(newWorkbook, OUTPUT_EXCEL_PATH);
        
        console.log(`\n⚠️ 發現 ${missingCards.length} 張卡片目前無市價！`);
        console.log(`📂 已為您產出查漏報表: ${OUTPUT_EXCEL_PATH}`);
    } else {
        console.log('\n🎉 太完美了！所有建檔的卡片都有對應的報價，100% 覆蓋率！');
    }
}

scanMissingPrices();