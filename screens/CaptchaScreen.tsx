import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
  PixelRatio,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface CaptchaScreenProps {
  onComplete: () => void;
  onBack: () => void;
  amount: string;
  recipientInfo: string;
}

export const CaptchaScreen = ({ onComplete, onBack, amount, recipientInfo }: CaptchaScreenProps) => {
  const [captcha, setCaptcha] = useState('');
  const [userInput, setUserInput] = useState('');
  const [typingMetrics, setTypingMetrics] = useState({
    startTime: null as number | null,
    keyTimings: [] as any[],
    backspaceCount: 0,
    touchEvents: [] as any[],
    currentSession: [] as any[],
    keyPressEvents: [] as any[],
    lastKeyReleaseTime: null as number | null,
    errorRecoveryEvents: [] as any[],
    sessionEntropy: 0,
  });

  const inputRef = useRef<TextInput>(null);

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

  const handleInputChange = (text: string) => {
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

  const handleTouchStart = (event: any) => {
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

  const handleTouchEnd = (event: any) => {
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
    const totalTime = startTime ? (endTime - startTime) / 1000 : 0;
    
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
    const calculateEntropy = (times: number[]) => {
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
      username: 'CaptchaUser',
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

  const logCaptchaDataCSV = async () => {
    const data = calculateMetrics();
    
    // Store data in AsyncStorage for the DatasetScreen
    try {
      const captchaEntry = {
        username: data.username || 'CaptchaUser',
        captcha: data.captcha || '',
        userInput: data.userInput || '',
        isCorrect: data.isCorrect || false,
        timestamp: data.timestamp || new Date().toISOString(),
        totalTime: data.totalTime || 0,
        wpm: data.wpm || 0,
        backspaceCount: data.backspaceCount || 0,
        avgFlightTime: data.avgFlightTime || 0,
        avgDwellTime: data.avgDwellTime || 0,
        avgInterKeyPause: data.avgInterKeyPause || 0,
        sessionEntropy: data.sessionEntropy || 0,
        keyDwellVariance: data.keyDwellVariance || 0,
        interKeyVariance: data.interKeyVariance || 0,
        pressureVariance: data.pressureVariance || 0,
        touchAreaVariance: data.touchAreaVariance || 0,
        avgTouchArea: data.avgTouchArea || 0,
        avgPressure: data.avgPressure || 0,
        avgCoordX: data.avgCoordX || 0,
        avgCoordY: data.avgCoordY || 0,
        avgErrorRecoveryTime: data.avgErrorRecoveryTime || 0,
        characterCount: data.characterCount || 0,
        // Store all the comprehensive data that's being logged
        flightTimes: data.flightTimes || [],
        dwellTimes: data.dwellTimes || [],
        interKeyPauses: data.interKeyPauses || [],
        typingPatternVector: data.typingPatternVector || [],
        keyTimingsCount: (data.keyTimings || []).length,
        touchEventsCount: (data.touchEvents || []).length,
        errorRecoveryCount: (data.errorRecoveryEvents || []).length,
        devicePlatform: data.deviceMetrics?.platform || 'unknown',
        deviceScreenWidth: data.deviceMetrics?.screenWidth || 0,
        deviceScreenHeight: data.deviceMetrics?.screenHeight || 0,
        devicePixelRatio: data.deviceMetrics?.pixelRatio || 1,
        keyTimings: data.keyTimings || [],
        touchEvents: data.touchEvents || [],
        errorRecoveryEvents: data.errorRecoveryEvents || [],
        deviceMetrics: data.deviceMetrics || {},
      };

      // Use the global function if available, or store directly
      if (global.addCaptchaData) {
        await global.addCaptchaData(captchaEntry);
      } else {
        // Fallback: store directly in AsyncStorage
        const storedData = await AsyncStorage.getItem('captchaDataset');
        const existingData = storedData ? JSON.parse(storedData) : [];
        const newData = [...existingData, { ...captchaEntry, id: Date.now().toString() }];
        await AsyncStorage.setItem('captchaDataset', JSON.stringify(newData));
      }
    } catch (error) {
      console.error('Error storing captcha data:', error);
    }
    
    // Create CSV format for backend (same as backend expects)
    const csvRow = [
      data.username || 'CaptchaUser',
      data.captcha || '',
      data.userInput || '',
      data.isCorrect || false,
      data.timestamp || new Date().toISOString(),
      data.totalTime || 0,
      (data.wpm || 0).toFixed(2),
      data.backspaceCount || 0,
      (data.avgFlightTime || 0).toFixed(3),
      (data.avgDwellTime || 0).toFixed(3),
      (data.avgInterKeyPause || 0).toFixed(3),
      (data.sessionEntropy || 0).toFixed(3),
      (data.keyDwellVariance || 0).toFixed(3),
      (data.interKeyVariance || 0).toFixed(3),
      (data.pressureVariance || 0).toFixed(3),
      (data.touchAreaVariance || 0).toFixed(3),
      (data.avgTouchArea || 0).toFixed(3),
      (data.avgPressure || 0).toFixed(3),
      (data.avgCoordX || 0).toFixed(3),
      (data.avgCoordY || 0).toFixed(3),
      (data.avgErrorRecoveryTime || 0).toFixed(3),
      data.characterCount || 0,
      `[${(data.flightTimes || []).join(';')}]`,
      `[${(data.dwellTimes || []).join(';')}]`,
      `[${(data.interKeyPauses || []).join(';')}]`
    ];

    // Log the CSV format (as raw data for backend)
    const csvData = csvRow.join(',');
    console.log('🔤 CAPTCHA Biometric Data for Backend:');
    console.log(csvData);
    
    // Send to backend for authentication
    try {
      const { backendService } = await import('../services/BackendService');
      const response = await backendService.authenticateCaptcha(data);
      
      console.log('✅ CAPTCHA Authentication Backend Response:');
      console.log(JSON.stringify(response, null, 2));
      
      // Log specific results
      if (response.authenticated) {
        console.log('✅ CAPTCHA AUTHENTICATION SUCCESSFUL');
        console.log(`👤 User: ${response.user}`);
        console.log(`🎯 Target User: ${response.target_user}`);
        console.log(`📊 Confidence: ${response.confidence.toFixed(4)}`);
        console.log(`🚪 Threshold: ${response.threshold.toFixed(4)}`);
        console.log(`🤖 Model Type: ${response.model_type}`);
      } else {
        console.log('❌ CAPTCHA AUTHENTICATION FAILED');
        console.log(`📊 Confidence: ${response.confidence.toFixed(4)} (Below threshold: ${response.threshold.toFixed(4)})`);
      }
    } catch (error) {
      console.error('❌ Backend CAPTCHA Authentication Error:', error);
      
      // Fallback: still log the raw data format
      console.log('📝 Raw CAPTCHA Data (for manual backend testing):');
      console.log(csvData);
    }
  };

  const handleSubmit = async () => {
    if (userInput.trim() === '') {
      return;
    }

    await logCaptchaDataCSV();
    onComplete();
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [captcha]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Security Verification</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
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

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  captchaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 20,
    textAlign: 'center',
  },
  captchaBox: {
    backgroundColor: '#f3f4f6',
    padding: 24,
    borderRadius: 12,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
    minWidth: 200,
  },
  captchaText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#374151',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    backgroundColor: '#ffffff',
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 2,
    width: '100%',
    maxWidth: 300,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
