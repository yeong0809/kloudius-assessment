import {
  EmailAddress,
  PasswordHash,
  User,
  UserRepository,
  CredentialRepository,
  SessionRepository,
  PasswordHasher,
} from '../../domain/auth';

// Working implementations of the domain ports, not jest mocks. Tests construct use
// cases with these directly, and swapping the composition root to point at them instead
// of the Keychain adapters is the proof that the domain depends on interfaces.

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  async findByEmail(email: EmailAddress): Promise<User | null> {
    return this.users.get(email.value) ?? null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.email.value, user);
  }
}

export class InMemoryCredentialRepository implements CredentialRepository {
  private readonly credentials = new Map<string, PasswordHash>();

  async find(email: EmailAddress): Promise<PasswordHash | null> {
    return this.credentials.get(email.value) ?? null;
  }

  async save(email: EmailAddress, credential: PasswordHash): Promise<void> {
    this.credentials.set(email.value, credential);
  }
}

export class InMemorySessionRepository implements SessionRepository {
  private session: string | null = null;

  async read(): Promise<string | null> {
    return this.session;
  }

  async write(email: string): Promise<void> {
    this.session = email;
  }

  async clear(): Promise<void> {
    this.session = null;
  }
}

// Reversible on purpose: use-case tests exercise orchestration, not SHA-256.
export class StubPasswordHasher implements PasswordHasher {
  private counter = 0;

  hash(password: string, salt: string): string {
    return `${salt}~${password}`;
  }

  generateSalt(): string {
    this.counter += 1;
    return `salt-${this.counter}`;
  }

  verify(password: string, stored: PasswordHash): boolean {
    return stored.hash === `${stored.salt}~${password}`;
  }
}

export interface InMemoryDeps {
  users: InMemoryUserRepository;
  credentials: InMemoryCredentialRepository;
  sessions: InMemorySessionRepository;
  hasher: StubPasswordHasher;
}

export function createInMemoryDeps(): InMemoryDeps {
  return {
    users: new InMemoryUserRepository(),
    credentials: new InMemoryCredentialRepository(),
    sessions: new InMemorySessionRepository(),
    hasher: new StubPasswordHasher(),
  };
}