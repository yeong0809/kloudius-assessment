import * as Keychain from 'react-native-keychain';
import {
  EmailAddress,
  PasswordHash,
  CredentialRepository,
  SessionRepository,
} from '../../domain/auth';

function serviceFor(email: string): string {
  return `com.assessment.auth.credential.${email.trim().toLowerCase()}`;
}

const SESSION_SERVICE = 'com.assessment.auth.session';

export class KeychainCredentialRepository implements CredentialRepository {
  async find(email: EmailAddress): Promise<PasswordHash | null> {
    try {
      // getGenericPassword resolves false when nothing is stored — a first-launch miss
      // is normal, not an error.
      const result = await Keychain.getGenericPassword({ service: serviceFor(email.value) });
      if (!result) {
        return null;
      }
      const parsed = JSON.parse(result.password);
      if (typeof parsed?.salt === 'string' && typeof parsed?.hash === 'string') {
        return PasswordHash.create(parsed.salt, parsed.hash);
      }
      return null;
    } catch {
      return null;
    }
  }

  async save(email: EmailAddress, credential: PasswordHash): Promise<void> {
    await Keychain.setGenericPassword('credential', JSON.stringify(credential), {
      service: serviceFor(email.value),
    });
  }
}

export class KeychainSessionRepository implements SessionRepository {
  async read(): Promise<string | null> {
    try {
      const result = await Keychain.getGenericPassword({ service: SESSION_SERVICE });
      return result ? result.password : null;
    } catch {
      return null;
    }
  }

  async write(email: string): Promise<void> {
    await Keychain.setGenericPassword('session', email, { service: SESSION_SERVICE });
  }

  async clear(): Promise<void> {
    await Keychain.resetGenericPassword({ service: SESSION_SERVICE });
  }
}