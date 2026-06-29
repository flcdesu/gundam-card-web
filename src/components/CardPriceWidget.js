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
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 6, 
        borderWidth: 1, 
        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
      },
      // 🌟 核心魔法：如果是 isAbsolute，就會開啟絕對定位，浮動在右上角
      isAbsolute && { position: 'absolute', top: 8, right: 8, zIndex: 10 }
    ]}>
      <Text style={{ 
        fontSize: 12, 
        fontWeight: '900', 
        color: isDarkMode ? '#fbbf24' : '#d97706' // 琥珀色/金色
      }}>
        ￥{priceJpy.toLocaleString()}
      </Text>
    </View>
  );
};

export default CardPriceWidget;