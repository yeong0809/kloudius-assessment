import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmailAddress, PasswordHash, User } from '../src/domain/auth';
import {
  KeychainCredentialRepository,
  KeychainSessionRepository,
} from '../src/infrastructure/keychain/KeychainCredentialRepository';
import { AsyncStorageUserRepository } from '../src/infrastructure/storage/AsyncStorageUserRepository';

const credentials = new KeychainCredentialRepository();
const sessions = new KeychainSessionRepository();
const users = new AsyncStorageUserRepository();

const email = (value: string) => EmailAddress.create(value)!;

beforeEach(async () => {
  await AsyncStorage.clear();
  for (const service of await Keychain.getAllGenericPasswordServices()) {
    await Keychain.resetGenericPassword({ service });
  }
});

describe('KeychainCredentialRepository', () => {
  it('returns null for an account that was never saved', async () => {
    // A first-launch miss is normal, not an error — this must not throw.
    await expect(credentials.find(email('nobody@example.com'))).resolves.toBeNull();
  });

  it('round-trips a credential', async () => {
    const saved = PasswordHash.create('salt1', 'hash1');
    await credentials.save(email('alice@example.com'), saved);

    const found = await credentials.find(email('alice@example.com'));
    expect(found).not.toBeNull();
    expect(found!.salt).toBe('salt1');
    expect(found!.hash).toBe('hash1');
  });

  it('keeps accounts separate', async () => {
    await credentials.save(email('alice@example.com'), PasswordHash.create('saltA', 'hashA'));
    await credentials.save(email('bob@example.com'), PasswordHash.create('saltB', 'hashB'));

    expect((await credentials.find(email('alice@example.com')))!.hash).toBe('hashA');
    expect((await credentials.find(email('bob@example.com')))!.hash).toBe('hashB');
  });

  it('normalizes the email so case variants share one record', async () => {
    await credentials.save(email('Alice@Example.com'), PasswordHash.create('salt1', 'hash1'));

    // Signup normalizes on write; login normalizes on read. If these disagreed, logging
    // in as alice@example.com after signing up as Alice@Example.com would find nothing.
    const found = await credentials.find(email('alice@example.com'));
    expect(found!.hash).toBe('hash1');
  });

  it('overwrites rather than duplicating on a repeated save', async () => {
    await credentials.save(email('alice@example.com'), PasswordHash.create('salt1', 'hash1'));
    await credentials.save(email('alice@example.com'), PasswordHash.create('salt2', 'hash2'));

    expect((await credentials.find(email('alice@example.com')))!.salt).toBe('salt2');
  });
});

describe('KeychainSessionRepository', () => {
  it('returns null when nothing is stored', async () => {
    await expect(sessions.read()).resolves.toBeNull();
  });

  it('round-trips the active email', async () => {
    await sessions.write('alice@example.com');
    await expect(sessions.read()).resolves.toBe('alice@example.com');
  });

  it('clears the session', async () => {
    await sessions.write('alice@example.com');
    await sessions.clear();
    await expect(sessions.read()).resolves.toBeNull();
  });

  it('survives repeated clears', async () => {
    await sessions.write('alice@example.com');
    await sessions.clear();
    await expect(sessions.clear()).resolves.toBeUndefined();
    await expect(sessions.read()).resolves.toBeNull();
  });
});

describe('AsyncStorageUserRepository', () => {
  it('returns null for an unknown user', async () => {
    await expect(users.findByEmail(email('nobody@example.com'))).resolves.toBeNull();
  });

  it('returns an empty directory on first read', async () => {
    // No write has happened yet; a miss must not throw during app start.
    await expect(users.findByEmail(email('anyone@example.com'))).resolves.toBeNull();
  });

  it('saves and finds a user by normalized email', async () => {
    const user = User.create(email('Alice@Example.com'), 'Alice');

    await users.save(user);
    const found = await users.findByEmail(email('alice@example.com'));

    expect(found).not.toBeNull();
    expect(found!.name).toBe('Alice');
    expect(found!.id).toBe(user.id);
  });

  it('finds the same account under a differently-cased email', async () => {
    await users.save(User.create(email('alice@example.com'), 'Alice'));

    expect(await users.findByEmail(email('ALICE@EXAMPLE.COM'))).not.toBeNull();
  });

  it('keeps multiple accounts separate', async () => {
    await users.save(User.create(email('alice@example.com'), 'Alice'));
    await users.save(User.create(email('bob@example.com'), 'Bob'));

    expect((await users.findByEmail(email('alice@example.com')))!.name).toBe('Alice');
    expect((await users.findByEmail(email('bob@example.com')))!.name).toBe('Bob');
  });

  it('treats a corrupt directory as empty rather than throwing', async () => {
    // A crash before the first render would be a white screen, so a bad read must be
    // swallowed into an empty directory.
    await AsyncStorage.setItem('@assessment/auth/users', '{not json');

    await expect(users.findByEmail(email('alice@example.com'))).resolves.toBeNull();
  });

  it('survives a save after a corrupt read', async () => {
    await AsyncStorage.setItem('@assessment/auth/users', 'not json at all');

    await users.save(User.create(email('alice@example.com'), 'Alice'));
    expect((await users.findByEmail(email('alice@example.com')))!.name).toBe('Alice');
  });
});
