# Task 3 — Application layer: use cases

Goal: the actual auth operations, each a small class with its dependencies injected. This
is where the flow lives — and it is still free of React, React Native, and every storage
library.

## Files

- `src/application/auth/AuthService.ts`
- `src/application/auth/SignUp.ts`
- `src/application/auth/LogIn.ts`
- `src/application/auth/LogOut.ts`
- `src/application/auth/RestoreSession.ts`

## Shape

One class per use case, dependencies passed to the constructor. Not exported functions
with five parameters — the constructor makes the dependency list explicit and makes each
use case trivially constructible with test doubles.

```ts
export class SignUp {
  constructor(
    private readonly users: UserRepository,
    private readonly credentials: CredentialRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: { name: string; email: string; password: string }): Promise<AuthResult<User>>;
}
```

`private readonly` parameter properties keep each class to a handful of lines with no
boilerplate field declarations.

## SignUp

1. `EmailAddress.create(input.email)` → null → `{ kind: 'invalid-email', field: 'email' }`
2. `validatePassword` fails → `{ kind: 'weak-password', field: 'password' }`
3. Blank name or password → `{ kind: 'missing-fields', field: … }`
4. `users.findByEmail` hit → `{ kind: 'email-already-registered', field: 'email' }`
5. Otherwise `hasher.generateSalt()` → `hasher.hash(password, salt)` →
   `PasswordHash.create(salt, hash)` → `users.save` + `credentials.save` → `sessions.write`
   → `{ ok: true, value: user }`

Check missing fields **before** constructing an `EmailAddress`, otherwise a blank email
reports "invalid format" when the real problem is that the field is empty. The distinction
matters for the inline errors.

Signup writes a session, so it signs the user straight in. That is the expected behaviour
and saves a pointless trip through Login.

## LogIn

1. Malformed email → `{ kind: 'invalid-email', field: 'email' }`
2. `users.findByEmail` miss, `credentials.find` miss, or `hasher.verify` false → **all**
   return `{ kind: 'invalid-credentials' }`
3. Success → `sessions.write` → `{ ok: true, value: user }`

One error kind for all three failure modes, with no `field`. An attacker who can tell
"no such user" from "wrong password" can enumerate which addresses have accounts.

## LogOut

`sessions.clear()`, then `{ ok: true, value: null }`. No navigation — the navigator reacts
to the null user (Task 6).

## RestoreSession

Runs once on mount. `sessions.read()` → null means stay signed out. Otherwise
`users.findByEmail` — and if that returns null, `sessions.clear()` and stay signed out,
because a dangling session email would otherwise render a Home screen for a user who does
not exist.

## AuthService — the façade

```ts
export class AuthService {
  constructor(deps: { users; credentials; sessions; hasher }) { … }
  signUp(input)  { return this.signUp.execute(input); }
  logIn(input)   { return this.logIn.execute(input); }
  logOut()       { return this.logOut.execute(); }
  restore()      { return this.restoreSession.execute(); }
}
```

One object the presentation layer depends on instead of four. It is deliberately thin — if
it starts growing logic of its own, that logic belongs in a use case.

## Verification

`npx tsc --noEmit`, then behavioural tests in Task 7 — which can now build a `SignUp` with
in-memory repositories and a stub hasher and assert on the returned `kind`, with no native
module and no React in sight.