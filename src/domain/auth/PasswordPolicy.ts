export const MIN_PASSWORD_LENGTH = 6;

export function validatePassword(raw: string): { valid: boolean; error?: string } {
  if (raw.length === 0) {
    return { valid: false, error: 'Password is required.' };
  }
  if (raw.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  return { valid: true };
}