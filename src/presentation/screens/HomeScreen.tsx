import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

export function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.greeting}>Welcome</Text>
        <Text style={styles.name} testID="home-name">
          {user?.name}
        </Text>
        <Text style={styles.email} testID="home-email">
          {user?.email}
        </Text>
      </View>

      <Button variant="secondary" onPress={logout}>
        <Button.Label>Logout</Button.Label>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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