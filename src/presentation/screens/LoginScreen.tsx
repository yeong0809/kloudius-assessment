import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Field } from '../components/Field';
import { PasswordInput } from '../components/PasswordInput';
import { Button } from '../components/Button';
import { authErrorMessages } from './authErrorMessages';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type FieldErrors = Partial<Record<'email' | 'password', string>>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const local: FieldErrors = {};
    if (!email.trim()) {
      local.email = authErrorMessages['missing-fields'];
    }
    if (!password) {
      local.password = authErrorMessages['missing-fields'];
    }
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }

    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (!result.ok) {
        setErrors(result.errors as FieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <Field error={errors.email}>
          <Field.Label>Email</Field.Label>
          <Field.Input
            testID="login-email"
            value={email}
            onChangeText={text => {
              setEmail(text);
              setErrors(previous => ({ ...previous, email: undefined }));
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Field.Error />
        </Field>

        <PasswordInput
          testID="login-password"
          value={password}
          error={errors.password}
          placeholder="Your password"
          onChangeText={text => {
            setPassword(text);
            setErrors(previous => ({ ...previous, password: undefined }));
          }}>
          <PasswordInput.Toggle />
        </PasswordInput>

        <Button loading={submitting} onPress={handleSubmit}>
          <Button.Label>Login</Button.Label>
        </Button>

        <Button variant="secondary" onPress={() => navigation.navigate('Signup')}>
          <Button.Label>Go to Signup</Button.Label>
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
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});