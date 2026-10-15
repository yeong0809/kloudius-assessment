import { sha256 } from 'js-sha256';
import { PasswordHash, PasswordHasher } from '../../domain/auth';

function generateSalt(): string {
  let salt = '';
  for (let i = 0; i < 32; i += 1) {
    salt += Math.floor(Math.random() * 16).toString(16);
  }
  return salt;
}

export class Sha256PasswordHasher implements PasswordHasher {
  // The salt is joined with a delimiter rather than concatenated, so ("ab","c") and
  // ("a","bc") cannot produce the same digest.
  hash(password: string, salt: string): string {
    return sha256(`${salt}:${password}`);
  }

  generateSalt(): string {
    return generateSalt();
  }

  verify(password: string, stored: PasswordHash): boolean {
    return this.hash(password, stored.salt) === stored.hash;
  }
}