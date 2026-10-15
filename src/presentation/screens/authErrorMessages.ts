import { AuthErrorKind } from '../../domain/auth';

export const authErrorMessages: Record<AuthErrorKind, string> = {
  'invalid-email': 'Enter a valid email address.',
  'weak-password': 'Password must be at least 6 characters.',
  'missing-fields': 'All fields are required.',
  'email-already-registered': 'An account with this email already exists.',
  'invalid-credentials': 'Incorrect email or password.',
};