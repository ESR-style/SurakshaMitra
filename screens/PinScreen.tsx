import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, TextInput, ScrollView, Dimensions, Platform, PixelRatio } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SecurityAlert } from '../components/SecurityAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global type declaration
declare global {
  var addPinData: ((data: any) => Promise<void>) | undefined;
}

const { width, height } = Dimensions.get('window');

interface PinScreenProps {
  onPinComplete: () => void;
}

export const PinScreen = ({ onPinComplete }: PinScreenProps) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const [pinMetrics, setPinMetrics] = useState({
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

  const resetPinMetrics = () => {
    setPinMetrics({
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

    setPinMetrics(prev => ({
      ...prev,
      touchEvents: [...prev.touchEvents, touchData],
      keyPressEvents: [...prev.keyPressEvents, { timestamp: currentTime, type: 'press', touchData }],
    }));
  };

  const handleTouchEnd = (event: any) => {
    const { locationX, locationY, force, identifier, touches, pageX, pageY } = event.nativeEvent;
    const currentTime = Date.now();
    
    // Calculate dwell time
    const lastPress = pinMetrics.keyPressEvents[pinMetrics.keyPressEvents.length - 1];
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

    setPinMetrics(prev => ({
      ...prev,
      touchEvents: [...prev.touchEvents, touchData],
    }));
  };

  // Show security alert when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSecurityAlert(true);
    }, 1000); // Show after 1 second

    return () => clearTimeout(timer);
  }, []);

  const handlePinChange = (text: string) => {
    if (text.length <= 6 && /^\d*$/.test(text)) {
      const currentTime = Date.now();
      
      // Start recording metrics when first digit is entered
      if (!pinMetrics.startTime && text.length === 1) {
        setPinMetrics(prev => ({
          ...prev,
          startTime: currentTime,
        }));
      }

      // Detect backspace and error recovery
      const isBackspace = text.length < pin.length;
      if (isBackspace) {
        const errorRecoveryEvent = {
          timestamp: currentTime,
          deletedChar: pin.charAt(text.length),
          position: text.length,
          recoveryTime: currentTime - (pinMetrics.lastKeyReleaseTime || currentTime),
        };

        setPinMetrics(prev => ({
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
        interKeyPause: pinMetrics.lastKeyReleaseTime ? currentTime - pinMetrics.lastKeyReleaseTime : 0,
      };

      setPinMetrics(prev => ({
        ...prev,
        keyTimings: [...prev.keyTimings, newKeyTiming],
        lastKeyReleaseTime: currentTime,
      }));

      setPin(text);
      
      if (text.length === 6) {
        setIsLoading(true);
        setTimeout(async () => {
          await logPinDataCSV();
          setIsLoading(false);
          onPinComplete();
        }, 800);
      }
    }
  };

  const calculatePinMetrics = () => {
    const { startTime, keyTimings, backspaceCount, touchEvents, errorRecoveryEvents } = pinMetrics;
    const endTime = Date.now();
    const totalTime = startTime ? (endTime - startTime) / 1000 : 0;
    
    // Calculate WPM (Words Per Minute) - using PIN digits as "words"
    const digitsTyped = pin.length / 5; // Treat 5 digits as 1 "word"
    const wpm = totalTime > 0 ? (digitsTyped / totalTime) * 60 : 0;

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
        dwellTimes.push(touchEnds[i].timestamp - touchStarts[i].timestamp);
      }
    }

    // Calculate inter-key pauses
    const interKeyPauses = [];
    for (let i = 1; i < touchStarts.length; i++) {
      if (touchEnds[i-1] && touchStarts[i]) {
        interKeyPauses.push(touchStarts[i].timestamp - touchEnds[i-1].timestamp);
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
      username: 'PinUser',
      captcha: '******', // PIN is masked for security
      userInput: '*'.repeat(pin.length), // PIN is masked for security
      isCorrect: pin.length === 6, // Assuming 6-digit PIN is correct
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
      characterCount: pin.length,
    };
  };

  const logPinDataCSV = async () => {
    const data = calculatePinMetrics();
    
    // Store data in AsyncStorage for the DatasetScreen
    try {
      const existingData = await AsyncStorage.getItem('pinDataset');
      const parsedData = existingData ? JSON.parse(existingData) : [];
      
      const dataWithId = {
        ...data,
        id: Date.now().toString(),
        keyTimingsCount: (data.keyTimings || []).length,
        touchEventsCount: (data.touchEvents || []).length,
        errorRecoveryCount: (data.errorRecoveryEvents || []).length,
        devicePlatform: data.deviceMetrics?.platform || 'unknown',
        deviceScreenWidth: data.deviceMetrics?.screenWidth || 0,
        deviceScreenHeight: data.deviceMetrics?.screenHeight || 0,
        devicePixelRatio: data.deviceMetrics?.pixelRatio || 1,
      };
      
      parsedData.push(dataWithId);
      await AsyncStorage.setItem('pinDataset', JSON.stringify(parsedData));
      
      // Make this data available globally for DatasetScreen
      if (global.addPinData) {
        await global.addPinData(dataWithId);
      }
    } catch (error) {
      console.error('Error storing PIN data:', error);
    }
    
    // Create CSV format for logging (same as backend expects)
    const csvRow = [
      data.username || 'PinUser',
      data.captcha || '******',
      data.userInput || '*'.repeat(data.characterCount || 6),
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
      `[${(data.interKeyPauses || []).join(';')}]`,
      `[${(data.typingPatternVector || []).join(';')}]`
    ];

    // Log the CSV format (as raw data for backend)
    const csvData = csvRow.join(',');
    console.log('🔐 PIN Biometric Data for Backend:');
    console.log(csvData);
    
    // Send to backend for authentication
    try {
      const { backendService } = await import('../services/BackendService');
      const response = await backendService.authenticatePin(data);
      
      console.log('✅ PIN Authentication Backend Response:');
      console.log(JSON.stringify(response, null, 2));
      
      // Log specific results
      if (response.authenticated) {
        console.log('✅ PIN AUTHENTICATION SUCCESSFUL');
        console.log(`👤 User: ${response.user}`);
        console.log(`🎯 Target User: ${response.target_user}`);
        console.log(`📊 Confidence: ${response.confidence.toFixed(4)}`);
        console.log(`🚪 Threshold: ${response.threshold.toFixed(4)}`);
        console.log(`🤖 Model Type: ${response.model_type}`);
      } else {
        console.log('❌ PIN AUTHENTICATION FAILED');
        console.log(`📊 Confidence: ${response.confidence.toFixed(4)} (Below threshold: ${response.threshold.toFixed(4)})`);
      }
    } catch (error) {
      console.error('❌ Backend PIN Authentication Error:', error);
      
      // Fallback: still log the raw data format
      console.log('📝 Raw PIN Data (for manual backend testing):');
      console.log(csvData);
    }
  };

  // Reset PIN metrics when PIN is cleared
  useEffect(() => {
    if (pin.length === 0) {
      resetPinMetrics();
    }
  }, [pin]);

  return (
    <ScrollView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header with Logo */}
      <View className="bg-white pt-16 pb-8 px-6">
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center mb-4 shadow-lg">
            <MaterialIcons name="account-balance" size={36} color="white" />
          </View>
          <Text className="text-blue-800 font-bold text-2xl mb-1">SURAKSHA BANK</Text>
          <Text className="text-blue-600 font-semibold text-lg">सुरक्षा-बैंक</Text>
        </View>
      </View>

      {/* PIN Section */}
      <View className="flex-1 px-6 pt-4">
        <View className="items-center mb-8">
          <Text className="text-blue-800 text-2xl font-bold mb-2">Enter PIN</Text>
          <Text className="text-blue-500 text-base text-center">Enter your 6-digit PIN to access your account</Text>
        </View>

        {/* PIN Input Circles with more spacing */}
        <View className="mb-8">
          <View className="flex-row justify-center items-center space-x-6 mb-6">
            {[...Array(6)].map((_, index) => (
              <View
                key={index}
                className={`w-14 h-14 rounded-full border-2 items-center justify-center ${
                  index < pin.length 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'bg-white border-blue-300'
                }`}
              >
                {index < pin.length && (
                  <View className="w-3 h-3 rounded-full bg-white" />
                )}
              </View>
            ))}
          </View>
          
          {/* Hidden TextInput */}
          <TextInput
            ref={inputRef}
            value={pin}
            onChangeText={handlePinChange}
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry={false}
            className="opacity-0 absolute w-full h-16 text-center"
            autoFocus={true}
            caretHidden={true}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
          
          <TouchableOpacity 
            className="bg-blue-50 rounded-xl py-4 px-6 items-center border border-blue-200"
            onPressIn={handleTouchStart}
            onPressOut={handleTouchEnd}
            onPress={() => {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
          >
            <Text className="text-blue-600 font-medium text-base">Tap to enter PIN</Text>
          </TouchableOpacity>
        </View>

        {/* Forgot PIN */}
        <TouchableOpacity className="items-center mb-8">
          <Text className="text-blue-600 font-semibold text-base">Forgot PIN?</Text>
        </TouchableOpacity>

        {/* Quick Services - White and Blue Theme */}
        <View className="mb-8">
          <Text className="text-blue-800 font-bold text-lg mb-4">Quick Services</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity className="items-center flex-1">
              <View className="w-14 h-14 bg-blue-50 rounded-xl items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="account-balance-wallet" size={26} color="#2563eb" />
              </View>
              <Text className="text-blue-700 font-medium text-xs text-center">Send Money</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center flex-1">
              <View className="w-14 h-14 bg-blue-50 rounded-xl items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="qr-code-scanner" size={26} color="#2563eb" />
              </View>
              <Text className="text-blue-700 font-medium text-xs text-center">Scan & Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center flex-1">
              <View className="w-14 h-14 bg-blue-50 rounded-xl items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="account-balance" size={26} color="#2563eb" />
              </View>
              <Text className="text-blue-700 font-medium text-xs text-center">Balance</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center flex-1">
              <View className="w-14 h-14 bg-blue-50 rounded-xl items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="support-agent" size={26} color="#2563eb" />
              </View>
              <Text className="text-blue-700 font-medium text-xs text-center">Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Services Row */}
        <View className="mb-8">
          <View className="flex-row justify-around">
            <TouchableOpacity className="items-center">
              <View className="w-12 h-12 bg-blue-50 rounded-lg items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="receipt" size={22} color="#2563eb" />
              </View>
              <Text className="text-blue-600 text-xs">Bill Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-12 h-12 bg-blue-50 rounded-lg items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="currency-rupee" size={22} color="#2563eb" />
              </View>
              <Text className="text-blue-600 text-xs">Recharge</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-12 h-12 bg-blue-50 rounded-lg items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="help-outline" size={22} color="#2563eb" />
              </View>
              <Text className="text-blue-600 text-xs">Help</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-12 h-12 bg-blue-50 rounded-lg items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="more-horiz" size={22} color="#2563eb" />
              </View>
              <Text className="text-blue-600 text-xs">More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom Promotional Area - White and Blue Theme */}
      <View className="bg-white px-6 py-6 border-t border-blue-100">
        <View className="bg-blue-600 rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white font-bold text-base">✨ Digital Banking Experience</Text>
              <Text className="text-blue-100 text-sm">Smart, Secure, Simple</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={20} color="white" />
          </View>
        </View>

        <View className="flex-row space-x-3 mb-4">
          <View className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <Text className="text-blue-800 font-semibold text-sm">🎯 Instant Loans</Text>
            <Text className="text-blue-600 text-xs">Pre-approved offers</Text>
          </View>
          
          <View className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <Text className="text-blue-800 font-semibold text-sm">💳 Zero Fee Cards</Text>
            <Text className="text-blue-600 text-xs">Lifetime free</Text>
          </View>
        </View>

        {/* Security Footer */}
        <View className="items-center pt-4 border-t border-blue-100">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="security" size={16} color="#2563eb" />
            <Text className="text-blue-600 font-medium text-sm ml-2">Secured by 256-bit encryption</Text>
          </View>
          <Text className="text-blue-500 text-xs text-center">
            Your data is protected with bank-grade security
          </Text>
        </View>
      </View>

      {/* Security Alert Modal */}
      <SecurityAlert 
        visible={showSecurityAlert}
        onClose={() => setShowSecurityAlert(false)}
      />
    </ScrollView>
  );
};

