interface SecurityCheck {
  pinAuthentication: boolean;
  twoFactorAuthentication: boolean;
  wifiSafetyCheck: boolean;
  firstActionSuccessful: boolean;
  navigationMethodSuccessful: boolean;
}

class SecurityVerificationService {
  private static instance: SecurityVerificationService;
  private securityChecks: SecurityCheck = {
    pinAuthentication: false,
    twoFactorAuthentication: false,
    wifiSafetyCheck: false,
    firstActionSuccessful: false,
    navigationMethodSuccessful: false,
  };

  static getInstance(): SecurityVerificationService {
    if (!SecurityVerificationService.instance) {
      SecurityVerificationService.instance = new SecurityVerificationService();
    }
    return SecurityVerificationService.instance;
  }

  // Update security check status based on console logs
  updateSecurityCheck(checkType: keyof SecurityCheck, status: boolean) {
    this.securityChecks[checkType] = status;
    console.log(`🔐 Security Check Updated: ${checkType} = ${status}`);
    console.log(`📊 Current Security State:`, this.securityChecks);
  }

  // Calculate confidence score based on successful checks
  calculateConfidenceScore(): number {
    const weights = {
      pinAuthentication: 30, // High priority
      twoFactorAuthentication: 25, // High priority
      wifiSafetyCheck: 20, // High priority
      firstActionSuccessful: 15, // Medium priority
      navigationMethodSuccessful: 10, // Lower priority
    };

    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const [key, weight] of Object.entries(weights)) {
      maxPossibleScore += weight;
      if (this.securityChecks[key as keyof SecurityCheck]) {
        totalScore += weight;
      }
    }

    const confidencePercentage = (totalScore / maxPossibleScore) * 100;
    console.log(`🎯 Confidence Score: ${confidencePercentage.toFixed(1)}% (${totalScore}/${maxPossibleScore})`);
    
    return confidencePercentage;
  }

  // Check if security verification is needed (if confidence is below threshold)
  needsSecurityVerification(): boolean {
    const confidenceScore = this.calculateConfidenceScore();
    
    // High priority checks - if any of these fail, it's a red flag
    const criticalChecks = [
      this.securityChecks.pinAuthentication,
      this.securityChecks.twoFactorAuthentication,
      this.securityChecks.wifiSafetyCheck
    ];

    const failedCriticalChecks = criticalChecks.filter(check => !check).length;
    
    // If 2 or more critical checks fail, require security verification
    if (failedCriticalChecks >= 2) {
      console.log(`🚨 Security Verification Required: ${failedCriticalChecks} critical checks failed`);
      return true;
    }

    // If overall confidence is below 50%, require verification
    if (confidenceScore < 50) {
      console.log(`🚨 Security Verification Required: Low confidence score ${confidenceScore.toFixed(1)}%`);
      return true;
    }

    console.log(`✅ Security Verification Not Required: Confidence score ${confidenceScore.toFixed(1)}%`);
    return false;
  }

  // Reset all security checks (for new session)
  resetSecurityChecks() {
    this.securityChecks = {
      pinAuthentication: false,
      twoFactorAuthentication: false,
      wifiSafetyCheck: false,
      firstActionSuccessful: false,
      navigationMethodSuccessful: false,
    };
    console.log('🔄 Security checks reset for new session');
  }

  // Get current security status
  getSecurityStatus(): SecurityCheck & { confidenceScore: number } {
    return {
      ...this.securityChecks,
      confidenceScore: this.calculateConfidenceScore(),
    };
  }
}

// Monitor console logs for security check results
class SecurityLogMonitor {
  private securityService: SecurityVerificationService;

  constructor() {
    this.securityService = SecurityVerificationService.getInstance();
    this.initializeLogMonitoring();
  }

  private initializeLogMonitoring() {
    // Override console.log to monitor for security check messages
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      
      // Monitor for security check results
      const message = args.join(' ');
      
      if (message.includes('✅ PIN AUTHENTICATION SUCCESSFUL')) {
        this.securityService.updateSecurityCheck('pinAuthentication', true);
      } else if (message.includes('❌ PIN AUTHENTICATION FAILED')) {
        this.securityService.updateSecurityCheck('pinAuthentication', false);
      }
      
      if (message.includes('✅ TWO-FACTOR AUTHENTICATION SUCCESSFUL')) {
        this.securityService.updateSecurityCheck('twoFactorAuthentication', true);
      } else if (message.includes('❌ TWO-FACTOR AUTHENTICATION FAILED')) {
        this.securityService.updateSecurityCheck('twoFactorAuthentication', false);
      }
      
      if (message.includes('✅ WIFI SAFETY CHECK SUCCESSFUL')) {
        this.securityService.updateSecurityCheck('wifiSafetyCheck', true);
      } else if (message.includes('❌ WIFI SAFETY CHECK FAILED')) {
        this.securityService.updateSecurityCheck('wifiSafetyCheck', false);
      }
      
      if (message.includes('✅ FIRST ACTION SUCCESSFUL')) {
        this.securityService.updateSecurityCheck('firstActionSuccessful', true);
      } else if (message.includes('❌ FIRST ACTION FAILED')) {
        this.securityService.updateSecurityCheck('firstActionSuccessful', false);
      }
      
      if (message.includes('✅ NAVIGATION METHOD SUCCESSFUL')) {
        this.securityService.updateSecurityCheck('navigationMethodSuccessful', true);
      } else if (message.includes('❌ NAVIGATION METHOD FAILED')) {
        this.securityService.updateSecurityCheck('navigationMethodSuccessful', false);
      }
    };
  }
}

// Initialize the log monitor
const logMonitor = new SecurityLogMonitor();

export { SecurityVerificationService, SecurityLogMonitor };
