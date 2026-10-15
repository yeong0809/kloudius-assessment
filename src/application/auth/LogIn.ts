import {
  EmailAddress,
  User,
  failure,
  AuthResult,
  UserRepository,
  CredentialRepository,
  SessionRepository,
  PasswordHasher,
} from '../../domain/auth';


export interface LogInInput {
  email: string;
  password: string;
}

export class LogIn {
  constructor(
    private readonly users: UserRepository,
    private readonly credentials: CredentialRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: LogInInput): Promise<AuthResult<User>> {
    const email = EmailAddress.create(input.email);
    if (!email) {
      return failure('invalid-email', 'email');
    }

    if (!input.password) {
      return failure('missing-fields');
    }

    const user = await this.users.findByEmail(email);
    const credential = user ? await this.credentials.find(email) : null;

    // One failure kind for unknown-email, missing-credential and wrong-password alike,
    // so the app cannot be used to discover which addresses are registered.
    if (!user || !credential || !this.hasher.verify(input.password, credential)) {
      return failure('invalid-credentials');
    }

    await this.sessions.write(email.value);
    return { ok: true, value: user };
  }
}