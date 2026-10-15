import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmailAddress, User, UserRepository, UserProfile } from '../../domain/auth';

const DIRECTORY_KEY = '@assessment/auth/users';

type Directory = Record<string, UserProfile>;

function normalizeKey(email: EmailAddress): string {
  return email.value;
}

async function readDirectory(): Promise<Directory> {
  try {
    const raw = await AsyncStorage.getItem(DIRECTORY_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Directory) : {};
  } catch {
    // A corrupt directory should read as empty rather than throwing during app start,
    // where an exception before the first render is a white screen.
    return {};
  }
}

export class AsyncStorageUserRepository implements UserRepository {
  async findByEmail(email: EmailAddress): Promise<User | null> {
    const directory = await readDirectory();
    const profile = directory[normalizeKey(email)];
    if (!profile) {
      return null;
    }
    const address = EmailAddress.create(profile.email);
    return address ? User.rehydrate(profile.id, address, profile.name) : null;
  }

  async save(user: User): Promise<void> {
    const directory = await readDirectory();
    const profile = user.toProfile();
    directory[profile.email] = profile;
    await AsyncStorage.setItem(DIRECTORY_KEY, JSON.stringify(directory));
  }
}