import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, Alert, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

// Global type declaration
declare global {
  var addCaptchaData: ((data: Omit<CaptchaData, 'id'>) => Promise<void>) | undefined;
  var addPinData: ((data: any) => Promise<void>) | undefined;
}

interface DatasetScreenProps {
  onBack: () => void;
}

interface CaptchaData {
  id: string;
  username: string;
  captcha: string;
  userInput: string;
  isCorrect: boolean;
  timestamp: string;
  totalTime: number;
  wpm: number;
  backspaceCount: number;
  avgFlightTime: number;
  avgDwellTime: number;
  avgInterKeyPause: number;
  sessionEntropy: number;
  keyDwellVariance: number;
  interKeyVariance: number;
  pressureVariance: number;
  touchAreaVariance: number;
  avgTouchArea: number;
  avgPressure: number;
  avgCoordX: number;
  avgCoordY: number;
  avgErrorRecoveryTime: number;
  characterCount: number;
  // Additional comprehensive data fields
  flightTimes: number[];
  dwellTimes: number[];
  interKeyPauses: number[];
  typingPatternVector: number[];
  keyTimingsCount: number;
  touchEventsCount: number;
  errorRecoveryCount: number;
  devicePlatform: string;
  deviceScreenWidth: number;
  deviceScreenHeight: number;
  devicePixelRatio: number;
  keyTimings: any[];
  touchEvents: any[];
  errorRecoveryEvents: any[];
  deviceMetrics: any;
}

