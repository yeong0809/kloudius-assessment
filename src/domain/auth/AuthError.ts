export type AuthErrorKind =
  | 'invalid-email'
  | 'weak-password'
  | 'missing-fields'
  | 'email-already-registered'
  | 'invalid-credentials';

export interface FieldRef {
  field: 'name' | 'email' | 'password';
}

export type AuthFailure = {
  ok: false;
  error: { kind: AuthErrorKind } & Partial<FieldRef>;
};

export type AuthResult<T> = { ok: true; value: T } | AuthFailure;

export function failure(kind: AuthErrorKind, field?: FieldRef['field']): AuthFailure {
  return field ? { ok: false, error: { kind, field } } : { ok: false, error: { kind } };
}