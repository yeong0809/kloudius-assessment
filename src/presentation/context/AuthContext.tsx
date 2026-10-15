import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AuthService } from '../../application/auth';
import {
  AuthErrorKind,
  AuthResult,
  UserProfile,
} from '../../domain/auth';
import { createAuthService } from '../../infrastructure/createAuthService';
import { authErrorMessages } from '../screens/authErrorMessages';

type FieldName = 'name' | 'email' | 'password';
type FieldErrors = Partial<Record<FieldName, string>>;

export interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  login(email: string, password: string): Promise<{ ok: boolean; errors: FieldErrors }>;
  signup(
    name: string,
    email: string,
    password: string,
  ): Promise<{ ok: boolean; errors: FieldErrors }>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// The domain reports a failure kind; presentation decides the wording.
function toFieldErrors(result: AuthResult<unknown>): FieldErrors {
  if (result.ok) {
    return {};
  }
  const { kind, field } = result.error;
  const message = authErrorMessages[kind as AuthErrorKind];
  return field ? { [field]: message } : { password: message };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const serviceRef = useRef<AuthService | null>(null);
  if (serviceRef.current === null) {
    serviceRef.current = createAuthService();
  }

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    serviceRef.current!.restore()
      .then(result => {
        if (active && result.ok && result.value) {
          setUser(result.value.toProfile());
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await serviceRef.current!.logIn({ email, password });
    const errors = toFieldErrors(result);
    if (result.ok) {
      setUser(result.value.toProfile());
    }
    return { ok: result.ok, errors };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const result = await serviceRef.current!.signUp({ name, email, password });
    const errors = toFieldErrors(result);
    if (result.ok) {
      setUser(result.value.toProfile());
    }
    return { ok: result.ok, errors };
  }, []);

  const logout = useCallback(async () => {
    await serviceRef.current!.logOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, signup, logout }),
    [user, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}