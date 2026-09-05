import test from 'node:test';
import assert from 'node:assert/strict';
import { TitanLicense, LICENSE_CONFIG, LIC_KEYS } from './androidBridge.js';

// Mock localStorage for Node test runner
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

test('TitanLicense: compareVersions compares semantic versions correctly', () => {
  assert.equal(TitanLicense.compareVersions('1.2.0', '1.0.1'), 1);
  assert.equal(TitanLicense.compareVersions('1.0.1', '1.0.1'), 0);
  assert.equal(TitanLicense.compareVersions('1.0.0', '1.0.1'), -1);
  assert.equal(TitanLicense.compareVersions('v1.2.1', '1.2.0'), 1);
  assert.equal(TitanLicense.compareVersions('2.0.0', '1.9.9'), 1);
  assert.equal(TitanLicense.compareVersions('1.2', '1.2.0'), 0);
  assert.equal(TitanLicense.compareVersions('1.2.4', '1.2.10'), -1);
});

test('TitanLicense: configuration matches required Titan License server endpoints', () => {
  assert.equal(LICENSE_CONFIG.SERVER_URL, 'https://worldpixelmap.in/apps_suite/license.php');
  assert.equal(LICENSE_CONFIG.APP_SLUG, 'agev');
  assert.equal(LICENSE_CONFIG.APP_VERSION, '1.0.1');
  assert.equal(LICENSE_CONFIG.STORE_URL, 'https://worldpixelmap.in/apps_suite/product.php?slug=agev');
  assert.equal(LICENSE_CONFIG.PORTAL_URL, 'https://worldpixelmap.in/apps_suite/portal.php');
});

