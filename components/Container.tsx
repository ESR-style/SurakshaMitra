import { SafeAreaView } from 'react-native';

export const Container = ({ children }: { children: React.ReactNode }) => {
  return <SafeAreaView className="flex-1 bg-gray-50 px-6 pt-4">{children}</SafeAreaView>;
};
