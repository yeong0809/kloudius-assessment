/** @type {import('detox').DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 300000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Debug-iphonesimulator/assessment.app',
      build:
        'LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 xcodebuild -workspace ios/assessment.xcworkspace -scheme assessment -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Release-iphonesimulator/assessment.app',
      build:
        'LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 xcodebuild -workspace ios/assessment.xcworkspace -scheme assessment -configuration Release -sdk iphonesimulator -derivedDataPath ios/build build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 17',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        avdName: 'Pixel_API_34',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug',
    },
  },
};
