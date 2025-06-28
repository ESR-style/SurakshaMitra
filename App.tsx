import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PinScreen } from './screens/PinScreen';
import { MainScreen } from './screens/MainScreen';

import './global.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handlePinComplete = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <>
      {isAuthenticated ? (
        <MainScreen onLogout={handleLogout} />
      ) : (
        <PinScreen onPinComplete={handlePinComplete} />
      )}
      <StatusBar style="dark" />
    </>
  );
}
