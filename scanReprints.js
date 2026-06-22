const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// 1. 確保基礎資料與字典存在
const cardsPath = path.join(__dirname, 'cards.json');
const dictPath = path.join(__dirname, 'imageDictionary.js');

if (!fs.existsSync(cardsPath)) {
    console.error('❌ 找不到 cards.json，請先執行 npm run update-data！');
    process.exit(1);
}
if (!fs.existsSync(dictPath)) {
    console.error('❌ 找不到 imageDictionary.js！');
    process.exit(1);
}

// 2. 建立母卡作品字典
const cardsData = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
const baseCardMap = {};
cardsData.forEach(card => {
    baseCardMap[card.id] = card.series_source || 'その他';
});

// 3. 讀取圖片字典並用正則表達式萃取所有重印卡 Key (包含 _RE_)
const dictContent = fs.readFileSync(dictPath, 'utf8');
const reRegex = /["']([^"']+_RE_[^"']+)["']\s*:/g;
let match;
const reprintKeys = new Set();

while ((match = reRegex.exec(dictContent)) !== null) {
    reprintKeys.add(match[1]);
}

// 4. 整理要匯出 Excel 的資料
const exportData = [];
Array.from(reprintKeys).sort().forEach(reprintId => {
    // 擷取母卡 ID (例如從 ST01-001_RE_A 擷取出 ST01-001)
    const baseId = reprintId.split('_RE_')[0];
    const inheritedSeries = baseCardMap[baseId] || '母卡資料遺失';

    exportData.push({
        '重印卡圖片ID': reprintId,
        '繼承母卡作品(參考)': inheritedSeries,
        '實際重印作品(日文)': '' // 🌟 這裡留空，等你手動填寫
    });
});

// 5. 產生 Excel 檔案
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(exportData);

// 設定欄寬讓 Excel 看起來更舒服
ws['!cols'] = [
    { wch: 25 }, // 重印卡圖片ID
    { wch: 25 }, // 繼承母卡作品(參考)
    { wch: 25 }  // 實際重印作品(日文)
];

xlsx.utils.book_append_sheet(wb, ws, "重印卡校對");

// 輸出到 excel_data 資料夾
const outputPath = path.join(__dirname, 'excel_data', 'reprint_series.xlsx');
xlsx.writeFile(wb, outputPath);

console.log(`✅ 大成功！已成功掃描 ${exportData.length} 張重印異畫卡。`);
console.log(`📁 檔案已輸出至: ${outputPath}`);
console.log(`📝 請打開該 Excel 進行校對，填寫「實際重印作品(日文)」欄位！(若與母卡相同可留空)`);