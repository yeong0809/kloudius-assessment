# Implementation plan

Broken-down tasks for a React Native authentication app, structured as **ports and
adapters** (hexagonal). Each file is independently executable and states its own
verification step. Work through them in order — later tasks depend on the contracts
earlier ones define.

| # | Task | Scope |
|---|---|---|
| 1 | [Foundation](01-foundation.md) | dependencies, `pod install`, theme tokens |
| 2 | [Domain](02-domain.md) | value objects, errors, entity, repository ports |
| 3 | [Application](03-application.md) | `SignUp`, `LogIn`, `LogOut`, `RestoreSession` |
| 4 | [Infrastructure](04-infrastructure.md) | Keychain / AsyncStorage / hashing adapters |
| 5 | [Components](05-components.md) | `Field`, `PasswordInput`, `Button` compounds |
| 6 | [Screens & Navigation](06-screens-navigation.md) | three screens, `RootNavigator`, composition root |
| 7 | [Tests & README](07-tests-readme.md) | in-memory test doubles and documentation |
| 8 | [Run & Verify](08-run-and-verify.md) | simulator pass-through and screenshots |

## The dependency rule

```
infrastructure ──► application ──► domain ◄── presentation
                                        ▲
                          (domain knows nothing
                           above or below)
```

**Dependencies point inward.** The domain layer imports nothing — not React, not React
Native, not Keychain, not AsyncStorage. That is the whole point: the login rules are
testable as plain TypeScript with no simulator, no native modules, and no mocks.

The domain declares *what* it needs (repository interfaces); infrastructure supplies it.
Swapping the Keychain for an API later means writing one new adapter and changing one
line in the composition root.

## Layer responsibilities

| Layer | Contains | May import |
|---|---|---|
| `domain` | value objects, `User`, error types, repository interfaces | nothing |
| `application` | use cases, each injected with its repositories | domain |
| `infrastructure` | Keychain / AsyncStorage / SHA-256 adapters | domain |
| `presentation` | screens, components, navigation, `AuthContext` | application, domain |

## Why this structure, and why only this much of it

A mobile client's domain is genuinely small: input validation, session state, and auth
transitions. The rules worth centralising — is this password correct, is this email taken —
belong on a server that does not exist yet. So the correct target here is **thin**, and the
question is which parts earn their keep.

Three properties are subtle enough that scattering them across screens is how they get
bought wrong, and the domain layer makes each structurally guaranteed:

1. **`EmailAddress.create()` is the only constructor.** It validates and normalizes to
   lowercase, so `Alice@Example.com` and `alice@example.com` cannot become two accounts.
   Handled in three call sites instead of one, it drifts — and a duplicate-account bug is
   invisible until it ships.
2. **`invalid-credentials` is one error kind**, covering both unknown-email and
   wrong-password. Splitting them would let the app reveal which addresses are registered.
3. **Ports make the logic testable without a device.** The domain and application tests run
   as plain TypeScript — no simulator, no Keychain mock, no Metro. That is the concrete
   payoff, and it is what the ports are really for.

Beyond that the justification runs out. Aggregates, domain events, and factory hierarchies
would be modelling a domain that is not here yet — so if the domain layer grows that
ceremony, the signal is to simplify back, not to lean in. The ports are the part worth
keeping either way.

**Revisit when the evidence changes**, not before:

- A backend exists → the real business rules move there, and DDD becomes considerably more
  valuable than it is here
- A second app needs the same auth → promote `src/` into `packages/auth/` with a published
  `index.ts`. That is the moment a package boundary starts paying for itself
- Offline-first sync lands → conflict resolution and sync state genuinely add domain
  complexity, and a deeper model becomes justified

## Context: how this maps to the assignment

The assignment requires a `login` / `signup` / `logout` / `user` context. That
requirement is met — but the context becomes a **presentation-layer adapter** rather than
the place where the rules live. It holds React state and calls use cases:

```tsx
const { user, login, signup, logout } = useAuth();
//         └──── React state, set from use case results
//                └──── delegates to SignUp / LogIn / LogOut
```

`AuthContext` exposes exactly the four members the assignment names (plus `isLoading`).
Everything behind it is swappable and independently testable.

## Conventions

**Components are compounds, not config props.** Each is a namespace of small parts
sharing state through one private context.

```tsx
<Field>
  <Field.Label>Email</Field.Label>
  <Field.Input value={email} onChangeText={setEmail} />
  <Field.Error>{errors.email}</Field.Error>
</Field>
```

**The domain speaks in error kinds, not UI strings.** A use case returns
`{ kind: 'invalid-credentials' }`; the screen maps that to "Incorrect email or password".
Adding a language or changing the copy never touches a use case.

**Auth state drives navigation.** `RootNavigator` renders Login/Signup when `user` is null
and Home when it is set. No imperative navigation in the auth flow — `logout()` clears the
user and Login appears because the stack swapped.

**Test doubles live in tests, not production.** In-memory repositories satisfy the domain
interfaces, so no test needs a native mock.

## Current state

Dependencies from Task 1 are installed in `package.json`, but `pod install` has not been
run and no `src/` code exists yet.

## Honest caveats

Called out here so they end up in the README rather than being discovered in review:

- SHA-256 is not memory-hard, so it does not resist offline brute force of a leaked
  store. It is the right shape here — hash plus per-user salt, never plaintext — and the
  store is device-local. Production would use argon2id or bcrypt with a server-held salt.
- Salt generation uses `Math.random`, which is not a CSPRNG.
- There is no backend, so credential checks are against local storage. Anyone with the
  device and the Keychain contents can read the credential store.
- DDD earns its keep only if it stays thin. If the domain layer grows ceremony the app
  does not need — aggregates, domain events, factories beyond the value objects — that
  is the signal to simplify back. The ports are worth keeping either way.