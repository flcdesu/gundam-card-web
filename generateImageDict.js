const fs = require('fs');
const path = require('path');

// 🌟 定義要掃描的資料夾陣列 (以專案根目錄為起點)
const scanDirectories = [
    './assets/cards',
    './assets/special' // 新增了 special 資料夾！
];

const outputFile = './imageDictionary.js';

// 遞迴掃描資料夾的引擎
function getAllImageFiles(dirPath, arrayOfFiles) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;

    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllImageFiles(fullPath, arrayOfFiles);
        } else {
            // 只抓取 png 或 jpg
            if (file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg')) {
                // 將路徑轉換為 React Native require 接受的格式
                const requirePath = './' + fullPath.replace(/\\/g, '/');
                arrayOfFiles.push(requirePath);
            }
        }
    });
    return arrayOfFiles;
}

console.log('🔄 開始雷達掃描圖片資料夾...');

let allImages = [];
scanDirectories.forEach(dir => {
    allImages = getAllImageFiles(dir, allImages);
});

// 依照 A-Z 排序
allImages.sort();

// 開始組合 imageDictionary.js 內容
let fileContent = `// 🚀 此檔案由腳本自動生成，請勿手動修改！\n`;
fileContent += `// 若有新增圖片，請直接運行對應腳本即可全自動更新\n\n`;
fileContent += `export const cardImages = {\n`;

allImages.forEach(imagePath => {
    const ext = path.extname(imagePath);
    const fileName = path.basename(imagePath, ext);
    fileContent += `  "${fileName}": require('${imagePath}'),\n`;
});

fileContent += `};\n\n`;
fileContent += `export const keywordImages = {\n  // 留空給關鍵字圖片使用\n};\n`;

fs.writeFileSync(outputFile, fileContent);
console.log(`✅ 大成功！圖片字典已更新，共掃描了 ${allImages.length} 張圖片！`);