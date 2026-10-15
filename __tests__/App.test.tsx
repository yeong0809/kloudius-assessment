import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import App from '../App';

// The app wired to in-memory repositories instead of the Keychain — the proof that the
// domain depends on interfaces rather than on storage. Requires happen inside the factory
// because jest.mock is hoisted above the imports.
jest.mock('../src/infrastructure/createAuthService', () => {
  const { AuthService } = require('../src/application/auth');
  const { createInMemoryDeps } = require('../src/infrastructure/memory/InMemoryRepositories');
  return { createAuthService: () => new AuthService(createInMemoryDeps()) };
});

// Each interaction gets its own act() so the press handler reads the state committed by
// the preceding changeText rather than the values from before it.
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

async function goToSignup() {
  await press('Go to Signup');
  await waitFor(() => expect(screen.getByText('Create account')).toBeTruthy());
}

async function signUp(name: string, email: string, password: string) {
  await fill('signup-name', name);
  await fill('signup-email', email);
  await fill('signup-password', password);
  await press('Signup');
}

describe('App auth flow', () => {
  it('signs up, logs out, and logs back in', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await goToSignup();
    await signUp('Alice', 'alice@example.com', 'secret123');

    // Signup signs the user straight in — the navigator swapped to Home on its own.
    await waitFor(() => expect(screen.getByTestId('home-name')).toBeTruthy());
    expect(screen.getByTestId('home-name')).toHaveTextContent('Alice');
    expect(screen.getByTestId('home-email')).toHaveTextContent('alice@example.com');

    await press('Logout');
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());

    await fill('login-email', 'alice@example.com');
    await fill('login-password', 'secret123');
    await press('Login');

    await waitFor(() => expect(screen.getByTestId('home-name')).toHaveTextContent('Alice'));
  });

  it('shows an inline error for a weak password', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await goToSignup();
    await signUp('Bob', 'bob@example.com', 'short');

    await waitFor(() =>
      expect(screen.getByText('Password must be at least 6 characters.')).toBeTruthy(),
    );
    // Still on Signup — a rejected submit must not sign anyone in.
    expect(screen.queryByTestId('home-name')).toBeNull();
  });

  it('rejects a login with the wrong password', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());
    await goToSignup();
    await signUp('Carol', 'carol@example.com', 'secret123');
    await waitFor(() => expect(screen.getByTestId('home-name')).toBeTruthy());

    await press('Logout');
    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());

    await fill('login-email', 'carol@example.com');
    await fill('login-password', 'wrongpass');
    await press('Login');

    await waitFor(() =>
      expect(screen.getByText('Incorrect email or password.')).toBeTruthy(),
    );
  });

  it('toggles password visibility', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByText('Welcome back')).toBeTruthy());

    expect(screen.getByTestId('login-password').props.secureTextEntry).toBe(true);

    await act(async () => {
      fireEvent.press(screen.getByTestId('password-toggle'));
    });
    await waitFor(() =>
      expect(screen.getByTestId('login-password').props.secureTextEntry).toBe(false),
    );
  });
});