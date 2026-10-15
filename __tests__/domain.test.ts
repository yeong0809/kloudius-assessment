import { EmailAddress, validatePassword, User, MIN_PASSWORD_LENGTH } from '../src/domain/auth';

describe('EmailAddress', () => {
  it('accepts a normal address', () => {
    expect(EmailAddress.create('alice@example.com')?.value).toBe('alice@example.com');
  });

  it('rejects malformed addresses', () => {
    expect(EmailAddress.create('alice@')).toBeNull();
    expect(EmailAddress.create('no-at-sign')).toBeNull();
    expect(EmailAddress.create('a@b')).toBeNull();
    expect(EmailAddress.create('')).toBeNull();
    expect(EmailAddress.create('two@@example.com')).toBeNull();
  });

  it('lowercases and trims', () => {
    expect(EmailAddress.create('  Alice@Example.COM ')?.value).toBe('alice@example.com');
  });

  it('treats case variants as the same address', () => {
    const a = EmailAddress.create('Alice@Example.com');
    const b = EmailAddress.create('alice@example.com');
    expect(a?.equals(b!)).toBe(true);
  });
});

describe('validatePassword', () => {
  it('rejects an empty password', () => {
    expect(validatePassword('').valid).toBe(false);
  });

  it('rejects one below the minimum', () => {
    const password = 'a'.repeat(MIN_PASSWORD_LENGTH - 1);
    expect(validatePassword(password).valid).toBe(false);
  });

  it('accepts exactly the minimum', () => {
    const password = 'a'.repeat(MIN_PASSWORD_LENGTH);
    expect(validatePassword(password).valid).toBe(true);
  });

  it('accepts a longer password', () => {
    expect(validatePassword('a'.repeat(20)).valid).toBe(true);
  });
});

describe('User', () => {
  it('normalises the name and generates an id', () => {
    const email = EmailAddress.create('alice@example.com')!;
    const user = User.create(email, '  Alice  ');

    expect(user.name).toBe('Alice');
    expect(user.id.length).toBeGreaterThan(0);
    expect(user.toProfile()).toEqual({
      id: user.id,
      name: 'Alice',
      email: 'alice@example.com',
    });
  });

  it('rehydrates with a known id', () => {
    const email = EmailAddress.create('bob@example.com')!;
    const user = User.rehydrate('fixed-id', email, 'Bob');
    expect(user.id).toBe('fixed-id');
  });

  it('generates distinct ids', () => {
    const email = EmailAddress.create('alice@example.com')!;
    expect(User.create(email, 'Alice').id).not.toBe(User.create(email, 'Alice').id);
  });
});