test('TitanLicense: device fingerprinting generates and persists a hardware ID', () => {
  const originalLocalStorage = globalThis.localStorage;
  globalThis.localStorage = new MockLocalStorage();

  try {
    const id1 = TitanLicense.getDeviceId();
    assert.ok(id1.startsWith('WEB-'));
    assert.ok(id1.length >= 10);

    const id2 = TitanLicense.getDeviceId();
    assert.equal(id1, id2, 'Device ID must be persistent across invocations');
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});

test('TitanLicense: fresh install requires mandatory one-time online handshake', async () => {
  const originalLocalStorage = globalThis.localStorage;
  const originalFetch = globalThis.fetch;
  globalThis.localStorage = new MockLocalStorage();

  // Simulate offline / network unreachable
  globalThis.fetch = () => Promise.reject(new Error('Failed to fetch'));

  try {
    assert.equal(TitanLicense.isTrialInitialized(), false);

    const result = await TitanLicense.checkTrial();
    assert.equal(result.isHandshakeRequired, true, 'Must require handshake when fresh and offline');
    assert.equal(result.trial_active, false);
    assert.ok(result.message.includes('One-time internet connection required'));
  } finally {
    globalThis.localStorage = originalLocalStorage;
    globalThis.fetch = originalFetch;
  }
});

test('TitanLicense: 100% offline trial counts down accurately with cryptographic epoch', async () => {
  const originalLocalStorage = globalThis.localStorage;
  const originalFetch = globalThis.fetch;
  const mockStorage = new MockLocalStorage();
  globalThis.localStorage = mockStorage;

  // Simulate offline
  globalThis.fetch = () => Promise.reject(new Error('Network offline'));

  try {
    const now = Date.now();
    const threeDaysMs = 3 * 86400000;
    const expiresEpoch = now + threeDaysMs;

    // Pre-seed initialized handshake state
    mockStorage.setItem(LIC_KEYS.TRIAL_INITIALIZED, 'true');
    mockStorage.setItem(LIC_KEYS.TRIAL_ACTIVE, 'true');
    mockStorage.setItem(LIC_KEYS.TRIAL_DAYS, '3');
    mockStorage.setItem(LIC_KEYS.TRIAL_EXPIRES_EPOCH, expiresEpoch.toString());
    mockStorage.setItem(LIC_KEYS.TRIAL_LAST_KNOWN_EPOCH, now.toString());
    mockStorage.setItem(LIC_KEYS.TRIAL_TOKEN, 'test-token');

    const result = await TitanLicense.checkTrial();
    assert.equal(result.trial_active, true);
    assert.equal(result.isHandshakeRequired, false);
    assert.equal(result.days_left, 3);
    assert.ok(result.message.includes('3 days remaining offline'));
  } finally {
    globalThis.localStorage = originalLocalStorage;
    globalThis.fetch = originalFetch;
  }
});

test('TitanLicense: anti-clock rollback guard revokes trial if clock is wound back', async () => {
  const originalLocalStorage = globalThis.localStorage;
  const originalFetch = globalThis.fetch;
  const mockStorage = new MockLocalStorage();
  globalThis.localStorage = mockStorage;

  // Simulate offline
  globalThis.fetch = () => Promise.reject(new Error('Network offline'));

  try {
    const now = Date.now();
    // Record a last known timestamp 2 hours in the future (tampering simulation)
    const futureTimestamp = now + (2 * 3600 * 1000);
    const expiresEpoch = now + (5 * 86400000);

    mockStorage.setItem(LIC_KEYS.TRIAL_INITIALIZED, 'true');
    mockStorage.setItem(LIC_KEYS.TRIAL_ACTIVE, 'true');
    mockStorage.setItem(LIC_KEYS.TRIAL_EXPIRES_EPOCH, expiresEpoch.toString());
    mockStorage.setItem(LIC_KEYS.TRIAL_LAST_KNOWN_EPOCH, futureTimestamp.toString());

    const result = await TitanLicense.checkTrial();
    assert.equal(result.trial_active, false, 'Trial must be deactivated on clock rollback');
    assert.ok(result.message.includes('Clock rollback detected'));

    // Check that local state was updated to locked
    assert.equal(mockStorage.getItem(LIC_KEYS.TRIAL_ACTIVE), 'false');
  } finally {
    globalThis.localStorage = originalLocalStorage;
    globalThis.fetch = originalFetch;
  }
});

test('TitanLicense: guaranteed lockout when device time reaches expiration epoch', async () => {
  const originalLocalStorage = globalThis.localStorage;
  const originalFetch = globalThis.fetch;
  const mockStorage = new MockLocalStorage();
  globalThis.localStorage = mockStorage;

  // Simulate offline
  globalThis.fetch = () => Promise.reject(new Error('Network offline'));

  try {
    const now = Date.now();
    // Expiration was 10 minutes ago
    const pastExpiresEpoch = now - (10 * 60 * 1000);

    mockStorage.setItem(LIC_KEYS.TRIAL_INITIALIZED, 'true');
    mockStorage.setItem(LIC_KEYS.TRIAL_ACTIVE, 'true');
    mockStorage.setItem(LIC_KEYS.TRIAL_DAYS, '1');
    mockStorage.setItem(LIC_KEYS.TRIAL_EXPIRES_EPOCH, pastExpiresEpoch.toString());
    mockStorage.setItem(LIC_KEYS.TRIAL_LAST_KNOWN_EPOCH, (pastExpiresEpoch - 60000).toString());

    const result = await TitanLicense.checkTrial();
    assert.equal(result.trial_active, false);
    assert.equal(result.days_left, 0);
    assert.equal(result.message, 'Trial has expired.');

    const info = TitanLicense.getLicenseInfo();
    assert.equal(info.isTrialExpired, true);
    assert.equal(info.status, 'TRIAL_EXPIRED');
  } finally {
    globalThis.localStorage = originalLocalStorage;
    globalThis.fetch = originalFetch;
  }
});

test('TitanLicense: license activation unlocks VIP tier and unbinds cleanly', async () => {
  const originalLocalStorage = globalThis.localStorage;
  const mockStorage = new MockLocalStorage();
  globalThis.localStorage = mockStorage;

  try {
    mockStorage.setItem(LIC_KEYS.ACTIVATED, 'true');
    mockStorage.setItem(LIC_KEYS.KEY, 'AGEV-TEST-KEY-1234');
    mockStorage.setItem(LIC_KEYS.CUSTOMER, 'Commander Shepard');
    mockStorage.setItem(LIC_KEYS.TIER, 'VIP');
    mockStorage.setItem(LIC_KEYS.EXPIRES, '2028-12-31 23:59:59');

    assert.equal(TitanLicense.isActivated(), true);
    const info = TitanLicense.getLicenseInfo();
    assert.equal(info.isActivated, true);
    assert.equal(info.customerName, 'Commander Shepard');
    assert.equal(info.tier, 'VIP');
    assert.equal(info.status, 'ACTIVE');

    // Deactivation clears VIP state
    await TitanLicense.deactivate();
    assert.equal(TitanLicense.isActivated(), false);
    assert.equal(mockStorage.getItem(LIC_KEYS.KEY), null);
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});
