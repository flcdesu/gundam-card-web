// cleanImages.js (解鎖防霸占版)
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const cards = require('./cards.json'); 

const CACHE_FILE = path.join(__dirname, '.cleaned_images_cache.json');
let cleanedCache = {};

if (fs.existsSync(CACHE_FILE)) {
  try { cleanedCache = require(CACHE_FILE) || {}; } catch (e) { cleanedCache = {}; }
}

const nextCache = { ...cleanedCache }; 

async function cleanMain() {
  console.log('🧹 啟動解鎖版點名冊智慧增量圖片清洗器...');
  let cleanCount = 0;
  let skipCount = 0;

  for (const card of cards) {
    if (!card.id) continue;

    const id = card.id;
    let folder = id.split('-')[0];
    if (folder === 'T') {
      const match = card.set ? card.set.match(/\[(.*?)\]/) : null;
      folder = (match && match[1]) ? match[1] : 'ST01';
    }

    const targetPath = path.join(__dirname, 'assets', 'cards', folder, `${id}.png`);
    if (!fs.existsSync(targetPath)) continue;

    const stat = fs.statSync(targetPath);
    const cacheKey = path.resolve(targetPath);

    if (cleanedCache[cacheKey] && 
        cleanedCache[cacheKey].size === stat.size && 
        cleanedCache[cacheKey].mtimeMs === stat.mtimeMs) {
      skipCount++;
      continue; 
    }

    try {
      // 🌟 核心解鎖魔法：先用純 fs 讀成二進位 Buffer，這樣 Windows 就會立刻放開檔案鎖！
      const inputBuffer = fs.readFileSync(targetPath);
      
      // 讓 sharp 在記憶體裡處理這個 Buffer，不要去碰實體檔案
      const outputBuffer = await sharp(inputBuffer).png().toBuffer();
      
      // 最後強制一次性寫入覆蓋
      fs.writeFileSync(targetPath, outputBuffer);
      
      const newStat = fs.statSync(targetPath);
      nextCache[cacheKey] = {
        size: newStat.size,
        mtimeMs: newStat.mtimeMs
      };
      
      console.log(`⚡ [成功解鎖清洗]：${folder}/${id}.png`);
      cleanCount++;
    } catch (error) {
      console.error(`❌ 無法處理檔案：${id}.png`, error.message);
    }
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(nextCache, null, 2));
  console.log(`✨ 報告！已閃擊跳過 ${skipCount} 張舊圖，成功強攻清洗了 ${cleanCount} 張被鎖定的新圖！`);
}

cleanMain();