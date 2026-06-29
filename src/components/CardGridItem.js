import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { cardImages } from '../data/cardDatabase';
import { getStyles } from '../styles';
import CardPriceWidget from './CardPriceWidget';

const CardGridItem = ({ item, dynamicCardWidth, language, onPress, isMobile, isDarkMode, showPrice }) => {
  const [isHovered, setIsHovered] = useState(false);
  const displayName = item[`name_${language}`] || '名稱未定';
  
  // 🌟 核心魔法：根據黑夜模式動態分配屬性底色
  const infoBackgroundColor = useMemo(() => {
    if (isDarkMode) {
      // 🌙 黑夜模式：極深色系的屬性底色
      return item.color === 'Blue' ? '#0f172a' : // 極深藍
             item.color === 'Red' ? '#2e1015' :  // 極深紅
             item.color === 'Green' ? '#062016' : // 極深綠
             '#1e293b';                          // 預設深灰藍
    } else {
      // ☀️ 亮色模式：原本的淡雅底色
      return item.color === 'Blue' ? '#e6f3ff' : 
             item.color === 'Red' ? '#fff1f1' : 
             item.color === 'Green' ? '#f0fff4' : 
             '#ffffff'; 
    }
  }, [isDarkMode, item.color]);

  const displayId = item.displayId || item.id;
  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

  return (
    <TouchableOpacity 
      style={[styles.gridCard, { width: dynamicCardWidth }, isMobile && { margin: 3 }, isHovered && styles.gridCardHovered]} 
      onPress={() => onPress(item)} activeOpacity={0.9} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
    >
      {/* 🌟 圖片區塊：加上 relative 定位，以便讓價格 Widget 浮動在右上角 */}
      <View style={[styles.imageWrapper, { height: dynamicCardWidth * 1.39, position: 'relative' }]}>
        {cardImages[item.id] ? (
          <Image source={{ uri: cardImages[item.id] }} style={styles.gridImage} resizeMode="cover" />
        ) : (
          <View style={styles.gridNoImage}>
            <Text style={styles.gridNoImageText}>圖片準備中</Text>
          </View>
        )}

        {/* 🌟 核心連線：當功能面板開啟 ￥ 時，列表每張卡片右上角會浮現市價 */}
        {showPrice && <CardPriceWidget cardId={item.id} isDarkMode={isDarkMode} isAbsolute={true} />}
      </View>

      <View style={[styles.gridCardInfo, { backgroundColor: infoBackgroundColor, padding: isMobile ? 4 : 6 }]}>
        <View style={styles.gridIdRow}>
          <Text style={[styles.gridCardId, isMobile && { fontSize: 9 }]} numberOfLines={1}>{displayId}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {item.isBetaCard && <Text style={[styles.gridBetaBadge, isMobile && { fontSize: 7, paddingHorizontal: 2 }]}>BETA</Text>}
            {item.isLimitedCard && <Text style={[styles.gridLimitedBadge, isMobile && { fontSize: 7, paddingHorizontal: 2 }, item.isBetaCard && { marginLeft: 4 }]}>LTD</Text>}
            {item.isPromoCard && <Text style={[styles.gridPromoBadge, isMobile && { fontSize: 7, paddingHorizontal: 2 }, (item.isBetaCard || item.isLimitedCard) && { marginLeft: 4 }]}>PR</Text>}
            {item._isReprint && <Text style={[styles.gridReprintBadge, isMobile && { fontSize: 7, paddingHorizontal: 2 }, (item.isBetaCard || item.isLimitedCard || item.isPromoCard) && { marginLeft: 4 }]}>RE</Text>}
            {item._isAltArt && <Text style={[styles.gridAltBadge, isMobile && { fontSize: 7, paddingHorizontal: 2 }, (item._isReprint || item.isBetaCard || item.isLimitedCard || item.isPromoCard) && { marginLeft: 4 }]}>異</Text>}
          </View>
        </View>
        <Text style={[styles.gridCardName, isMobile && { fontSize: 10 }]} numberOfLines={1}>{displayName}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default CardGridItem;