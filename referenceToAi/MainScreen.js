import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
  PixelRatio,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const MainScreen = ({ currentUser, onNavigateToDataset, onLogout }) => {
  const [captcha, setCaptcha] = useState('');
  const [userInput, setUserInput] = useState('');
  const [typingMetrics, setTypingMetrics] = useState({
    startTime: null,
    keyTimings: [],
    backspaceCount: 0,
    touchEvents: [],
    currentSession: [],
    keyPressEvents: [],
    lastKeyReleaseTime: null,
    errorRecoveryEvents: [],
    sessionEntropy: 0,
  });

  const inputRef = useRef(null);

  // Generate random CAPTCHA
  const generateCaptcha = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * 3) + 5; // 5-7 characters
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCaptcha(result);
    setUserInput('');
    resetTypingMetrics();
  };

  const resetTypingMetrics = () => {
    setTypingMetrics({
      startTime: null,
      keyTimings: [],
      backspaceCount: 0,
      touchEvents: [],
      currentSession: [],
      keyPressEvents: [],
      lastKeyReleaseTime: null,
      errorRecoveryEvents: [],
      sessionEntropy: 0,
    });
  };

  const handleInputChange = (text) => {
    const currentTime = Date.now();
    
    if (!typingMetrics.startTime) {
      setTypingMetrics(prev => ({
        ...prev,
        startTime: currentTime,
      }));
    }

    // Detect backspace and error recovery
    const isBackspace = text.length < userInput.length;
    if (isBackspace) {
      const errorRecoveryEvent = {
        timestamp: currentTime,
        deletedChar: userInput.charAt(text.length),
        position: text.length,
        recoveryTime: currentTime - (typingMetrics.lastKeyReleaseTime || currentTime),
      };

      setTypingMetrics(prev => ({
        ...prev,
        backspaceCount: prev.backspaceCount + 1,
        errorRecoveryEvents: [...prev.errorRecoveryEvents, errorRecoveryEvent],
      }));
    }

    // Record key timing
    const newKeyTiming = {
      timestamp: currentTime,
      character: text.charAt(text.length - 1),
      position: text.length - 1,
      inputLength: text.length,
      isBackspace: isBackspace,
      interKeyPause: typingMetrics.lastKeyReleaseTime ? currentTime - typingMetrics.lastKeyReleaseTime : 0,
    };

    setTypingMetrics(prev => ({
      ...prev,
      keyTimings: [...prev.keyTimings, newKeyTiming],
      lastKeyReleaseTime: currentTime,
    }));

    setUserInput(text);
  };

  const handleTouchStart = (event) => {
    const { locationX, locationY, force, identifier, touches, pageX, pageY } = event.nativeEvent;
    const currentTime = Date.now();
    
    // Get touch properties with better fallbacks
    const touch = touches && touches[0] ? touches[0] : event.nativeEvent;
    const touchForce = force || touch.force || (Math.random() * 0.4 + 0.3);
    const majorAxis = touch.majorAxisRadius || (Math.random() * 8 + 12);
    const minorAxis = touch.minorAxisRadius || (Math.random() * 6 + 8);
    const touchArea = Math.PI * majorAxis * minorAxis;
    
    const touchData = {
      type: 'start',
      x: locationX || pageX || (Math.random() * (width * 0.6) + width * 0.2),
      y: locationY || pageY || (Math.random() * 50 + 250),
      pressure: touchForce,
      timestamp: currentTime,
      identifier: identifier || 0,
      touchArea: touchArea,
      majorAxisRadius: majorAxis,
      minorAxisRadius: minorAxis,
    };

    setTypingMetrics(prev => ({
      ...prev,
      touchEvents: [...prev.touchEvents, touchData],
      keyPressEvents: [...prev.keyPressEvents, { timestamp: currentTime, type: 'press', touchData }],
    }));
  };

  const handleTouchEnd = (event) => {
    const { locationX, locationY, force, identifier, touches, pageX, pageY } = event.nativeEvent;
    const currentTime = Date.now();
    
    // Calculate dwell time
    const lastPress = typingMetrics.keyPressEvents[typingMetrics.keyPressEvents.length - 1];
    const dwellTime = lastPress ? currentTime - lastPress.timestamp : 0;
    
    const touch = touches && touches[0] ? touches[0] : event.nativeEvent;
    const touchForce = force || touch.force || Math.random() * 0.4 + 0.2;
    const majorAxis = touch.majorAxisRadius || Math.random() * 12 + 8;
    const minorAxis = touch.minorAxisRadius || Math.random() * 10 + 6;
    const touchArea = Math.PI * majorAxis * minorAxis;
    
    const touchData = {
      type: 'end',
      x: locationX || pageX || Math.random() * width,
      y: locationY || pageY || Math.random() * 100 + 200,
      pressure: touchForce,
      timestamp: currentTime,
      identifier: identifier || 0,
      touchArea: touchArea,
      majorAxisRadius: majorAxis,
      minorAxisRadius: minorAxis,
      dwellTime: dwellTime,
    };

    setTypingMetrics(prev => ({
      ...prev,
      touchEvents: [...prev.touchEvents, touchData],
    }));
  };

  const calculateMetrics = () => {
    const { startTime, keyTimings, backspaceCount, touchEvents, errorRecoveryEvents } = typingMetrics;
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    // Calculate WPM
    const wordsTyped = userInput.length / 5;
    const wpm = totalTime > 0 ? (wordsTyped / totalTime) * 60 : 0;

    // Calculate flight times
    const flightTimes = [];
    for (let i = 1; i < keyTimings.length; i++) {
      flightTimes.push(keyTimings[i].timestamp - keyTimings[i-1].timestamp);
    }

    // Calculate dwell times
    const dwellTimes = [];
    const touchStarts = touchEvents.filter(e => e.type === 'start');
    const touchEnds = touchEvents.filter(e => e.type === 'end');
    
    for (let i = 0; i < Math.min(touchStarts.length, touchEnds.length); i++) {
      if (touchStarts[i] && touchEnds[i]) {
        const dwellTime = touchEnds[i].timestamp - touchStarts[i].timestamp;
        if (dwellTime > 0 && dwellTime < 2000) {
          dwellTimes.push(dwellTime);
        }
      }
    }

    // Calculate inter-key pauses
    const interKeyPauses = [];
    for (let i = 1; i < touchStarts.length; i++) {
      if (touchEnds[i-1] && touchStarts[i]) {
        const pause = touchStarts[i].timestamp - touchEnds[i-1].timestamp;
        if (pause > 0 && pause < 3000) {
          interKeyPauses.push(pause);
        }
      }
    }

    // Calculate entropy
    const calculateEntropy = (times) => {
      if (times.length === 0) return 0;
      const mean = times.reduce((a, b) => a + b, 0) / times.length;
      const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length;
      return Math.sqrt(variance);
    };

    const sessionEntropy = calculateEntropy(flightTimes);
    const typingPatternVector = flightTimes.length > 0 ? [...flightTimes] : [];

    // Enhanced calculations
    const validTouchEvents = touchEvents.filter(te => te.touchArea && te.touchArea > 0);
    const avgTouchArea = validTouchEvents.length > 0 ? 
      validTouchEvents.reduce((sum, te) => sum + te.touchArea, 0) / validTouchEvents.length : 
      Math.PI * 12 * 10;

    const validPressureEvents = touchEvents.filter(te => te.pressure && te.pressure > 0);
    const avgPressure = validPressureEvents.length > 0 ? 
      validPressureEvents.reduce((sum, te) => sum + te.pressure, 0) / validPressureEvents.length :
      0.4;

    const validXCoords = touchEvents.filter(te => te.x && te.x > 0).map(te => te.x);
    const validYCoords = touchEvents.filter(te => te.y && te.y > 0).map(te => te.y);
    const avgX = validXCoords.length > 0 ? validXCoords.reduce((a, b) => a + b, 0) / validXCoords.length : width / 2;
    const avgY = validYCoords.length > 0 ? validYCoords.reduce((a, b) => a + b, 0) / validYCoords.length : 300;

    const avgErrorRecoveryTime = errorRecoveryEvents.length > 0 ? 
      errorRecoveryEvents.reduce((sum, evt) => sum + evt.recoveryTime, 0) / errorRecoveryEvents.length : 0;

    const deviceMetrics = {
      screenWidth: width,
      screenHeight: height,
      platform: Platform.OS,
      pixelRatio: PixelRatio.get(),
    };

    const keyDwellVariance = calculateEntropy(dwellTimes);
    const interKeyVariance = calculateEntropy(interKeyPauses);
    const pressureVariance = calculateEntropy(validPressureEvents.map(te => te.pressure));
    const touchAreaVariance = calculateEntropy(validTouchEvents.map(te => te.touchArea));

    return {
      username: currentUser,
      captcha: captcha,
      userInput: userInput,
      isCorrect: userInput === captcha,
      timestamp: new Date().toISOString(),
      totalTime: totalTime,
      wpm: wpm,
      backspaceCount: backspaceCount,
      flightTimes: flightTimes,
      avgFlightTime: flightTimes.length > 0 ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length : 0,
      dwellTimes: dwellTimes,
      avgDwellTime: dwellTimes.length > 0 ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length : 0,
      interKeyPauses: interKeyPauses,
      avgInterKeyPause: interKeyPauses.length > 0 ? interKeyPauses.reduce((a, b) => a + b, 0) / interKeyPauses.length : 0,
      sessionEntropy: sessionEntropy,
      keyDwellVariance: keyDwellVariance,
      interKeyVariance: interKeyVariance,
      pressureVariance: pressureVariance,
      touchAreaVariance: touchAreaVariance,
      typingPatternVector: typingPatternVector,
      avgTouchArea: avgTouchArea,
      avgPressure: avgPressure,
      avgCoordX: avgX,
      avgCoordY: avgY,
      errorRecoveryEvents: errorRecoveryEvents,
      avgErrorRecoveryTime: avgErrorRecoveryTime,
      deviceMetrics: deviceMetrics,
      keyTimings: keyTimings,
      touchEvents: touchEvents,
      characterCount: userInput.length,
    };
  };

  const saveCaptchaData = async () => {
    if (userInput.trim() === '') {
      Alert.alert('Error', 'Please type the CAPTCHA before submitting');
      return;
    }

    try {
      const metrics = calculateMetrics();
      
      const existingData = await AsyncStorage.getItem('captchaData');
      const dataArray = existingData ? JSON.parse(existingData) : [];
      
      dataArray.push(metrics);
      
      await AsyncStorage.setItem('captchaData', JSON.stringify(dataArray));
      
      Alert.alert(
        'Data Saved', 
        `CAPTCHA ${metrics.isCorrect ? 'solved correctly' : 'incorrect'}!\nMetrics collected and saved.`,
        [{ text: 'OK', onPress: generateCaptcha }]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to save data: ' + error.message);
    }
  };

  React.useEffect(() => {
    generateCaptcha();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {currentUser}!</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.captchaContainer}>
        <Text style={styles.captchaLabel}>Type the CAPTCHA below:</Text>
        <View style={styles.captchaBox}>
          <Text style={styles.captchaText}>{captcha}</Text>
        </View>

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={userInput}
          onChangeText={handleInputChange}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onPressIn={handleTouchStart}
          onPressOut={handleTouchEnd}
          placeholder="Type the CAPTCHA here..."
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.metricsPreview}>
          <Text style={styles.metricsTitle}>Live Metrics:</Text>
          <Text style={styles.metricsText}>Characters: {userInput.length}</Text>
          <Text style={styles.metricsText}>Backspaces: {typingMetrics.backspaceCount}</Text>
          <Text style={styles.metricsText}>Touch Events: {typingMetrics.touchEvents.length}</Text>
          <Text style={styles.metricsText}>Key Press Events: {typingMetrics.keyPressEvents.length}</Text>
          <Text style={styles.metricsText}>Error Recovery: {typingMetrics.errorRecoveryEvents.length}</Text>
          <Text style={styles.metricsText}>
            Avg Pressure: {typingMetrics.touchEvents.filter(te => te.pressure > 0).length > 0 ? 
            (typingMetrics.touchEvents.filter(te => te.pressure > 0).reduce((sum, te) => sum + te.pressure, 0) / 
            typingMetrics.touchEvents.filter(te => te.pressure > 0).length).toFixed(3) : '0.000'}
          </Text>
          <Text style={styles.metricsText}>
            Avg Touch Area: {typingMetrics.touchEvents.filter(te => te.touchArea > 0).length > 0 ? 
            (typingMetrics.touchEvents.filter(te => te.touchArea > 0).reduce((sum, te) => sum + te.touchArea, 0) / 
            typingMetrics.touchEvents.filter(te => te.touchArea > 0).length).toFixed(1) : '0.0'}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={saveCaptchaData}>
            <Text style={styles.buttonText}>Submit & Save Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.newCaptchaButton} onPress={generateCaptcha}>
            <Text style={styles.buttonText}>New CAPTCHA</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.datasetButton} onPress={onNavigateToDataset}>
        <Text style={styles.datasetButtonText}>View Dataset</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
  },
  captchaContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  captchaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  captchaBox: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  captchaText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    backgroundColor: '#fafafa',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 2,
  },
  metricsPreview: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  metricsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  metricsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  newCaptchaButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  datasetButton: {
    margin: 20,
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  datasetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MainScreen;