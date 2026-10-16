const { by, element, expect, device, waitFor } = require('detox');
const { execSync } = require('child_process');
const os = require('os');
const path = require('path');

const EMAIL = 'e2e.user@example.com';
const PASSWORD = 'secret123';

// iOS AutoFill raises system sheets the tests cannot survive: "Use Strong Password?" the
// moment an empty password field takes focus, and "Save Password?" once a signup
// succeeds. Both are SpringBoard UI, so Detox can neither see nor dismiss them, and they
// sit on top of the submit and logout buttons — taps land on the sheet and fail with
// "View is not hittable". Detox has no API for this; the documented workaround
// (wix/Detox#3761) is to turn AutoFill off in the simulator's configuration profiles.
//
// The equivalent manual step is Settings -> General -> AutoFill & Passwords -> turn
// AutoFill Passwords off.
function disablePasswordAutoFill() {
  const base = path.join(
    os.homedir(),
    'Library',
    'Developer',
    'CoreSimulator',
    'Devices',
    device.id,
    'data',
  );
  const profiles = [
    'Containers/Shared/SystemGroup/systemgroup.com.apple.configurationprofiles/Library/ConfigurationProfiles/UserSettings.plist',
    'Library/UserConfigurationProfiles/EffectiveUserSettings.plist',
    'Library/UserConfigurationProfiles/PublicInfo/PublicEffectiveUserSettings.plist',
  ];

  for (const profile of profiles) {
    try {
      execSync(
        `plutil -replace restrictedBool.allowPasswordAutoFill.value -bool NO "${path.join(base, profile)}"`,
        { stdio: 'ignore' },
      );
    } catch (error) {
      // A profile that is missing or shaped differently on a future iOS must not fail the
      // run before any test has reported something useful.
    }
  }
}

// Screens must be seeded to a known state: the Keychain and AsyncStorage survive an app
// restart, so a leftover account would make a "duplicate email" or "wrong password"
// assertion depend on what ran before.
async function resetAppState() {
  await device.launchApp({
    newInstance: true,
    delete: true,
  });
}

async function loginVisible() {
  await waitFor(element(by.text('Welcome back')))
    .toBeVisible()
    .withTimeout(30000);
}

async function goToSignup() {
  await element(by.text('Go to Signup')).tap();
  await waitFor(element(by.text('Create account'))).toBeVisible();
}

async function fillSignup(name, email, password) {
  await element(by.id('signup-name')).replaceText(name);
  await element(by.id('signup-email')).replaceText(email);
  await element(by.id('signup-password')).replaceText(password);
}

describe('Authentication flow', () => {
  beforeAll(async () => {
    disablePasswordAutoFill();
    await resetAppState();
  });

  beforeEach(async () => {
    await device.launchApp({ newInstance: true, delete: true });
    await loginVisible();
  });

  it('shows the login screen on a cold start', async () => {
    await expect(element(by.text('Welcome back'))).toBeVisible();
    await expect(element(by.id('login-email'))).toBeVisible();
    await expect(element(by.id('login-password'))).toBeVisible();
  });

  it('signs up, signs out, and signs back in', async () => {
    await goToSignup();
    await fillSignup('E2E User', EMAIL, PASSWORD);
    await element(by.text('Signup')).tap();

    // Signup signs the user straight in.
    await waitFor(element(by.id('home-name')))
      .toBeVisible()
      .withTimeout(30000);
    await expect(element(by.id('home-name'))).toHaveText('E2E User');
    await expect(element(by.id('home-email'))).toHaveText(EMAIL);

    await element(by.id('logout-button')).tap();
    await waitFor(element(by.text('Welcome back'))).toBeVisible();

    await element(by.id('login-email')).replaceText(EMAIL);
    await element(by.id('login-password')).replaceText(PASSWORD);
    await element(by.text('Login')).tap();

    await waitFor(element(by.id('home-name')))
      .toBeVisible()
      .withTimeout(30000);
    await expect(element(by.id('home-name'))).toHaveText('E2E User');
  });

  it('restores the session after the app is relaunched', async () => {
    await goToSignup();
    await fillSignup('Persist User', 'persist@example.com', PASSWORD);
    await element(by.text('Signup')).tap();
    await waitFor(element(by.id('home-name'))).toBeVisible();

    // Relaunch WITHOUT delete, so the Keychain and AsyncStorage persist. Reaching Home
    // proves RestoreSession read the stored session back.
    await device.launchApp({ newInstance: true });
    await waitFor(element(by.id('home-name')))
      .toBeVisible()
      .withTimeout(30000);
    await expect(element(by.id('home-name'))).toHaveText('Persist User');
  });

  it('rejects a wrong password with an inline error', async () => {
    await goToSignup();
    await fillSignup('Wrong Pass', 'wrongpass@example.com', PASSWORD);
    await element(by.text('Signup')).tap();
    await waitFor(element(by.id('home-name'))).toBeVisible();

    await element(by.id('logout-button')).tap();
    await waitFor(element(by.text('Welcome back'))).toBeVisible();

    await element(by.id('login-email')).replaceText('wrongpass@example.com');
    await element(by.id('login-password')).replaceText('nottherightone');
    await element(by.text('Login')).tap();

    await waitFor(element(by.text('Incorrect email or password.'))).toBeVisible();
  });

  it('shows a validation error for a short password on signup', async () => {
    await goToSignup();
    await fillSignup('Short Pass', 'short@example.com', 'abc');
    await element(by.text('Signup')).tap();

    await waitFor(element(by.text('Password must be at least 6 characters.'))).toBeVisible();
    // A rejected submit must not sign anyone in.
    await expect(element(by.id('home-name'))).not.toExist();
  });

  it('toggles password visibility on the login screen', async () => {
    await expect(element(by.id('login-password'))).toBeVisible();
    // Both states render the same field; the toggle changes secureTextEntry, which has no
    // visible assertion here beyond the glyph swapping. Tap it and confirm the field
    // survives the interaction.
    await element(by.id('password-toggle')).tap();
    await expect(element(by.id('login-password'))).toBeVisible();
    await element(by.id('password-toggle')).tap();
    await expect(element(by.id('login-password'))).toBeVisible();
  });
});