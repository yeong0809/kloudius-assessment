import { EmailAddress } from './EmailAddress';
import { PasswordHash } from './PasswordHash';
import { User } from './User';

export interface UserRepository {
  findByEmail(email: EmailAddress): Promise<User | null>;
  save(user: User): Promise<void>;
}

export interface CredentialRepository {
  find(email: EmailAddress): Promise<PasswordHash | null>;
  save(email: EmailAddress, credential: PasswordHash): Promise<void>;
}

export interface SessionRepository {
  read(): Promise<string | null>;
  write(email: string): Promise<void>;
  clear(): Promise<void>;
}

export interface PasswordHasher {
  hash(password: string, salt: string): string;
  generateSalt(): string;
  verify(password: string, stored: PasswordHash): boolean;
}