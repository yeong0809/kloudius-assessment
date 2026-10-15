import {
  EmailAddress,
  User,
  AuthResult,
  UserRepository,
  SessionRepository,
} from '../../domain/auth';

export class RestoreSession {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
  ) {}

  async execute(): Promise<AuthResult<User | null>> {
    const stored = await this.sessions.read();
    if (!stored) {
      return { ok: true, value: null };
    }

    const email = EmailAddress.create(stored);
    const user = email ? await this.users.findByEmail(email) : null;

    // A session pointing at a deleted account must not render a Home screen.
    if (!user) {
      await this.sessions.clear();
      return { ok: true, value: null };
    }

    return { ok: true, value: user };
  }
}