import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DatasetScreen = ({ currentUser, onNavigateToMain }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('captchaData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setData(parsedData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearData = async () => {
    Alert.alert(
      'Clear Dataset',
      'Are you sure you want to delete all collected data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('captchaData');
              setData([]);
              Alert.alert('Success', 'Dataset cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const exportData = async () => {
    if (data.length === 0) {
      Alert.alert('Error', 'No data to export');
      return;
    }

    try {
      // Create CSV headers with all features
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
      let csvContent = headers.join(',') + '\n';
      
      data.forEach(entry => {
        const row = [
          `"${entry.username || ''}"`,
          `"${entry.captcha || ''}"`,
          `"${entry.userInput || ''}"`,
          entry.isCorrect || false,
          `"${entry.timestamp || ''}"`,
          entry.totalTime || 0,
          entry.wpm?.toFixed(2) || 0,
          entry.backspaceCount || 0,
          entry.avgFlightTime?.toFixed(3) || 0,
          entry.avgDwellTime?.toFixed(3) || 0,
          entry.avgInterKeyPause?.toFixed(3) || 0,
          entry.sessionEntropy?.toFixed(3) || 0,
          entry.keyDwellVariance?.toFixed(3) || 0,
          entry.interKeyVariance?.toFixed(3) || 0,
          entry.pressureVariance?.toFixed(3) || 0,
          entry.touchAreaVariance?.toFixed(3) || 0,
          entry.avgTouchArea?.toFixed(3) || 0,
          entry.avgPressure?.toFixed(3) || 0,
          entry.avgCoordX?.toFixed(3) || 0,
          entry.avgCoordY?.toFixed(3) || 0,
          entry.avgErrorRecoveryTime?.toFixed(3) || 0,
          entry.characterCount || 0,
          `"[${(entry.flightTimes || []).join(';')}]"`,
          `"[${(entry.dwellTimes || []).join(';')}]"`,
          `"[${(entry.interKeyPauses || []).join(';')}]"`,
          `"[${(entry.typingPatternVector || []).join(';')}]"`,
          (entry.keyTimings || []).length,
          (entry.touchEvents || []).length,
          (entry.errorRecoveryEvents || []).length,
          `"${entry.deviceMetrics?.platform || 'unknown'}"`,
          entry.deviceMetrics?.screenWidth || 0,
          entry.deviceMetrics?.screenHeight || 0,
          entry.deviceMetrics?.pixelRatio || 1
        ];
        csvContent += row.join(',') + '\n';
      });

      // Share the CSV data
      await Share.share({
        message: csvContent,
        title: 'CAPTCHA Dataset Export',
      });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to export data: ' + error.message);
    }
  };

  const renderDataItem = ({ item, index }) => (
    <View style={styles.dataItem}>
      <Text style={styles.itemTitle}>Entry #{index + 1}</Text>
      <Text style={styles.itemText}>User: {item.username}</Text>
      <Text style={styles.itemText}>CAPTCHA: {item.captcha}</Text>
      <Text style={styles.itemText}>Input: {item.userInput}</Text>
      <Text style={[styles.itemText, { color: item.isCorrect ? 'green' : 'red' }]}>
        {item.isCorrect ? 'Correct' : 'Incorrect'}
      </Text>
      <Text style={styles.itemText}>Time: {item.totalTime?.toFixed(2)}s</Text>
      <Text style={styles.itemText}>WPM: {item.wpm?.toFixed(1)}</Text>
      <Text style={styles.itemText}>Backspaces: {item.backspaceCount}</Text>
      <Text style={styles.itemText}>
        Avg Flight Time: {item.avgFlightTime?.toFixed(0)}ms
      </Text>
      <Text style={styles.itemText}>
        Avg Dwell Time: {item.avgDwellTime?.toFixed(0)}ms
      </Text>
      <Text style={styles.itemText}>
        Touch Area: {item.avgTouchArea?.toFixed(1)}
      </Text>
      <Text style={styles.itemText}>
        Pressure: {item.avgPressure?.toFixed(3)}
      </Text>
      <Text style={styles.itemText}>
        Coordinates: ({item.avgCoordX?.toFixed(1)}, {item.avgCoordY?.toFixed(1)})
      </Text>
    </View>
  );

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading dataset...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateToMain}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Dataset ({data.length} entries)</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Dataset Statistics</Text>
        <Text style={styles.statsText}>
          Total Entries: {data.length}
        </Text>
        <Text style={styles.statsText}>
          Users: {new Set(data.map(d => d.username)).size}
        </Text>
        <Text style={styles.statsText}>
          Accuracy: {data.length > 0 ? 
            ((data.filter(d => d.isCorrect).length / data.length) * 100).toFixed(1) : 0}%
        </Text>
        <Text style={styles.statsText}>
          Avg WPM: {data.length > 0 ? 
            (data.reduce((sum, d) => sum + (d.wpm || 0), 0) / data.length).toFixed(1) : 0}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.exportButton} onPress={exportData}>
          <Text style={styles.buttonText}>Export CSV</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.clearButton} onPress={clearData}>
          <Text style={styles.buttonText}>Clear Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderDataItem}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    margin: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  exportButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dataItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
});

export default DatasetScreen;