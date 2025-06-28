const { withAndroidManifest } = require('@expo/config-plugins');

const withSecurityPermissions = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Add necessary permissions
    const permissions = [
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.BATTERY_STATS'
    ];
    
    permissions.forEach(permission => {
      if (!androidManifest.manifest['uses-permission']?.find(p => p.$['android:name'] === permission)) {
        androidManifest.manifest['uses-permission'] = androidManifest.manifest['uses-permission'] || [];
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': permission }
        });
      }
    });
    
    return config;
  });
};

module.exports = withSecurityPermissions;
