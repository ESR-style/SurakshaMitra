import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Gyroscope, Accelerometer, Magnetometer } from 'expo-sensors';
import * as Device from 'expo-device';

export const SensorTest = () => {
  const [gyroData, setGyroData] = useState<any[]>([]);
  const [accelData, setAccelData] = useState<any[]>([]);
  const [sensorStatus, setSensorStatus] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  
  const subscriptionsRef = useRef<any[]>([]);

  const checkSensorAvailability = async () => {
    const status = {
      gyroscope: await Gyroscope.isAvailableAsync(),
      accelerometer: await Accelerometer.isAvailableAsync(),
      magnetometer: await Magnetometer.isAvailableAsync(),
      deviceInfo: {
        isDevice: Device.isDevice,
        modelName: Device.modelName,
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        deviceType: Device.deviceType
      }
    };
    
    setSensorStatus(status);
    console.log('Sensor Status:', JSON.stringify(status, null, 2));
  };

  const startSensorTest = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setGyroData([]);
    setAccelData([]);

    // Clear previous subscriptions
    subscriptionsRef.current.forEach(sub => sub?.remove());
    subscriptionsRef.current = [];

    try {
      // Test Gyroscope
      if (sensorStatus.gyroscope) {
        Gyroscope.setUpdateInterval(1000);
        const gyroSub = Gyroscope.addListener(({ x, y, z }) => {
          const reading = {
            sensor: 'gyroscope',
            x: x.toFixed(6),
            y: y.toFixed(6),
            z: z.toFixed(6),
            magnitude: Math.sqrt(x*x + y*y + z*z).toFixed(6),
            timestamp: new Date().toISOString()
          };
          
          setGyroData(prev => [...prev.slice(-9), reading]); // Keep last 10 readings
          console.log('Gyro Reading:', reading);
        });
        subscriptionsRef.current.push(gyroSub);
      }

      // Test Accelerometer
      if (sensorStatus.accelerometer) {
        Accelerometer.setUpdateInterval(1000);
        const accelSub = Accelerometer.addListener(({ x, y, z }) => {
          const reading = {
            sensor: 'accelerometer',
            x: x.toFixed(6),
            y: y.toFixed(6),
            z: z.toFixed(6),
            magnitude: Math.sqrt(x*x + y*y + z*z).toFixed(6),
            timestamp: new Date().toISOString()
          };
          
          setAccelData(prev => [...prev.slice(-9), reading]); // Keep last 10 readings
          console.log('Accel Reading:', reading);
        });
        subscriptionsRef.current.push(accelSub);
      }

      // Auto-stop after 30 seconds
      setTimeout(() => {
        stopSensorTest();
      }, 30000);

    } catch (error) {
      console.error('Sensor test error:', error);
      Alert.alert('Error', `Sensor test failed: ${error}`);
      setIsRunning(false);
    }
  };

  const stopSensorTest = () => {
    subscriptionsRef.current.forEach(sub => sub?.remove());
    subscriptionsRef.current = [];
    setIsRunning(false);
  };

  useEffect(() => {
    checkSensorAvailability();
    
    return () => {
      subscriptionsRef.current.forEach(sub => sub?.remove());
    };
  }, []);

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold mb-4 text-center">Sensor Test</Text>
      
      {/* Device Info */}
      <View className="mb-6 p-4 bg-gray-100 rounded-lg">
        <Text className="text-lg font-semibold mb-2">Device Info:</Text>
        <Text className="text-sm">Is Device: {sensorStatus.deviceInfo?.isDevice ? 'Yes' : 'No'}</Text>
        <Text className="text-sm">Model: {sensorStatus.deviceInfo?.modelName || 'Unknown'}</Text>
        <Text className="text-sm">Brand: {sensorStatus.deviceInfo?.brand || 'Unknown'}</Text>
        <Text className="text-sm">Manufacturer: {sensorStatus.deviceInfo?.manufacturer || 'Unknown'}</Text>
        <Text className="text-sm">Type: {sensorStatus.deviceInfo?.deviceType || 'Unknown'}</Text>
      </View>

      {/* Sensor Availability */}
      <View className="mb-6 p-4 bg-gray-100 rounded-lg">
        <Text className="text-lg font-semibold mb-2">Sensor Availability:</Text>
        <Text className="text-sm">Gyroscope: {sensorStatus.gyroscope ? '✅ Available' : '❌ Not Available'}</Text>
        <Text className="text-sm">Accelerometer: {sensorStatus.accelerometer ? '✅ Available' : '❌ Not Available'}</Text>
        <Text className="text-sm">Magnetometer: {sensorStatus.magnetometer ? '✅ Available' : '❌ Not Available'}</Text>
      </View>

      {/* Controls */}
      <View className="flex-row mb-6 space-x-2">
        <TouchableOpacity
          className={`flex-1 py-3 px-4 rounded-lg ${isRunning ? 'bg-red-500' : 'bg-blue-500'}`}
          onPress={isRunning ? stopSensorTest : startSensorTest}
        >
          <Text className="text-white text-center font-semibold">
            {isRunning ? 'Stop Test' : 'Start Test'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 px-4 rounded-lg bg-gray-500"
          onPress={checkSensorAvailability}
        >
          <Text className="text-white text-center font-semibold">Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Gyroscope Data */}
      {sensorStatus.gyroscope && (
        <View className="mb-6 p-4 bg-blue-50 rounded-lg">
          <Text className="text-lg font-semibold mb-2">Gyroscope Readings ({gyroData.length}):</Text>
          {gyroData.length === 0 ? (
            <Text className="text-gray-500">No readings yet</Text>
          ) : (
            gyroData.slice(-5).map((reading, index) => (
              <Text key={index} className="text-xs font-mono">
                X:{reading.x} Y:{reading.y} Z:{reading.z} M:{reading.magnitude}
              </Text>
            ))
          )}
        </View>
      )}

      {/* Accelerometer Data */}
      {sensorStatus.accelerometer && (
        <View className="mb-6 p-4 bg-green-50 rounded-lg">
          <Text className="text-lg font-semibold mb-2">Accelerometer Readings ({accelData.length}):</Text>
          {accelData.length === 0 ? (
            <Text className="text-gray-500">No readings yet</Text>
          ) : (
            accelData.slice(-5).map((reading, index) => (
              <Text key={index} className="text-xs font-mono">
                X:{reading.x} Y:{reading.y} Z:{reading.z} M:{reading.magnitude}
              </Text>
            ))
          )}
        </View>
      )}

      <Text className="text-xs text-gray-500 text-center mt-4">
        Test will auto-stop after 30 seconds. Check console for detailed logs.
      </Text>
    </ScrollView>
  );
};
