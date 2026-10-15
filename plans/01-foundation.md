# Task 1 — Foundation: dependencies & theme tokens

Goal: get every new native module linked and establish the visual language the rest of
the app builds on.

## Steps

1. Confirm the install completed:

```sh
npm ls @react-navigation/native @react-navigation/native-stack react-native-screens @react-native-async-storage/async-storage react-native-keychain js-sha256
```

2. Re-run CocoaPods. `react-native-screens`, `react-native-keychain`, and
   `async-storage` are native modules and are not linked until this runs:

```sh
bundle exec pod install
```

3. Create the theme tokens and the layer directories.

## Theme

`src/presentation/theme/colors.ts` — one palette, referenced everywhere. No raw hex
outside this file.

```ts
export const colors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  primary: '#3B5BDB',
  primaryPressed: '#3249A8',
  text: '#1B1E28',
  textMuted: '#6B7280',
  border: '#DDE1E8',
  danger: '#D64545',
  dangerSurface: '#FDECEC',
} as const;
```

`src/presentation/theme/spacing.ts` — a 4px scale, named semantically so no screen
hardcodes `24`:

```ts
export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;
```

## Layer directories

```sh
mkdir -p src/domain/auth \
         src/application/auth \
         src/infrastructure/{keychain,storage,hashing} \
         src/presentation/{components,screens,navigation,context,theme}
```

Only `domain` is required to exist before Task 2. The rest get their contents later, but
creating the tree now makes the layering visible from the start.

## The inward rule

Before writing any file, note which direction its imports may go:

- `src/domain/**` imports **nothing** from this project. No React, no React Native, no
  storage library. If a domain file needs a type from outside `domain`, that is a signal
  the type belongs in the domain.
- `src/application/**` imports from `domain` only.
- `src/infrastructure/**` imports from `domain` only (it implements domain interfaces).
- `src/presentation/**` imports from `application` and `domain`.

If you catch yourself wanting infrastructure code inside a use case, that is the boundary
telling you it wants to be injected instead.

## Verification

`npx tsc --noEmit` passes and `pod install` reports no errors. Nothing renders yet, so
there is nothing visual to check at this stage.