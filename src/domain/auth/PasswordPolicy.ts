export const MIN_PASSWORD_LENGTH = 6;

// Returns the failure kind a password maps to, or null when it is acceptable. The domain
// names the problem and stops there; authErrorMessages owns the wording.
export function validatePassword(raw: string): 'missing-fields' | 'weak-password' | null {
  if (raw.length === 0) {
    return 'missing-fields';
  }
  if (raw.length < MIN_PASSWORD_LENGTH) {
    return 'weak-password';
  }
  return null;
}