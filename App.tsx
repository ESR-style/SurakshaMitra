import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PinScreen } from './screens/PinScreen';
import { TwoFactorSetupScreen } from './screens/TwoFactorSetupScreen';
import { WifiSafetyPopup } from './screens/WifiSafetyPopup';
import { MainScreen } from './screens/MainScreen';

import './global.css';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'pin' | 'twoFactor' | 'main'>('pin');
  const [showWifiPopup, setShowWifiPopup] = useState(false);

  const handlePinComplete = () => {
    setCurrentScreen('twoFactor');
  };

  const handleTwoFactorComplete = (choice: number) => {
    // Always show wifi popup regardless of choice
    setShowWifiPopup(true);
    setCurrentScreen('main');
  };

  const handleWifiSafetyComplete = (choice: number) => {
    setShowWifiPopup(false);
  };

  const handleLogout = () => {
    setCurrentScreen('pin');
    setShowWifiPopup(false);
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'pin':
        return <PinScreen onPinComplete={handlePinComplete} />;
      case 'twoFactor':
        return <TwoFactorSetupScreen onComplete={handleTwoFactorComplete} />;
      case 'main':
        return <MainScreen onLogout={handleLogout} />;
      default:
        return <PinScreen onPinComplete={handlePinComplete} />;
    }
  };

  return (
    <>
      {renderCurrentScreen()}
      <WifiSafetyPopup 
        visible={showWifiPopup} 
        onComplete={handleWifiSafetyComplete} 
      />
      <StatusBar style="dark" />
    </>
  );
}
