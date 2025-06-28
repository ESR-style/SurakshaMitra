import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SecurityDetection, SecurityInfo } from './SecurityDetection';

interface SecurityAlertProps {
  visible: boolean;
  onClose: () => void;
}

export const SecurityAlert = ({ visible, onClose }: SecurityAlertProps) => {
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      checkSecurityStatus();
    }
  }, [visible]);

  const checkSecurityStatus = async () => {
    try {
      setLoading(true);
      const info = await SecurityDetection.getSecurityInfo();
      setSecurityInfo(info);
      
      // SecurityModule already handles comprehensive logging through getSecurityInfo()
      // Additional logging for SecurityAlert specific events
      console.log('=== SECURITY ALERT ===');
      console.log(JSON.stringify({ 
        event: 'security_alert_triggered',
        securityCheck: 'completed',
        summary: {
          isDeveloperMode: info.isDeveloperMode,
          isUSBDebugging: info.isUSBDebugging,
          isEmulator: info.isEmulator,
          isRooted: info.isRooted,
          totalThreats: [
            info.isDeveloperMode,
            info.isUSBDebugging,
            info.isEmulator,
            info.isRooted
          ].filter(Boolean).length,
          deviceInfo: {
            model: info.deviceModel,
            manufacturer: info.deviceManufacturer,
            androidVersion: info.androidVersion,
            buildFingerprint: info.buildFingerprint
          }
        },
        timestamp: new Date().toISOString()
      }, null, 2));

      // Log individual security alert events for detected threats
      if (info.isDeveloperMode) {
        console.log('=== ALERT ===');
        console.log(JSON.stringify({ 
          alert: 'developer_mode_detected',
          severity: 'high',
          message: 'Developer mode is enabled on this device',
          timestamp: new Date().toISOString()
        }, null, 2));
      }

      if (info.isUSBDebugging) {
        console.log('=== ALERT ===');
        console.log(JSON.stringify({ 
          alert: 'usb_debugging_detected',
          severity: 'high',
          message: 'USB debugging is enabled on this device',
          timestamp: new Date().toISOString()
        }, null, 2));
      }

      if (info.isEmulator) {
        console.log('=== ALERT ===');
        console.log(JSON.stringify({ 
          alert: 'emulator_detected',
          severity: 'critical',
          message: 'App is running on an emulator/simulator',
          timestamp: new Date().toISOString()
        }, null, 2));
      }

      if (info.isRooted) {
        console.log('=== ALERT ===');
        console.log(JSON.stringify({ 
          alert: 'rooted_device_detected',
          severity: 'critical',
          message: 'Device appears to be rooted',
          timestamp: new Date().toISOString()
        }, null, 2));
      }

    } catch (error) {
      console.log('=== ERROR ===');
      console.log(JSON.stringify({ 
        error: 'security_alert_check_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const getSecurityThreats = () => {
    if (!securityInfo) return [];
    
    const threats = [];
    
    if (securityInfo.isDeveloperMode) {
      threats.push({
        icon: 'developer-mode' as const,
        title: 'Developer Mode Enabled',
        description: 'Your device has Developer Options enabled, which may compromise security.',
        severity: 'high' as const
      });
    }
    
    if (securityInfo.isUSBDebugging) {
      threats.push({
        icon: 'usb' as const,
        title: 'USB Debugging Active',
        description: 'USB Debugging is enabled, allowing external access to your device.',
        severity: 'high' as const
      });
    }
    
    if (securityInfo.isEmulator) {
      threats.push({
        icon: 'computer' as const,
        title: 'Emulator Detected',
        description: 'This app is running on an emulator, not a physical device.',
        severity: 'critical' as const
      });
    }
    
    if (securityInfo.isRooted) {
      threats.push({
        icon: 'warning' as const,
        title: 'Rooted Device',
        description: 'Your device appears to be rooted, which poses security risks.',
        severity: 'critical' as const
      });
    }
    
    return threats;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#6b7280';
    }
  };

  const threats = getSecurityThreats();
  const hasThreats = threats.length > 0;

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
          {/* Header */}
          <View className="items-center mb-6">
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${
              hasThreats ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <MaterialIcons 
                name={hasThreats ? "security" : "verified-user"} 
                size={32} 
                color={hasThreats ? "#ef4444" : "#10b981"} 
              />
            </View>
            <Text className="text-xl font-bold text-gray-900 text-center">
              {loading ? 'Checking Security...' : hasThreats ? 'Security Alert' : 'Security Check'}
            </Text>
          </View>

          {loading ? (
            <View className="items-center py-8">
              <Text className="text-gray-600 text-center">
                Scanning device for security threats...
              </Text>
            </View>
          ) : (
            <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
              {hasThreats ? (
                <View className="mb-4">
                  <Text className="text-red-600 font-semibold text-center mb-4">
                    Security threats detected on your device:
                  </Text>
                  
                  {threats.map((threat, index) => (
                    <View key={index} className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                      <View className="flex-row items-start">
                        <MaterialIcons 
                          name={threat.icon} 
                          size={24} 
                          color={getSeverityColor(threat.severity)}
                          style={{ marginRight: 12 }}
                        />
                        <View className="flex-1">
                          <Text className="font-semibold text-gray-900 mb-1">
                            {threat.title}
                          </Text>
                          <Text className="text-gray-700 text-sm">
                            {threat.description}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                  
                  <Text className="text-gray-600 text-sm text-center mt-4">
                    For your security, consider disabling these features before using banking services.
                  </Text>
                </View>
              ) : (
                <View className="items-center py-4">
                  <Text className="text-green-600 font-semibold text-center mb-2">
                    No security threats detected
                  </Text>
                  <Text className="text-gray-600 text-sm text-center">
                    Your device appears to be secure for banking operations.
                  </Text>
                </View>
              )}

              {/* Device Info */}
              {securityInfo && (
                <View className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <Text className="font-semibold text-gray-900 mb-2">Device Information</Text>
                  <Text className="text-gray-600 text-xs">
                    {securityInfo.deviceManufacturer} {securityInfo.deviceModel}
                  </Text>
                  <Text className="text-gray-600 text-xs">
                    Android {securityInfo.androidVersion}
                  </Text>
                  <Text className="text-gray-600 text-xs">
                    Build: {securityInfo.buildFingerprint}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Action Buttons */}
          <View className="mt-6">
            {hasThreats ? (
              <View className="space-y-3">
                <TouchableOpacity 
                  className="bg-red-600 py-3 px-6 rounded-xl"
                  onPress={onClose}
                >
                  <Text className="text-white font-semibold text-center">
                    Continue Anyway (Not Recommended)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-gray-100 py-3 px-6 rounded-xl"
                  onPress={onClose}
                >
                  <Text className="text-gray-700 font-semibold text-center">
                    Exit App
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                className="bg-green-600 py-3 px-6 rounded-xl"
                onPress={onClose}
              >
                <Text className="text-white font-semibold text-center">
                  Continue
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
