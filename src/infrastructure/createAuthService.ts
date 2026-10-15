import { AuthService, AuthServiceDeps } from '../application/auth';
import { KeychainCredentialRepository, KeychainSessionRepository } from './keychain/KeychainCredentialRepository';
import { AsyncStorageUserRepository } from './storage/AsyncStorageUserRepository';
import { Sha256PasswordHasher } from './hashing/Sha256PasswordHasher';

// The one place that knows the concrete adapters. Swapping the Keychain for an API means
// editing this function and nothing else.
export function createAuthService(): AuthService {
  const deps: AuthServiceDeps = {
    users: new AsyncStorageUserRepository(),
    credentials: new KeychainCredentialRepository(),
    sessions: new KeychainSessionRepository(),
    hasher: new Sha256PasswordHasher(),
  };
  return new AuthService(deps);
}