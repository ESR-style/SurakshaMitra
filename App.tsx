import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, PanResponder, BackHandler } from 'react-native';
import { PinScreen } from './screens/PinScreen';
import { TwoFactorSetupScreen } from './screens/TwoFactorSetupScreen';
import { WifiSafetyPopup } from './screens/WifiSafetyPopup';
import { MainScreen } from './screens/MainScreen';
import { SendMoneyScreen } from './screens/SendMoneyScreen';
import { CardsScreen } from './screens/CardsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { DatasetScreen } from './screens/DatasetScreen';
import { EmulatorDetection } from './components/EmulatorDetection';
import { SecurityVerificationService } from './services/SecurityVerificationService';

import './global.css';

// Suppress Reanimated warnings about reading shared values during render
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    (args[0].includes('[Reanimated] Reading from') || 
     args[0].includes('Reading from value during component render'))
  ) {
    // Suppress the specific Reanimated warning
    return;
  }
  originalWarn(...args);
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'pin' | 'twoFactor' | 'main' | 'sendMoney' | 'cards' | 'profile' | 'datasets'>('pin');
  const [showWifiPopup, setShowWifiPopup] = useState(false);
  const [mainScreenVisitCount, setMainScreenVisitCount] = useState(0); // Track visits to main screen
  const [isHandlingNavigation, setIsHandlingNavigation] = useState(false); // Prevent double navigation logging
  const [sessionFirstActionCompleted, setSessionFirstActionCompleted] = useState(false); // Track if first action was completed in this session
  const [isFirstLoginToMain, setIsFirstLoginToMain] = useState(true); // Track if this is the first time reaching main screen after login
  const [startEmulatorDetection, setStartEmulatorDetection] = useState(false); // Control when to start emulator detection
  const [emulatorDetectionCompleted, setEmulatorDetectionCompleted] = useState(false); // Track if emulator detection has been completed

  // Initialize security verification service
  const securityService = SecurityVerificationService.getInstance();
  
  // Security check on app start
  useEffect(() => {
    const performSecurityCheck = async () => {
      try {
        const { SecurityDetection } = await import('./components/SecurityDetection');
        const securityInfo = await SecurityDetection.getSecurityInfo();
        
        console.log('🛡️ Security Check Data:');
        console.log(JSON.stringify(securityInfo));
        
        // Send to backend for validation
        try {
          const { backendService } = await import('./services/BackendService');
          const response = await backendService.checkDeviceSecurity(securityInfo);
          
          console.log('✅ Device Security Backend Response:');
          console.log(JSON.stringify(response, null, 2));
          
          // Log specific results
          if (response.authenticated) {
            console.log('✅ DEVICE SECURITY CHECK SUCCESSFUL');
            console.log(`💬 Message: ${response.message}`);
            console.log(`📱 Device: ${response.details.deviceModel} by ${response.details.deviceManufacturer}`);
          } else {
            console.log('❌ DEVICE SECURITY CHECK FAILED');
            console.log(`💬 Message: ${response.message}`);
            console.log(`📱 Device: ${response.details.deviceModel} by ${response.details.deviceManufacturer}`);
          }
        } catch (error) {
          console.error('❌ Backend Device Security Error:', error);
          
          // Fallback: still log the raw data format
          console.log('📝 Raw Device Security Data (for manual backend testing):');
          console.log(JSON.stringify(securityInfo));
        }
      } catch (error) {
        console.error('❌ Security Check Error:', error);
      }
    };
    
    performSecurityCheck();
  }, []);

  // Navigation logging helper
  const logNavigation = async (method: 'leftSwipe' | 'rightSwipe' | 'hardwareBack' | 'backIcon', from: string, to: string) => {
    const navigationData = {
      navigationMethod: method, 
      fromScreen: from, 
      toScreen: to,
      timestamp: new Date().toISOString()
    };
    
    console.log(JSON.stringify(navigationData));
    
    // Send to backend for validation
    try {
      const { backendService } = await import('./services/BackendService');
      const response = await backendService.checkNavigationMethod(method);
      
      console.log('✅ Navigation Method Backend Response:');
      console.log(JSON.stringify(response, null, 2));
      
      // Log specific results
      if (response.authenticated) {
        console.log('✅ NAVIGATION METHOD SUCCESSFUL');
        console.log(`🧭 Method: ${response.method}`);
        console.log(`💬 Message: ${response.message}`);
      } else {
        console.log('❌ NAVIGATION METHOD FAILED');
        console.log(`🧭 Method: ${response.method}`);
        console.log(`💬 Message: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Backend Navigation Method Error:', error);
      
      // Fallback: still log the raw data format
      console.log('📝 Raw Navigation Data (for manual backend testing):');
      console.log(JSON.stringify(navigationData));
    }
  };

  // Gesture handler for swipe detection
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 100;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Optional: Add visual feedback during swipe
    },
    onPanResponderRelease: (evt, gestureState) => {
      const swipeThreshold = 50;
      
      if (gestureState.dx > swipeThreshold) {
        // Right swipe (usually back gesture)
        handleSwipeBack('rightSwipe');
      } else if (gestureState.dx < -swipeThreshold) {
        // Left swipe
        handleSwipeBack('leftSwipe');
      }
    },
  });

  const handleSwipeBack = (swipeDirection: 'leftSwipe' | 'rightSwipe') => {
    if (currentScreen !== 'pin' && currentScreen !== 'twoFactor' && currentScreen !== 'main' && !isHandlingNavigation) {
      setIsHandlingNavigation(true);
      logNavigation(swipeDirection, currentScreen, 'main');
      setCurrentScreen('main');
      setMainScreenVisitCount(prev => prev + 1); // Increment visit count
      
      // Reset flag after a short delay
      setTimeout(() => setIsHandlingNavigation(false), 100);
    }
  };

  const handlePinComplete = () => {
    setCurrentScreen('twoFactor');
  };

  const handleTwoFactorComplete = (choice: number) => {
    // Always show wifi popup regardless of choice
    setShowWifiPopup(true);
    setCurrentScreen('main');
    setMainScreenVisitCount(1); // First visit to main screen
    setIsFirstLoginToMain(true); // Mark as first login to main
    
    // Start emulator detection after reaching main screen (only if not already completed)
    if (!emulatorDetectionCompleted) {
      setTimeout(() => {
        setStartEmulatorDetection(true);
      }, 1000); // Small delay to ensure main screen is loaded
    }
  };

  const handleWifiSafetyComplete = (choice: number) => {
    setShowWifiPopup(false);
  };

  const handleLogout = () => {
    // Reset security verification service for new session
    securityService.resetSecurityChecks();
    
    setCurrentScreen('pin');
    setShowWifiPopup(false);
    setMainScreenVisitCount(0); // Reset visit count on logout
    setSessionFirstActionCompleted(false); // Reset first action tracking on logout
    setIsFirstLoginToMain(true); // Reset for next login
    setStartEmulatorDetection(false); // Reset emulator detection
    setEmulatorDetectionCompleted(false); // Reset emulator detection completion status
  };

  const handleNavigateToSendMoney = () => {
    setCurrentScreen('sendMoney');
  };

  const handleNavigateToCards = () => {
    setCurrentScreen('cards');
  };

  const handleNavigateToProfile = () => {
    setCurrentScreen('profile');
  };

  const handleNavigateToDatasets = () => {
    setCurrentScreen('datasets');
  };

  const handleBackToProfile = () => {
    setCurrentScreen('profile');
  };

  const handleFirstActionCompleted = () => {
    setSessionFirstActionCompleted(true);
    setIsFirstLoginToMain(false); // Mark that we're no longer in first login state
  };

  const handleEmulatorDetectionComplete = async (isEmulator: boolean) => {
    const result = isEmulator ? 'emulator_detected' : 'real_device';
    console.log(JSON.stringify({ 
      emulatorDetectionResult: result, 
      timestamp: new Date().toISOString() 
    }));
    
    // Send to backend for validation
    try {
      const { backendService } = await import('./services/BackendService');
      const response = await backendService.checkEmulatorDetection(result);
      
      console.log('✅ Emulator Detection Backend Response:');
      console.log(JSON.stringify(response, null, 2));
      
      // Log specific results
      if (response.authenticated) {
        console.log('🔓 EMULATOR DETECTION SUCCESSFUL');
        console.log(`📱 Result: ${response.result}`);
        console.log(`💬 Message: ${response.message}`);
      } else {
        console.log('🔒 EMULATOR DETECTION FAILED');
        console.log(`📱 Result: ${response.result}`);
        console.log(`💬 Message: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Backend Emulator Detection Error:', error);
      
      // Fallback: still log the raw data format
      console.log('📝 Raw Emulator Detection Data (for manual backend testing):');
      console.log(JSON.stringify({ emulatorDetectionResult: result }));
    }
    
    setEmulatorDetectionCompleted(true); // Mark detection as completed
    setStartEmulatorDetection(false); // Stop detection
    
  };

  const handleBackToMainIcon = () => {
    logNavigation('backIcon', currentScreen, 'main');
    setCurrentScreen('main');
    setMainScreenVisitCount(prev => prev + 1); // Increment visit count
  };

  // Hardware back button handler for Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentScreen === 'datasets' && !isHandlingNavigation) {
        setIsHandlingNavigation(true);
        logNavigation('hardwareBack', currentScreen, 'profile');
        setCurrentScreen('profile');
        setTimeout(() => setIsHandlingNavigation(false), 100);
        return true; // Prevent default behavior
      } else if (currentScreen !== 'pin' && currentScreen !== 'twoFactor' && currentScreen !== 'main' && !isHandlingNavigation) {
        setIsHandlingNavigation(true);
        logNavigation('hardwareBack', currentScreen, 'main');
        setCurrentScreen('main');
        setMainScreenVisitCount(prev => prev + 1); // Increment visit count
        
        // Reset flag after a short delay
        setTimeout(() => setIsHandlingNavigation(false), 100);
        return true; // Prevent default behavior
      }
      return false; // Allow default behavior
    });

    return () => backHandler.remove();
  }, [currentScreen, isHandlingNavigation]);

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'pin':
        return <PinScreen onPinComplete={handlePinComplete} />;
      case 'twoFactor':
        return <TwoFactorSetupScreen onComplete={handleTwoFactorComplete} />;
      case 'main':
        return (
          <MainScreen 
            onLogout={handleLogout}
            onNavigateToSendMoney={handleNavigateToSendMoney}
            onNavigateToCards={handleNavigateToCards}
            onNavigateToProfile={handleNavigateToProfile}
            enableFirstActionTracking={isFirstLoginToMain && !sessionFirstActionCompleted}
            onFirstActionCompleted={handleFirstActionCompleted}
          />
        );
      case 'sendMoney':
        return <SendMoneyScreen onBack={handleBackToMainIcon} />;
      case 'cards':
        return <CardsScreen onBack={handleBackToMainIcon} />;
      case 'profile':
        return <ProfileScreen onBack={handleBackToMainIcon} onNavigateToDatasets={handleNavigateToDatasets} />;
      case 'datasets':
        return <DatasetScreen onBack={handleBackToProfile} />;
      default:
        return <PinScreen onPinComplete={handlePinComplete} />;
    }
  };

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {renderCurrentScreen()}
      <WifiSafetyPopup 
        visible={showWifiPopup} 
        onComplete={handleWifiSafetyComplete} 
      />
      <EmulatorDetection 
        isActive={startEmulatorDetection && !emulatorDetectionCompleted}
        onDetectionComplete={handleEmulatorDetectionComplete}
      />
      <StatusBar style="dark" />
    </View>
  );
}
