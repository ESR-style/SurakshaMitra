import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SecurityQuestionProps {
  visible: boolean;
  onSuccess: () => void;
  onFailure: () => void;
}

export const SecurityQuestion = ({ visible, onSuccess, onFailure }: SecurityQuestionProps) => {
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showError, setShowError] = useState(false);

  const handleSubmit = () => {
    const correctAnswer = 'siddesh sir';
    
    if (answer.toLowerCase().trim() === correctAnswer.toLowerCase()) {
      setAnswer('');
      setAttempts(0);
      setShowError(false);
      onSuccess();
    } else {
      setAttempts(prev => prev + 1);
      setShowError(true);
      
      if (attempts >= 2) {
        // After 3 failed attempts, mark as intruder
        setAnswer('');
        setAttempts(0);
        setShowError(false);
        onFailure();
      }
    }
  };

  const handleClose = () => {
    setAnswer('');
    setAttempts(0);
    setShowError(false);
    onFailure();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-black/70 items-center justify-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
              <MaterialIcons name="security" size={32} color="#ef4444" />
            </View>
            <Text className="text-red-600 font-bold text-xl mb-2 text-center">
              Security Verification
            </Text>
            <Text className="text-gray-600 text-sm text-center">
              Additional verification required
            </Text>
          </View>

          {/* Warning Message */}
          <View className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
            <View className="flex-row items-start">
              <MaterialIcons name="warning" size={20} color="#ef4444" />
              <Text className="text-red-700 ml-3 flex-1 text-sm">
                Suspicious activity detected. Please answer the security question to continue.
              </Text>
            </View>
          </View>

          {/* Security Question */}
          <View className="mb-6">
            <Text className="text-gray-800 font-semibold text-base mb-3">
              What is your favorite teacher's name?
            </Text>
            
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="Enter your answer"
              className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800 border border-gray-200"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {showError && (
              <Text className="text-red-600 text-sm mt-2">
                Incorrect answer. {2 - attempts} attempts remaining.
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity 
              onPress={handleSubmit}
              className="bg-blue-600 rounded-xl py-3 px-6 items-center"
              disabled={!answer.trim()}
            >
              <Text className="text-white font-bold text-base">Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleClose}
              className="bg-gray-100 rounded-xl py-3 px-6 items-center border border-gray-200"
            >
              <Text className="text-gray-600 font-semibold text-base">Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Security Footer */}
          <View className="items-center pt-4 border-t border-gray-100 mt-4">
            <Text className="text-gray-500 text-xs text-center">
              This verification helps protect your account from unauthorized access
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};
