const fs = require('fs');
const path = require('path');

console.log('🔍 開始掃描並修復違規的檔名 (處理 "+" 符號)...');

const inputFolder = path.join(__dirname, 'public', 'assets');

function getAllFiles(dirPath, arrayOfFiles) {
    if (!fs.existsSync(dirPath)) {
        console.log(`⚠️ 找不到資料夾: ${dirPath}`);
        return arrayOfFiles || [];
    }
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });
    return arrayOfFiles;
}

const allFiles = getAllFiles(inputFolder);
let renamedCount = 0;

allFiles.forEach(filePath => {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);

    // 🌟 核心邏輯：把 " ++" 變成 "_PLUSPLUS"，把 " +" 或 "+" 變成 "_PLUS"
    if (baseName.includes('+')) {
        let newBaseName = baseName
            .replace(/\s*\+\+/g, '_PLUSPLUS') // 先處理 ++ 
            .replace(/\s*\+/g, '_PLUS');      // 再處理單個 +

        const newFullPath = path.join(dir, newBaseName + ext);
        fs.renameSync(filePath, newFullPath);
        console.log(`✅ 修復成功: ${baseName}${ext} -> ${newBaseName}${ext}`);
        renamedCount++;
    }
});

if (renamedCount === 0) {
    console.log('✨ 檢查完畢，沒有發現違規檔名！');
} else {
    console.log(`🎉 檔名修復完成！共修改了 ${renamedCount} 個檔案。`);
}