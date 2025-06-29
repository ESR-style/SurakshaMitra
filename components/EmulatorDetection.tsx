import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Gyroscope, Accelerometer, Magnetometer } from 'expo-sensors';
import * as Device from 'expo-device';

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
  const [detectionStarted, setDetectionStarted] = useState(false);
  const [detectionMethod, setDetectionMethod] = useState<string>(''); // Track detection method
  const subscriptionRef = useRef<any>(null);
  const alternativeSubscriptionRef = useRef<any>(null); // For accelerometer cleanup
  const detectionCompletedRef = useRef<boolean>(false); // Prevent multiple completions - using ref for closure access

  useEffect(() => {
    if (!isActive || isMonitoring || detectionStarted) return;

    console.log(JSON.stringify({ 
      emulatorDetection: 'started', 
      timestamp: new Date().toISOString() 
    }));

    setIsMonitoring(true);
    setDetectionStarted(true); // Mark detection as started
    detectionCompletedRef.current = false; // Reset completion flag
    const readings: GyroReading[] = [];

    // Start gyroscope monitoring
    const startMonitoring = async () => {
      try {
        // First check device info for basic emulator detection
        const deviceInfo = {
          isDevice: Device.isDevice,
          deviceType: Device.deviceType,
          modelName: Device.modelName,
          brand: Device.brand,
          manufacturer: Device.manufacturer
        };

        console.log(JSON.stringify({ 
          emulatorDetection: 'device_info_check',
          deviceInfo,
          timestamp: new Date().toISOString() 
        }));

        // Check if it's clearly an emulator based on device info
        const isEmulatorByDeviceInfo = !Device.isDevice || 
          Device.modelName?.toLowerCase().includes('emulator') ||
          Device.modelName?.toLowerCase().includes('simulator') ||
          Device.brand?.toLowerCase().includes('generic') ||
          Device.manufacturer?.toLowerCase().includes('generic');

        console.log(JSON.stringify({ 
          emulatorDetection: 'device_info_analysis',
          isEmulatorByDeviceInfo,
          reason: isEmulatorByDeviceInfo ? 'device_info_indicates_emulator' : 'device_info_indicates_real_device',
          proceedingWithSensorCheck: true, // Always proceed with sensor check for debugging
          timestamp: new Date().toISOString() 
        }));

        // Check if gyroscope is available
        const isAvailable = await Gyroscope.isAvailableAsync();
        console.log(JSON.stringify({ 
          emulatorDetection: 'gyroscope_availability_check',
          isAvailable,
          platform: Platform.OS,
          timestamp: new Date().toISOString() 
        }));

        if (!isAvailable) {
          console.log(JSON.stringify({ 
            emulatorDetection: 'gyroscope_not_available', 
            timestamp: new Date().toISOString() 
          }));
          setDetectionMethod('No Gyroscope');
          
          // Try alternative sensors immediately
          tryAlternativeSensors();
          return;
        }

        // Try to get permission for sensors (for newer Android versions)
        try {
          console.log(JSON.stringify({ 
            emulatorDetection: 'attempting_gyroscope_setup',
            platform: Platform.OS,
            timestamp: new Date().toISOString() 
          }));

          // Set a reasonable update interval - not too fast to avoid permission issues
          await Gyroscope.setUpdateInterval(500); // 500ms = 2Hz, slower to ensure it works
          
          console.log(JSON.stringify({ 
            emulatorDetection: 'gyroscope_update_interval_set',
            updateInterval: 500,
            timestamp: new Date().toISOString() 
          }));

          let readingCount = 0;
          const maxReadings = 20; // 10 seconds at 2Hz
          let hasSignificantMovement = false;
          let maxReading = 0;
          let timeoutId: NodeJS.Timeout;
          let initialReadingReceived = false;

          // First, try to get an initial reading to test if the sensor works
          console.log(JSON.stringify({ 
            emulatorDetection: 'creating_gyroscope_listener',
            timestamp: new Date().toISOString() 
          }));

          subscriptionRef.current = Gyroscope.addListener(({ x, y, z }) => {
            if (!initialReadingReceived) {
              initialReadingReceived = true;
              console.log(JSON.stringify({ 
                emulatorDetection: 'first_gyroscope_reading_received',
                timestamp: new Date().toISOString() 
              }));
            }

            readingCount++;
            const magnitude = Math.sqrt(x*x + y*y + z*z);
            maxReading = Math.max(maxReading, magnitude);
            
            console.log(JSON.stringify({ 
              gyroReading: {
                count: readingCount,
                x: x.toFixed(6),
                y: y.toFixed(6),
                z: z.toFixed(6),
                magnitude: magnitude.toFixed(6),
                timestamp: new Date().toISOString()
              }
            }));

            // Check for any significant movement (threshold lowered)
            if (magnitude > 0.001) {
              hasSignificantMovement = true;
            }
            
            readings.push({ x, y, z });

            // Stop early if we detect significant movement and have enough readings
            if (hasSignificantMovement && readingCount >= 5) {
              clearTimeout(timeoutId);
              if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
              }
              console.log(JSON.stringify({ 
                emulatorDetection: 'early_termination_movement_detected',
                readingCount,
                maxReading,
                timestamp: new Date().toISOString() 
              }));
              if (!detectionCompletedRef.current) {
                analyzeReadings(readings, 'Early Movement Detection');
              }
            }
          });

          console.log(JSON.stringify({ 
            emulatorDetection: 'gyroscope_listener_created_successfully',
            listenerRef: subscriptionRef.current ? 'valid' : 'null',
            timestamp: new Date().toISOString() 
          }));

          // Check if we got any readings after 2 seconds
          setTimeout(() => {
            console.log(JSON.stringify({ 
              emulatorDetection: '2_second_check',
              readingsReceived: readings.length,
              initialReadingReceived,
              listenerActive: subscriptionRef.current ? 'yes' : 'no',
              timestamp: new Date().toISOString() 
            }));

            if (readings.length === 0) {
              console.log(JSON.stringify({ 
                emulatorDetection: 'no_readings_after_2_seconds',
                possibleCause: 'sensor_permission_or_hardware_issue',
                attemptingFallback: true,
                timestamp: new Date().toISOString() 
              }));
              
              // Try alternative detection methods
              if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
              }
              
              // Fallback to device info based detection
              setDetectionMethod('Sensor Access Failed');
              
              // Try alternative detection methods
              tryAlternativeSensors();
            }
          }, 2000);

          // Monitor for 8 seconds maximum (reduced from 10)
          timeoutId = setTimeout(() => {
            if (subscriptionRef.current) {
              subscriptionRef.current.remove();
              subscriptionRef.current = null;
            }
            console.log(JSON.stringify({ 
              emulatorDetection: 'timeout_reached',
              totalReadings: readings.length,
              hasSignificantMovement,
              maxReading,
              initialReadingReceived,
              detectionCompleted: detectionCompletedRef.current,
              timestamp: new Date().toISOString() 
            }));
            // Only analyze if detection hasn't been completed by accelerometer
            if (!detectionCompletedRef.current) {
              analyzeReadings(readings, 'Timeout Analysis');
            }
          }, 8000);
          
        } catch (sensorError) {
          console.log(JSON.stringify({ 
            emulatorDetection: 'sensor_permission_error',
            error: sensorError instanceof Error ? sensorError.message : 'Unknown sensor error',
            timestamp: new Date().toISOString() 
          }));
          
          // Try alternative sensors when gyroscope fails
          console.log(JSON.stringify({ 
            emulatorDetection: 'trying_alternative_sensors',
            timestamp: new Date().toISOString() 
          }));
          
          tryAlternativeSensors();
        }
        
      } catch (error) {
        console.log(JSON.stringify({ 
          emulatorDetection: 'general_error', 
          error: error instanceof Error ? error.message : 'Unknown error', 
          timestamp: new Date().toISOString() 
        }));
        setDetectionMethod('General Error');
      }
    };

    const tryAlternativeSensors = async () => {
      console.log(JSON.stringify({ 
        emulatorDetection: 'trying_accelerometer',
        timestamp: new Date().toISOString() 
      }));

      try {
        // Try accelerometer as fallback
        const accelAvailable = await Accelerometer.isAvailableAsync();
        if (accelAvailable) {
          console.log(JSON.stringify({ 
            emulatorDetection: 'accelerometer_available',
            timestamp: new Date().toISOString() 
          }));

          const accelReadings: GyroReading[] = [];
          let accelReadingCount = 0;

          Accelerometer.setUpdateInterval(1000); // 1 second intervals
          const accelSubscription = Accelerometer.addListener(({ x, y, z }) => {
            accelReadingCount++;
            accelReadings.push({ x, y, z });
            
            console.log(JSON.stringify({ 
              accelerometerReading: {
                count: accelReadingCount,
                x: x.toFixed(6),
                y: y.toFixed(6),
                z: z.toFixed(6),
                magnitude: Math.sqrt(x*x + y*y + z*z).toFixed(6)
              },
              timestamp: new Date().toISOString() 
            }));

            if (accelReadingCount >= 3) { // Get at least 3 readings
              accelSubscription.remove();
              alternativeSubscriptionRef.current = null;
              console.log(JSON.stringify({ 
                emulatorDetection: 'accelerometer_readings_collected',
                totalReadings: accelReadings.length,
                detectionCompleted: detectionCompletedRef.current,
                timestamp: new Date().toISOString() 
              }));
              setDetectionMethod('Accelerometer Fallback');
              if (!detectionCompletedRef.current) {
                analyzeReadings(accelReadings, 'Accelerometer Analysis');
              }
            }
          });
          
          alternativeSubscriptionRef.current = accelSubscription;

          // Timeout for accelerometer
          setTimeout(() => {
            if (alternativeSubscriptionRef.current) {
              alternativeSubscriptionRef.current.remove();
              alternativeSubscriptionRef.current = null;
            }
            if (accelReadings.length === 0 && !detectionCompletedRef.current) {
              console.log(JSON.stringify({ 
                emulatorDetection: 'accelerometer_also_failed',
                detectionCompleted: detectionCompletedRef.current,
                timestamp: new Date().toISOString() 
              }));
              setDetectionMethod('All Sensors Failed');
              handleDetectionResult(true);
            }
          }, 5000);

        } else {
          console.log(JSON.stringify({ 
            emulatorDetection: 'accelerometer_not_available',
            timestamp: new Date().toISOString() 
          }));
          setDetectionMethod('No Sensors Available');
          handleDetectionResult(true);
        }
      } catch (error) {
        console.log(JSON.stringify({ 
          emulatorDetection: 'accelerometer_error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString() 
        }));
        setDetectionMethod('Sensor Access Error');
        handleDetectionResult(true);
      }
    };

    const analyzeReadings = (readings: GyroReading[], analysisType: string) => {
      // Prevent multiple analyses
      if (detectionCompletedRef.current) {
        console.log(JSON.stringify({ 
          emulatorDetection: 'analysis_skipped_already_completed',
          analysisType,
          timestamp: new Date().toISOString() 
        }));
        return;
      }
      
      console.log(JSON.stringify({ 
        emulatorDetection: 'sensor_analysis_starting',
        analysisType,
        readingsCount: readings.length,
        timestamp: new Date().toISOString() 
      }));

      if (readings.length === 0) {
        console.log(JSON.stringify({ 
          emulatorDetection: 'no_readings_collected',
          analysisType,
          possibleReasons: [
            'sensor_permission_denied',
            'sensor_hardware_unavailable',
            'emulator_blocking_sensor_access'
          ],
          timestamp: new Date().toISOString() 
        }));
        setDetectionMethod('No Readings - ' + analysisType);
        handleDetectionResult(true);
        return;
      }

      // Calculate various metrics
      const totalTilt = readings.reduce((sum, reading) => {
        return sum + Math.abs(reading.x) + Math.abs(reading.y) + Math.abs(reading.z);
      }, 0);

      const avgTilt = totalTilt / readings.length;
      
      // Calculate maximum magnitude
      const maxMagnitude = Math.max(...readings.map(r => 
        Math.sqrt(r.x*r.x + r.y*r.y + r.z*r.z)
      ));

      // Calculate variance to detect constant values
      const avgX = readings.reduce((sum, r) => sum + r.x, 0) / readings.length;
      const avgY = readings.reduce((sum, r) => sum + r.y, 0) / readings.length;
      const avgZ = readings.reduce((sum, r) => sum + r.z, 0) / readings.length;
      
      const variance = readings.reduce((sum, r) => {
        return sum + Math.pow(r.x - avgX, 2) + Math.pow(r.y - avgY, 2) + Math.pow(r.z - avgZ, 2);
      }, 0) / readings.length;

      setAverageTilt(avgTilt);
      setGyroReadings(readings);

      console.log(JSON.stringify({ 
        emulatorDetection: 'sensor_analysis_completed',
        analysisType,
        sensorMetrics: {
          averageTilt: avgTilt,
          maxMagnitude,
          variance,
          totalReadings: readings.length,
          avgX, avgY, avgZ,
          individualReadings: readings.map((r, i) => ({
            index: i,
            x: r.x.toFixed(6),
            y: r.y.toFixed(6),
            z: r.z.toFixed(6),
            magnitude: Math.sqrt(r.x*r.x + r.y*r.y + r.z*r.z).toFixed(6)
          }))
        },
        timestamp: new Date().toISOString() 
      }));

      // Get device info for final analysis
      const deviceInfo = {
        isDevice: Device.isDevice,
        modelName: Device.modelName,
        brand: Device.brand,
        manufacturer: Device.manufacturer
      };

      const isEmulatorByDeviceInfo = !Device.isDevice || 
        Device.modelName?.toLowerCase().includes('emulator') ||
        Device.modelName?.toLowerCase().includes('simulator') ||
        Device.brand?.toLowerCase().includes('generic') ||
        Device.manufacturer?.toLowerCase().includes('generic');

      // Sensor-based detection thresholds
      const varianceThreshold = 0.000001;
      const magnitudeThreshold = 0.0005;
      
      let isEmulatorBySensor = false;
      let sensorReason = '';

      if (variance < varianceThreshold && maxMagnitude < magnitudeThreshold) {
        isEmulatorBySensor = true;
        sensorReason = 'too_stable_no_natural_variation';
      } else if (avgTilt < 0.00001 && maxMagnitude < 0.0001) {
        isEmulatorBySensor = true;
        sensorReason = 'readings_too_perfect';
      } else {
        isEmulatorBySensor = false;
        sensorReason = 'natural_device_movement_detected';
      }

      // Final decision combining both methods
      const finalIsEmulator = isEmulatorByDeviceInfo || isEmulatorBySensor;
      let finalReason = '';
      let finalMethod = '';

      if (isEmulatorByDeviceInfo && isEmulatorBySensor) {
        finalReason = 'both_device_info_and_sensors_indicate_emulator';
        finalMethod = 'Device Info + Sensor Analysis';
      } else if (isEmulatorByDeviceInfo) {
        finalReason = 'device_info_indicates_emulator_despite_sensor_activity';
        finalMethod = 'Device Info Override';
      } else if (isEmulatorBySensor) {
        finalReason = 'sensors_indicate_emulator_despite_device_info';
        finalMethod = 'Sensor Analysis Override';
      } else {
        finalReason = 'both_methods_indicate_real_device';
        finalMethod = 'Real Device Confirmed';
      }

      setDetectionMethod(finalMethod);
      
      console.log(JSON.stringify({ 
        emulatorDetectionFinalResult: {
          finalDecision: finalIsEmulator ? 'emulator_detected' : 'real_device',
          deviceInfoResult: isEmulatorByDeviceInfo ? 'emulator' : 'real_device',
          sensorResult: isEmulatorBySensor ? 'emulator' : 'real_device', 
          sensorMetrics: { avgTilt, maxMagnitude, variance },
          sensorThresholds: { varianceThreshold, magnitudeThreshold },
          deviceInfo,
          reason: finalReason,
          method: finalMethod
        },
        timestamp: new Date().toISOString() 
      }));

      handleDetectionResult(finalIsEmulator);
    };

    const handleDetectionResult = (isEmulator: boolean) => {
      // Prevent multiple detections
      if (detectionCompletedRef.current) {
        console.log(JSON.stringify({ 
          emulatorDetection: 'detection_result_ignored_already_completed',
          attemptedResult: isEmulator ? 'emulator' : 'real_device',
          timestamp: new Date().toISOString() 
        }));
        return;
      }
      
      detectionCompletedRef.current = true;
      setIsMonitoring(false);
      
      // Clean up all subscriptions
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      if (alternativeSubscriptionRef.current) {
        alternativeSubscriptionRef.current.remove();
        alternativeSubscriptionRef.current = null;
      }
      
      console.log(JSON.stringify({ 
        emulatorDetectionResult: isEmulator ? 'emulator_detected' : 'real_device',
        timestamp: new Date().toISOString() 
      }));
      
      if (isEmulator) {
        setShowAlert(true);
      }
      onDetectionComplete(isEmulator);
    };

    startMonitoring();

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      if (alternativeSubscriptionRef.current) {
        alternativeSubscriptionRef.current.remove();
        alternativeSubscriptionRef.current = null;
      }
      setIsMonitoring(false);
    };
  }, [isActive, isMonitoring, detectionStarted]);

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      if (alternativeSubscriptionRef.current) {
        alternativeSubscriptionRef.current.remove();
        alternativeSubscriptionRef.current = null;
      }
    };
  }, []);

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
              Debug: Method: {detectionMethod} | Avg Tilt: {averageTilt.toFixed(6)} | Readings: {gyroReadings.length}
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              Device: {Device.isDevice ? 'Physical' : 'Virtual'} | Model: {Device.modelName || 'Unknown'}
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
