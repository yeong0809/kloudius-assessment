# Task 5 — Presentation components: reusable compound primitives

Goal: three self-contained component compounds that screens compose. No screen should
hand-roll an input or a button. These live in `src/presentation/components/` and import
only React and React Native — never the domain, never infrastructure.

## The pattern

Each compound is a namespace of parts sharing state through **one private context**. The
context is not exported — consumers use the namespace, never the context. This keeps the
API declarative at the call site while letting parts stay independently reusable.

```tsx
const FieldContext = createContext<FieldState>(…);   // private, not exported

export const Field = Object.assign(FieldRoot, {
  Label: FieldLabel,
  Input: FieldInput,
  Error: FieldError,
});
```

State lives in `FieldRoot` and flows down. `Field.Input` and `Field.Error` read
`FieldContext` for the invalid flag so the error styling and the red border can never
disagree.

## Files

- `src/presentation/components/Field.tsx`
- `src/presentation/components/PasswordInput.tsx`
- `src/presentation/components/Button.tsx`

## Field.tsx

```tsx
type FieldRootProps = { children: ReactNode; error?: string };
type FieldInputProps = TextInputProps;
```

- `Field` — root `View`. Owns `{ error }`.
- `Field.Label` — small muted caption above the input.
- `Field.Input` — `TextInput` with themed border, padding, radius. Applies the error
  border colour when invalid. Spreads `...props` last so callers can override anything.
- `Field.Error` — renders only when an error exists, in `colors.danger`. Reserves no
  vertical space when empty so the form does not jump as errors appear and clear.

Note the wiring to the domain: `Field` takes `error?: string` (copy), while the domain
returns `{ kind, field }` (a failure kind). A screen maps kind → string before handing it
down — that translation is presentation's job, not a component's.

One thing to get right: validation runs on blur and on submit, not on every keystroke.
Rejecting a half-typed email mid-keystroke makes the field feel hostile.

## PasswordInput.tsx

Composes the whole `Field` compound and contributes exactly **one** new part — the
visibility toggle from the assignment's bonus task. This is the payoff of the compound
approach: the bonus feature adds no duplicated field logic.

```tsx
export const PasswordInput = Object.assign(PasswordInputRoot, {
  Toggle: ToggleButton,
});
```

`ToggleButton` reads and writes a local `secureTextEntry` flag in the root and places an
eye / eye-off glyph in the input's right padding. Render it only when the caller includes
it as a child, so a caller can opt out.

Keep the glyph text-only (`👁` / `🙈`). `react-native-vector-icons` would add a font asset
and another native link for two characters. A vector icon swap is confined to `ToggleButton`
if a reviewer prefers it.

## Button.tsx

```tsx
type ButtonProps = { variant?: 'primary' | 'secondary'; loading?: boolean; onPress: () => void };
export const Button = Object.assign(ButtonRoot, { Label: ButtonLabel });
```

Pressable with the `pressed` state driving `colors.primaryPressed`. In `loading`, show an
`ActivityIndicator` and disable presses — that is what prevents the double-submit that
would otherwise create two accounts from one tap.

## Verification

`npx tsc --noEmit` and `npm run lint`. Visual and interaction checks happen in Task 8 on
the simulator: toggle the password field on both auth screens, confirm the glyph swaps and
the text reveals, and confirm a submitting button ignores taps.