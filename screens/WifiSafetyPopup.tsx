import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface WifiSafetyPopupProps {
  visible: boolean;
  onComplete: (choice: number) => void;
}

export const WifiSafetyPopup = ({ visible, onComplete }: WifiSafetyPopupProps) => {
  const handleChoice = async (choice: number) => {
    console.log(JSON.stringify({ wifiSafetyChoice: choice }));
    
    // Send to backend for validation
    try {
      const { backendService } = await import('../services/BackendService');
      const response = await backendService.checkWifiSafety(choice);
      
      console.log('✅ WiFi Safety Backend Response:');
      console.log(JSON.stringify(response, null, 2));
      
      // Log specific results
      if (response.authenticated) {
        console.log('✅ WIFI SAFETY CHECK SUCCESSFUL');
        console.log(`📊 Choice: ${response.choice}`);
        console.log(`💬 Message: ${response.message}`);
      } else {
        console.log('❌ WIFI SAFETY CHECK FAILED');
        console.log(`📊 Choice: ${response.choice}`);
        console.log(`💬 Message: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Backend WiFi Safety Error:', error);
      
      // Fallback: still log the raw data format
      console.log('📝 Raw WiFi Safety Data (for manual backend testing):');
      console.log(JSON.stringify({ wifiSafetyChoice: choice }));
    }
    
    onComplete(choice);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
              <MaterialIcons name="wifi" size={32} color="#10b981" />
            </View>
            <Text className="text-gray-800 font-bold text-xl mb-2 text-center">
              Connected to WiFi
            </Text>
            <Text className="text-blue-600 font-semibold text-base text-center">
              Stay Safe Online
            </Text>
          </View>

          {/* Safety Message */}
          <View className="mb-6">
            <Text className="text-gray-700 text-base text-center leading-6 mb-4">
              You're now connected to a WiFi network. For your security, please ensure:
            </Text>
            
            <View className="space-y-3">
              <View className="flex-row items-start">
                <MaterialIcons name="shield" size={18} color="#ef4444" />
                <Text className="text-gray-600 ml-3 flex-1 text-sm">
                  Never share your banking credentials on public WiFi
                </Text>
              </View>
              
              <View className="flex-row items-start">
                <MaterialIcons name="lock" size={18} color="#ef4444" />
                <Text className="text-gray-600 ml-3 flex-1 text-sm">
                  Always log out completely when finished
                </Text>
              </View>
              
              <View className="flex-row items-start">
                <MaterialIcons name="visibility-off" size={18} color="#ef4444" />
                <Text className="text-gray-600 ml-3 flex-1 text-sm">
                  Avoid banking on unsecured networks
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity 
              onPress={() => handleChoice(1)}
              className="bg-blue-600 rounded-xl py-3 px-6 items-center"
            >
              <Text className="text-white font-bold text-base">I Understand</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleChoice(2)}
              className="bg-gray-100 rounded-xl py-3 px-6 items-center border border-gray-200"
            >
              <Text className="text-gray-600 font-semibold text-base">Ignore</Text>
            </TouchableOpacity>
          </View>

          {/* Security Footer */}
          <View className="items-center pt-4 border-t border-gray-100 mt-4">
            <View className="flex-row items-center">
              <MaterialIcons name="security" size={14} color="#2563eb" />
              <Text className="text-blue-600 font-medium text-xs ml-2">
                Your safety is our priority
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
