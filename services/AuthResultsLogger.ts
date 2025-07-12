import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthResult {
  id: string;
  type: 'PIN_SUCCESS' | 'PIN_FAILED';
  message: string;
  timestamp: string;
}

class AuthResultsLogger {
  private static instance: AuthResultsLogger;

  static getInstance(): AuthResultsLogger {
    if (!AuthResultsLogger.instance) {
      AuthResultsLogger.instance = new AuthResultsLogger();
    }
    return AuthResultsLogger.instance;
  }

  async logAuthResult(type: 'PIN_SUCCESS' | 'PIN_FAILED', message: string): Promise<void> {
    try {
      const newResult: AuthResult = {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date().toISOString(),
      };

      const existing = await AsyncStorage.getItem('auth_results');
      const results = existing ? JSON.parse(existing) : [];
      const updatedResults = [newResult, ...results].slice(0, 100); // Keep only last 100 results

      await AsyncStorage.setItem('auth_results', JSON.stringify(updatedResults));
      
      console.log('📝 Auth result logged:', { type, timestamp: newResult.timestamp });
    } catch (error) {
      console.error('Error saving auth result:', error);
    }
  }

  async getAuthResults(): Promise<AuthResult[]> {
    try {
      const stored = await AsyncStorage.getItem('auth_results');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading auth results:', error);
      return [];
    }
  }

  async clearAllResults(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_results');
      console.log('📝 All auth results cleared');
    } catch (error) {
      console.error('Error clearing auth results:', error);
      throw error;
    }
  }
}

export { AuthResultsLogger, type AuthResult };
