/**
 * Backend Service for SurakshaMitra Authentication API
 * Handles all communication with the keystroke authentication backend
 */

// Configure your backend URL here
const BACKEND_URL = 'http://64.227.187.22:8000'; // Change this to your actual backend URL

// Add debugging for network issues
const DEBUG_NETWORK = __DEV__;

export interface AuthenticationResponse {
  authenticated: boolean;
  confidence: number;
  threshold: number;
  user: string;
  target_user: string;
  model_type: string;
}

export interface SecurityCheckResponse {
  authenticated: boolean;
  message: string;
  details: {
    deviceModel: string;
    deviceManufacturer: string;
    expectedModel: string;
    expectedManufacturer: string;
    deviceMatch: boolean;
    isDeveloperMode: boolean;
    isUSBDebugging: boolean;
    isEmulator: boolean;
    isRooted: boolean;
    securityCheck: string;
    version: string;
  };
}

export interface TwoFactorResponse {
  authenticated: boolean;
  message: string;
  choice: number;
}

export interface EmulatorResponse {
  authenticated: boolean;
  message: string;
  result: string;
}

export interface WifiSafetyResponse {
  authenticated: boolean;
  message: string;
  choice: number;
}

export interface FirstActionResponse {
  authenticated: boolean;
  message: string;
  action: string;
}

export interface NavigationResponse {
  authenticated: boolean;
  message: string;
  method: string;
}

export class BackendService {
  private static instance: BackendService;
  private baseURL: string;

  constructor(baseURL = BACKEND_URL) {
    this.baseURL = baseURL;
  }

  static getInstance(): BackendService {
    if (!BackendService.instance) {
      BackendService.instance = new BackendService();
    }
    return BackendService.instance;
  }

