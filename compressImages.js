const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 🌟 鎖定你的真實根目錄：public/assets
const inputFolder = path.join(__dirname, 'public', 'assets');

console.log('🚀 開始執行「全自動鑽探」圖片壓縮腳本...');
console.log(`📂 正在掃描根目錄及所有子資料夾:\n   ${inputFolder}`);

// 🕵️‍♂️ 這個「遞迴」魔法函式會一直鑽進子資料夾，直到把所有檔案找出來
function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            // 如果看到資料夾，就繼續鑽進去！
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            // 如果是檔案，就存起來！
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

// 檢查根目錄存不存在
if (!fs.existsSync(inputFolder)) {
    console.error('\n❌ 錯誤：找不到 public/assets 資料夾！請確認腳本跟 public 資料夾是不是放在同一個地方。');
    process.exit(1);
}

// 拿到所有的檔案
const allFiles = getAllFiles(inputFolder);
// 濾出結尾是 jpg, jpeg, png 的圖片檔案
const imageFiles = allFiles.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

if (imageFiles.length === 0) {
    console.log(`\n⚠️ 警告：找不到任何 JPG/PNG 圖片！請確認路徑。`);
    process.exit(1);
}

console.log(`\n🔍 在茫茫資料海中，總共找到了 ${imageFiles.length} 張圖片！`);
console.log('✨ 開始施展 WebP 瘦身魔法...\n');

let processedCount = 0;

imageFiles.forEach(inputFile => {
    // 魔法：在原來的圖片旁邊，產生一個同名但副檔名是 .webp 的新圖片！
    const outputFile = inputFile.replace(/\.(jpg|jpeg|png)$/i, '.webp');

    // 防呆：如果已經有 webp 檔案了，就跳過，這樣下次跑才不用等很久
    if (fs.existsSync(outputFile)) {
        processedCount++;
        if (processedCount === imageFiles.length) {
            console.log(`\n🎉 全部處理完畢！`);
        }
        return;
    }

    sharp(inputFile)
        .resize({ width: 600 })
        .webp({ quality: 75 })
        .toFile(outputFile)
        .then(info => {
            processedCount++;
            
            // 🌟 終極自動化：壓縮成功後，直接刪除原來的 PNG/JPG 肥大檔案！
            try {
                fs.unlinkSync(inputFile);
            } catch (err) {
                console.error(`⚠️ 刪除原圖失敗: ${inputFile}`);
            }

            console.log(`✅ [${processedCount}/${imageFiles.length}] 成功: ${path.basename(inputFile)} -> ${(info.size / 1024).toFixed(2)} KB (已刪除原圖)`);
            
            if (processedCount === imageFiles.length) {
                console.log(`\n🎉 全部處理完畢！準備起飛！`);
            }
        })
        .catch(err => {
            console.error(`❌ 失敗 ${inputFile}:`, err);
        });
});