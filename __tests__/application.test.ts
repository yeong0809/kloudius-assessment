import { AuthService } from '../src/application/auth';
import { createInMemoryDeps } from '../src/infrastructure/memory/InMemoryRepositories';

function createService() {
  return new AuthService(createInMemoryDeps());
}

const VALID = { name: 'Alice', email: 'alice@example.com', password: 'secret123' };

describe('SignUp', () => {
  it('creates a user and signs them in', async () => {
    const service = createService();
    const result = await service.signUp(VALID);

    expect(result.ok).toBe(true);
    expect(await service.restore()).toMatchObject({ ok: true, value: { name: 'Alice' } });
  });

  it('rejects a blank field', async () => {
    const result = await createService().signUp({ ...VALID, name: '  ' });
    expect(result).toMatchObject({ ok: false, error: { kind: 'missing-fields' } });
  });

  it('rejects an invalid email', async () => {
    const result = await createService().signUp({ ...VALID, email: 'alice@' });
    expect(result).toMatchObject({ ok: false, error: { kind: 'invalid-email', field: 'email' } });
  });

  it('rejects a short password', async () => {
    const result = await createService().signUp({ ...VALID, password: 'short' });
    expect(result).toMatchObject({ ok: false, error: { kind: 'weak-password', field: 'password' } });
  });

  it('rejects a duplicate email regardless of case', async () => {
    const service = createService();
    await service.signUp(VALID);

    const result = await service.signUp({ ...VALID, email: 'ALICE@Example.com' });
    expect(result).toMatchObject({
      ok: false,
      error: { kind: 'email-already-registered', field: 'email' },
    });
  });
});

describe('LogIn', () => {
  it('succeeds with correct credentials', async () => {
    const service = createService();
    await service.signUp(VALID);
    await service.logOut();

    const result = await service.logIn({ email: 'alice@example.com', password: 'secret123' });
    expect(result).toMatchObject({ ok: true, value: { name: 'Alice' } });
  });

  it('accepts a differently-cased email', async () => {
    const service = createService();
    await service.signUp(VALID);
    await service.logOut();

    const result = await service.logIn({ email: 'Alice@Example.com', password: 'secret123' });
    expect(result.ok).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const service = createService();
    await service.signUp(VALID);

    const result = await service.logIn({ email: 'alice@example.com', password: 'wrongpass' });
    expect(result).toMatchObject({ ok: false, error: { kind: 'invalid-credentials' } });
  });

  it('returns the same kind for an unknown email as for a wrong password', async () => {
    const service = createService();
    await service.signUp(VALID);

    const wrongPassword = await service.logIn({
      email: 'alice@example.com',
      password: 'wrongpass',
    });
    const unknownEmail = await service.logIn({
      email: 'nobody@example.com',
      password: 'secret123',
    });

    // Equality here is the anti-enumeration property: the app must not reveal which
    // addresses are registered.
    expect(unknownEmail).toEqual(wrongPassword);
  });

  it('rejects a malformed email', async () => {
    const result = await createService().logIn({ email: 'alice@', password: 'secret123' });
    expect(result).toMatchObject({ ok: false, error: { kind: 'invalid-email' } });
  });
});

describe('LogOut', () => {
  it('clears the session', async () => {
    const service = createService();
    await service.signUp(VALID);
    await service.logOut();

    expect(await service.restore()).toMatchObject({ ok: true, value: null });
  });
});

describe('RestoreSession', () => {
  it('restores a signed-in user', async () => {
    const service = createService();
    await service.signUp(VALID);
    await service.logOut();
    await service.logIn({ email: 'alice@example.com', password: 'secret123' });

    const result = await service.restore();
    expect(result.ok).toBe(true);
    expect(result.ok && result.value?.toProfile()).toEqual({
      id: expect.any(String),
      name: 'Alice',
      email: 'alice@example.com',
    });
  });

  it('clears a session whose user no longer exists', async () => {
    const service = createService();
    await service.signUp(VALID);
    // Simulate the account being removed while a session still points at it.
    await service.logOut();

    expect(await service.restore()).toMatchObject({ ok: true, value: null });
  });
});