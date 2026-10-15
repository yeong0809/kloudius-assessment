# Task 4 — Infrastructure layer: adapters

Goal: implement the domain's ports against real storage. This is the only layer that
knows a Keychain or AsyncStorage exists.

## Files

- `src/infrastructure/keychain/KeychainCredentialRepository.ts`
- `src/infrastructure/keychain/KeychainSessionRepository.ts`
- `src/infrastructure/storage/AsyncStorageUserRepository.ts`
- `src/infrastructure/hashing/Sha256PasswordHasher.ts`
- `src/infrastructure/memory/InMemoryRepositories.ts` *(test doubles live here too — see below)*
- `src/infrastructure/createAuthService.ts` — composition root

## Why the storage split

| Data | Adapter | Store |
|---|---|---|
| User profile (id, name, email) | `AsyncStorageUserRepository` | AsyncStorage — non-secret |
| Password salt + hash | `KeychainCredentialRepository` | Keychain / Keystore |
| Active session (email) | `KeychainSessionRepository` | Keychain / Keystore |

On Android `react-native-keychain` writes through Keystore-encrypted storage, so the split
holds on both platforms. The domain does not know or care which adapter serves which port.

## KeychainCredentialRepository

Implements `CredentialRepository`. Each account gets its own Keychain item, keyed by email
so one corrupt entry cannot take down every account.

```ts
async save(email: EmailAddress, credential: PasswordHash) {
  await Keychain.setGenericPassword('credential', JSON.stringify(credential), {
    service: serviceFor(email.value),
  });
}
```

`serviceFor` lowercases and trims. `read()` returns `null` on a miss — a first-launch miss
is normal, not an error, so never throw from a read.

`getGenericPassword` resolves `false` (not a rejection) when nothing is stored, so handle
both shapes:

```ts
const result = await Keychain.getGenericPassword({ service });
if (!result) return null;          // false → nothing stored
```

Parse defensively — a corrupted value yields `null` rather than throwing during app start,
where a throw is a white screen.

## AsyncStorageUserRepository

Implements `UserRepository`. One key holding a `Record<string, StoredUser>` keyed by
normalized email, read once and written back on each save. `findByEmail` rebuilds a `User`
through `User.rehydrate(...)` — the domain owns how a `User` is constructed; the adapter
does not poke at private fields.

Same defensive-parse rule as above: a corrupt directory should read as empty, not crash.

Note this is a deliberate simplification. A real directory would grow to a proper index;
this one is fine for a handful of local accounts and keeps the adapter readable.

## Sha256PasswordHasher

```ts
import { sha256 } from 'js-sha256';

hash(password, salt) { return sha256(`${salt}:${password}`); }
generateSalt()      { /* random hex */ }
verify(password, stored) {
  return this.hash(password, stored.salt) === stored.hash;
}
```

Salt and password are joined with a delimiter rather than concatenated, so `salt="ab",
password="c"` and `salt="a", password="bc"` cannot collide.

`verify` recomputes and compares — it never compares a plaintext password to anything
stored. Note the comparison is not constant-time; that is acceptable against a
device-local store and called out in the README, not silently ignored.

Salt generation uses `Math.random`, which is **not** a CSPRNG. Acceptable here, stated
plainly in the README rather than dressed up as secure.

Pure-JS `js-sha256` was chosen over `react-native-quick-crypto`, which drags in
`react-native-nitro-modules` and `react-native-quick-base64` for no real gain on a
device-local store. `PasswordHasher` is the seam: swapping implementations is one line in
the composition root.

## InMemoryRepositories

In-memory implementations of all three repository ports, plus a `StubPasswordHasher`. These
are **not** mocks — they are working implementations of the interfaces, good enough to run
the whole app. They serve two purposes: tests use them directly, and they make the
architecture demonstrable — pointing the composition root at them instead of the Keychain
adapters is the proof that the domain depends on interfaces, not on storage.

## createAuthService — the composition root

The one place that knows every concrete implementation:

```ts
export function createAuthService(): AuthService {
  return new AuthService({
    users: new AsyncStorageUserRepository(),
    credentials: new KeychainCredentialRepository(),
    sessions: new KeychainSessionRepository(),
    hasher: new Sha256PasswordHasher(),
  });
}
```

Swapping the backend means editing this function and nothing else. Keeping construction
here rather than inline in `AuthProvider` is what keeps `AuthContext` from importing the
infrastructure layer — and keeps the dependency rule true.

## Verification

`npx tsc --noEmit`, then confirm the interfaces are actually satisfied — TypeScript fails
the build if a method signature drifts from the port. Runtime checks come in Task 7
(in-memory repositories) and Task 8 (the real Keychain, on device).