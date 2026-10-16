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

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

type FieldErrors = Partial<Record<'name' | 'email' | 'password', string>>;

export function SignupScreen({ navigation }: Props) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const local: FieldErrors = {};
    const required = authErrorMessages['missing-fields'];
    if (!name.trim() || !email.trim() || !password) {
      if (!name.trim()) {
        local.name = required;
      }
      if (!email.trim()) {
        local.email = required;
      }
      if (!password) {
        local.password = required;
      }
      setErrors(local);
      return;
    }

    setSubmitting(true);
    try {
      const result = await signup(name, email, password);
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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>It only takes a moment</Text>
        </View>

        <Field error={errors.name}>
          <Field.Label>Name</Field.Label>
          <Field.Input
            testID="signup-name"
            value={name}
            onChangeText={text => {
              setName(text);
              setErrors(previous => ({ ...previous, name: undefined }));
            }}
            placeholder="Your name"
            autoCapitalize="words"
          />
          <Field.Error />
        </Field>

        <Field error={errors.email}>
          <Field.Label>Email</Field.Label>
          <Field.Input
            testID="signup-email"
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
          testID="signup-password"
          value={password}
          error={errors.password}
          placeholder="At least 6 characters"
          onChangeText={text => {
            setPassword(text);
            setErrors(previous => ({ ...previous, password: undefined }));
          }}>
          <PasswordInput.Toggle />
        </PasswordInput>

        <Button loading={submitting} onPress={handleSubmit}>
          <Button.Label>Signup</Button.Label>
        </Button>

        <Button variant="secondary" onPress={() => navigation.goBack()}>
          <Button.Label>Go to Login</Button.Label>
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