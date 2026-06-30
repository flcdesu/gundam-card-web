import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styles from '../styles';

const RangeTrack = ({ label, range, setRange, minVal = 0, maxVal = 9, onReset, isMobile }) => {
  const numbers = Array.from({ length: maxVal - minVal + 1 }, (_, i) => minVal + i);
  const isOffset = !numbers.includes(0);
  const isFullRange = range[0] === minVal && range[1] === maxVal;

  const handleNumberClick = (num) => {
    if (isFullRange) setRange([minVal, num]);
    else if (range[0] === minVal && range[1] === num) setRange([num, num]);
    else if (range[0] === num && range[1] === num) setRange([num, num]);
    else if (range[0] === range[1] && num !== range[0]) setRange([Math.min(range[0], num), Math.max(range[0], num)]);
    else if (range[0] === minVal && range[1] !== maxVal) setRange([minVal, num]);
    else setRange([minVal, num]);
  };

  return (
    <View style={styles.rangeTrackContainer}>
      <Text style={styles.rangeTrackLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
        {isMobile ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.rangeTrackBox, isOffset && { marginLeft: 28 }]}>
            {numbers.map(num => {
              const inRange = !isFullRange && (num >= range[0] && num <= range[1]);
              const isFirstActive = !isFullRange && (num === range[0]);
              const isLastActive = !isFullRange && (num === range[1]);
              return (
                <TouchableOpacity key={num} style={[styles.rangeNumberCell, inRange && styles.rangeNumberCellActive, isFirstActive && styles.rangeCellFirst, isLastActive && styles.rangeCellLast]} onPress={() => handleNumberClick(num)} activeOpacity={0.8}>
                  <Text style={[styles.rangeNumberText, inRange && styles.rangeNumberTextActive]}>{num}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={[styles.rangeTrackBox, isOffset && { marginLeft: 28 }]}>
            {numbers.map(num => {
              const inRange = !isFullRange && (num >= range[0] && num <= range[1]);
              const isFirstActive = !isFullRange && (num === range[0]);
              const isLastActive = !isFullRange && (num === range[1]);
              return (
                <TouchableOpacity key={num} style={[styles.rangeNumberCell, inRange && styles.rangeNumberCellActive, isFirstActive && styles.rangeCellFirst, isLastActive && styles.rangeCellLast]} onPress={() => handleNumberClick(num)} activeOpacity={0.8}>
                  <Text style={[styles.rangeNumberText, inRange && styles.rangeNumberTextActive]}>{num}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.trackResetBtn} onPress={onReset} activeOpacity={0.7}><Text style={styles.trackResetBtnText}>↺</Text></TouchableOpacity>
    </View>
  );
};

export default RangeTrack;
