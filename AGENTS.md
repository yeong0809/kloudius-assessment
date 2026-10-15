# AGENTS.md

Conventions for working in this repository. Read this before changing code.

## Project

React Native 0.87.1 (TypeScript) authentication app — Login, Signup, and Home screens
with a React Context auth provider. No backend: credential checks run against local
storage. Structured as **ports and adapters** (hexagonal). See `plans/` for the task
breakdown this app was built from.

## Commands

```sh
npm install                  # dependencies
bundle install               # Ruby/CocoaPods, first clone only
bundle exec pod install      # required after any native dependency change
npm start                    # Metro
npm run ios                  # iOS simulator
npm run android              # Android emulator
npm test                     # Jest
npx tsc --noEmit             # typecheck
npm run lint                 # ESLint
```

Changing a native dependency without re-running `pod install` is the most common cause of
a build failure here. `pod install` is required after adding or upgrading
`react-native-screens`, `react-native-keychain`, `@react-native-async-storage/async-storage`,
or any other module with native code.

## Architecture — dependencies point inward

```
infrastructure ──► application ──► domain ◄── presentation
```

| Layer | Contains | May import |
|---|---|---|
| `domain` | value objects, `User`, `AuthError`, repository interfaces | **nothing** |
| `application` | use cases (`SignUp`, `LogIn`, …) | domain |
| `infrastructure` | Keychain / AsyncStorage / SHA-256 adapters | domain |
| `presentation` | screens, components, navigation, `AuthContext` | application, domain |

```
src/
  domain/auth/       EmailAddress, PasswordHash, User, AuthError, repositories (ports)
  application/auth/  SignUp, LogIn, LogOut, RestoreSession, AuthService
  infrastructure/    keychain/, storage/, hashing/, memory/, createAuthService.ts
  presentation/      components/, screens/, navigation/, context/, theme/
```

**The domain imports nothing from this project.** No React, no React Native, no Keychain, no
AsyncStorage. If a domain file needs a type from outside `domain`, that type probably
belongs in the domain. This is what makes the auth logic testable with no simulator and no
native mocks — do not erode it.

Keep concrete construction in the composition root (`createAuthService.ts`). That is the
one place that knows the adapters; `AuthContext` and the use cases must not import from
`infrastructure`.

## Conventions

### The domain speaks in error kinds, not UI strings

Use cases return `{ kind: 'invalid-credentials' }`; screens map `kind` → copy via
`authErrorMessages`. A domain file must not contain user-facing text. `invalid-credentials`
is a single kind covering both unknown-email and wrong-password — splitting them would leak
which emails have accounts.

### Value objects validate themselves

`EmailAddress.create()` is the only way to construct one — it validates and normalizes to
lowercase. That normalization is why `Alice@Example.com` and `alice@example.com` cannot
become two accounts. Never accept a raw `string` where an `EmailAddress` is intended;
repository ports take the value object so a use case cannot pass an unnormalized address.

### Never store or compare a plaintext password

Hash with a per-user salt via the `PasswordHasher` port. The seam is
`Sha256PasswordHasher` — swapping to argon2/bcrypt means writing one new adapter and
changing one line in the composition root.

### Components are compounds, not config props

Each component is a namespace of small parts sharing state through **one private context**,
built with `Object.assign(Root, { Part })`. Parts read the same state, so derived UI (an
error border and its error text) cannot disagree. To add a part, extend the namespace —
not with another boolean prop on the root.

```tsx
<Field>
  <Field.Label>Email</Field.Label>
  <Field.Input value={email} onChangeText={setEmail} error={errors.email} />
  <Field.Error>{errors.email}</Field.Error>
</Field>
```

### Auth state drives navigation

`RootNavigator` renders Login/Signup when `user` is null and Home when it is set. Do not add
imperative navigation to the auth flow — `logout()` clears the user and Login appears
because the stack swapped. This also keeps signed-in users off the auth screens, since they
are not in the stack while authenticated. `AuthProvider` stays **outside** the navigator.

### Test doubles are real implementations

`src/infrastructure/memory/` holds in-memory repositories that satisfy the ports, used by
tests and by anyone demonstrating the architecture. Prefer them over `jest.mock`. If a
domain or application test needs a mock, that is a signal a dependency is not being
injected.

## Known limitations

Stated so they are not rediscovered in review, and mirrored in the README:

- SHA-256 is not memory-hard and does not resist offline brute force of a leaked store.
  The store is device-local, which is what makes it acceptable here. Production would use
  argon2id or bcrypt with a server-held salt.
- Salts are generated with `Math.random`, which is not a CSPRNG.
- `verify` compares hashes non-constant-time — acceptable against a device-local store.
- With no backend, the credential store is only as private as the device.
- Keep the DDD thin. If the domain grows ceremony the app does not need (aggregates, domain
  events, extra factories), simplify back — the ports are the part worth keeping.