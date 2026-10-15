# Task 2 — Domain layer: value objects, errors, and ports

Goal: the rules that define what a valid email, password, and user are — with zero
imports from the outside world. Everything after this task depends on these types, so get
the shape right before writing much else.

## Files

All under `src/domain/auth/`:

- `EmailAddress.ts`
- `PasswordHash.ts`
- `PasswordPolicy.ts`
- `AuthError.ts`
- `User.ts`
- `PasswordHasher.ts`
- `repositories.ts`

This layer imports **nothing** from the project — no React, no React Native, no Keychain,
no AsyncStorage. That is what makes it testable without a simulator.

## EmailAddress.ts — value object

```ts
export class EmailAddress {
  private constructor(readonly value: string) {}

  static create(raw: string): EmailAddress | null {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) return null;
    return new EmailAddress(normalized);
  }

  equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }

  toString(): string { return this.value; }
}
```

The private constructor is the point: the only way to get one is `create`, which validates
and normalizes. A value object that exists is a valid one. Normalizing to lowercase here
means `Alice@Example.com` and `alice@example.com` cannot become two accounts — that
concern lives in exactly one place instead of being remembered at every call site.

`EMAIL_PATTERN` lives here, in the module that uses it. Not a shared `utils/validation.ts`
— the rule belongs to the value it constrains.

## PasswordPolicy.ts

```ts
export const MIN_PASSWORD_LENGTH = 6;
export function validatePassword(raw: string): { valid: boolean; error?: string };
```

Length only. The assignment asks for six characters; do not invent complexity rules it
did not request. Returning `{ valid, error }` rather than a bare boolean because the caller
needs the reason to show inline.

## PasswordHash.ts — value object

```ts
export class PasswordHash {
  private constructor(readonly salt: string, readonly hash: string) {}
  static create(salt: string, hash: string): PasswordHash;
}
```

There is deliberately no method to recover the password and no `equals` comparing against
a plaintext password — `PasswordHasher.verify` owns comparison. Nothing outside this file
needs to know the hash's shape, which is what lets the hashing algorithm change later
without touching callers.

## AuthError.ts — error kinds, not messages

```ts
export type AuthErrorKind =
  | 'invalid-email'
  | 'weak-password'
  | 'missing-fields'
  | 'email-already-registered'
  | 'invalid-credentials';

export type AuthFailure = { ok: false; error: { kind: AuthErrorKind; field?: string } };
export type AuthResult<T> = { ok: true; value: T } | AuthFailure;
```

The domain does not know the word "Incorrect email or password" — that is presentation
copy. A use case reports `kind: 'invalid-credentials'`; `LoginScreen` decides what to
display. Changing the wording, or translating the app, then requires no change to a single
use case.

Note `invalid-credentials` is one kind covering both unknown-email and wrong-password. If
these were separate kinds the UI would leak which addresses are registered.

## User.ts — entity

```ts
export class User {
  readonly id: string;        // crypto.randomUUID()
  readonly email: EmailAddress;
  name: string;

  private constructor(id, email, name) { … }
  static create(email: EmailAddress, name: string): User;
  toProfile(): { id: string; name: string; email: string };
}
```

`name` is mutable — users correct their name; their identity does not change. `toProfile`
converts to a plain object for storage and for the presentation layer, so nothing outside
the domain handles an `EmailAddress` instance directly.

## repositories.ts — the ports

```ts
export interface UserRepository {
  findByEmail(email: EmailAddress): Promise<User | null>;
  save(user: User): Promise<void>;
}

export interface CredentialRepository {
  find(email: EmailAddress): Promise<PasswordHash | null>;
  save(email: EmailAddress, credential: PasswordHash): Promise<void>;
}

export interface SessionRepository {
  read(): Promise<string | null>;   // the signed-in email
  write(email: string): Promise<void>;
  clear(): Promise<void>;
}
```

These are the seams. Task 4 implements them against Keychain and AsyncStorage; Task 7
implements them in memory for tests. Neither the use cases nor the screens change when the
storage behind them does.

Interfaces take `EmailAddress`, not `string` — a use case cannot accidentally look up an
unnormalized address, because the type system will not let it.

## PasswordHasher.ts — a port too

```ts
export interface PasswordHasher {
  hash(password: string, salt: string): string;
  generateSalt(): string;
  verify(password: string, stored: PasswordHash): boolean;
}
```

Hashing is an external concern (SHA-256 today, argon2 tomorrow), so it is injected like
any other dependency rather than imported into a use case.

## Verification

`npx tsc --noEmit`. Then write `__tests__/domain.test.ts` covering:

- `EmailAddress.create` accepts normal addresses, rejects `alice@`, `no-at-sign`,
  `a@b`; lowercases and trims; two differently-cased inputs are `.equals()`
- `validatePassword` rejects 5 characters, accepts exactly 6
- `User.create` normalises and generates an id

No native mocks and no simulator required — that is the testability payoff of the
inward rule, and this is the task where you should feel it.