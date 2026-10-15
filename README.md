# User Authentication App

A React Native app with Login, Signup, and Home screens, built around a React Context
authentication provider. Passwords are salted and SHA-256 hashed before they are stored,
and the sensitive values live in the iOS Keychain / Android Keystore rather than in plain
storage.

There is no backend — credential checks run against local storage. That makes the app
self-contained and runnable without a server, and it is what the assignment calls for.

## Screens

| Login | Signup | Home |
|---|---|---|
| Email and password, inline errors | Name, email, password | The signed-in user's name and email |
| Errors for malformed email and bad credentials | Errors for missing fields, malformed email, short password | Logout returns to Login |

The eye icon on both auth screens toggles password visibility (the assignment's bonus
task).

## Features, mapped to the assignment

| Requirement | Where |
|---|---|
| 1. Auth context with `login`, `signup`, `logout`, `user` | [`src/presentation/context/AuthContext.tsx`](src/presentation/context/AuthContext.tsx) |
| 2. Login, Signup, and Home screens | [`src/presentation/screens/`](src/presentation/screens/) |
| 3. Persist authentication | [`src/infrastructure/`](src/infrastructure/) — AsyncStorage + Keychain |
| 4. React Navigation | [`src/presentation/navigation/RootNavigator.tsx`](src/presentation/navigation/RootNavigator.tsx) |
| 5. Styled UI, inputs, buttons, error messages | [`src/presentation/components/`](src/presentation/components/) |
| Bonus: password visibility toggle | [`src/presentation/components/PasswordInput.tsx`](src/presentation/components/PasswordInput.tsx) |

The context exposes exactly the four members the assignment names, plus `isLoading` while
the saved session is being restored on launch.

## Getting started

Prerequisites: follow the React Native
[environment setup guide](https://reactnative.dev/docs/set-up-your-environment) first —
Xcode and CocoaPods on macOS, or Android Studio on other platforms.

```sh
npm install
bundle install          # Ruby/CocoaPods, first clone only
bundle exec pod install # required after any native dependency change
```

Then, in one terminal:

```sh
npm start
```

And in another:

```sh
npm run ios       # or: npm run android
```

`pod install` must be re-run whenever a package with native code is added or upgraded —
this project uses `react-native-screens`, `react-native-keychain`, and AsyncStorage. A
build that fails to link them is almost always a missing `pod install`.

### If the iOS build fails

Both issues below are already handled in [`ios/Podfile`](ios/Podfile); they are listed here
because the errors are cryptic and the fixes are easy to undo by accident.

- **`Unicode Normalization not appropriate for ASCII-8BIT`** from `pod install` — the
  shell's locale is not UTF-8. Prefix the command:
  `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 bundle exec pod install`
- **`/scripts/xcode/with-environment.sh: No such file or directory`** — CocoaPods 1.15
  does not propagate `REACT_NATIVE_PATH` to every pod, but React Native's script phases
  need it. The `post_install` hook sets it on all targets.

## Architecture

The app is structured as **ports and adapters**, with dependencies pointing inward:

```
infrastructure ──► application ──► domain ◄── presentation
```

```
src/
  domain/auth/       EmailAddress, PasswordHash, User, AuthError, repository interfaces
  application/auth/  SignUp, LogIn, LogOut, RestoreSession, AuthService
  infrastructure/    keychain/, storage/, hashing/, memory/, createAuthService.ts
  presentation/      components/, screens/, navigation/, context/, theme/
```

**The domain layer imports nothing** — no React, no React Native, no Keychain. It holds
the rules: what a valid email is, how long a password must be, and which failures exist.
That is what lets the auth logic be tested as plain TypeScript with no simulator and no
native mocks.

Three things the domain layer makes structurally guaranteed:

- **`EmailAddress.create()` is the only way to build one.** It validates and normalizes to
  lowercase, so `Alice@Example.com` and `alice@example.com` cannot become two accounts.
- **`invalid-credentials` is one failure kind** covering both unknown-email and
  wrong-password. Splitting them would let the app reveal which addresses are registered.
- **The domain reports failure *kinds*, not sentences.** A screen maps the kind to
  user-facing copy, so changing the wording never touches a use case.

`AuthContext` holds React state and delegates to the `AuthService` use cases — it is the
assignment's context, implemented as a presentation adapter rather than as the place the
rules live.

**Auth state drives navigation.** `RootNavigator` renders Login/Signup when there is no
user and Home when there is, so `logout()` returns to Login with no navigation call. It
also keeps a signed-in user from reaching the auth screens by swiping back.

Swapping the local store for a real API means writing three classes that implement the
existing repository interfaces and changing one line in
[`createAuthService.ts`](src/infrastructure/createAuthService.ts). No screen or use case
changes.

## Storage design

| Data | Stored in | Why |
|---|---|---|
| User profiles (id, name, email) | AsyncStorage | Non-secret; a plain JSON directory |
| Password salt and hash | Keychain / Keystore | Secret material |
| Active session (email) | Keychain / Keystore | The security-sensitive read on launch |

Passwords are never stored or compared in plaintext. Signup generates a per-user salt and
stores `sha256(salt + ":" + password)`; login recomputes and compares.

## Known limitations

Worth stating plainly rather than leaving to be discovered:

- **SHA-256 is not memory-hard.** It does not resist offline brute force of a leaked
  store. It is acceptable here because the store is device-local, but a production system
  would use argon2id or bcrypt with a server-held salt.
- **Salts are generated with `Math.random`**, which is not a cryptographically secure
  random source.
- **`verify` compares hashes in non-constant time.** Negligible against a device-local
  store, worth knowing if this moved server-side.
- **There is no backend**, so anyone with the device and Keychain access can read the
  credential store. There is also no email verification, password reset, or rate limiting
  on login attempts.

## Tests

```sh
npm test
```

Three suites, 28 tests:

- `__tests__/domain.test.ts` — email validation and normalization, password policy, `User`
- `__tests__/application.test.ts` — the use cases, against in-memory repositories
- `__tests__/App.test.tsx` — a full signup → logout → login round trip through the real
  screens and navigator

The domain and application suites need no mocks at all.
[`src/infrastructure/memory/`](src/infrastructure/memory/) holds real working
implementations of the repository interfaces, which is also the proof that the domain
depends on interfaces rather than on storage.

Other checks:

```sh
npx tsc --noEmit
npm run lint
```

## Implementation notes

The task-by-task breakdown this app was built from is in [`plans/`](plans/), and
[`AGENTS.md`](AGENTS.md) documents the conventions to follow when changing it.