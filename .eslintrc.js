module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['jest.setup.js', 'jest.setupAfterEnv.js', '__tests__/**/*', 'e2e/**/*'],
      env: { jest: true },
    },
  ],
};