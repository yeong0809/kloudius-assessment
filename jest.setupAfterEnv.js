const { configure } = require('@testing-library/react-native');

// waitFor defaults to a 1s timeout, which a cold Jest transform blows straight through
// on a loaded machine — the suite then fails on machine speed rather than on behaviour.
// 5s costs nothing once the app is mounted, and a genuine hang still fails.
configure({ asyncUtilTimeout: 5000 });