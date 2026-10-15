import { EmailAddress, PasswordHash } from '../src/domain/auth';
import { Sha256PasswordHasher } from '../src/infrastructure/hashing/Sha256PasswordHasher';

const hasher = new Sha256PasswordHasher();

function credential(salt: string, hash: string): PasswordHash {
  return PasswordHash.create(salt, hash);
}

describe('Sha256PasswordHasher', () => {
  it('is deterministic for the same password and salt', () => {
    expect(hasher.hash('secret123', 'abc')).toBe(hasher.hash('secret123', 'abc'));
  });

  it('produces different hashes for different salts', () => {
    // Per-user salt is the point: two users with the same password must not share a hash.
    expect(hasher.hash('secret123', 'abc')).not.toBe(hasher.hash('secret123', 'xyz'));
  });

  it('produces different hashes for different passwords', () => {
    expect(hasher.hash('secret123', 'abc')).not.toBe(hasher.hash('secret124', 'abc'));
  });

  it('does not collide when salt and password concatenate to the same string', () => {
    // ("ab", "c") and ("a", "bc") would collide without the delimiter.
    expect(hasher.hash('c', 'ab')).not.toBe(hasher.hash('bc', 'a'));
  });

  it('accepts the correct password', () => {
    const stored = credential('salt1', hasher.hash('secret123', 'salt1'));
    expect(hasher.verify('secret123', stored)).toBe(true);
  });

  it('rejects a wrong password', () => {
    const stored = credential('salt1', hasher.hash('secret123', 'salt1'));
    expect(hasher.verify('secret124', stored)).toBe(false);
  });

  it('rejects when the salt does not match the stored one', () => {
    const stored = credential('salt1', hasher.hash('secret123', 'salt1'));
    expect(hasher.verify('secret123', PasswordHash.create('salt2', stored.hash))).toBe(false);
  });

  it('generates a non-empty salt, and a different one each time', () => {
    const salt = hasher.generateSalt();
    expect(salt.length).toBeGreaterThan(0);
    expect(salt).not.toBe(hasher.generateSalt());
  });

  it('round-trips a hash built from a generated salt', () => {
    const salt = hasher.generateSalt();
    const stored = credential(salt, hasher.hash('secret123', salt));
    expect(hasher.verify('secret123', stored)).toBe(true);
  });

  it('does not leak the password into the hash', () => {
    expect(hasher.hash('secret123', 'abc')).not.toContain('secret123');
  });
});

describe('hashing integration with User', () => {
  it('produces a stored credential that verifies against the right user only', () => {
    const salt = hasher.generateSalt();
    const userCredential = PasswordHash.create(salt, hasher.hash('secret123', salt));

    expect(hasher.verify('secret123', userCredential)).toBe(true);
    expect(hasher.verify('secret1234', userCredential)).toBe(false);

    // A different user with the same password gets a different salt and hash.
    const otherSalt = hasher.generateSalt();
    const other = PasswordHash.create(otherSalt, hasher.hash('secret123', otherSalt));
    expect(other.hash).not.toBe(userCredential.hash);
  });

  it('serializes a credential to the shape the Keychain adapter stores', () => {
    const salt = hasher.generateSalt();
    const json = JSON.stringify(
      PasswordHash.create(salt, hasher.hash('secret123', salt)).toJSON(),
    );
    expect(JSON.parse(json)).toEqual({ salt, hash: hasher.hash('secret123', salt) });
  });
});

describe('EmailAddress in the credential key', () => {
  it('resolves the same Keychain service for case-variant emails', async () => {
    // The adapter keys the Keychain item by email.value, which is normalized. This
    // asserts the property that keeps Alice@Example.com from becoming a second account.
    const typed = EmailAddress.create('Alice@Example.com')!;
    const stored = EmailAddress.create('alice@example.com')!;
    expect(typed.equals(stored)).toBe(true);

    const salt = hasher.generateSalt();
    const record = new Map<string, string>([[stored.value, hasher.hash('secret123', salt)]]);
    expect(record.get(typed.value)).toBe(hasher.hash('secret123', salt));
  });
});