  /**
   * Generic HTTP request method
   */
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    data?: any,
    contentType = 'application/json'
  ): Promise<any> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const config: RequestInit = {
        method,
        headers: {
          'Content-Type': contentType,
          'Accept': 'application/json',
        },
      };

      if (data && method === 'POST') {
        if (contentType === 'application/json') {
          config.body = JSON.stringify(data);
        } else {
          config.body = data;
        }
      }

      if (DEBUG_NETWORK) {
        console.log(`🌐 Making ${method} request to: ${url}`);
        console.log(`📤 Request data:`, data);
      }

      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP Error ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      
      if (DEBUG_NETWORK) {
        console.log(`📥 Response received:`, responseData);
      }
      
      return responseData;
    } catch (error) {
      console.error(`❌ Network error for ${endpoint}:`, error);
      
      // Provide more helpful error messages for production
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Network connection failed. Please check your internet connection and ensure the server is accessible.');
      }
      
      if (DEBUG_NETWORK) {
        // In development, log more details
        console.debug('🔍 Debug info:', {
          endpoint,
          method,
          data,
          contentType,
          error,
        });
      }
      throw error;
    }
  }

  /**
   * Format captcha data for backend API
   */
  private formatCaptchaData(data: any): string {
    const csvData = [
      data.username || 'CaptchaUser',
      data.captcha || '',
      data.userInput || '',
      data.isCorrect || false,
      data.timestamp || new Date().toISOString(),
      data.totalTime || 0,
      data.wpm || 0,
      data.backspaceCount || 0,
      data.avgFlightTime || 0,
      data.avgDwellTime || 0,
      data.avgInterKeyPause || 0,
      data.sessionEntropy || 0,
      data.keyDwellVariance || 0,
      data.interKeyVariance || 0,
      data.pressureVariance || 0,
      data.touchAreaVariance || 0,
      data.avgTouchArea || 0,
      data.avgPressure || 0,
      data.avgCoordX || 0,
      data.avgCoordY || 0,
      data.avgErrorRecoveryTime || 0,
      data.characterCount || 0,
      this.formatArray(data.flightTimes || []),
      this.formatArray(data.dwellTimes || []),
      this.formatArray(data.interKeyPauses || [])
    ];

    return csvData.join(',');
  }

  /**
   * Format PIN data for backend API
   */
  private formatPinData(data: any): string {
    const csvData = [
      data.username || 'PinUser',
      data.captcha || '******',
      data.userInput || '*'.repeat(data.characterCount || 6),
      data.isCorrect || false,
      data.timestamp || new Date().toISOString(),
      data.totalTime || 0,
      data.wpm || 0,
      data.backspaceCount || 0,
      data.avgFlightTime || 0,
      data.avgDwellTime || 0,
      data.avgInterKeyPause || 0,
      data.sessionEntropy || 0,
      data.keyDwellVariance || 0,
      data.interKeyVariance || 0,
      data.pressureVariance || 0,
      data.touchAreaVariance || 0,
      data.avgTouchArea || 0,
      data.avgPressure || 0,
      data.avgCoordX || 0,
      data.avgCoordY || 0,
      data.avgErrorRecoveryTime || 0,
      data.characterCount || 0,
      this.formatArray(data.flightTimes || []),
      this.formatArray(data.dwellTimes || []),
      this.formatArray(data.interKeyPauses || []),
      this.formatArray(data.typingPatternVector || [])
    ];

    return csvData.join(',');
  }

  /**
   * Format array for backend API (semicolon-separated values in brackets)
   */
  private formatArray(arr: number[]): string {
    if (!arr || arr.length === 0) return '[]';
    return `[${arr.join(';')}]`;
  }

  /**
   * Authenticate captcha keystroke dynamics
   */
  async authenticateCaptcha(data: any): Promise<AuthenticationResponse> {
    try {
      console.log('🔐 Authenticating captcha keystroke data...');
      const formattedData = this.formatCaptchaData(data);
      console.log('📝 Formatted captcha data:', formattedData);
      
      const response = await this.makeRequest(
        '/authenticate/captcha',
        'POST',
        formattedData,
        'text/plain'
      );
      
      console.log('✅ Captcha authentication result:', response);
      return response;
    } catch (error) {
      console.error('❌ Captcha authentication failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate PIN keystroke dynamics
   */
  async authenticatePin(data: any): Promise<AuthenticationResponse> {
    try {
      console.log('🔐 Authenticating PIN keystroke data...');
      const formattedData = this.formatPinData(data);
      console.log('📝 Formatted PIN data:', formattedData);
      
      const response = await this.makeRequest(
        '/authenticate/pin',
        'POST',
        formattedData,
        'text/plain'
      );
      
      console.log('✅ PIN authentication result:', response);
      return response;
    } catch (error) {
      console.error('❌ PIN authentication failed:', error);
      throw error;
    }
  }

  /**
   * Auto-detect and authenticate using appropriate model
   */
  async authenticateAuto(data: any): Promise<AuthenticationResponse> {
    try {
      console.log('🔐 Auto-authenticating keystroke data...');
      
      // Determine if it's PIN or captcha based on data
      const isPinData = data.characterCount <= 6 && data.username === 'PinUser';
      const formattedData = isPinData ? this.formatPinData(data) : this.formatCaptchaData(data);
      
      console.log('📝 Formatted auto data:', formattedData);
      
      const response = await this.makeRequest(
        '/authenticate/auto',
        'POST',
        formattedData,
        'text/plain'
      );
      
      console.log('✅ Auto authentication result:', response);
      return response;
    } catch (error) {
      console.error('❌ Auto authentication failed:', error);
      throw error;
    }
  }

  /**
   * Check device security parameters
   */
  async checkDeviceSecurity(securityState: any): Promise<SecurityCheckResponse> {
    try {
      console.log('🛡️ Checking device security...');
      
      const payload = {
        securityCheck: 'completed',
        version: 'enhanced_v2.0',
        state: securityState
      };
      
      console.log('📝 Security check payload:', payload);
      
      const response = await this.makeRequest('/security/device-check', 'POST', payload);
      
      console.log('✅ Device security check result:', response);
      return response;
    } catch (error) {
      console.error('❌ Device security check failed:', error);
      throw error;
    }
  }

  /**
   * Check two-factor authentication choice
   */
  async checkTwoFactor(choice: number): Promise<TwoFactorResponse> {
    try {
      console.log('🔐 Checking two-factor choice...');
      
      const payload = { twoFactorChoice: choice };
      console.log('📝 Two-factor payload:', payload);
      
      const response = await this.makeRequest(
        '/security/two-factor',
        'POST',
        JSON.stringify(payload),
        'text/plain'
      );
      
      console.log('✅ Two-factor check result:', response);
      return response;
    } catch (error) {
      console.error('❌ Two-factor check failed:', error);
      throw error;
    }
  }

  /**
   * Check emulator detection result
   */
  async checkEmulatorDetection(result: string): Promise<EmulatorResponse> {
    try {
      console.log('📱 Checking emulator detection...');
      
      const payload = { emulatorDetectionResult: result };
      console.log('📝 Emulator detection payload:', payload);
      
      const response = await this.makeRequest(
        '/security/emulator-detection',
        'POST',
        JSON.stringify(payload),
        'text/plain'
      );
      
      console.log('✅ Emulator detection result:', response);
      return response;
    } catch (error) {
      console.error('❌ Emulator detection check failed:', error);
      throw error;
    }
  }

  /**
   * Check WiFi safety choice
   */
  async checkWifiSafety(choice: number): Promise<WifiSafetyResponse> {
    try {
      console.log('📶 Checking WiFi safety choice...');
      
      const payload = { wifiSafetyChoice: choice };
      console.log('📝 WiFi safety payload:', payload);
      
      const response = await this.makeRequest(
        '/security/wifi-safety',
        'POST',
        JSON.stringify(payload),
        'text/plain'
      );
      
      console.log('✅ WiFi safety check result:', response);
      return response;
    } catch (error) {
      console.error('❌ WiFi safety check failed:', error);
      throw error;
    }
  }

  /**
   * Check first action choice
   */
  async checkFirstAction(action: string, pressed: boolean): Promise<FirstActionResponse> {
    try {
      console.log('👆 Checking first action...');
      
      const payload = { firstAction: action, pressed };
      console.log('📝 First action payload:', payload);
      
      const response = await this.makeRequest('/security/first-action', 'POST', payload);
      
      console.log('✅ First action check result:', response);
      return response;
    } catch (error) {
      console.error('❌ First action check failed:', error);
      throw error;
    }
  }

  /**
   * Check navigation method
   */
  async checkNavigationMethod(method: string): Promise<NavigationResponse> {
    try {
      console.log('🧭 Checking navigation method...');
      
      const payload = { navigationMethod: method };
      console.log('📝 Navigation method payload:', payload);
      
      const response = await this.makeRequest(
        '/security/navigation-method',
        'POST',
        JSON.stringify(payload),
        'text/plain'
      );
      
      console.log('✅ Navigation method check result:', response);
      return response;
    } catch (error) {
      console.error('❌ Navigation method check failed:', error);
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<any> {
    try {
      console.log('🏥 Performing health check...');
      const response = await this.makeRequest('/health', 'GET');
      console.log('✅ Health check result:', response);
      return response;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }
}

export const backendService = BackendService.getInstance();
