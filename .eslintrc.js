module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['jest.setup.js', '__tests__/**/*', 'e2e/**/*'],
      env: { jest: true },
    },
  ],
};