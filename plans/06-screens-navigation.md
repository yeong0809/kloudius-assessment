# Task 6 — Presentation screens, navigation, and AuthContext

Goal: wire the use cases into React — `AuthContext` as a presentation adapter, three
screens, and a navigator that switches on auth state.

## Files

- `src/presentation/context/AuthContext.tsx`
- `src/presentation/navigation/types.ts`
- `src/presentation/navigation/RootNavigator.tsx`
- `src/presentation/screens/LoginScreen.tsx`
- `src/presentation/screens/SignupScreen.tsx`
- `src/presentation/screens/HomeScreen.tsx`
- `App.tsx` (rewritten)

## AuthContext — the adapter that satisfies the assignment

The assignment requires a context exposing `login`, `signup`, `logout`, `user`. The context
exists, but it is a **presentation-layer adapter** over the application layer: it holds
React state and delegates to `AuthService`.

```tsx
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const serviceRef = useRef(createAuthService());   // built once
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    serviceRef.current.restore()
      .then(r => { if (r.ok) setUser(r.value); })
      .finally(() => setIsLoading(false));
  }, []);

  const signup = async (name, email, password) => {
    const result = await serviceRef.current.signUp({ name, email, password });
    if (result.ok) setUser(result.value);
    return result;
  };
  // logIn / logOut follow the same shape

  const value = useMemo(() => ({ user, isLoading, login, signup, logout }),
    [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

Notes:
- `createAuthService()` in a `useRef` so the adapters are constructed once, not every
  render.
- The context imports from `application`, never from `infrastructure` — the composition
  root is the only place that knows the concrete adapters.
- `restore()` replaces the raw session read from the earlier plan; the use case owns that
  logic now.
- `useAuth()` throws outside a provider (a wiring bug, fail loudly).

## types.ts

```ts
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
};
```

Typed params so `navigation.navigate('Signup')` is checked at compile time.

## RootNavigator.tsx

A single `NavigationContainer` wrapping a `createNativeStackNavigator`. The stack always
declares all three screens; `RootNavigator` reads `user` and returns early:

```tsx
if (isLoading) return <SplashView />;
return (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Home" component={HomeScreen} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  </NavigationContainer>
);
```

The key decision: **auth state drives the navigator**, not navigation calls. When
`logout()` clears the user, Home unmounts and Login mounts automatically — no imperative
navigation anywhere in the auth flow. It also keeps a signed-in user from reaching Login or
Signup by swiping back, since those screens are not in the stack while authenticated.

The `isLoading` branch prevents a Login flash on every cold start while the Keychain read
resolves.

## Screens

All three share one pattern: map `AuthErrorKind` → user-facing copy, call the context
function, and surface the failure inline. That kind → copy mapping is the only place
UI strings appear.

```tsx
// authErrorMessages.ts — one map, used by both auth screens
export const authErrorMessages: Record<AuthErrorKind, string> = {
  'invalid-email': 'Enter a valid email address.',
  'weak-password': 'Password must be at least 6 characters.',
  'missing-fields': 'All fields are required.',
  'email-already-registered': 'An account with this email already exists.',
  'invalid-credentials': 'Incorrect email or password.',
};
```

- **LoginScreen** — email + password fields, primary Login button, secondary button to
  Signup. Local state: `email`, `password`, `errors`, `submitting`. Password uses
  `<PasswordInput><PasswordInput.Toggle /></PasswordInput>`. Clear a field's error as soon
  as that field is edited.
- **SignupScreen** — adds name, plus a "Go to Login" button calling `navigation.goBack()`.
  The context validates everything already; the screen validates on submit only to show
  errors before the round trip, collecting all failures at once rather than one per tap.
- **HomeScreen** — greets by name, shows email, renders a Logout button. No navigation
  call afterwards; the RootNavigator swap handles it. Center name and email on a card.

## App.tsx

Rewrite the stock template. Provider order matters:

```tsx
<SafeAreaProvider>
  <AuthProvider>
    <RootNavigator />
  </AuthProvider>
</SafeAreaProvider>
```

`AuthProvider` must be **outside** the navigator — the navigator reads auth state to decide
which screens exist. Remove the `NewAppScreen` import and the `useColorScheme` branching;
this app ships one light theme.

## Verification

`npx tsc --noEmit` and `npm run lint`, then the full manual pass on the simulator in
Task 8.