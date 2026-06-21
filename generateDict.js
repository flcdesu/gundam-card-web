const fs = require('fs');
const path = require('path');

// 🌟 掃描路徑改為 public 底下
const scanDirectories = [
    './public/assets/cards',
    './public/assets/special'
];

const outputFile = './imageDictionary.js';

function getAllImageFiles(dirPath, arrayOfFiles) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllImageFiles(fullPath, arrayOfFiles);
        } else {
            if (file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg')) {
                // 🌟 核心改變：不再使用 require()，直接存成相對網址路徑
                const relativeUrl = fullPath.replace('public\\', '').replace('public/', '/').replace(/\\/g, '/');
                // 確保路徑是以 / 開頭
                const finalUrl = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
                arrayOfFiles.push({ path: fullPath, url: finalUrl });
            }
        }
    });
    return arrayOfFiles;
}

console.log('🔄 開始極速雷達掃描 (靜態模式)...');

let allImages = [];
scanDirectories.forEach(dir => {
    allImages = getAllImageFiles(dir, allImages);
});

// 依照 A-Z 排序
allImages.sort((a, b) => a.url.localeCompare(b.url));

let fileContent = `// 🚀 此檔案由腳本自動生成 (靜態模式)\n\n`;
fileContent += `export const cardImages = {\n`;

allImages.forEach(img => {
    const ext = path.extname(img.path);
    const fileName = path.basename(img.path, ext);
    // 寫入字串網址，而不是 require()
    fileContent += `  "${fileName}": "${img.url}",\n`;
});

fileContent += `};\n\n`;
fileContent += `export const keywordImages = {};\n`;

fs.writeFileSync(outputFile, fileContent);
console.log(`✅ 大成功！圖片字典已轉為輕量靜態模式，共掃描了 ${allImages.length} 張圖片！`);