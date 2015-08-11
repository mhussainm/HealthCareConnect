
App.accessRule('*');

App.icons({
  'android_ldpi': 'resources/icons/icon-36x36.png',
  'android_mdpi': 'resources/icons/icon-48x48.png',
  'android_tvdpi': 'resources/icons/icon-64x64.png',  
  'android_hdpi': 'resources/icons/icon-72x72.png',
  'android_xhdpi': 'resources/icons/icon-96x96.png',
  'android_xxhdpi': 'resources/icons/icon-144x144.png',
  'android_xxxhdpi': 'resources/icons/icon-192x192.png'  
});

App.launchScreens({
  'android_ldpi_portrait': 'resources/splash/splash-200x320.png',
  'android_mdpi_portrait': 'resources/splash/splash-320x480.png',
  'android_hdpi_portrait': 'resources/splash/splash-480x800.png',
  'android_xhdpi_portrait': 'resources/splash/splash-640x960.png',
  'android_xhdpi_portrait': 'resources/splash/splash-960x1600.png',
  'android_xhdpi_portrait': 'resources/splash/splash-1280x1960.png'    
});

App.setPreference('orientation','portrait');