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

import './global.css';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'pin' | 'twoFactor' | 'main' | 'sendMoney' | 'cards' | 'profile'>('pin');
  const [showWifiPopup, setShowWifiPopup] = useState(false);
  const [mainScreenVisitCount, setMainScreenVisitCount] = useState(0); // Track visits to main screen
  const [isHandlingNavigation, setIsHandlingNavigation] = useState(false); // Prevent double navigation logging
  const [sessionFirstActionCompleted, setSessionFirstActionCompleted] = useState(false); // Track if first action was completed in this session
  const [isFirstLoginToMain, setIsFirstLoginToMain] = useState(true); // Track if this is the first time reaching main screen after login

  // Navigation logging helper
  const logNavigation = (method: 'leftSwipe' | 'rightSwipe' | 'hardwareBack' | 'backIcon', from: string, to: string) => {
    console.log(JSON.stringify({ 
      navigationMethod: method, 
      fromScreen: from, 
      toScreen: to,
      timestamp: new Date().toISOString()
    }));
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
  };

  const handleWifiSafetyComplete = (choice: number) => {
    setShowWifiPopup(false);
  };

  const handleLogout = () => {
    setCurrentScreen('pin');
    setShowWifiPopup(false);
    setMainScreenVisitCount(0); // Reset visit count on logout
    setSessionFirstActionCompleted(false); // Reset first action tracking on logout
    setIsFirstLoginToMain(true); // Reset for next login
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

  const handleFirstActionCompleted = () => {
    setSessionFirstActionCompleted(true);
    setIsFirstLoginToMain(false); // Mark that we're no longer in first login state
  };

  const handleBackToMainIcon = () => {
    logNavigation('backIcon', currentScreen, 'main');
    setCurrentScreen('main');
    setMainScreenVisitCount(prev => prev + 1); // Increment visit count
  };

  // Hardware back button handler for Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentScreen !== 'pin' && currentScreen !== 'twoFactor' && currentScreen !== 'main' && !isHandlingNavigation) {
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
        return <ProfileScreen onBack={handleBackToMainIcon} />;
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
      <StatusBar style="dark" />
    </View>
  );
}
