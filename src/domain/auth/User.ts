import { EmailAddress } from './EmailAddress';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// React Native ships no crypto.randomUUID, and its UUIDv4 shape is not load-bearing
// here — the id only needs to be unique within the local user directory.
function generateId(): string {
  let id = '';
  for (let i = 0; i < 32; i += 1) {
    id += Math.floor(Math.random() * 16).toString(16);
    if (i === 7 || i === 11 || i === 15 || i === 19) {
      id += '-';
    }
  }
  return id;
}

export class User {
  private constructor(
    readonly id: string,
    readonly email: EmailAddress,
    public name: string,
  ) {}

  static create(email: EmailAddress, name: string): User {
    return new User(generateId(), email, name.trim());
  }

  static rehydrate(id: string, email: EmailAddress, name: string): User {
    return new User(id, email, name);
  }

  toProfile(): UserProfile {
    return { id: this.id, name: this.name, email: this.email.value };
  }
}