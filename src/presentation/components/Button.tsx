import React, { createContext, useContext, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

interface ButtonContextValue {
  loading: boolean;
  variant: Variant;
}

type Variant = 'primary' | 'secondary';

const ButtonContext = createContext<ButtonContextValue>({
  loading: false,
  variant: 'primary',
});

interface ButtonRootProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
}

function ButtonRoot({ children, onPress, variant = 'primary', loading = false }: ButtonRootProps) {
  const value = useMemo(() => ({ loading, variant }), [loading, variant]);
  const isPrimary = variant === 'primary';

  return (
    <ButtonContext.Provider value={value}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: loading }}
        disabled={loading}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          isPrimary ? styles.primary : styles.secondary,
          pressed && !loading ? (isPrimary ? styles.primaryPressed : styles.secondaryPressed) : null,
          loading ? styles.disabled : null,
        ]}>
        <View style={styles.content}>{children}</View>
      </Pressable>
    </ButtonContext.Provider>
  );
}

function ButtonLabel({ children }: { children: React.ReactNode }) {
  const { loading, variant } = useContext(ButtonContext);
  if (loading) {
    return (
      <ActivityIndicator
        color={variant === 'primary' ? colors.surface : colors.primary}
        size="small"
      />
    );
  }
  return <Text style={[styles.label, variant === 'secondary' ? styles.labelSecondary : null]}>{children}</Text>;
}

export const Button = Object.assign(ButtonRoot, {
  Label: ButtonLabel,
});

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    minHeight: 20,
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryPressed: {
    backgroundColor: colors.background,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  labelSecondary: {
    color: colors.primary,
  },
});