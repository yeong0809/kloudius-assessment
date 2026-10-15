# Task 8 — Run the app & capture screenshots

Goal: prove it works on a real device, not just that it compiles. Everything above can
typecheck and still be wrong at runtime — a mis-ordered provider, a Keychain call that
throws on a real device, a session that fails to restore.

## Start Metro

```sh
npm start
```

## Build and run on iOS

```sh
npm run ios
```

If the new native modules were linked after the last build, the first run needs a clean
build. Watch the Metro output for a red screen — that is where a provider-ordering or
native-linking mistake shows up.

## Manual golden path

Work through this in order, on the simulator:

1. **Cold start** — Login appears directly, with no flash of an empty screen. If Home
   appears instead, a session was left behind from a previous run.
2. **Signup validation** — on Signup, submit with an email like `alice@` and a
   4-character password. Both errors appear together.
3. **Signup success** — a valid new email creates the account and lands on Home, showing
   the name and email just entered. No detour through Login.
4. **Duplicate email** — sign out, then sign up again with the same email: "An account
   with this email already exists."
5. **Login failure** — sign out, log in with the right email and a wrong password:
   "Incorrect email or password."
6. **Login success** — correct credentials reach Home.
7. **Persistence** — with the user signed in, kill the app entirely (swipe it off the
   simulator), relaunch. It opens **straight to Home**. This is the Keychain round trip;
   if it lands on Login, `RestoreSession` is not reading the session.
8. **Logout** — tap Logout: returns to Login, not Home.
9. **Password toggle** — the eye glyph toggles on both Login and Signup, and the field
   text reveals and hides.
10. **Back navigation** — while signed in, swipe back. You must not reach Login or
    Signup; they are not in the stack.

## Screenshots for the deliverable

Capture three, saved into `docs/` so the README can embed them:

- Login screen, clean
- Signup screen with a validation error visible
- Home screen showing the user's name and email

The assignment asks for screenshots or a short video; three stills covering the main
states satisfy it.

## Verification

Every step above observed passing, plus `npm test`, `npx tsc --noEmit`, and
`npm run lint` all green. That combination — logic tested, types clean, and the full flow
exercised on a device — is what makes the deliverable complete.