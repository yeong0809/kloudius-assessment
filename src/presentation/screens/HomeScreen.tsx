import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

export function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}>
      {/* Scrollable so the Logout button stays reachable when a software keyboard is
          open on a short device. */}
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.greeting}>Welcome</Text>
          <Text style={styles.name} testID="home-name">
            {user?.name}
          </Text>
          <Text style={styles.email} testID="home-email">
            {user?.email}
          </Text>
        </View>

        <Button testID="logout-button" variant="secondary" onPress={logout}>
          <Button.Label>Logout</Button.Label>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  email: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});