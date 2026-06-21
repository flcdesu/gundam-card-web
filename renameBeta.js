const fs = require('fs');
const path = require('path');

// 🌟 目標資料夾：Beta 卡片的暫存加工區
const targetDir = "C:\\Users\\FLC\\Desktop\\JavaScript\\Gundam Card Web\\gundam-card-web\\assets\\cards\\beta";

// 開始讀取資料夾
fs.readdir(targetDir, (err, files) => {
    if (err) {
        console.error("❌ 讀取資料夾失敗，請確認路徑是否正確：", err);
        return;
    }

    let renamedCount = 0;

    files.forEach(file => {
        // 只過濾圖片檔案 (避免改到隱藏檔或其他怪東西)
        if (!file.toLowerCase().endsWith('.png') && !file.toLowerCase().endsWith('.jpg')) return;

        const ext = path.extname(file); // 取得副檔名 (例如 .png)
        const nameWithoutExt = path.basename(file, ext); // 取得主檔名 (例如 GD01-004_PLUS)

        // 🛡️ 防呆機制：如果名字裡已經有 _BETA，就跳過不處理，避免重複疊加 (冪等性)
        if (nameWithoutExt.includes('_BETA')) {
            console.log(`⏩ 已略過 (早已有 _BETA)：${file}`);
            return;
        }

        let newFileName = '';
        const firstUnderscoreIndex = nameWithoutExt.indexOf('_');

        // 判斷是否有異畫後綴 (尋找第一個底線)
        if (firstUnderscoreIndex === -1) {
            // 情境 1：常規卡 (例如 GD01-004) ➔ 直接在後面加上 _BETA
            newFileName = `${nameWithoutExt}_BETA${ext}`;
        } else {
            // 情境 2：異畫卡 (例如 GD01-004_PLUS) ➔ 把 _BETA 夾在卡號和後綴中間
            const baseId = nameWithoutExt.substring(0, firstUnderscoreIndex); // GD01-004
            const suffix = nameWithoutExt.substring(firstUnderscoreIndex);    // _PLUS
            newFileName = `${baseId}_BETA${suffix}${ext}`;                    // GD01-004_BETA_PLUS.png
        }

        // 組合完整的檔案路徑
        const oldFilePath = path.join(targetDir, file);
        const newFilePath = path.join(targetDir, newFileName);

        // 執行重新命名
        try {
            fs.renameSync(oldFilePath, newFilePath);
            console.log(`✅ 成功改名：${file} ➔ ${newFileName}`);
            renamedCount++;
        } catch (renameErr) {
            console.error(`❌ 改名失敗 (${file}):`, renameErr);
        }
    });

    console.log(`\n🎉 任務完成！共成功為 ${renamedCount} 張 Beta 卡加上後綴。`);
    console.log(`👉 現在你可以安心地將這批圖片剪下，貼上到你的常規卡圖資料夾裡了！`);
});
