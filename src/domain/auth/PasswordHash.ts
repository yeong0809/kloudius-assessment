export class PasswordHash {
  private constructor(
    readonly salt: string,
    readonly hash: string,
  ) {}

  static create(salt: string, hash: string): PasswordHash {
    return new PasswordHash(salt, hash);
  }

  toJSON(): { salt: string; hash: string } {
    return { salt: this.salt, hash: this.hash };
  }
}