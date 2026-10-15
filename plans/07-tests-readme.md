# Task 7 — Tests & README

Goal: prove the domain, use cases, and wiring work — and replace the stock template
README with real documentation.

## The payoff

Because the domain and application layers import nothing external, most tests need **no
mocks at all**. `InMemoryRepositories` (Task 4) are real working implementations of the
ports, so tests construct a `SignUp` with them and assert on returned error `kind`s. No
simulator, no native module mocking, no `jest.mock` of Keychain.

## Files

- `__tests__/domain.test.ts` — value objects and rules
- `__tests__/application.test.ts` — use cases against in-memory repositories
- `__tests__/App.test.tsx` — mounts the tree, exercises a signup→logout→login round trip
- `README.md` (rewritten)

`jest.config.js` needs a setup file only for the React render tests. The domain and
application suites need nothing.

## domain.test.ts

- `EmailAddress.create` — accepts normal addresses; rejects `alice@`, `no-at-sign`,
  `a@b`; lowercases and trims; two differently-cased inputs are `.equals()`
- `validatePassword` — 5 chars rejects, exactly 6 accepts, 20 accepts
- `User.create` — normalises email, generates an id

## application.test.ts

Drive the use cases against `InMemoryRepositories` and a stub hasher. Cover:

1. `SignUp` creates a user and writes a session
2. `SignUp` rejects a short password, an invalid email, a blank field, and a duplicate
   email — assert on `kind`
3. `LogIn` succeeds with correct credentials
4. `LogIn` rejects a wrong password and an unknown email **with the same `kind`** — that
   equality is the anti-enumeration property, so assert on it directly
5. `LogOut` clears the session
6. `RestoreSession` returns the user after a session was written, and clears a dangling
   session whose user no longer exists
7. `useAuth` outside a provider throws

The stub hasher can be a trivial reversible fake for these tests — they are testing use
case orchestration, not SHA-256 (which the real adapter owns).

## App.test.tsx

Render `<App />` with `@testing-library/react-native`, mock `createAuthService` to return
an `AuthService` built on in-memory repositories, and drive a full round trip: signup
lands on Home, logout returns to Login, login reaches Home again. This is the one test
that proves the composition and the navigator swap are wired correctly.

Add `@testing-library/react-native` setup to `jest.config.js` per its docs.

## README.md

Replace the template wholesale:

1. **What it is** — two sentences, plus a screenshot or two
2. **Features** — mapped to the assignment's requirement numbers so a reviewer can tick
   them off: Context auth (1), the three screens (2), AsyncStorage persistence (3),
   navigation (4), UI (5), password toggle bonus
3. **Getting started** — `npm install`, `bundle install`, `bundle exec pod install`,
   `npm start`, `npm run ios` / `npm run android`; keep the template's environment
   prerequisites link
4. **Architecture** — the `src/` tree with the four layers and the inward-dependency
   diagram; one paragraph on why auth state drives the navigator
5. **Storage design** — the split table from Task 4 and the reasoning; the part most
   worth explaining carefully in a review
6. **Honest caveats** — SHA-256 is not memory-hard; `Math.random` is not a CSPRNG;
   `verify` is not constant-time; no backend. A reviewer values a stated limitation over a
   discovered one
7. **Running the tests** — `npm test`

## Verification

`npm test` green, `npx tsc --noEmit` clean, `npm run lint` clean. Then Task 8.