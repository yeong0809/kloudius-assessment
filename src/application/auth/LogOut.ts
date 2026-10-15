import { SessionRepository } from '../../domain/auth';

export class LogOut {
  constructor(private readonly sessions: SessionRepository) {}

  async execute(): Promise<void> {
    await this.sessions.clear();
  }
}