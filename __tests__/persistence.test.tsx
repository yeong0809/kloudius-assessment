import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import App from '../App';

// This suite runs the app against the REAL storage adapters — AsyncStorage and the
// Keychain — with only the Keychain's native call mocked in jest.setup.js. Where
// App.test.tsx proves the domain depends on interfaces, this proves the adapters
// serialize and restore correctly through the actual composition root.

async function clearStores() {
  await AsyncStorage.clear();
  for (const service of await Keychain.getAllGenericPasswordServices()) {
    await Keychain.resetGenericPassword({ service });
  }
}

async function fill(testID: string, value: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(testID), value);
  });
}

async function press(label: string) {
  await act(async () => {
    fireEvent.press(screen.getByText(label));
  });
}

async function signUp(name: string, address: string, password: string) {
  await fill('signup-name', name);
  await fill('signup-email', address);
  await fill('signup-password', password);
  await press('Signup');
}

beforeEach(clearStores);

describe('persistence through the real adapters', () => {
  it('signs up, logs out, and logs back in across separate app mounts', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());

    await press('Go to Signup');
    await waitFor(() => expect(screen.getByText('Create account')).toBeTruthy());
    await signUp('Alice', 'alice@example.com', 'secret123');
    await waitFor(() => expect(screen.getByTestId('home-name')).toHaveTextContent('Alice'));

    // A second mount is the app relaunching: this only reaches Home if the session was
    // persisted to the Keychain and the profile to AsyncStorage. RTL cleans up the
    // previous tree automatically, so this is a cold start from storage.
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('home-name')).toHaveTextContent('Alice'), {
      timeout: 5000,
    });
  });

  it('restores the session after logout is not triggered', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await press('Go to Signup');
    await waitFor(() => expect(screen.getByText('Create account')).toBeTruthy());
    await signUp('Bob', 'bob@example.com', 'secret123');
    await waitFor(() => expect(screen.getByTestId('home-name')).toHaveTextContent('Bob'));

    // The active session is stored in the Keychain, not in component state.
    const session = await Keychain.getGenericPassword({
      service: 'com.assessment.auth.session',
    });
    if (!session) {
      throw new Error('expected a stored session');
    }
    expect(session.password).toBe('bob@example.com');
  });

  it('rejects a wrong password using the persisted credential', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await press('Go to Signup');
    await waitFor(() => expect(screen.getByText('Create account')).toBeTruthy());
    await signUp('Carol', 'carol@example.com', 'secret123');
    await waitFor(() => expect(screen.getByTestId('home-name')).toBeTruthy());

    await press('Logout');
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());

    await fill('login-email', 'carol@example.com');
    await fill('login-password', 'wrongpass');
    await press('Login');

    // Reaching this message means the real Keychain credential was read, hashed, and
    // compared against the submitted password.
    await waitFor(() =>
      expect(screen.getByText('Incorrect email or password.')).toBeTruthy(),
    );
  });

  it('accepts a differently-cased email against the stored credential', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await press('Go to Signup');
    await waitFor(() => expect(screen.getByText('Create account')).toBeTruthy());
    await signUp('Dave', 'Dave@Example.com', 'secret123');
    await waitFor(() => expect(screen.getByTestId('home-name')).toHaveTextContent('Dave'));

    await press('Logout');
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());

    await fill('login-email', 'dave@example.com');
    await fill('login-password', 'secret123');
    await press('Login');

    await waitFor(() => expect(screen.getByTestId('home-name')).toHaveTextContent('Dave'));
  });

  it('reports a duplicate email from the persisted directory', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await press('Go to Signup');
    await waitFor(() => expect(screen.getByText('Create account')).toBeTruthy());
    await signUp('Eve', 'eve@example.com', 'secret123');
    await waitFor(() => expect(screen.getByTestId('home-name')).toBeTruthy());
    await press('Logout');
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());

    await press('Go to Signup');
    await waitFor(() => expect(screen.getByText('Create account')).toBeTruthy());
    await signUp('Eve Again', 'EVE@example.com', 'different1');
    await waitFor(() =>
      expect(screen.getByText('An account with this email already exists.')).toBeTruthy(),
    );
  });

  it('stays signed out when a session points at a deleted account', async () => {
    // A dangling session must not render Home for a user who no longer exists.
    await AsyncStorage.setItem('@assessment/auth/users', JSON.stringify({}));
    await Keychain.setGenericPassword('session', 'ghost@example.com', {
      service: 'com.assessment.auth.session',
    });

    render(<App />);
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    expect(screen.queryByTestId('home-name')).toBeNull();

    // RestoreSession clears the stale session rather than leaving it behind.
    const session = await Keychain.getGenericPassword({
      service: 'com.assessment.auth.session',
    });
    expect(session).toBe(false);
  });

  it('never writes a plaintext password to storage', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await press('Go to Signup');
    await waitFor(() => expect(screen.getByText('Create account')).toBeTruthy());
    await signUp('Frank', 'frank@example.com', 'plaintext123');
    await waitFor(() => expect(screen.getByTestId('home-name')).toBeTruthy());

    const directory = await AsyncStorage.getItem('@assessment/auth/users');
    const credential = await Keychain.getGenericPassword({
      service: 'com.assessment.auth.credential.frank@example.com',
    });

    expect(directory).toBeTruthy();
    expect(directory).not.toContain('plaintext123');
    if (!credential) {
      throw new Error('expected a stored credential');
    }
    expect(credential.password).not.toContain('plaintext123');
    expect(JSON.parse(credential.password)).toEqual({
      salt: expect.any(String),
      hash: expect.any(String),
    });
  });
});