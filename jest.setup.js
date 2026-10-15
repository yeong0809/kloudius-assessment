global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);

// An in-memory store rather than canned constants: a mock that ignored writes would let
// a test pass while the real app lost every credential.
jest.mock('react-native-keychain', () => {
  const store = new Map();

  return {
    setGenericPassword: jest.fn(async (username, password, options) => {
      store.set(options?.service ?? 'default', { username, password });
      return { service: options?.service ?? 'default', storage: 'keychain' };
    }),
    getGenericPassword: jest.fn(async options => {
      const entry = store.get(options?.service ?? 'default');
      return entry ?? false;
    }),
    resetGenericPassword: jest.fn(async options => {
      store.delete(options?.service ?? 'default');
      return true;
    }),
    getAllGenericPasswordServices: jest.fn(async () => Array.from(store.keys())),
  };
});