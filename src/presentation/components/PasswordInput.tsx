import React, { createContext, useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Field } from './Field';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface PasswordInputState {
  hidden: boolean;
  toggle: () => void;
}

const PasswordInputContext = createContext<PasswordInputState>({
  hidden: true,
  toggle: () => {},
});

interface PasswordInputRootProps {
  children?: React.ReactNode;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  testID?: string;
}

function PasswordInputRoot({
  children,
  error,
  value,
  onChangeText,
  placeholder,
  testID,
}: PasswordInputRootProps) {
  const [hidden, setHidden] = useState(true);
  const state = useMemo(
    () => ({ hidden, toggle: () => setHidden(previous => !previous) }),
    [hidden],
  );

  return (
    <PasswordInputContext.Provider value={state}>
      <Field error={error}>
        <Field.Input
          testID={testID}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={hidden}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
        />
        {children}
        <Field.Error />
      </Field>
    </PasswordInputContext.Provider>
  );
}

function ToggleButton() {
  const { hidden, toggle } = useContext(PasswordInputContext);
  return (
    <Pressable
      accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
      accessibilityRole="button"
      onPress={toggle}
      style={styles.toggle}
      testID="password-toggle">
      <Text style={styles.toggleLabel}>{hidden ? '👁' : '🙈'}</Text>
    </Pressable>
  );
}

export const PasswordInput = Object.assign(PasswordInputRoot, {
  Toggle: ToggleButton,
});

const styles = StyleSheet.create({
  input: {
    paddingRight: 44,
  },
  toggle: {
    position: 'absolute',
    right: spacing.sm,
    top: 14,
    padding: spacing.xs,
  },
  toggleLabel: {
    fontSize: 17,
    color: colors.textMuted,
  },
});