import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SensorTest } from '../components/SensorTest';

export default function SensorTestScreen() {
  return (
    <View className="flex-1 bg-white">
      <SensorTest />
    </View>
  );
}
