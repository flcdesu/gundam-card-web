import React from 'react';
import { View, Text } from 'react-native';
import pricesData from '../data/prices.json';

const CardPriceWidget = ({ cardId, isDarkMode, isAbsolute = false }) => {
  const priceJpy = pricesData[cardId];
  
  // 如果沒有價格，就完全不顯示
  if (!priceJpy) return null; 

  return (
    <View style={[
      {
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 5,  // 🌟 從 8 縮小到 5
        paddingVertical: 2,    // 🌟 從 4 縮小到 2
        borderRadius: 4,       // 🌟 圓角從 6 縮小到 4，看起來更俐落
        borderWidth: 1, 
        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
      },
      // 🌟 邊距從 8 縮小到 5，讓它更貼合角落，不佔用太多卡圖空間
      isAbsolute && { position: 'absolute', top: 5, right: 5, zIndex: 10 }
    ]}>
      <Text style={{ 
        fontSize: 10,          // 🌟 從 12 縮小到 10，與 BETA 標籤完美呼應！
        fontWeight: 'bold',    // 🌟 從 900 改為 bold，避免字體縮小後糊在一起
        color: isDarkMode ? '#fbbf24' : '#d97706' // 琥珀色/金色
      }}>
        ￥{priceJpy.toLocaleString()}
      </Text>
    </View>
  );
};

export default CardPriceWidget;