export const DatasetScreen = ({ onBack }: DatasetScreenProps) => {
  const [captchaData, setCaptchaData] = useState<CaptchaData[]>([]);
  const [pinData, setPinData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showRawData, setShowRawData] = useState<string | null>(null);

  // Load captcha data from AsyncStorage
  const loadCaptchaData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('captchaDataset');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setCaptchaData(parsedData);
      }
    } catch (error) {
      console.error('Error loading captcha data:', error);
    }
  };

  // Load PIN data from AsyncStorage
  const loadPinData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('pinDataset');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setPinData(parsedData);
      }
    } catch (error) {
      console.error('Error loading PIN data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save captcha data to AsyncStorage
  const saveCaptchaData = async (data: CaptchaData[]) => {
    try {
      await AsyncStorage.setItem('captchaDataset', JSON.stringify(data));
      setCaptchaData(data);
    } catch (error) {
      console.error('Error saving captcha data:', error);
    }
  };

  // Save PIN data to AsyncStorage
  const savePinData = async (data: any[]) => {
    try {
      await AsyncStorage.setItem('pinDataset', JSON.stringify(data));
      setPinData(data);
    } catch (error) {
      console.error('Error saving PIN data:', error);
    }
  };

  // Add new captcha data entry
  const addCaptchaData = async (newData: Omit<CaptchaData, 'id'>) => {
    const dataWithId = {
      ...newData,
      id: Date.now().toString(),
    };
    const updatedData = [...captchaData, dataWithId];
    await saveCaptchaData(updatedData);
  };

  // Add new PIN data entry
  const addPinData = async (newData: any) => {
    const updatedData = [...pinData, newData];
    await savePinData(updatedData);
  };

  // Copy entry data to clipboard
  const copyEntryToClipboard = async (item: CaptchaData) => {
    try {
      const csvData = [
        `"${item.username}"`,
        `"${item.captcha}"`,
        `"${item.userInput}"`,
        item.isCorrect.toString(),
        `"${item.timestamp}"`,
        item.totalTime.toString(),
        item.wpm.toFixed(2),
        item.backspaceCount.toString(),
        item.avgFlightTime.toFixed(3),
        item.avgDwellTime.toFixed(3),
        item.avgInterKeyPause.toFixed(3),
        item.sessionEntropy.toFixed(3),
        item.keyDwellVariance.toFixed(3),
        item.interKeyVariance.toFixed(3),
        item.pressureVariance.toFixed(3),
        item.touchAreaVariance.toFixed(3),
        item.avgTouchArea.toFixed(3),
        item.avgPressure.toFixed(3),
        item.avgCoordX.toFixed(3),
        item.avgCoordY.toFixed(3),
        item.avgErrorRecoveryTime.toFixed(3),
        item.characterCount.toString(),
        `"[${(item.flightTimes || []).join(';')}]"`,
        `"[${(item.dwellTimes || []).join(';')}]"`,
        `"[${(item.interKeyPauses || []).join(';')}]"`,
        `"[${(item.typingPatternVector || []).join(';')}]"`,
        (item.keyTimingsCount || 0).toString(),
        (item.touchEventsCount || 0).toString(),
        (item.errorRecoveryCount || 0).toString(),
        `"${item.devicePlatform || 'unknown'}"`,
        (item.deviceScreenWidth || 0).toString(),
        (item.deviceScreenHeight || 0).toString(),
        (item.devicePixelRatio || 1).toString()
      ].join(',');
      
      await Clipboard.setStringAsync(csvData);
      Alert.alert('Copied!', 'Entry data copied to clipboard in CSV format.');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy data to clipboard.');
    }
  };

  // Copy PIN entry data to clipboard
  const copyPinEntryToClipboard = async (item: any) => {
    try {
      const csvData = [
        `"${item.username || ''}"`,
        `"${item.captcha || ''}"`,
        `"${item.userInput || ''}"`,
        (item.isCorrect || false).toString(),
        `"${item.timestamp || ''}"`,
        (item.totalTime || 0).toString(),
        (item.wpm?.toFixed(2) || 0).toString(),
        (item.backspaceCount || 0).toString(),
        (item.avgFlightTime?.toFixed(3) || 0).toString(),
        (item.avgDwellTime?.toFixed(3) || 0).toString(),
        (item.avgInterKeyPause?.toFixed(3) || 0).toString(),
        (item.sessionEntropy?.toFixed(3) || 0).toString(),
        (item.keyDwellVariance?.toFixed(3) || 0).toString(),
        (item.interKeyVariance?.toFixed(3) || 0).toString(),
        (item.pressureVariance?.toFixed(3) || 0).toString(),
        (item.touchAreaVariance?.toFixed(3) || 0).toString(),
        (item.avgTouchArea?.toFixed(3) || 0).toString(),
        (item.avgPressure?.toFixed(3) || 0).toString(),
        (item.avgCoordX?.toFixed(3) || 0).toString(),
        (item.avgCoordY?.toFixed(3) || 0).toString(),
        (item.avgErrorRecoveryTime?.toFixed(3) || 0).toString(),
        (item.characterCount || 0).toString(),
        `"[${(item.flightTimes || []).join(';')}]"`,
        `"[${(item.dwellTimes || []).join(';')}]"`,
        `"[${(item.interKeyPauses || []).join(';')}]"`,
        `"[${(item.typingPatternVector || []).join(';')}]"`,
        (item.keyTimingsCount || 0).toString(),
        (item.touchEventsCount || 0).toString(),
        (item.errorRecoveryCount || 0).toString(),
        `"${item.devicePlatform || 'unknown'}"`,
        (item.deviceScreenWidth || 0).toString(),
        (item.deviceScreenHeight || 0).toString(),
        (item.devicePixelRatio || 1).toString()
      ].join(',');
      
      await Clipboard.setStringAsync(csvData);
      Alert.alert('Copied!', 'PIN entry data copied to clipboard in CSV format.');
    } catch (error) {
      console.error('Error copying PIN data to clipboard:', error);
      Alert.alert('Error', 'Failed to copy PIN data to clipboard.');
    }
  };

  // Export data as CSV
  const exportData = async () => {
    if (captchaData.length === 0 && pinData.length === 0) {
      Alert.alert('No Data', 'There is no data to export.');
      return;
    }

    // Show export options if both datasets exist
    if (captchaData.length > 0 && pinData.length > 0) {
      Alert.alert(
        'Export Data',
        'Which dataset would you like to export?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'CAPTCHA Data', onPress: () => exportCaptchaData() },
          { text: 'PIN Data', onPress: () => exportPinData() },
          { text: 'Both', onPress: () => exportAllData() }
        ]
      );
      return;
    }

    // Export available dataset
    if (captchaData.length > 0) {
      await exportCaptchaData();
    } else if (pinData.length > 0) {
      await exportPinData();
    }
  };

  // Export CAPTCHA data
  const exportCaptchaData = async () => {
    try {
      // Create CSV headers
      const headers = [
        'username', 'captcha', 'userInput', 'isCorrect', 'timestamp', 
        'totalTime', 'wpm', 'backspaceCount', 'avgFlightTime', 'avgDwellTime',
        'avgInterKeyPause', 'sessionEntropy', 'keyDwellVariance', 'interKeyVariance',
        'pressureVariance', 'touchAreaVariance', 'avgTouchArea', 'avgPressure',
        'avgCoordX', 'avgCoordY', 'avgErrorRecoveryTime', 'characterCount',
        'flightTimesArray', 'dwellTimesArray', 'interKeyPausesArray', 
        'typingPatternVector', 'keyTimingsCount', 'touchEventsCount', 
        'errorRecoveryCount', 'devicePlatform', 'deviceScreenWidth', 
        'deviceScreenHeight', 'devicePixelRatio'
      ];

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...captchaData.map(item => [
          `"${item.username || ''}"`,
          `"${item.captcha || ''}"`,
          `"${item.userInput || ''}"`,
          item.isCorrect || false,
          `"${item.timestamp || ''}"`,
          item.totalTime || 0,
          item.wpm?.toFixed(2) || 0,
          item.backspaceCount || 0,
          item.avgFlightTime?.toFixed(3) || 0,
          item.avgDwellTime?.toFixed(3) || 0,
          item.avgInterKeyPause?.toFixed(3) || 0,
          item.sessionEntropy?.toFixed(3) || 0,
          item.keyDwellVariance?.toFixed(3) || 0,
          item.interKeyVariance?.toFixed(3) || 0,
          item.pressureVariance?.toFixed(3) || 0,
          item.touchAreaVariance?.toFixed(3) || 0,
          item.avgTouchArea?.toFixed(3) || 0,
          item.avgPressure?.toFixed(3) || 0,
          item.avgCoordX?.toFixed(3) || 0,
          item.avgCoordY?.toFixed(3) || 0,
          item.avgErrorRecoveryTime?.toFixed(3) || 0,
          item.characterCount || 0,
          `"[${(item.flightTimes || []).join(';')}]"`,
          `"[${(item.dwellTimes || []).join(';')}]"`,
          `"[${(item.interKeyPauses || []).join(';')}]"`,
          `"[${(item.typingPatternVector || []).join(';')}]"`,
          item.keyTimingsCount || 0,
          item.touchEventsCount || 0,
          item.errorRecoveryCount || 0,
          `"${item.devicePlatform || 'unknown'}"`,
          item.deviceScreenWidth || 0,
          item.deviceScreenHeight || 0,
          item.devicePixelRatio || 1
        ].join(','))
      ].join('\n');

      // Save to file
      const fileName = `captcha_dataset_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Export Complete', `CAPTCHA data exported to: ${fileName}`);
      }
    } catch (error) {
      console.error('Error exporting CAPTCHA data:', error);
      Alert.alert('Export Error', 'Failed to export CAPTCHA data. Please try again.');
    }
  };

  // Export PIN data
  const exportPinData = async () => {
    try {
      // Create CSV headers (same format as CAPTCHA for consistency)
      const headers = [
        'username', 'captcha', 'userInput', 'isCorrect', 'timestamp', 
        'totalTime', 'wpm', 'backspaceCount', 'avgFlightTime', 'avgDwellTime',
        'avgInterKeyPause', 'sessionEntropy', 'keyDwellVariance', 'interKeyVariance',
        'pressureVariance', 'touchAreaVariance', 'avgTouchArea', 'avgPressure',
        'avgCoordX', 'avgCoordY', 'avgErrorRecoveryTime', 'characterCount',
        'flightTimesArray', 'dwellTimesArray', 'interKeyPausesArray', 
        'typingPatternVector', 'keyTimingsCount', 'touchEventsCount', 
        'errorRecoveryCount', 'devicePlatform', 'deviceScreenWidth', 
        'deviceScreenHeight', 'devicePixelRatio'
      ];

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...pinData.map(item => [
          `"${item.username || ''}"`,
          `"${item.captcha || ''}"`,
          `"${item.userInput || ''}"`,
          item.isCorrect || false,
          `"${item.timestamp || ''}"`,
          item.totalTime || 0,
          item.wpm?.toFixed(2) || 0,
          item.backspaceCount || 0,
          item.avgFlightTime?.toFixed(3) || 0,
          item.avgDwellTime?.toFixed(3) || 0,
          item.avgInterKeyPause?.toFixed(3) || 0,
          item.sessionEntropy?.toFixed(3) || 0,
          item.keyDwellVariance?.toFixed(3) || 0,
          item.interKeyVariance?.toFixed(3) || 0,
          item.pressureVariance?.toFixed(3) || 0,
          item.touchAreaVariance?.toFixed(3) || 0,
          item.avgTouchArea?.toFixed(3) || 0,
          item.avgPressure?.toFixed(3) || 0,
          item.avgCoordX?.toFixed(3) || 0,
          item.avgCoordY?.toFixed(3) || 0,
          item.avgErrorRecoveryTime?.toFixed(3) || 0,
          item.characterCount || 0,
          `"[${(item.flightTimes || []).join(';')}]"`,
          `"[${(item.dwellTimes || []).join(';')}]"`,
          `"[${(item.interKeyPauses || []).join(';')}]"`,
          `"[${(item.typingPatternVector || []).join(';')}]"`,
          item.keyTimingsCount || 0,
          item.touchEventsCount || 0,
          item.errorRecoveryCount || 0,
          `"${item.devicePlatform || 'unknown'}"`,
          item.deviceScreenWidth || 0,
          item.deviceScreenHeight || 0,
          item.devicePixelRatio || 1
        ].join(','))
      ].join('\n');

      // Save to file
      const fileName = `pin_dataset_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Export Complete', `PIN data exported to: ${fileName}`);
      }
    } catch (error) {
      console.error('Error exporting PIN data:', error);
      Alert.alert('Export Error', 'Failed to export PIN data. Please try again.');
    }
  };

  // Export all data (both CAPTCHA and PIN)
  const exportAllData = async () => {
    try {
      const headers = [
        'dataType', 'username', 'captcha', 'userInput', 'isCorrect', 'timestamp', 
        'totalTime', 'wpm', 'backspaceCount', 'avgFlightTime', 'avgDwellTime',
        'avgInterKeyPause', 'sessionEntropy', 'keyDwellVariance', 'interKeyVariance',
        'pressureVariance', 'touchAreaVariance', 'avgTouchArea', 'avgPressure',
        'avgCoordX', 'avgCoordY', 'avgErrorRecoveryTime', 'characterCount',
        'flightTimesArray', 'dwellTimesArray', 'interKeyPausesArray', 
        'typingPatternVector', 'keyTimingsCount', 'touchEventsCount', 
        'errorRecoveryCount', 'devicePlatform', 'deviceScreenWidth', 
        'deviceScreenHeight', 'devicePixelRatio'
      ];

      const allData = [
        ...captchaData.map(item => ({ ...item, dataType: 'CAPTCHA' })),
        ...pinData.map(item => ({ ...item, dataType: 'PIN' }))
      ];

      const csvContent = [
        headers.join(','),
        ...allData.map(item => [
          `"${item.dataType || ''}"`,
          `"${item.username || ''}"`,
          `"${item.captcha || ''}"`,
          `"${item.userInput || ''}"`,
          item.isCorrect || false,
          `"${item.timestamp || ''}"`,
          item.totalTime || 0,
          item.wpm?.toFixed(2) || 0,
          item.backspaceCount || 0,
          item.avgFlightTime?.toFixed(3) || 0,
          item.avgDwellTime?.toFixed(3) || 0,
          item.avgInterKeyPause?.toFixed(3) || 0,
          item.sessionEntropy?.toFixed(3) || 0,
          item.keyDwellVariance?.toFixed(3) || 0,
          item.interKeyVariance?.toFixed(3) || 0,
          item.pressureVariance?.toFixed(3) || 0,
          item.touchAreaVariance?.toFixed(3) || 0,
          item.avgTouchArea?.toFixed(3) || 0,
          item.avgPressure?.toFixed(3) || 0,
          item.avgCoordX?.toFixed(3) || 0,
          item.avgCoordY?.toFixed(3) || 0,
          item.avgErrorRecoveryTime?.toFixed(3) || 0,
          item.characterCount || 0,
          `"[${(item.flightTimes || []).join(';')}]"`,
          `"[${(item.dwellTimes || []).join(';')}]"`,
          `"[${(item.interKeyPauses || []).join(';')}]"`,
          `"[${(item.typingPatternVector || []).join(';')}]"`,
          item.keyTimingsCount || 0,
          item.touchEventsCount || 0,
          item.errorRecoveryCount || 0,
          `"${item.devicePlatform || 'unknown'}"`,
          item.deviceScreenWidth || 0,
          item.deviceScreenHeight || 0,
          item.devicePixelRatio || 1
        ].join(','))
      ].join('\n');

      const fileName = `biometric_dataset_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Export Complete', `Combined dataset exported to: ${fileName}`);
      }
    } catch (error) {
      console.error('Error exporting combined data:', error);
      Alert.alert('Export Error', 'Failed to export combined data. Please try again.');
    }
  };

  // Delete all data
  const deleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'Are you sure you want to delete all captcha data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('captchaDataset');
              setCaptchaData([]);
              Alert.alert('Success', 'All captcha data has been deleted.');
            } catch (error) {
              console.error('Error deleting data:', error);
              Alert.alert('Error', 'Failed to delete data. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Delete all PIN data
  const deleteAllPinData = () => {
    Alert.alert(
      'Delete All PIN Data',
      'Are you sure you want to delete all PIN data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('pinDataset');
              setPinData([]);
              Alert.alert('Success', 'All PIN data has been deleted.');
            } catch (error) {
              console.error('Error deleting PIN data:', error);
              Alert.alert('Error', 'Failed to delete PIN data. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Delete single entry
  const deleteEntry = (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updatedData = captchaData.filter(item => item.id !== id);
            await saveCaptchaData(updatedData);
          }
        }
      ]
    );
  };

  // Delete single PIN entry
  const deletePinEntry = (id: string) => {
    Alert.alert(
      'Delete PIN Entry',
      'Are you sure you want to delete this PIN entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updatedData = pinData.filter(item => item.id !== id);
            await savePinData(updatedData);
          }
        }
      ]
    );
  };

  // Render captcha data item
  const renderCaptchaItem = ({ item }: { item: CaptchaData }) => {
    const isExpanded = expandedItem === item.id;
    
    const toggleExpanded = () => {
      setExpandedItem(isExpanded ? null : item.id);
    };

    return (
      <TouchableOpacity 
        onPress={toggleExpanded}
        className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-gray-800 font-semibold text-base">
              {item.captcha} → {item.userInput}
            </Text>
            <View className="flex-row items-center mt-1">
              <MaterialIcons 
                name={item.isCorrect ? "check-circle" : "cancel"} 
                size={16} 
                color={item.isCorrect ? "#10b981" : "#ef4444"} 
              />
              <Text className={`ml-1 text-sm font-medium ${item.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {item.isCorrect ? 'Correct' : 'Incorrect'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => deleteEntry(item.id)} className="p-2 mr-2">
              <MaterialIcons name="delete" size={20} color="#ef4444" />
            </TouchableOpacity>
            <MaterialIcons 
              name={isExpanded ? "expand-less" : "expand-more"} 
              size={24} 
              color="#6b7280" 
            />
          </View>
        </View>
        
        <View className="flex-row justify-between items-center pt-2 border-t border-gray-100">
          <Text className="text-gray-500 text-xs">
            {new Date(item.timestamp).toLocaleString()}
          </Text>
          <View className="flex-row space-x-4">
            <Text className="text-gray-500 text-xs">
              {item.totalTime.toFixed(1)}s
            </Text>
            <Text className="text-gray-500 text-xs">
              {item.wpm.toFixed(0)} WPM
            </Text>
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View className="mt-4 pt-4 border-t border-gray-200">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-800 font-semibold text-base">Detailed Biometric Data</Text>
              <TouchableOpacity 
                onPress={() => copyEntryToClipboard(item)}
                className="bg-blue-100 rounded-lg px-3 py-1 flex-row items-center"
              >
                <MaterialIcons name="content-copy" size={16} color="#2563eb" />
                <Text className="text-blue-700 text-xs ml-1 font-medium">Copy CSV</Text>
              </TouchableOpacity>
            </View>
            
            {/* Basic Info */}
            <View className="bg-blue-50 rounded-lg p-3 mb-3">
              <Text className="text-blue-800 font-semibold text-sm mb-2">Basic Information</Text>
              <View className="space-y-1">
                <Text className="text-blue-700 text-xs">Username: {item.username}</Text>
                <Text className="text-blue-700 text-xs">Character Count: {item.characterCount}</Text>
                <Text className="text-blue-700 text-xs">Backspace Count: {item.backspaceCount}</Text>
                <Text className="text-blue-700 text-xs">Total Time: {item.totalTime.toFixed(3)}s</Text>
                <Text className="text-blue-700 text-xs">WPM: {item.wpm.toFixed(2)}</Text>
              </View>
            </View>

            {/* Timing Metrics */}
            <View className="bg-green-50 rounded-lg p-3 mb-3">
              <Text className="text-green-800 font-semibold text-sm mb-2">Timing Metrics</Text>
              <View className="space-y-1">
                <Text className="text-green-700 text-xs">Avg Flight Time: {item.avgFlightTime.toFixed(3)}ms</Text>
                <Text className="text-green-700 text-xs">Avg Dwell Time: {item.avgDwellTime.toFixed(3)}ms</Text>
                <Text className="text-green-700 text-xs">Avg Inter-Key Pause: {item.avgInterKeyPause.toFixed(3)}ms</Text>
                <Text className="text-green-700 text-xs">Session Entropy: {item.sessionEntropy.toFixed(3)}</Text>
              </View>
            </View>

            {/* Variance Metrics */}
            <View className="bg-purple-50 rounded-lg p-3 mb-3">
              <Text className="text-purple-800 font-semibold text-sm mb-2">Variance Metrics</Text>
              <View className="space-y-1">
                <Text className="text-purple-700 text-xs">Key Dwell Variance: {item.keyDwellVariance.toFixed(3)}</Text>
                <Text className="text-purple-700 text-xs">Inter-Key Variance: {item.interKeyVariance.toFixed(3)}</Text>
                <Text className="text-purple-700 text-xs">Pressure Variance: {item.pressureVariance.toFixed(3)}</Text>
                <Text className="text-purple-700 text-xs">Touch Area Variance: {item.touchAreaVariance.toFixed(3)}</Text>
              </View>
            </View>

            {/* Touch Metrics */}
            <View className="bg-orange-50 rounded-lg p-3 mb-3">
              <Text className="text-orange-800 font-semibold text-sm mb-2">Touch Metrics</Text>
              <View className="space-y-1">
                <Text className="text-orange-700 text-xs">Avg Touch Area: {item.avgTouchArea.toFixed(3)}px²</Text>
                <Text className="text-orange-700 text-xs">Avg Pressure: {item.avgPressure.toFixed(3)}</Text>
                <Text className="text-orange-700 text-xs">Avg Coord X: {item.avgCoordX.toFixed(3)}px</Text>
                <Text className="text-orange-700 text-xs">Avg Coord Y: {item.avgCoordY.toFixed(3)}px</Text>
                <Text className="text-orange-700 text-xs">Avg Error Recovery Time: {item.avgErrorRecoveryTime.toFixed(3)}ms</Text>
              </View>
            </View>

            {/* Raw Data Arrays */}
            <View className="bg-indigo-50 rounded-lg p-3 mb-3">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-indigo-800 font-semibold text-sm">Raw Data Arrays</Text>
                <TouchableOpacity 
                  onPress={() => setShowRawData(showRawData === item.id ? null : item.id)}
                  className="bg-indigo-100 rounded px-2 py-1"
                >
                  <Text className="text-indigo-700 text-xs font-medium">
                    {showRawData === item.id ? 'Hide' : 'Show'} Raw
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="space-y-1">
                <Text className="text-indigo-700 text-xs">Flight Times: {(item.flightTimes || []).length} values</Text>
                <Text className="text-indigo-700 text-xs">Dwell Times: {(item.dwellTimes || []).length} values</Text>
                <Text className="text-indigo-700 text-xs">Inter-Key Pauses: {(item.interKeyPauses || []).length} values</Text>
                <Text className="text-indigo-700 text-xs">Typing Pattern Vector: {(item.typingPatternVector || []).length} values</Text>
              </View>
              
              {/* Raw Data Values */}
              {showRawData === item.id && (
                <View className="mt-3 pt-3 border-t border-indigo-200">
                  {(item.flightTimes || []).length > 0 && (
                    <View className="mb-2">
                      <Text className="text-indigo-800 font-medium text-xs mb-1">Flight Times (ms):</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                        <Text className="text-indigo-600 text-xs font-mono">
                          [{(item.flightTimes || []).map(t => t.toFixed(1)).join(', ')}]
                        </Text>
                      </ScrollView>
                    </View>
                  )}
                  
                  {(item.dwellTimes || []).length > 0 && (
                    <View className="mb-2">
                      <Text className="text-indigo-800 font-medium text-xs mb-1">Dwell Times (ms):</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                        <Text className="text-indigo-600 text-xs font-mono">
                          [{(item.dwellTimes || []).map(t => t.toFixed(1)).join(', ')}]
                        </Text>
                      </ScrollView>
                    </View>
                  )}
                  
                  {(item.interKeyPauses || []).length > 0 && (
                    <View className="mb-2">
                      <Text className="text-indigo-800 font-medium text-xs mb-1">Inter-Key Pauses (ms):</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                        <Text className="text-indigo-600 text-xs font-mono">
                          [{(item.interKeyPauses || []).map(t => t.toFixed(1)).join(', ')}]
                        </Text>
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Event Counts */}
            <View className="bg-teal-50 rounded-lg p-3 mb-3">
              <Text className="text-teal-800 font-semibold text-sm mb-2">Event Counts</Text>
              <View className="space-y-1">
                <Text className="text-teal-700 text-xs">Key Timings: {item.keyTimingsCount || 0}</Text>
                <Text className="text-teal-700 text-xs">Touch Events: {item.touchEventsCount || 0}</Text>
                <Text className="text-teal-700 text-xs">Error Recovery Events: {item.errorRecoveryCount || 0}</Text>
              </View>
            </View>

            {/* Device Information */}
            <View className="bg-amber-50 rounded-lg p-3 mb-3">
              <Text className="text-amber-800 font-semibold text-sm mb-2">Device Information</Text>
              <View className="space-y-1">
                <Text className="text-amber-700 text-xs">Platform: {item.devicePlatform || 'unknown'}</Text>
                <Text className="text-amber-700 text-xs">Screen: {item.deviceScreenWidth || 0} × {item.deviceScreenHeight || 0}</Text>
                <Text className="text-amber-700 text-xs">Pixel Ratio: {item.devicePixelRatio || 1}</Text>
              </View>
            </View>

            {/* CSV Format Preview */}
            <View className="bg-gray-50 rounded-lg p-3">
              <Text className="text-gray-800 font-semibold text-sm mb-2">CSV Export Format Preview</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={true} className="max-h-20">
                <Text className="text-gray-600 text-xs font-mono">
                  "{item.username}","{item.captcha}","{item.userInput}",{item.isCorrect.toString()},"{item.timestamp}",{item.totalTime},{item.wpm.toFixed(2)},{item.backspaceCount},{item.avgFlightTime.toFixed(3)},{item.avgDwellTime.toFixed(3)},{item.avgInterKeyPause.toFixed(3)},{item.sessionEntropy.toFixed(3)},{item.keyDwellVariance.toFixed(3)},{item.interKeyVariance.toFixed(3)},{item.pressureVariance.toFixed(3)},{item.touchAreaVariance.toFixed(3)},{item.avgTouchArea.toFixed(3)},{item.avgPressure.toFixed(3)},{item.avgCoordX.toFixed(3)},{item.avgCoordY.toFixed(3)},{item.avgErrorRecoveryTime.toFixed(3)},{item.characterCount},"[{(item.flightTimes || []).join(';')}]","[{(item.dwellTimes || []).join(';')}]","[{(item.interKeyPauses || []).join(';')}]","[{(item.typingPatternVector || []).join(';')}]",{item.keyTimingsCount || 0},{item.touchEventsCount || 0},{item.errorRecoveryCount || 0},"{item.devicePlatform || 'unknown'}",{item.deviceScreenWidth || 0},{item.deviceScreenHeight || 0},{item.devicePixelRatio || 1}
                </Text>
              </ScrollView>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render PIN data item
  const renderPinItem = ({ item }: { item: any }) => {
    const isExpanded = expandedItem === item.id;
    
    const toggleExpanded = () => {
      setExpandedItem(isExpanded ? null : item.id);
    };

    return (
      <TouchableOpacity 
        onPress={toggleExpanded}
        className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-gray-800 font-semibold text-base">
              PIN Entry → {item.userInput || '*'.repeat(6)}
            </Text>
            <View className="flex-row items-center mt-1">
              <MaterialIcons 
                name={item.isCorrect ? "check-circle" : "info"} 
                size={16} 
                color={item.isCorrect ? "#10b981" : "#3b82f6"} 
              />
              <Text className={`ml-1 text-sm font-medium ${item.isCorrect ? 'text-green-600' : 'text-blue-600'}`}>
                {item.isCorrect ? '6-digit PIN' : 'PIN Entry'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => deletePinEntry(item.id)} className="p-2 mr-2">
              <MaterialIcons name="delete" size={20} color="#ef4444" />
            </TouchableOpacity>
            <MaterialIcons 
              name={isExpanded ? "expand-less" : "expand-more"} 
              size={24} 
              color="#6b7280" 
            />
          </View>
        </View>
        
        <View className="flex-row justify-between items-center pt-2 border-t border-gray-100">
          <Text className="text-gray-500 text-xs">
            {new Date(item.timestamp).toLocaleString()}
          </Text>
          <View className="flex-row space-x-4">
            <Text className="text-gray-500 text-xs">
              {item.totalTime?.toFixed(1) || 0}s
            </Text>
            <Text className="text-gray-500 text-xs">
              {item.wpm?.toFixed(1) || 0} WPM
            </Text>
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View className="mt-4 pt-4 border-t border-gray-200">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-800 font-semibold text-base">Detailed PIN Biometric Data</Text>
              <TouchableOpacity onPress={() => copyPinEntryToClipboard(item)} className="bg-blue-50 px-3 py-1 rounded-lg">
                <Text className="text-blue-600 text-xs font-medium">Copy CSV</Text>
              </TouchableOpacity>
            </View>
            
            {/* Basic Info */}
            <View className="bg-purple-50 rounded-lg p-3 mb-3">
              <Text className="text-purple-800 font-semibold text-sm mb-2">Basic Metrics</Text>
              <Text className="text-purple-700 text-xs">Characters: {item.characterCount || 0}</Text>
              <Text className="text-purple-700 text-xs">Backspaces: {item.backspaceCount || 0}</Text>
              <Text className="text-purple-700 text-xs">Total Time: {item.totalTime?.toFixed(2) || 0}s</Text>
              <Text className="text-purple-700 text-xs">WPM: {item.wpm?.toFixed(2) || 0}</Text>
            </View>

            {/* Timing Metrics */}
            <View className="bg-green-50 rounded-lg p-3 mb-3">
              <Text className="text-green-800 font-semibold text-sm mb-2">Timing Analysis</Text>
              <Text className="text-green-700 text-xs">Avg Flight Time: {item.avgFlightTime?.toFixed(3) || 0}ms</Text>
              <Text className="text-green-700 text-xs">Avg Dwell Time: {item.avgDwellTime?.toFixed(3) || 0}ms</Text>
              <Text className="text-green-700 text-xs">Avg Inter-Key Pause: {item.avgInterKeyPause?.toFixed(3) || 0}ms</Text>
              <Text className="text-green-700 text-xs">Session Entropy: {item.sessionEntropy?.toFixed(3) || 0}</Text>
            </View>

            {/* Variance Metrics */}
            <View className="bg-purple-50 rounded-lg p-3 mb-3">
              <Text className="text-purple-800 font-semibold text-sm mb-2">Variance Analysis</Text>
              <Text className="text-purple-700 text-xs">Key Dwell Variance: {item.keyDwellVariance?.toFixed(3) || 0}</Text>
              <Text className="text-purple-700 text-xs">Inter-Key Variance: {item.interKeyVariance?.toFixed(3) || 0}</Text>
              <Text className="text-purple-700 text-xs">Pressure Variance: {item.pressureVariance?.toFixed(3) || 0}</Text>
              <Text className="text-purple-700 text-xs">Touch Area Variance: {item.touchAreaVariance?.toFixed(3) || 0}</Text>
            </View>

            {/* Touch Metrics */}
            <View className="bg-orange-50 rounded-lg p-3 mb-3">
              <Text className="text-orange-800 font-semibold text-sm mb-2">Touch Analysis</Text>
              <Text className="text-orange-700 text-xs">Avg Touch Area: {item.avgTouchArea?.toFixed(3) || 0}px²</Text>
              <Text className="text-orange-700 text-xs">Avg Pressure: {item.avgPressure?.toFixed(3) || 0}</Text>
              <Text className="text-orange-700 text-xs">Avg X Coord: {item.avgCoordX?.toFixed(3) || 0}px</Text>
              <Text className="text-orange-700 text-xs">Avg Y Coord: {item.avgCoordY?.toFixed(3) || 0}px</Text>
              <Text className="text-orange-700 text-xs">Avg Error Recovery: {item.avgErrorRecoveryTime?.toFixed(3) || 0}ms</Text>
            </View>

            {/* Device Information */}
            <View className="bg-amber-50 rounded-lg p-3 mb-3">
              <Text className="text-amber-800 font-semibold text-sm mb-2">Device Info</Text>
              <Text className="text-amber-700 text-xs">Platform: {item.devicePlatform || 'unknown'}</Text>
              <Text className="text-amber-700 text-xs">Screen: {item.deviceScreenWidth || 0} × {item.deviceScreenHeight || 0}</Text>
              <Text className="text-amber-700 text-xs">Pixel Ratio: {item.devicePixelRatio || 1}</Text>
            </View>

            {/* CSV Format Preview */}
            <View className="bg-gray-50 rounded-lg p-3">
              <Text className="text-gray-800 font-semibold text-sm mb-2">CSV Export Format Preview</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={true} className="max-h-20">
                <Text className="text-gray-600 text-xs font-mono">
                  "{item.username || ''}","{item.captcha || ''}","{item.userInput || ''}",{item.isCorrect || false},"{item.timestamp || ''}",{item.totalTime || 0},{item.wpm?.toFixed(2) || 0},{item.backspaceCount || 0},{item.avgFlightTime?.toFixed(3) || 0},{item.avgDwellTime?.toFixed(3) || 0},{item.avgInterKeyPause?.toFixed(3) || 0},{item.sessionEntropy?.toFixed(3) || 0},{item.keyDwellVariance?.toFixed(3) || 0},{item.interKeyVariance?.toFixed(3) || 0},{item.pressureVariance?.toFixed(3) || 0},{item.touchAreaVariance?.toFixed(3) || 0},{item.avgTouchArea?.toFixed(3) || 0},{item.avgPressure?.toFixed(3) || 0},{item.avgCoordX?.toFixed(3) || 0},{item.avgCoordY?.toFixed(3) || 0},{item.avgErrorRecoveryTime?.toFixed(3) || 0},{item.characterCount || 0},"[{((item.flightTimes || []).join(';'))}]","[{((item.dwellTimes || []).join(';'))}]","[{((item.interKeyPauses || []).join(';'))}]","[{((item.typingPatternVector || []).join(';'))}]",{item.keyTimingsCount || 0},{item.touchEventsCount || 0},{item.errorRecoveryCount || 0},"{item.devicePlatform || 'unknown'}",{item.deviceScreenWidth || 0},{item.deviceScreenHeight || 0},{item.devicePixelRatio || 1}
                </Text>
              </ScrollView>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    loadCaptchaData();
    loadPinData();
  }, []);

  // Make these functions available globally so other screens can use them
  useEffect(() => {
    global.addCaptchaData = addCaptchaData;
    global.addPinData = addPinData;
    return () => {
      delete global.addCaptchaData;
      delete global.addPinData;
    };
  }, [captchaData, pinData]);

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View className="bg-white pt-16 pb-6 px-6 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onBack} className="mr-4">
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-gray-800 font-bold text-xl">Datasets</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Dataset Types */}
        <View className="px-6 py-4">
          <Text className="text-gray-800 font-bold text-base mb-3">Available Datasets</Text>
          
          {/* Captcha Dataset Card */}
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                    <MaterialIcons name="security" size={20} color="#2563eb" />
                  </View>
                  <View>
                    <Text className="text-gray-800 font-semibold text-base">Captcha Dataset</Text>
                    <Text className="text-gray-500 text-sm">Biometric typing patterns</Text>
                  </View>
                </View>
                <View className="bg-blue-100 rounded-full px-3 py-1">
                  <Text className="text-blue-800 font-semibold text-sm">{captchaData.length}</Text>
                </View>
              </View>
              
              {/* Action Buttons */}
              <View className="flex-row space-x-3">
                <TouchableOpacity 
                  onPress={exportData}
                  className="flex-1 bg-blue-600 rounded-xl p-3 flex-row items-center justify-center"
                  disabled={captchaData.length === 0}
                  style={{ opacity: captchaData.length === 0 ? 0.5 : 1 }}
                >
                  <MaterialIcons name="file-download" size={18} color="white" />
                  <Text className="text-white font-semibold text-sm ml-2">Export CSV</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={deleteAllData}
                  className="flex-1 bg-red-50 border border-red-200 rounded-xl p-3 flex-row items-center justify-center"
                  disabled={captchaData.length === 0}
                  style={{ opacity: captchaData.length === 0 ? 0.5 : 1 }}
                >
                  <MaterialIcons name="delete-sweep" size={18} color="#ef4444" />
                  <Text className="text-red-600 font-semibold text-sm ml-2">Delete All</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* PIN Dataset */}
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-purple-100 items-center justify-center mr-3">
                    <MaterialIcons name="pin" size={20} color="#7c3aed" />
                  </View>
                  <View>
                    <Text className="text-gray-800 font-semibold text-base">PIN Dataset</Text>
                    <Text className="text-gray-500 text-sm">Biometric data from PIN entries</Text>
                  </View>
                </View>
                <View className="bg-purple-100 rounded-full px-3 py-1">
                  <Text className="text-purple-700 font-semibold text-sm">{pinData.length}</Text>
                </View>
              </View>
              
              {/* Action Buttons */}
              <View className="flex-row space-x-3">
                <TouchableOpacity 
                  onPress={exportData}
                  className="flex-1 bg-purple-600 rounded-xl p-3 flex-row items-center justify-center"
                  disabled={pinData.length === 0}
                  style={{ opacity: pinData.length === 0 ? 0.5 : 1 }}
                >
                  <MaterialIcons name="file-download" size={18} color="white" />
                  <Text className="text-white font-semibold text-sm ml-2">Export CSV</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={deleteAllPinData}
                  className="flex-1 bg-red-50 border border-red-200 rounded-xl p-3 flex-row items-center justify-center"
                  disabled={pinData.length === 0}
                  style={{ opacity: pinData.length === 0 ? 0.5 : 1 }}
                >
                  <MaterialIcons name="delete-sweep" size={18} color="#ef4444" />
                  <Text className="text-red-600 font-semibold text-sm ml-2">Delete All</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {pinData.length > 0 && (
              <View className="px-4 pb-4">
                <View className="flex-row justify-between text-xs">
                  <Text className="text-gray-500">Latest: {new Date(pinData[pinData.length - 1]?.timestamp).toLocaleDateString()}</Text>
                  <Text className="text-gray-500">Type: Keystroke Dynamics</Text>
                </View>
              </View>
            )}
          </View>

          <View className="bg-gray-100 rounded-2xl p-4 mb-4 opacity-60">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-gray-200 items-center justify-center mr-3">
                  <MaterialIcons name="account-circle" size={20} color="#6b7280" />
                </View>
                <View>
                  <Text className="text-gray-600 font-semibold text-base">Details Dataset</Text>
                  <Text className="text-gray-400 text-sm mt-1">Coming soon...</Text>
                </View>
              </View>
              <View className="bg-gray-200 rounded-full px-3 py-1">
                <Text className="text-gray-500 font-semibold text-sm">0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Captcha Entries */}
        {captchaData.length > 0 && (
          <View className="px-6 py-4">
            <Text className="text-gray-800 font-bold text-base mb-3">Recent Captcha Entries</Text>
            <FlatList
              data={captchaData.slice(-10).reverse()} // Show last 10 entries, newest first
              renderItem={renderCaptchaItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Recent PIN Entries */}
        {pinData.length > 0 && (
          <View className="px-6 py-4">
            <Text className="text-gray-800 font-bold text-base mb-3">Recent PIN Entries</Text>
            <FlatList
              data={pinData.slice(-10).reverse()} // Show last 10 entries, newest first
              renderItem={renderPinItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {captchaData.length === 0 && pinData.length === 0 && !loading && (
          <View className="px-6 py-8">
            <View className="bg-white rounded-2xl p-8 items-center">
              <MaterialIcons name="folder-open" size={48} color="#9ca3af" />
              <Text className="text-gray-500 font-semibold text-lg mt-4">No Data Available</Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">
                Complete captcha verifications or PIN entries to start collecting data
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
