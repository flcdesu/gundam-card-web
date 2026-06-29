import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import pricesData from '../data/prices.json';

const CardPriceWidget = ({ cardId, isDarkMode, isAbsolute = false }) => {
  const priceJpy = pricesData[cardId];
  
  // 🌟 召喚視窗尺寸偵測魔法
  const { width } = useWindowDimensions();
  const isMobile = width < 768; // 設定斷點：寬度小於 768px 就判定為手機版
  
  if (!priceJpy) return null; 

  return (
    <View style={[
      {
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.9)',
        // 🌟 根據 isMobile 動態切換內距與圓角 (手機版 : 電腦版)
        paddingHorizontal: isMobile ? 5 : 8, 
        paddingVertical: isMobile ? 2 : 4, 
        borderRadius: isMobile ? 4 : 6, 
        borderWidth: 1, 
        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
      },
      // 🌟 動態切換邊距
      isAbsolute && { 
        position: 'absolute', 
        top: isMobile ? 5 : 8, 
        right: isMobile ? 5 : 8, 
        zIndex: 10 
      }
    ]}>
      <Text style={{ 
        // 🌟 動態切換字體大小與粗細
        fontSize: isMobile ? 10 : 12, 
        fontWeight: isMobile ? 'bold' : '900', 
        color: isDarkMode ? '#fbbf24' : '#d97706' 
      }}>
        ￥{priceJpy.toLocaleString()}
      </Text>
    </View>
  );
};

export default CardPriceWidget;