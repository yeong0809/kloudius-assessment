import {
  EmailAddress,
  PasswordHash,
  User,
  failure,
  AuthResult,
  validatePassword,
  UserRepository,
  CredentialRepository,
  SessionRepository,
  PasswordHasher,
} from '../../domain/auth';


export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export class SignUp {
  constructor(
    private readonly users: UserRepository,
    private readonly credentials: CredentialRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: SignUpInput): Promise<AuthResult<User>> {
    if (!input.name.trim() || !input.email.trim() || !input.password) {
      return failure('missing-fields');
    }

    const email = EmailAddress.create(input.email);
    if (!email) {
      return failure('invalid-email', 'email');
    }

    const passwordProblem = validatePassword(input.password);
    if (passwordProblem) {
      return failure(passwordProblem, 'password');
    }

    if (await this.users.findByEmail(email)) {
      return failure('email-already-registered', 'email');
    }

    const user = User.create(email, input.name);
    const salt = this.hasher.generateSalt();
    const credential = PasswordHash.create(salt, this.hasher.hash(input.password, salt));

    await this.users.save(user);
    await this.credentials.save(email, credential);
    await this.sessions.write(email.value);

    return { ok: true, value: user };
  }
}