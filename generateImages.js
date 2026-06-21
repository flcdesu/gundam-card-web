const fs = require('fs');
const path = require('path');
let cards = [];
try {
  cards = require('./cards.json');
} catch (e) {
  console.log('⚠️ 找不到 cards.json，將只進行反向掃描。');
}

const ASSETS_DIR = path.join(__dirname, 'assets', 'cards');
const excludeFromReprintPrefixes = ['T-', 'R-', 'EXB-', 'EXR-'];

console.log('啟動 🤖 自動化圖片處理機器人...\n');

// ==========================================
// 🛠️ 階段一：實體檔案自動改名 (解決 Webpack 同名覆蓋問題)
// ==========================================
let renamedCount = 0;

if (fs.existsSync(ASSETS_DIR)) {
  const folders = fs.readdirSync(ASSETS_DIR).filter(file => fs.statSync(path.join(ASSETS_DIR, file)).isDirectory());

  folders.forEach(folderName => {
    const folderPath = path.join(ASSETS_DIR, folderName);
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.png') || file.endsWith('.jpg'));

    files.forEach(file => {
      const ext = path.extname(file); // e.g., ".png"
      const fileNameWithoutExt = path.parse(file).name; // e.g., "ST01-014"
      
      // 1. 檢查是否為需要排除的特殊卡 (Token, Resource 等)
      const isExcludedType = excludeFromReprintPrefixes.some(prefix => fileNameWithoutExt.startsWith(prefix));
      if (isExcludedType) return;

      // 2. 檢查是否已經被改名過了 (防呆機制)
      if (fileNameWithoutExt.includes('_RE_')) return;

      // 3. 拆解 Base ID，判斷是否為重印卡
      const parts = fileNameWithoutExt.split('_');
      const baseId = parts[0]; 
      const originSetMatch = baseId.match(/^([A-Z0-9]+)-/i);
      
      if (originSetMatch) {
        const originSet = originSetMatch[1]; // e.g., "ST01"
        
        // 如果來源彈數 !== 當前資料夾，這就是重印卡！開鍘改名！
        if (originSet !== folderName) {
          const suffix = parts.slice(1).join('_'); // 抓取原本的異畫後綴 (如 PLUS)
          const suffixString = suffix ? `_${suffix}` : '';
          
          // 組裝新檔名：原卡號_RE_新彈數_後綴 (如 ST01-014_RE_ST09_PLUS.png)
          const newFileName = `${baseId}_RE_${folderName}${suffixString}${ext}`;
          
          const oldPath = path.join(folderPath, file);
          const newPath = path.join(folderPath, newFileName);
          
          fs.renameSync(oldPath, newPath);
          console.log(`✏️ 實體檔案改名: [${folderName}] ${file}  -->  ${newFileName}`);
          renamedCount++;
        }
      }
    });
  });
}

// ==========================================
// 📖 階段二：生成 imageDictionary.js
// ==========================================
let output = `// 🤖 這個檔案是自動生成的，請勿手動修改！\n// 請執行 node generateImages.js 來更新此字典\n\n`;
output += `export const keywordImages = {};\n\n`;
output += `export const cardImages = {\n`;

let successCount = 0;
let missingCount = 0;
let altArtCount = 0;
let reprintCount = 0;
let reprintAltCount = 0;

const foundKeys = new Set();

// 讀取 cards.json 處理基礎卡與 Token (邏輯不變)
cards.forEach(card => {
  if (card.id) {
    const id = card.id; 
    let folder = id.split('-')[0]; 
    if (folder === 'T') {
      const match = card.set ? card.set.match(/\[(.*?)\]/) : null;
      folder = match && match[1] ? match[1] : 'ST01'; 
    }
    const relativePath = `./assets/cards/${folder}/${id}.png`;
    const absolutePath = path.join(ASSETS_DIR, folder, `${id}.png`);
    if (fs.existsSync(absolutePath)) {
      if (!foundKeys.has(id)) {
        output += `  "${id}": require('${relativePath}'),\n`;
        foundKeys.add(id);
        successCount++;
      }
    } else {
      missingCount++;
    }
  }
});

// 掃描資料夾建立字典
if (fs.existsSync(ASSETS_DIR)) {
  const folders = fs.readdirSync(ASSETS_DIR).filter(file => fs.statSync(path.join(ASSETS_DIR, file)).isDirectory());
  folders.forEach(folderName => {
    const folderPath = path.join(ASSETS_DIR, folderName);
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.png') || file.endsWith('.jpg'));

    files.forEach(file => {
      const fileNameWithoutExt = path.parse(file).name;
      // 因為實體檔案已經改好名了，我們只需要直接把檔名當作 Key 寫入！
      if (!foundKeys.has(fileNameWithoutExt)) {
        output += `  "${fileNameWithoutExt}": require('./assets/cards/${folderName}/${file}'),\n`;
        foundKeys.add(fileNameWithoutExt);
        
        // 統計分類
        if (fileNameWithoutExt.includes('_RE_')) {
          if (fileNameWithoutExt.split('_RE_')[1].includes('_')) reprintAltCount++;
          else reprintCount++;
        } else if (fileNameWithoutExt.includes('_')) {
          altArtCount++;
        } else {
          successCount++;
        }
      }
    });
  });
}

output += `};\n`;
fs.writeFileSync('./imageDictionary.js', output);

console.log(`\n✅ 階段一完成：自動更改了 ${renamedCount} 個重印卡實體檔名！`);
console.log(`✅ 階段二完成：字典已生成！(已完美避開 Webpack 覆寫衝突)`);
console.log(`  - 原版卡 & Token & Resource : ${successCount} 張`);
console.log(`  - 原產地異畫卡             : ${altArtCount} 張`);
console.log(`  - 普畫重印卡               : ${reprintCount} 張`);
console.log(`  - 重印卡的異畫版           : ${reprintAltCount} 張`);
console.log(`  - 暫無圖片卡片             : ${missingCount} 張\n`);