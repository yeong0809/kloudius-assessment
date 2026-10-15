import {
  User,
  AuthResult,
  UserRepository,
  CredentialRepository,
  SessionRepository,
  PasswordHasher,
} from '../../domain/auth';
import { SignUp, SignUpInput } from './SignUp';
import { LogIn, LogInInput } from './LogIn';
import { LogOut } from './LogOut';
import { RestoreSession } from './RestoreSession';

export interface AuthServiceDeps {
  users: UserRepository;
  credentials: CredentialRepository;
  sessions: SessionRepository;
  hasher: PasswordHasher;
}

export class AuthService {
  private readonly signUpUseCase: SignUp;
  private readonly logInUseCase: LogIn;
  private readonly logOutUseCase: LogOut;
  private readonly restoreSession: RestoreSession;

  constructor(deps: AuthServiceDeps) {
    this.signUpUseCase = new SignUp(deps.users, deps.credentials, deps.sessions, deps.hasher);
    this.logInUseCase = new LogIn(deps.users, deps.credentials, deps.sessions, deps.hasher);
    this.logOutUseCase = new LogOut(deps.sessions);
    this.restoreSession = new RestoreSession(deps.users, deps.sessions);
  }

  signUp(input: SignUpInput): Promise<AuthResult<User>> {
    return this.signUpUseCase.execute(input);
  }

  logIn(input: LogInInput): Promise<AuthResult<User>> {
    return this.logInUseCase.execute(input);
  }

  async logOut(): Promise<void> {
    await this.logOutUseCase.execute();
  }

  restore(): Promise<AuthResult<User | null>> {
    return this.restoreSession.execute();
  }
}