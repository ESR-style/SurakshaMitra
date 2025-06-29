import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Gyroscope } from 'expo-sensors';

interface EmulatorDetectionProps {
  isActive: boolean; // Whether to start monitoring
  onDetectionComplete: (isEmulator: boolean) => void;
}

interface GyroReading {
  x: number;
  y: number;
  z: number;
}

export const EmulatorDetection = ({ isActive, onDetectionComplete }: EmulatorDetectionProps) => {
  const [showAlert, setShowAlert] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [gyroReadings, setGyroReadings] = useState<GyroReading[]>([]);
  const [averageTilt, setAverageTilt] = useState(0);
  const [detectionStarted, setDetectionStarted] = useState(false); // Track if detection has been started

  useEffect(() => {
    if (!isActive || isMonitoring || detectionStarted) return;

    console.log(JSON.stringify({ 
      emulatorDetection: 'started', 
      timestamp: new Date().toISOString() 
    }));

    setIsMonitoring(true);
    setDetectionStarted(true); // Mark detection as started
    const readings: GyroReading[] = [];
    let subscription: any = null;

    // Start gyroscope monitoring
    const startMonitoring = async () => {
      try {
        // Check if gyroscope is available
        const isAvailable = await Gyroscope.isAvailableAsync();
        if (!isAvailable) {
        console.log(JSON.stringify({ 
            emulatorDetection: 'gyroscope_not_available', 
          timestamp: new Date().toISOString() 
        }));
          // If gyroscope is not available, assume it's an emulator
          handleDetectionResult(true);
          return;
        }

        // Set update interval to 100ms for good sampling
        Gyroscope.setUpdateInterval(100);

        subscription = Gyroscope.addListener(({ x, y, z }) => {
          readings.push({ x, y, z });
        });

        // Monitor for 10 seconds
        setTimeout(() => {
          if (subscription) {
            subscription.remove();
          }
          analyzeReadings(readings);
        }, 10000);
        
      } catch (error) {
        console.log(JSON.stringify({ 
          emulatorDetection: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error', 
          timestamp: new Date().toISOString() 
        }));
        // On error, assume it might be an emulator
        handleDetectionResult(true);
      }
    };

    const analyzeReadings = (readings: GyroReading[]) => {
      if (readings.length === 0) {
        // No readings collected, likely an emulator
        handleDetectionResult(true);
        return;
      }

      // Calculate average absolute tilt across all axes
      const totalTilt = readings.reduce((sum, reading) => {
        return sum + Math.abs(reading.x) + Math.abs(reading.y) + Math.abs(reading.z);
      }, 0);

      const avgTilt = totalTilt / readings.length;
      setAverageTilt(avgTilt);
      setGyroReadings(readings);

      console.log(JSON.stringify({ 
        emulatorDetection: 'completed',
        averageTilt: avgTilt,
        totalReadings: readings.length,
        timestamp: new Date().toISOString() 
      }));

      // Only detect emulator if average tilt is exactly 0 or extremely close to 0
      // Real devices should have some movement, even if minimal (> 0.0001)
      const threshold = 0.0001;
      const isEmulator = avgTilt < threshold;
      
      console.log(JSON.stringify({ 
        emulatorDetectionResult: isEmulator ? 'emulator_detected' : 'real_device',
        averageTilt: avgTilt,
        threshold: threshold,
        reason: isEmulator ? 'average_tilt_below_threshold' : 'average_tilt_above_threshold',
        timestamp: new Date().toISOString() 
      }));

      handleDetectionResult(isEmulator);
    };

    const handleDetectionResult = (isEmulator: boolean) => {
      setIsMonitoring(false);
      if (isEmulator) {
        setShowAlert(true);
      }
      onDetectionComplete(isEmulator);
    };

    startMonitoring();

    // Cleanup function
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isActive, isMonitoring]);

  const handleAlertClose = () => {
    setShowAlert(false);
  };

  if (!showAlert) return null;

  return (
    <Modal
      transparent={true}
      visible={showAlert}
      animationType="fade"
      onRequestClose={handleAlertClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
          {/* Security Alert Icon */}
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-3">
              <MaterialIcons name="security" size={32} color="#ef4444" />
            </View>
            <Text className="text-xl font-bold text-gray-900 text-center">
              Security Alert
            </Text>
          </View>

          {/* Alert Message */}
          <View className="mb-6">
            <Text className="text-gray-700 text-center text-base leading-6 mb-3">
              Emulator Detected
            </Text>
            <Text className="text-gray-600 text-center text-sm leading-5">
              This app detected you may be running on an emulator. For security reasons, 
              some features may be restricted on non-physical devices.
            </Text>
          </View>

          {/* Debug Info (for development) */}
          <View className="mb-4 p-3 bg-gray-50 rounded-lg">
            <Text className="text-xs text-gray-600 text-center">
              Debug: Avg Tilt: {averageTilt.toFixed(6)} | Threshold: 0.0001 | Readings: {gyroReadings.length}
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              Detected: {averageTilt < 0.0001 ? 'Emulator (tilt < 0.0001)' : 'Real Device'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-3">
            <TouchableOpacity 
              className="flex-1 bg-gray-100 py-3 px-4 rounded-xl"
              onPress={handleAlertClose}
            >
              <Text className="text-gray-700 font-semibold text-center">
                Continue Anyway
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-1 bg-red-600 py-3 px-4 rounded-xl"
              onPress={handleAlertClose}
            >
              <Text className="text-white font-semibold text-center">
                Exit App
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
