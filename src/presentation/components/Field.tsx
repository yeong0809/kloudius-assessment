import React, { createContext, useContext, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

interface FieldState {
  error?: string;
}

const FieldContext = createContext<FieldState>({});

export function useFieldState(): FieldState {
  return useContext(FieldContext);
}

interface FieldRootProps {
  children: React.ReactNode;
  error?: string;
  style?: StyleProp<ViewStyle>;
}

function FieldRoot({ children, error, style }: FieldRootProps) {
  const value = useMemo(() => ({ error }), [error]);
  return (
    <FieldContext.Provider value={value}>
      <View style={[styles.field, style]}>{children}</View>
    </FieldContext.Provider>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

function FieldInput({ style, ...props }: TextInputProps) {
  const { error } = useFieldState();
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={[styles.input, error ? styles.inputInvalid : null, style]}
      {...props}
    />
  );
}

function FieldError({ children }: { children?: React.ReactNode }) {
  const { error } = useFieldState();
  if (!error) {
    return null;
  }
  return <Text style={styles.error}>{children ?? error}</Text>;
}

export const Field = Object.assign(FieldRoot, {
  Label: FieldLabel,
  Input: FieldInput,
  Error: FieldError,
});

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
  },
  inputInvalid: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSurface,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: spacing.xs,
  },
});