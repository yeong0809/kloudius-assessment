import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/presentation/context/AuthContext';
import { RootNavigator } from './src/presentation/navigation/RootNavigator';
import { createAuthService } from './src/infrastructure/createAuthService';

function App() {
  // The composition root. This is the only place outside infrastructure that names a
  // concrete adapter, and it hands the wired service down as a prop — useState rather
  // than a module constant so the service is built once per app mount.
  const [authService] = useState(createAuthService);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {/* AuthProvider must sit outside the navigator — it reads auth state to decide
          which screens exist. */}
      <AuthProvider service={authService}>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;