/**
 * @file androidBridge.js
 * @description In-app BYOK (Bring Your Own Key) manager, hardware licensing,
 * and Android Native bridge for God's Eye View v1.0.1.
 */

export const GEV_KEYS = {
  GOOGLE_MAPS: 'GOOGLE_MAPS_API_KEY',
  OPENAI: 'OPENAI_API_KEY',
  AISSTREAM: 'AISSTREAM_API_KEY',
  NASA_FIRMS: 'FIRMS_MAP_KEY',
  TOMTOM: 'TOMTOM_API_KEY',
  CESIUM_ION: 'CESIUM_ION_TOKEN',
};

const STORAGE_PREFIX = 'GEV_KEY_';

export const KEY_SPECS = {
  [GEV_KEYS.GOOGLE_MAPS]: {
    name: 'Google Photorealistic 3D Tiles',
    category: 'Map & 3D Globe',
    required: false,
    freeQuota: '1,000 free 3-hour sessions per month',
    description: 'Powers high-resolution photorealistic 3D cities and global 3D tile geometry.',
    fallback: 'OpenStreetMap + Re:Earth 3D Terrain (100% Free & Keyless)',
    signupUrl: 'https://console.cloud.google.com/google/maps-apis/credentials',
    guideSteps: [
      'Go to Google Cloud Console (console.cloud.google.com).',
      'Create a new project (e.g. "GodsEyeView").',
      'Navigate to "APIs & Services" > "Library" and enable "Map Tiles API".',
      'Go to "Credentials", click "Create Credentials" > "API Key".',
      '(Optional but recommended) Under Key Restrictions, select API restrictions: "Map Tiles API".',
      'Copy the key and paste it here.',
    ],
  },
  [GEV_KEYS.OPENAI]: {
    name: 'OpenAI Realtime Voice & AI HUD',
    category: 'AI & Voice Agent',
    required: false,
    freeQuota: 'Pay-per-usage (cents/minute on gpt-realtime-mini)',
    description: 'Enables hands-free conversational voice commands (GEV MIC) and real-time visual scene analysis.',
    fallback: 'Voice is disabled; full tactical touch/mouse HUD navigation remains 100% functional.',
    signupUrl: 'https://platform.openai.com/api-keys',
    guideSteps: [
      'Log into platform.openai.com with your OpenAI account.',
      'Go to "API Keys" in the dashboard.',
      'Click "Create new secret key", name it "GodsEyeView".',
      'Copy the generated key (starts with sk-...) and paste it here.',
      'Ensure your OpenAI account has at least $1 in credit balance to use Realtime models.',
    ],
  },
  [GEV_KEYS.AISSTREAM]: {
    name: 'AISStream Live Marine Vessels',
    category: 'Live Telemetry',
    required: false,
    freeQuota: '100% Free instant developer key',
    description: 'Streams real-time worldwide cargo, tanker, passenger, and maritime ship telemetry via WebSocket.',
    fallback: 'Vessels layer is inactive when key is missing.',
    signupUrl: 'https://aisstream.io/',
    guideSteps: [
      'Visit aisstream.io and click "Sign Up".',
      'Create a free account with your email.',
      'Go to your dashboard to generate your API Key.',
      'Copy the key and paste it here.',
    ],
  },
  [GEV_KEYS.NASA_FIRMS]: {
    name: 'NASA FIRMS Active Wildfires',
    category: 'Live Telemetry',
    required: false,
    freeQuota: '100% Free key from NASA EOSDIS',
    description: 'Displays active thermal anomalies and global wildfires from VIIRS & MODIS satellite sensors.',
    fallback: 'Fires layer is inactive when key is missing.',
    signupUrl: 'https://firms.modaps.eosdis.nasa.gov/api/map_key/',
    guideSteps: [
      'Visit the NASA FIRMS Map Key generator page.',
      'Enter your email address and click "Get MAP KEY".',
      'Check your inbox for the confirmation email containing your MAP KEY.',
      'Paste your key here.',
    ],
  },
  [GEV_KEYS.TOMTOM]: {
    name: 'TomTom Live Traffic Flow',
    category: 'Live Telemetry',
    required: false,
    freeQuota: 'Free tier (~50,000 tile requests/day)',
    description: 'Colors street-level traffic according to live rush-hour jams and vehicular speeds.',
    fallback: 'Built-in animated traffic simulation (white dots with standard road-speed flow).',
    signupUrl: 'https://developer.tomtom.com/',
    guideSteps: [
      'Sign up for a free account at developer.tomtom.com.',
      'Go to "Keys" in your dashboard.',
      'Copy your primary API Key and paste it here.',
    ],
  },
  [GEV_KEYS.CESIUM_ION]: {
    name: 'Cesium Ion Access Token',
    category: 'Map & 3D Globe',
    required: false,
    freeQuota: '100% Free personal community tier',
    description: 'Enables Bing Aerial satellite imagery and Cesium World Terrain elevation data.',
    fallback: 'Re:Earth 3D Terrain / OSM (Keyless).',
    signupUrl: 'https://ion.cesium.com/signup',
    guideSteps: [
      'Create a free account at ion.cesium.com.',
      'Go to "Access Tokens" tab.',
      'Copy your default token (or create one with assets:read permission).',
      'Paste it here.',
    ],
  },
};

/**
 * KeyStore: manages persistent in-browser keys, fallback to env, and connection tests.
 */
class KeyStore {
  constructor() {
    this._listeners = new Set();
  }

  getKey(id) {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_PREFIX + id);
        if (stored && stored.trim()) return stored.trim();
      }
    } catch {}
    try {
      const envVal = (typeof import.meta !== 'undefined' && import.meta?.env?.[id])
        || (typeof process !== 'undefined' && process?.env?.[id]);
      if (envVal && typeof envVal === 'string' && envVal.trim()) return envVal.trim();
    } catch {}
    return '';
  }

  setKey(id, value) {
    const trimmed = (value || '').trim();
    try {
      if (typeof localStorage !== 'undefined') {
        if (trimmed) {
          localStorage.setItem(STORAGE_PREFIX + id, trimmed);
        } else {
          localStorage.removeItem(STORAGE_PREFIX + id);
        }
      }
    } catch (err) {
      console.warn('[KeyStore] Failed to write to localStorage:', err);
    }
    this._notify(id, trimmed);
  }

  removeKey(id) {
    this.setKey(id, '');
  }

  hasKey(id) {
    return Boolean(this.getKey(id));
  }

  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notify(id, value) {
    for (const listener of this._listeners) {
      try {
        listener(id, value);
      } catch (err) {
        console.error('[KeyStore] Listener error:', err);
      }
    }
  }

  async testKey(id, explicitValue) {
    const key = explicitValue !== undefined ? explicitValue.trim() : this.getKey(id);
    if (!key) return { ok: false, message: 'Key is empty' };

    try {
      switch (id) {
        case GEV_KEYS.GOOGLE_MAPS: {
          const url = `https://tile.googleapis.com/v1/createSession?key=${encodeURIComponent(key)}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mapType: 'satellite', language: 'en-US', region: 'US' }),
          });
          if (res.ok) return { ok: true, message: 'Google 3D Tiles API key is valid!' };
          const errData = await res.json().catch(() => ({}));
          return {
            ok: false,
            message: `Google Maps Error: ${errData.error?.message || `HTTP ${res.status}: ${res.statusText}`}`,
          };
        }
        case GEV_KEYS.OPENAI: {
          const res = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${key}` },
          });
          if (res.ok) return { ok: true, message: 'OpenAI API key is valid!' };
          const errData = await res.json().catch(() => ({}));
          return {
            ok: false,
            message: `OpenAI Error: ${errData.error?.message || `HTTP ${res.status} (Unauthorized or invalid key)`}`,
          };
        }
        case GEV_KEYS.NASA_FIRMS: {
          const url = `https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/${encodeURIComponent(key)}/VIIRS_NOAA20_NRT`;
          try {
            const res = await fetch(url);
            if (res.ok) {
              const txt = await res.text();
              if (!txt.toLowerCase().includes('invalid') && !txt.toLowerCase().includes('error')) {
                return { ok: true, message: 'NASA FIRMS key is valid!' };
              }
            }
            return { ok: false, message: 'NASA FIRMS key was rejected by provider' };
          } catch (err) {
            // Direct client fetch can be blocked by CORS on some browser origins
            if (/^[a-fA-F0-9]{32}$/.test(key)) {
              return { ok: true, message: 'NASA FIRMS key format verified (32-character hex key)!' };
            }
            return { ok: false, message: `NASA FIRMS connection test: ${err.message || err}` };
          }
        }
        case GEV_KEYS.TOMTOM: {
          const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point=30.2672,-97.7431&unit=KMPH&key=${encodeURIComponent(key)}`;
          const res = await fetch(url);
          if (res.ok) return { ok: true, message: 'TomTom API key is valid!' };
          const errData = await res.json().catch(() => ({}));
          return {
            ok: false,
            message: `TomTom Error: ${errData.message || errData.detailedError?.message || `HTTP ${res.status}`}`,
          };
        }
        case GEV_KEYS.CESIUM_ION: {
          const url = `https://api.cesium.com/v1/assets?access_token=${encodeURIComponent(key)}`;
          const res = await fetch(url);
          if (res.ok) return { ok: true, message: 'Cesium Ion token is valid!' };
          const errData = await res.json().catch(() => ({}));
          return { ok: false, message: `Cesium Ion Error: ${errData.message || `HTTP ${res.status}`}` };
        }
        case GEV_KEYS.AISSTREAM: {
          if (key.length >= 10 && /^[a-zA-Z0-9_\-.]+$/.test(key)) {
            return { ok: true, message: 'AISStream API key format verified!' };
          }
          return { ok: false, message: 'AISStream key appears invalid (must be >= 10 characters).' };
        }
        default:
          return { ok: true, message: 'Key saved.' };
      }
    } catch (e) {
      return { ok: false, message: `Connection test failed: ${e.message || e}` };
    }
  }
}

export const keyStore = new KeyStore();

/**
 * Titan License Client for Hardware Protection & Upgrades
 */
export const LICENSE_CONFIG = {
  SERVER_URL: 'https://worldpixelmap.in/apps_suite/license.php',
  APP_SLUG: 'agev',
  APP_NAME: "God's Eye View",
  APP_VERSION: '1.0.1',
  STORE_URL: 'https://worldpixelmap.in/apps_suite/product.php?slug=agev',
  PORTAL_URL: 'https://worldpixelmap.in/apps_suite/portal.php',
  OFFLINE_GRACE_MS: 7 * 24 * 60 * 60 * 1000,
};

export const LIC_KEYS = {
  ACTIVATED: 'gev_lic_activated',
  KEY: 'gev_lic_key',
  CUSTOMER: 'gev_lic_customer',
  TIER: 'gev_lic_tier',
  EXPIRES: 'gev_lic_expires',
  TOKEN: 'gev_lic_token',
  LAST_VERIFIED: 'gev_lic_last_verified',
  TRIAL_INITIALIZED: 'gev_trial_initialized',
  TRIAL_ACTIVE: 'gev_trial_active',
  TRIAL_DAYS: 'gev_trial_days',
  TRIAL_EXPIRES_EPOCH: 'gev_trial_expires_epoch',
  TRIAL_LAST_KNOWN_EPOCH: 'gev_trial_last_known_epoch',
  TRIAL_TOKEN: 'gev_trial_token',
  DEVICE_ID: 'gev_web_device_id',
};

export class TitanLicense {
  static _getItem(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {}
    return null;
  }

  static _setItem(key, value) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {}
  }

  static _removeItem(key) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {}
  }

  static isAndroid() {
    return typeof window !== 'undefined' && Boolean(window.AndroidBridge && window.AndroidBridge.isAndroid?.());
  }

  static getDeviceId() {
    let id = this._getItem(LIC_KEYS.DEVICE_ID);
    if (!id) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = 'WEB-' + crypto.randomUUID().toUpperCase();
      } else {
        id = 'WEB-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
      }
      this._setItem(LIC_KEYS.DEVICE_ID, id);
    }
    return id;
  }

  static getDeviceModel() {
    if (typeof navigator === 'undefined') return 'Desktop Workstation (Web)';
    const ua = navigator.userAgent || '';
    if (ua.includes('Windows')) return 'Windows Desktop (Web)';
    if (ua.includes('Macintosh')) return 'macOS Workstation (Web)';
    if (ua.includes('Linux')) return 'Linux Station (Web)';
    if (ua.includes('Android')) return 'Android Device (Web)';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'Apple iOS (Web)';
    return 'Web Intelligence Console';
  }

  static isTrialInitialized() {
    if (this.isAndroid() && window.AndroidBridge?.isTrialInitialized) {
      return Boolean(window.AndroidBridge.isTrialInitialized());
    }
    return this._getItem(LIC_KEYS.TRIAL_INITIALIZED) === 'true';
  }

  static isActivated() {
    if (this.isAndroid() && window.AndroidBridge?.isActivated) {
      return Boolean(window.AndroidBridge.isActivated());
    }
    return this._getItem(LIC_KEYS.ACTIVATED) === 'true';
  }

  static getLicenseInfo() {
    if (this.isAndroid() && window.AndroidBridge?.getLicenseInfo) {
      try {
        return JSON.parse(window.AndroidBridge.getLicenseInfo());
      } catch (e) {
        console.warn('[LicenseBridge] Error parsing Android license info:', e);
      }
    }

    const activated = this.isActivated();
    const trialInitialized = this.isTrialInitialized();
    const trialActive = this._getItem(LIC_KEYS.TRIAL_ACTIVE) === 'true';
    const trialDays = parseInt(this._getItem(LIC_KEYS.TRIAL_DAYS) || '0', 10);
    const expiresEpoch = parseInt(this._getItem(LIC_KEYS.TRIAL_EXPIRES_EPOCH) || '0', 10);
    const lastKnown = parseInt(this._getItem(LIC_KEYS.TRIAL_LAST_KNOWN_EPOCH) || '0', 10);
    const now = Date.now();

    const isClockRollback = lastKnown > 0 && now < (lastKnown - 60000);
    const isExpired = !activated && (!trialActive || (expiresEpoch > 0 && now >= expiresEpoch) || isClockRollback);

    return {
      isActivated: activated,
      licenseKey: this._getItem(LIC_KEYS.KEY) || '',
      customerName: this._getItem(LIC_KEYS.CUSTOMER) || 'Valued Commander',
      tier: this._getItem(LIC_KEYS.TIER) || 'FREE',
      expiresAt: this._getItem(LIC_KEYS.EXPIRES) || 'Lifetime',
      status: activated ? 'ACTIVE' : (!isExpired && trialActive) ? 'TRIAL_ACTIVE' : 'TRIAL_EXPIRED',
      isTrialInitialized: trialInitialized,
      isTrialActive: !isExpired && trialActive,
      trialDaysLeft: isExpired ? 0 : trialDays,
      trialExpiresEpoch: expiresEpoch,
      isTrialExpired: isExpired,
      deviceId: this.getDeviceId(),
      deviceModel: this.getDeviceModel(),
      appVersion: LICENSE_CONFIG.APP_VERSION,
      lastVerifiedAt: parseInt(this._getItem(LIC_KEYS.LAST_VERIFIED) || '0', 10),
    };
  }

  static async activate(rawKey) {
    const key = (rawKey || '').trim().toUpperCase();
    if (!key) return { success: false, error: 'License key cannot be empty.' };

    if (this.isAndroid() && window.AndroidBridge?.activateLicense) {
      try {
        const resStr = window.AndroidBridge.activateLicense(key);
        return JSON.parse(resStr);
      } catch (e) {
        console.warn('[LicenseBridge] Android activateLicense error:', e);
      }
    }

    try {
      const payload = {
        action: 'activate',
        app_slug: LICENSE_CONFIG.APP_SLUG,
        license_key: key,
        device_id: this.getDeviceId(),
        device_model: this.getDeviceModel(),
        app_version: LICENSE_CONFIG.APP_VERSION,
      };
      const res = await fetch(LICENSE_CONFIG.SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        this._setItem(LIC_KEYS.ACTIVATED, 'true');
        this._setItem(LIC_KEYS.KEY, key);
        this._setItem(LIC_KEYS.CUSTOMER, data.customer_name || 'Valued Commander');
        this._setItem(LIC_KEYS.TIER, data.tier || 'PRO');
        this._setItem(LIC_KEYS.EXPIRES, data.expires_at || 'Lifetime');
        this._setItem(LIC_KEYS.TOKEN, data.token || '');
        this._setItem(LIC_KEYS.LAST_VERIFIED, Date.now().toString());

        // Dismiss lockout gate & handshake gate if present
        document.getElementById('gev-lockout-gate')?.remove();
        document.getElementById('gev-handshake-gate')?.remove();

        return { success: true, message: data.message || 'License Activated Successfully!', data };
      }
      return { success: false, error: data.error || data.message || 'Activation failed.' };
    } catch (e) {
      return { success: false, error: 'Network error connecting to license server: ' + (e.message || e) };
    }
  }

  static async verify() {
    if (this.isAndroid() && window.AndroidBridge?.verifyLicense) {
      try {
        const resStr = window.AndroidBridge.verifyLicense();
        return JSON.parse(resStr);
      } catch (e) {
        console.warn('[LicenseBridge] Android verifyLicense error:', e);
      }
    }

    const key = this._getItem(LIC_KEYS.KEY);
    if (!key) return { success: false, status: 'UNACTIVATED' };

    try {
      const payload = {
        action: 'verify',
        app_slug: LICENSE_CONFIG.APP_SLUG,
        license_key: key,
        device_id: this.getDeviceId(),
      };
      const res = await fetch(LICENSE_CONFIG.SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.status === 'ACTIVE') {
        this._setItem(LIC_KEYS.LAST_VERIFIED, Date.now().toString());
        if (data.tier) this._setItem(LIC_KEYS.TIER, data.tier);
        if (data.expires_at) this._setItem(LIC_KEYS.EXPIRES, data.expires_at);
        return { success: true, status: 'ACTIVE', data };
      }
      this._setItem(LIC_KEYS.ACTIVATED, 'false');
      return { success: false, status: data.status || 'UNBOUND', error: data.error || data.message };
    } catch {
      const last = parseInt(this._getItem(LIC_KEYS.LAST_VERIFIED) || '0', 10);
      if (last > 0 && Date.now() - last < LICENSE_CONFIG.OFFLINE_GRACE_MS) {
        return { success: true, status: 'OFFLINE_GRACE', isOfflineGrace: true };
      }
      return { success: false, status: 'OFFLINE_EXPIRED', error: 'Offline grace expired.' };
    }
  }

  static async checkTrial() {
    if (this.isAndroid() && window.AndroidBridge?.checkTrial) {
      try {
        return JSON.parse(window.AndroidBridge.checkTrial());
      } catch (e) {
        console.warn('[LicenseBridge] Error calling Android checkTrial:', e);
      }
    }

    if (this.isActivated()) {
      return {
        success: true,
        trial_active: false,
        days_left: 0,
        isHandshakeRequired: false,
        message: 'Licensed',
      };
    }

    try {
      const payload = {
        action: 'check_trial',
        app_slug: LICENSE_CONFIG.APP_SLUG,
        app_name: LICENSE_CONFIG.APP_NAME,
        device_id: this.getDeviceId(),
        device_model: this.getDeviceModel(),
      };

      const res = await fetch(LICENSE_CONFIG.SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const trialActive = Boolean(data.trial_active);
      const daysLeft = typeof data.days_left === 'number' ? data.days_left : 0;
      const expiresEpoch = typeof data.trial_expires_epoch === 'number' && data.trial_expires_epoch > 0
        ? data.trial_expires_epoch
        : (Date.now() + (daysLeft * 86400000));
      const token = data.token || '';
      const message = data.message || (trialActive ? `Trial is active (${daysLeft} days remaining).` : 'Trial expired.');

      this._setItem(LIC_KEYS.TRIAL_INITIALIZED, 'true');
      this._setItem(LIC_KEYS.TRIAL_ACTIVE, trialActive ? 'true' : 'false');
      this._setItem(LIC_KEYS.TRIAL_DAYS, daysLeft.toString());
      this._setItem(LIC_KEYS.TRIAL_EXPIRES_EPOCH, expiresEpoch.toString());
      this._setItem(LIC_KEYS.TRIAL_TOKEN, token);
      this._setItem(LIC_KEYS.TRIAL_LAST_KNOWN_EPOCH, Date.now().toString());

      return {
        success: true,
        trial_active: trialActive,
        days_left: daysLeft,
        trial_expires_epoch: expiresEpoch,
        message,
        isHandshakeRequired: false,
      };
    } catch {
      // Offline fallback: check if mandatory handshake was completed
      if (!this.isTrialInitialized()) {
        return {
          success: false,
          trial_active: false,
          days_left: 0,
          isHandshakeRequired: true,
          message: 'One-time internet connection required to start your free trial.',
        };
      }

      const now = Date.now();
      const lastKnown = parseInt(this._getItem(LIC_KEYS.TRIAL_LAST_KNOWN_EPOCH) || '0', 10);
      const expiresEpoch = parseInt(this._getItem(LIC_KEYS.TRIAL_EXPIRES_EPOCH) || '0', 10);

      // Anti-Clock Rollback Guard (1-min tolerance: 60,000ms)
      if (lastKnown > 0 && now < (lastKnown - 60000)) {
        this._setItem(LIC_KEYS.TRIAL_ACTIVE, 'false');
        return {
          success: true,
          trial_active: false,
          days_left: 0,
          isHandshakeRequired: false,
          message: 'Clock rollback detected. Please restore correct system time.',
        };
      }

      // Guaranteed Expiration Check
      if (expiresEpoch > 0 && now >= expiresEpoch) {
        this._setItem(LIC_KEYS.TRIAL_ACTIVE, 'false');
        this._setItem(LIC_KEYS.TRIAL_DAYS, '0');
        return {
          success: true,
          trial_active: false,
          days_left: 0,
          isHandshakeRequired: false,
          message: 'Trial has expired.',
        };
      }

      // Offline active calculation
      const msRemaining = expiresEpoch > 0 ? (expiresEpoch - now) : 0;
      const calculatedDays = msRemaining > 0 ? Math.ceil(msRemaining / 86400000) : 1;
      this._setItem(LIC_KEYS.TRIAL_LAST_KNOWN_EPOCH, Math.max(lastKnown, now).toString());
      this._setItem(LIC_KEYS.TRIAL_DAYS, calculatedDays.toString());

      return {
        success: true,
        trial_active: true,
        days_left: calculatedDays,
        trial_expires_epoch: expiresEpoch,
        isHandshakeRequired: false,
        message: `Trial active (${calculatedDays} days remaining offline).`,
      };
    }
  }

  static async checkUpdate() {
    try {
      const payload = { action: 'check_update', app_slug: LICENSE_CONFIG.APP_SLUG };
      const res = await fetch(LICENSE_CONFIG.SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        const latest = data.latest_version || LICENSE_CONFIG.APP_VERSION;
        const hasUpdate = this.compareVersions(latest, LICENSE_CONFIG.APP_VERSION) > 0;
        return { ...data, isUpdateAvailable: hasUpdate };
      }
      return { success: false, isUpdateAvailable: false };
    } catch (e) {
      return { success: false, isUpdateAvailable: false, error: e.message || String(e) };
    }
  }

  static async deactivate() {
    if (this.isAndroid() && window.AndroidBridge?.deactivateLicense) {
      try {
        const resStr = window.AndroidBridge.deactivateLicense();
        return JSON.parse(resStr);
      } catch (e) {
        console.warn('[LicenseBridge] Android deactivateLicense error:', e);
      }
    }

    const key = this._getItem(LIC_KEYS.KEY);
    if (key) {
      try {
        await fetch(LICENSE_CONFIG.SERVER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'deactivate',
            license_key: key,
            device_id: this.getDeviceId(),
          }),
        });
      } catch (e) {
        console.warn('[License] Deactivate network error:', e);
      }
    }
    this._removeItem(LIC_KEYS.ACTIVATED);
    this._removeItem(LIC_KEYS.KEY);
    this._removeItem(LIC_KEYS.CUSTOMER);
    this._removeItem(LIC_KEYS.TOKEN);
    this._removeItem(LIC_KEYS.TIER);
    this._removeItem(LIC_KEYS.EXPIRES);
    this._removeItem(LIC_KEYS.LAST_VERIFIED);
    return { success: true };
  }

  static compareVersions(v1, v2) {
    const p1 = (v1 || '').replace(/^v/i, '').split('.').map(x => parseInt(x, 10) || 0);
    const p2 = (v2 || '').replace(/^v/i, '').split('.').map(x => parseInt(x, 10) || 0);
    const len = Math.max(p1.length, p2.length);
    for (let i = 0; i < len; i++) {
      const a = p1[i] || 0;
      const b = p2[i] || 0;
      if (a !== b) return a > b ? 1 : -1;
    }
    return 0;
  }

  static showInitialHandshakeOverlay() {
    if (typeof document === 'undefined') return;
    if (this.isAndroid() && window.AndroidBridge?.showInitialHandshakeDialog) {
      window.AndroidBridge.showInitialHandshakeDialog();
      return;
    }

    if (document.getElementById('gev-handshake-gate')) return;
    injectModalStyles();

    const gate = document.createElement('div');
    gate.id = 'gev-handshake-gate';
    gate.className = 'gev-gate-backdrop';
    gate.innerHTML = `
      <div class="gev-gate-card">
        <div class="gev-gate-icon">🌐</div>
        <h2 class="gev-gate-title">One-Time Setup Required</h2>
        <div class="gev-gate-sub">TITAN HARDWARE PROTECTION · INITIAL SETUP</div>
        <p class="gev-gate-desc">
          Connect once to start your 7-day free trial. Afterwards, the app works 100% offline!
        </p>
        <div id="gev-handshake-status" class="gev-gate-status gev-gate-status-err" style="display:none;"></div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <button type="button" id="gev-btn-handshake-connect" class="gev-btn gev-btn-primary" style="padding:12px; font-size:13px;">
            ⚡ Connect & Start Free Trial
          </button>
          <button type="button" id="gev-btn-handshake-key" class="gev-btn gev-btn-secondary" style="padding:10px; font-size:12px;">
            🔑 I Have a License Key
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(gate);

    const btnConnect = gate.querySelector('#gev-btn-handshake-connect');
    const btnKey = gate.querySelector('#gev-btn-handshake-key');
    const statusBox = gate.querySelector('#gev-handshake-status');

    btnConnect.addEventListener('click', async () => {
      btnConnect.disabled = true;
      btnConnect.textContent = '⏳ Verifying Connection...';
      statusBox.style.display = 'none';

      const res = await this.checkTrial();
      if (res.trial_active) {
        gate.remove();
        this.showTrialStartupAlert(res.days_left);
        this.startWatchdog();
      } else if (res.isHandshakeRequired) {
        statusBox.style.display = 'block';
        statusBox.textContent = '✕ Connection required. Please check your network and retry.';
        btnConnect.disabled = false;
        btnConnect.textContent = '⚡ Retry Connection';
      } else {
        gate.remove();
        this.showHardLockoutOverlay();
      }
    });

    btnKey.addEventListener('click', () => {
      this.showActivationModal({
        onActivated: () => {
          gate.remove();
        },
      });
    });
  }

  static showHardLockoutOverlay() {
    if (typeof document === 'undefined') return;
    if (this.isAndroid() && window.AndroidBridge?.showHardLockoutDialog) {
      window.AndroidBridge.showHardLockoutDialog();
      return;
    }

    if (document.getElementById('gev-lockout-gate')) return;
    injectModalStyles();

    const gate = document.createElement('div');
    gate.id = 'gev-lockout-gate';
    gate.className = 'gev-gate-backdrop';
    gate.innerHTML = `
      <div class="gev-gate-card gev-gate-lockout">
        <div class="gev-gate-icon" style="color:#ff4d6d;">🔒</div>
        <h2 class="gev-gate-title">Trial Period Expired</h2>
        <div class="gev-gate-sub" style="color:#ff4d6d;">GOD'S EYE VIEW TELEMETRY LOCKED</div>
        <p class="gev-gate-desc">
          Your free evaluation has ended. To continue using God's Eye View with live satellite, ADS-B, radar, and maritime telemetry, please enter a valid license key or purchase a subscription.
        </p>
        <div class="gev-form-group" style="margin:16px 0;">
          <input type="text" id="gev-lockout-key-input" class="gev-input gev-input-key" placeholder="AGEV-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false" style="width:100%; box-sizing:border-box; padding:10px;" />
        </div>
        <div id="gev-lockout-status" class="gev-gate-status gev-gate-status-err" style="display:none;"></div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <button type="button" id="gev-btn-lockout-activate" class="gev-btn gev-btn-primary" style="padding:12px; font-size:13px;">
            ⚡ Activate License
          </button>
          <div style="display:flex; gap:8px;">
            <a href="${LICENSE_CONFIG.STORE_URL}" target="_blank" rel="noopener noreferrer" class="gev-btn" style="flex:1; text-align:center; background:rgba(255,200,59,0.15); border:1px solid #ffc83b; color:#ffc83b; text-decoration:none; padding:10px 6px; font-size:11px; border-radius:4px; font-weight:600;">
              🛒 Buy License Key
            </a>
            <a href="${LICENSE_CONFIG.PORTAL_URL}" target="_blank" rel="noopener noreferrer" class="gev-btn" style="flex:1; text-align:center; background:rgba(15,23,42,0.8); border:1px solid #1f334a; color:#8ea8c4; text-decoration:none; padding:10px 6px; font-size:11px; border-radius:4px; font-weight:600;">
              🖥️ Device Portal
            </a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(gate);

    const input = gate.querySelector('#gev-lockout-key-input');
    const btnActivate = gate.querySelector('#gev-btn-lockout-activate');
    const statusBox = gate.querySelector('#gev-lockout-status');

    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase();
    });

    btnActivate.addEventListener('click', async () => {
      const rawKey = input.value.trim();
      if (!rawKey) {
        statusBox.style.display = 'block';
        statusBox.textContent = 'Please enter your license key.';
        return;
      }
      btnActivate.disabled = true;
      btnActivate.textContent = '⏳ Activating...';
      statusBox.style.display = 'none';

      const res = await this.activate(rawKey);
      if (res.success) {
        gate.remove();
        alert('✓ ' + (res.message || 'License Activated Successfully!'));
      } else {
        statusBox.style.display = 'block';
        statusBox.textContent = '✕ ' + (res.error || 'Activation failed.');
        btnActivate.disabled = false;
        btnActivate.textContent = '⚡ Activate License';
      }
    });
  }

  static showActivationModal(options = {}) {
    if (typeof document === 'undefined') return;
    if (this.isAndroid() && window.AndroidBridge?.showActivationDialog) {
      window.AndroidBridge.showActivationDialog();
      return;
    }

    injectModalStyles();
    const existing = document.getElementById('gev-activation-modal');
    if (existing) existing.remove();

    const info = this.getLicenseInfo();
    const modal = document.createElement('div');
    modal.id = 'gev-activation-modal';
    modal.className = 'gev-config-backdrop';
    modal.style.display = 'flex';
    modal.style.zIndex = '99999999';
    modal.innerHTML = `
      <div class="gev-config-dialog" style="max-width:480px; width:92vw;" role="dialog" aria-modal="true">
        <div class="gev-config-header">
          <div class="gev-config-title-wrap">
            <span class="gev-config-icon">🛡️</span>
            <div>
              <h2 class="gev-config-title">TITAN LICENSE ACTIVATION</h2>
              <div class="gev-config-subtitle">HARDWARE-BOUND DEVICE ENROLLMENT</div>
            </div>
          </div>
          <button type="button" class="gev-config-close-btn" id="gev-activation-close">✕</button>
        </div>
        <div class="gev-config-body" style="padding:18px;">
          <div style="font-size:11px; color:#8ea8c4; margin-bottom:14px; background:rgba(2,6,23,0.7); padding:8px 12px; border-radius:4px; border:1px solid #1e293b;">
            Device ID: <code style="color:#00f0ff; font-weight:700;">${info.deviceId.slice(0, 18)}...</code><br>
            Model: <span style="color:#cbd5e1;">${info.deviceModel}</span>
          </div>
          <div class="gev-form-group" style="margin-bottom:14px;">
            <label style="display:block; font-size:11px; font-weight:700; color:#cbd5e1; margin-bottom:6px; letter-spacing:0.05em;">ENTER LICENSE KEY</label>
            <input type="text" id="gev-act-key-input" class="gev-input gev-input-key" placeholder="AGEV-XXXX-XXXX-XXXX" value="${info.licenseKey || ''}" autocomplete="off" spellcheck="false" style="width:100%; box-sizing:border-box; padding:10px;" />
          </div>
          <div id="gev-act-status" class="gev-gate-status gev-gate-status-err" style="display:none; margin-bottom:12px;"></div>
          <button type="button" id="gev-btn-act-submit" class="gev-btn gev-btn-primary" style="width:100%; padding:12px; font-size:13px; margin-bottom:12px;">
            ⚡ Activate License Key
          </button>
          <div style="display:flex; gap:8px;">
            <a href="${LICENSE_CONFIG.STORE_URL}" target="_blank" rel="noopener noreferrer" class="gev-btn" style="flex:1; text-align:center; background:rgba(255,200,59,0.15); border:1px solid #ffc83b; color:#ffc83b; text-decoration:none; padding:10px 6px; font-size:11px; border-radius:4px; font-weight:600;">
              🛒 Buy License Key
            </a>
            <a href="${LICENSE_CONFIG.PORTAL_URL}" target="_blank" rel="noopener noreferrer" class="gev-btn" style="flex:1; text-align:center; background:rgba(15,23,42,0.8); border:1px solid #1f334a; color:#8ea8c4; text-decoration:none; padding:10px 6px; font-size:11px; border-radius:4px; font-weight:600;">
              🖥️ Device Portal
            </a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#gev-activation-close');
    const input = modal.querySelector('#gev-act-key-input');
    const submitBtn = modal.querySelector('#gev-btn-act-submit');
    const statusBox = modal.querySelector('#gev-act-status');

    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });

    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase();
    });

    submitBtn.addEventListener('click', async () => {
      const rawKey = input.value.trim();
      if (!rawKey) {
        statusBox.style.display = 'block';
        statusBox.textContent = 'Please enter your license key.';
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Activating...';
      statusBox.style.display = 'none';

      const res = await this.activate(rawKey);
      if (res.success) {
        modal.remove();
        alert('✓ ' + (res.message || 'License Activated Successfully!'));
        options.onActivated?.(res);
      } else {
        statusBox.style.display = 'block';
        statusBox.textContent = '✕ ' + (res.error || 'Activation failed.');
        submitBtn.disabled = false;
        submitBtn.textContent = '⚡ Activate License Key';
      }
    });
  }

  static showManageLicenseModal(options = {}) {
    if (typeof document === 'undefined') return;
    if (this.isAndroid() && window.AndroidBridge?.showLicenseManagementDialog) {
      window.AndroidBridge.showLicenseManagementDialog();
      return;
    }

    injectModalStyles();
    const existing = document.getElementById('gev-manage-modal');
    if (existing) existing.remove();

    const info = this.getLicenseInfo();
    const modal = document.createElement('div');
    modal.id = 'gev-manage-modal';
    modal.className = 'gev-config-backdrop';
    modal.style.display = 'flex';
    modal.style.zIndex = '99999999';
    modal.innerHTML = `
      <div class="gev-config-dialog" style="max-width:480px; width:92vw;" role="dialog" aria-modal="true">
        <div class="gev-config-header">
          <div class="gev-config-title-wrap">
            <span class="gev-config-icon">🛡️</span>
            <div>
              <h2 class="gev-config-title">TITAN LICENSE STATUS</h2>
              <div class="gev-config-subtitle">HARDWARE-BOUND VIP ENROLLMENT</div>
            </div>
          </div>
          <button type="button" class="gev-config-close-btn" id="gev-manage-close">✕</button>
        </div>
        <div class="gev-config-body" style="padding:18px;">
          <div style="display:flex; flex-direction:column; gap:10px; font-size:12px; color:#cbd5e1; margin-bottom:18px;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #1e293b; padding-bottom:6px;">
              <span style="color:#8ea8c4;">Customer:</span>
              <span style="color:#fff; font-weight:700;">${info.customerName}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #1e293b; padding-bottom:6px;">
              <span style="color:#8ea8c4;">Tier:</span>
              <span style="color:#00f0ff; font-weight:700;">${info.tier} VIP</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #1e293b; padding-bottom:6px;">
              <span style="color:#8ea8c4;">Expires:</span>
              <span style="color:#fff;">${info.expiresAt}</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #1e293b; padding-bottom:6px;">
              <span style="color:#8ea8c4;">License Key:</span>
              <span style="font-family:monospace; color:#00ff88;">${info.licenseKey.slice(0, 10)}...</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #1e293b; padding-bottom:6px;">
              <span style="color:#8ea8c4;">Device Fingerprint:</span>
              <span style="font-family:monospace; color:#38bdf8;">${info.deviceId.slice(0, 16)}...</span>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <button type="button" id="gev-btn-unbind" class="gev-btn" style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; color:#f87171; padding:10px; font-size:12px; font-weight:600; border-radius:4px;">
              🚫 Unlink / Deactivate This Device
            </button>
            <div style="display:flex; gap:8px;">
              <a href="${LICENSE_CONFIG.PORTAL_URL}" target="_blank" rel="noopener noreferrer" class="gev-btn" style="flex:1; text-align:center; background:rgba(15,23,42,0.8); border:1px solid #1f334a; color:#8ea8c4; text-decoration:none; padding:10px 6px; font-size:11px; border-radius:4px; font-weight:600;">
                🖥️ Device Portal
              </a>
              <a href="${LICENSE_CONFIG.STORE_URL}" target="_blank" rel="noopener noreferrer" class="gev-btn" style="flex:1; text-align:center; background:rgba(255,200,59,0.15); border:1px solid #ffc83b; color:#ffc83b; text-decoration:none; padding:10px 6px; font-size:11px; border-radius:4px; font-weight:600;">
                🛒 Purchase Licenses
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#gev-manage-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelector('#gev-btn-unbind').addEventListener('click', async () => {
      if (confirm('Are you sure you want to unbind and deactivate this device from your license?')) {
        modal.remove();
        await this.deactivate();
        alert('Device unlinked successfully.');
        options.onDeactivated?.();
        this.showHardLockoutOverlay();
      }
    });
  }

  static showTrialStartupAlert(daysLeft) {
    if (typeof document === 'undefined') return;
    if (document.getElementById('gev-trial-toast')) return;
    injectModalStyles();

    const toast = document.createElement('div');
    toast.id = 'gev-trial-toast';
    toast.className = 'gev-trial-toast';
    toast.innerHTML = `
      <span style="font-size:18px;">⏳</span>
      <div>
        Free Trial Active: <strong style="color:#ffc83b;">${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining</strong>.
      </div>
      <div style="display:flex; gap:8px; margin-left:auto;">
        <button type="button" id="gev-btn-trial-continue" class="gev-btn gev-btn-secondary" style="padding:4px 8px; font-size:11px;">
          Continue
        </button>
        <button type="button" id="gev-btn-trial-activate" class="gev-btn gev-btn-primary" style="padding:4px 8px; font-size:11px;">
          ⚡ Activate Key
        </button>
      </div>
    `;
    document.body.appendChild(toast);

    toast.querySelector('#gev-btn-trial-continue').addEventListener('click', () => toast.remove());
    toast.querySelector('#gev-btn-trial-activate').addEventListener('click', () => {
      toast.remove();
      this.showActivationModal();
    });

    setTimeout(() => {
      if (toast && toast.parentNode) toast.remove();
    }, 15000);
  }

  static showUpdateModal(updateData) {
    if (typeof document === 'undefined') return;
    if (this.isAndroid() && window.AndroidBridge?.checkForUpdates) {
      window.AndroidBridge.checkForUpdates();
      return;
    }

    injectModalStyles();
    const existing = document.getElementById('gev-update-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'gev-update-modal';
    modal.className = 'gev-config-backdrop';
    modal.style.display = 'flex';
    modal.style.zIndex = '99999999';
    modal.innerHTML = `
      <div class="gev-config-dialog" style="max-width:500px; width:92vw;" role="dialog" aria-modal="true">
        <div class="gev-config-header">
          <div class="gev-config-title-wrap">
            <span class="gev-config-icon">🚀</span>
            <div>
              <h2 class="gev-config-title">UPDATE AVAILABLE: v${updateData.latest_version}</h2>
              <div class="gev-config-subtitle">CURRENT VERSION: v${LICENSE_CONFIG.APP_VERSION}</div>
            </div>
          </div>
          <button type="button" class="gev-config-close-btn" id="gev-update-close">✕</button>
        </div>
        <div class="gev-config-body" style="padding:18px;">
          <div style="font-size:11px; color:#8ea8c4; margin-bottom:12px;">
            ${updateData.min_requirements ? `Platform: <strong style="color:#cbd5e1;">${updateData.min_requirements}</strong> · ` : ''}
            ${updateData.file_size ? `Download Size: <strong style="color:#cbd5e1;">${updateData.file_size}</strong>` : ''}
          </div>
          <div style="font-size:11px; font-weight:700; color:#38bdf8; margin-bottom:6px; letter-spacing:0.05em;">NEW FEATURES & CHANGELOG:</div>
          <pre style="background:rgba(2,6,23,0.85); border:1px solid rgba(56,189,248,0.2); border-radius:4px; padding:12px; font-size:11px; color:#cbd5e1; white-space:pre-wrap; max-height:160px; overflow-y:auto; margin-bottom:18px; font-family:Inter, sans-serif;">${updateData.features || 'General performance optimizations and telemetry enhancements.'}</pre>
          <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button type="button" class="gev-btn gev-btn-secondary" id="gev-btn-update-later" style="padding:8px 16px;">Later</button>
            <a href="${updateData.download_url || LICENSE_CONFIG.STORE_URL}" target="_blank" rel="noopener noreferrer" class="gev-btn gev-btn-primary" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px; padding:8px 16px;">
              ⬇ Download Update
            </a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#gev-update-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#gev-btn-update-later').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });
  }

  static startWatchdog() {
    if (typeof window === 'undefined') return;
    if (this._watchdogTimer) clearInterval(this._watchdogTimer);
    this._watchdogTimer = setInterval(() => {
      if (this.isActivated()) {
        clearInterval(this._watchdogTimer);
        this._watchdogTimer = null;
        return;
      }

      const now = Date.now();
      const lastKnown = parseInt(this._getItem(LIC_KEYS.TRIAL_LAST_KNOWN_EPOCH) || '0', 10);
      const expiresEpoch = parseInt(this._getItem(LIC_KEYS.TRIAL_EXPIRES_EPOCH) || '0', 10);

      // Anti-Clock Rollback Guard (1-min tolerance: 60,000ms)
      if (lastKnown > 0 && now < (lastKnown - 60000)) {
        this._setItem(LIC_KEYS.TRIAL_ACTIVE, 'false');
        clearInterval(this._watchdogTimer);
        this._watchdogTimer = null;
        this.showHardLockoutOverlay();
        return;
      }

      // Guaranteed Expiration Check
      if (expiresEpoch > 0 && now >= expiresEpoch) {
        this._setItem(LIC_KEYS.TRIAL_ACTIVE, 'false');
        this._setItem(LIC_KEYS.TRIAL_DAYS, '0');
        clearInterval(this._watchdogTimer);
        this._watchdogTimer = null;
        this.showHardLockoutOverlay();
        return;
      }

      if (now > lastKnown) {
        this._setItem(LIC_KEYS.TRIAL_LAST_KNOWN_EPOCH, now.toString());
      }
    }, 30000);
  }

  static async initProtection() {
    if (this.isAndroid()) {
      // In Android, MainActivity.kt runs startup licensing checks and native dialogs
      return;
    }

    const info = this.getLicenseInfo();

    if (info.isActivated) {
      // Heartbeat verify in background
      this.verify().then(res => {
        if (!res.success && (res.status === 'UNBOUND' || res.status === 'EXPIRED' || res.status === 'REVOKED' || res.status === 'SUSPENDED')) {
          this.showHardLockoutOverlay();
        }
      }).catch(() => {});
    } else {
      const trialResult = await this.checkTrial();
      if (trialResult.isHandshakeRequired) {
        this.showInitialHandshakeOverlay();
      } else if (trialResult.trial_active) {
        this.showTrialStartupAlert(trialResult.days_left);
        this.startWatchdog();
      } else {
        this.showHardLockoutOverlay();
      }
    }

    // In-app update check
    this.checkUpdate().then(update => {
      if (update && update.isUpdateAvailable) {
        this.showUpdateModal(update);
      }
    }).catch(() => {});
  }
}

/**
 * In-App Tactical BYOK & License Vault Modal
 */
let modalEl = null;
let isOpen = false;

export function initKeyConfigModal() {
  if (modalEl) return;

  modalEl = document.createElement('div');
  modalEl.id = 'gev-config-modal-backdrop';
  modalEl.className = 'gev-config-backdrop';
  modalEl.style.display = 'none';
  modalEl.innerHTML = `
    <div class="gev-config-dialog" role="dialog" aria-modal="true" aria-labelledby="gev-config-title">
      <div class="gev-config-header">
        <div class="gev-config-title-wrap">
          <span class="gev-config-icon">⚙️</span>
          <div>
            <h2 id="gev-config-title" class="gev-config-title">SYSTEM CONFIGURATION & LICENSE VAULT</h2>
            <div class="gev-config-subtitle">TITAN HARDWARE PROTECTION · BRING YOUR OWN KEY (BYOK) · OPEN-SOURCE TILES</div>
          </div>
        </div>
        <button type="button" class="gev-config-close-btn" id="gev-config-close" title="Close [Esc]">✕</button>
      </div>

      <div class="gev-config-status-bar">
        <div class="gev-config-status-item">
          <span class="status-label">LICENSE:</span>
          <span class="status-val" id="gev-license-status">CHECKING...</span>
        </div>
        <div class="gev-config-status-item">
          <span class="status-label">GLOBE ENGINE:</span>
          <span class="status-val" id="gev-engine-status">CHECKING...</span>
        </div>
        <div class="gev-config-status-item">
          <span class="status-label">KEYLESS LAYERS:</span>
          <span class="status-val active">10 ACTIVE (100% FREE)</span>
        </div>
        <div class="gev-config-status-item">
          <span class="status-label">APP VERSION:</span>
          <span class="status-val">v${LICENSE_CONFIG.APP_VERSION}</span>
        </div>
      </div>

      <div class="gev-config-body" id="gev-config-body">
        <!-- Rendered dynamically -->
      </div>

      <div class="gev-config-footer">
        <div class="gev-config-footer-left">
          <button type="button" class="gev-btn gev-btn-secondary" id="gev-config-clear-all">Clear User Keys</button>
        </div>
        <div class="gev-config-footer-right">
          <button type="button" class="gev-btn gev-btn-secondary" id="gev-config-cancel">Cancel</button>
          <button type="button" class="gev-btn gev-btn-primary" id="gev-config-save">💾 Save & Apply</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  document.getElementById('gev-config-close').addEventListener('click', hideKeyConfigModal);
  document.getElementById('gev-config-cancel').addEventListener('click', hideKeyConfigModal);
  modalEl.addEventListener('click', e => {
    if (e.target === modalEl) hideKeyConfigModal();
  });

  document.getElementById('gev-config-save').addEventListener('click', saveAndApplyKeys);
  document.getElementById('gev-config-clear-all').addEventListener('click', () => {
    if (confirm('Clear all saved personal API keys and revert to open-source defaults?')) {
      for (const keyId of Object.values(GEV_KEYS)) {
        keyStore.removeKey(keyId);
      }
      renderCards();
      updateStatusBar();
    }
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) hideKeyConfigModal();
  });

  injectModalStyles();
}

export function showKeyConfigModal() {
  initKeyConfigModal();
  renderCards();
  updateStatusBar();
  modalEl.style.display = 'flex';
  isOpen = true;
}

export function hideKeyConfigModal() {
  if (modalEl) {
    modalEl.style.display = 'none';
    isOpen = false;
  }
}

function updateStatusBar() {
  const engineStatus = document.getElementById('gev-engine-status');
  if (engineStatus) {
    if (keyStore.hasKey(GEV_KEYS.GOOGLE_MAPS)) {
      engineStatus.innerHTML = '<span style="color:#00ff88;">● GOOGLE 3D TILES</span>';
    } else {
      engineStatus.innerHTML = '<span style="color:#38bdf8;">● OSM + RE:EARTH (FREE)</span>';
    }
  }

  const licenseStatus = document.getElementById('gev-license-status');
  if (licenseStatus) {
    const info = TitanLicense.getLicenseInfo();
    if (info.isActivated) {
      licenseStatus.innerHTML = `<span style="color:#00f0ff; font-weight:700;">● ${info.tier} VIP</span>`;
    } else if (info.isTrialActive && !info.isTrialExpired) {
      licenseStatus.innerHTML = `<span style="color:#ffc83b; font-weight:700;">● TRIAL (${info.trialDaysLeft}d left)</span>`;
    } else {
      licenseStatus.innerHTML = '<span style="color:#ff4d6d; font-weight:700;">✕ EXPIRED</span>';
    }
  }
}

function renderCards() {
  const body = document.getElementById('gev-config-body');
  if (!body) return;
  body.innerHTML = '';

  // 1. Titan Hardware License Card
  const licInfo = TitanLicense.getLicenseInfo();
  const licCard = document.createElement('div');
  licCard.className = 'gev-key-card gev-license-card';
  licCard.id = 'card-titan-license';

  let badgeColor = '#ffc83b';
  let badgeText = `○ TRIAL (${licInfo.trialDaysLeft} DAYS LEFT)`;
  if (licInfo.isActivated) {
    badgeColor = '#00f0ff';
    badgeText = `● ${licInfo.tier} VIP ACTIVE`;
  } else if (licInfo.isTrialExpired) {
    badgeColor = '#ff4d6d';
    badgeText = '✕ EXPIRED / LOCKED';
  }

  licCard.innerHTML = `
    <div class="gev-key-header">
      <div class="gev-key-info">
        <div class="gev-key-title-row">
          <span class="gev-key-name" style="color:#00f0ff; font-weight:700; display:flex; align-items:center; gap:8px;">
            <span>🛡️</span> TITAN HARDWARE LICENSE VAULT
          </span>
          <span class="gev-badge" style="background:${badgeColor}22; color:${badgeColor}; border:1px solid ${badgeColor};">
            ${badgeText}
          </span>
        </div>
        <div class="gev-key-desc">
          ${
            licInfo.isActivated
              ? `Licensed to <strong>${licInfo.customerName}</strong> (${licInfo.expiresAt}) · Device: <code>${licInfo.deviceId.slice(0, 16)}...</code>`
              : `Hardware fingerprint bound to device (${licInfo.deviceModel}). Full access to satellite, ADS-B, radar & CCTV telemetry.`
          }
        </div>
      </div>
    </div>

    <div class="gev-license-actions-row" style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
      <button type="button" class="gev-btn gev-btn-action" id="gev-btn-manage-lic" style="background:rgba(0,240,255,0.15); border:1px solid #00f0ff; color:#00f0ff;">
        ${licInfo.isActivated ? '⚙️ Manage / Unlink Device' : '⚡ Enter License Key'}
      </button>
      <a href="${LICENSE_CONFIG.STORE_URL}" target="_blank" rel="noopener noreferrer" class="gev-btn gev-btn-action" style="background:rgba(255,200,59,0.15); border:1px solid #ffc83b; color:#ffc83b; text-decoration:none; display:inline-flex; align-items:center;">
        🛒 Buy License Key
      </a>
      <button type="button" class="gev-btn gev-btn-action" id="gev-btn-check-update" style="background:rgba(15,23,42,0.8); border:1px solid #1f334a; color:#8ea8c4;">
        🔄 Check Updates
      </button>
      <a href="${LICENSE_CONFIG.PORTAL_URL}" target="_blank" rel="noopener noreferrer" class="gev-btn gev-btn-action" style="background:rgba(15,23,42,0.8); border:1px solid #1f334a; color:#8ea8c4; text-decoration:none; display:inline-flex; align-items:center;">
        🖥️ Device Portal
      </a>
    </div>
  `;
  body.appendChild(licCard);

  licCard.querySelector('#gev-btn-manage-lic')?.addEventListener('click', () => {
    if (TitanLicense.isAndroid()) {
      if (licInfo.isActivated) {
        window.AndroidBridge.showLicenseManagementDialog();
      } else {
        window.AndroidBridge.showActivationDialog();
      }
    } else {
      if (licInfo.isActivated) {
        TitanLicense.showManageLicenseModal({
          onDeactivated: () => {
            renderCards();
            updateStatusBar();
          },
        });
      } else {
        TitanLicense.showActivationModal({
          onActivated: () => {
            renderCards();
            updateStatusBar();
          },
        });
      }
    }
  });

  licCard.querySelector('#gev-btn-check-update')?.addEventListener('click', () => {
    if (TitanLicense.isAndroid()) {
      window.AndroidBridge.checkForUpdates();
    } else {
      TitanLicense.checkUpdate().then(res => {
        if (res.isUpdateAvailable) {
          TitanLicense.showUpdateModal(res);
        } else if (res.success) {
          alert(`✓ God's Eye View is up to date (v${LICENSE_CONFIG.APP_VERSION})`);
        } else {
          alert('Could not reach update server.');
        }
      });
    }
  });

  // 2. Render Provider Key Cards
  Object.entries(KEY_SPECS).forEach(([id, spec]) => {
    const currentVal = keyStore.getKey(id);
    const isSet = Boolean(currentVal);

    const card = document.createElement('div');
    card.className = 'gev-key-card';
    card.id = `card-${id}`;
    card.innerHTML = `
      <div class="gev-key-header">
        <div class="gev-key-info">
          <div class="gev-key-title-row">
            <span class="gev-key-name">${spec.name}</span>
            <span class="gev-badge ${isSet ? 'badge-configured' : 'badge-fallback'}">
              ${isSet ? '● CONFIGURED' : '○ KEYLESS FALLBACK'}
            </span>
          </div>
          <div class="gev-key-desc">${spec.description}</div>
          <div class="gev-key-meta-line">
            <span class="meta-tag free-tag">Quota: ${spec.freeQuota}</span>
            <span class="meta-tag fallback-tag">Fallback: ${spec.fallback}</span>
          </div>
        </div>
      </div>

      <div class="gev-key-input-row">
        <div class="gev-input-wrap">
          <input 
            type="password" 
            class="gev-key-input" 
            id="input-${id}" 
            placeholder="Paste your ${spec.name} here..." 
            value="${currentVal}"
            autocomplete="off"
            spellcheck="false"
          />
          <button type="button" class="gev-input-btn gev-btn-clear" data-target="input-${id}" title="Clear field">✕</button>
          <button type="button" class="gev-input-btn gev-toggle-vis-btn" data-target="input-${id}" title="Toggle visibility">👁️</button>
        </div>
        <button type="button" class="gev-btn gev-btn-action paste-key-btn" data-target="input-${id}" title="Paste key from clipboard">📋 Paste</button>
        <button type="button" class="gev-btn gev-btn-action test-key-btn" data-keyid="${id}">🧪 Test</button>
        <button type="button" class="gev-btn gev-btn-action guide-key-btn" data-target="guide-${id}">📖 Guide</button>
      </div>

      <div class="gev-test-result" id="result-${id}" style="display:none;"></div>

      <div class="gev-key-guide" id="guide-${id}" style="display:none;">
        <div class="gev-guide-inner">
          <div class="gev-guide-title">How to get your free key:</div>
          <ol class="gev-guide-steps">
            ${spec.guideSteps.map(step => `<li>${step}</li>`).join('')}
          </ol>
          <a href="${spec.signupUrl}" target="_blank" rel="noopener noreferrer" class="gev-guide-link">
            Open Provider Portal ↗ (${new URL(spec.signupUrl).hostname})
          </a>
        </div>
      </div>
    `;

    body.appendChild(card);

    // Live badge updating on user typing or pasting
    const inputEl = card.querySelector(`#input-${id}`);
    const badgeEl = card.querySelector('.gev-badge');
    if (inputEl && badgeEl) {
      inputEl.addEventListener('input', () => {
        const hasVal = Boolean(inputEl.value.trim());
        badgeEl.className = `gev-badge ${hasVal ? 'badge-configured' : 'badge-fallback'}`;
        badgeEl.textContent = hasVal ? '● CONFIGURED' : '○ KEYLESS FALLBACK';
      });
    }
  });

  // Clear button handlers
  body.querySelectorAll('.gev-btn-clear').forEach(btn => {
    btn.addEventListener('click', e => {
      const targetId = e.currentTarget.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      }
    });
  });

  // Paste button handlers
  body.querySelectorAll('.paste-key-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const targetId = e.currentTarget.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      try {
        if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
          const clipText = await navigator.clipboard.readText();
          if (clipText && clipText.trim()) {
            input.value = clipText.trim();
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
            return;
          }
        }
      } catch (err) {
        console.warn('[KeyConfig] Clipboard readText failed:', err);
      }

      // Fallback prompt for environments with strict clipboard security
      const manual = prompt('Paste your API Key:', input.value || '');
      if (manual !== null) {
        input.value = manual.trim();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      }
    });
  });

  // Toggle visibility button handlers
  body.querySelectorAll('.gev-toggle-vis-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const targetId = e.currentTarget.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        e.currentTarget.textContent = isPassword ? '🙈' : '👁️';
      }
    });
  });

  // Toggle guide button handlers
  body.querySelectorAll('.guide-key-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const targetId = e.currentTarget.getAttribute('data-target');
      const guide = document.getElementById(targetId);
      if (guide) {
        const isHidden = guide.style.display === 'none';
        guide.style.display = isHidden ? 'block' : 'none';
        e.currentTarget.classList.toggle('active', isHidden);
      }
    });
  });

  // Test key button handlers
  body.querySelectorAll('.test-key-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const keyId = e.currentTarget.getAttribute('data-keyid');
      const input = document.getElementById(`input-${keyId}`);
      const result = document.getElementById(`result-${keyId}`);
      if (!input || !result) return;

      const val = input.value.trim();
      if (!val) {
        result.style.display = 'block';
        result.className = 'gev-test-result result-warn';
        result.textContent = 'Input is empty. Enter or paste a key to test.';
        return;
      }

      result.style.display = 'block';
      result.className = 'gev-test-result result-loading';
      result.textContent = 'Testing connection with provider...';

      const res = await keyStore.testKey(keyId, val);
      if (res.ok) {
        result.className = 'gev-test-result result-ok';
        result.textContent = '✓ ' + res.message;
      } else {
        result.className = 'gev-test-result result-err';
        result.textContent = '✕ ' + res.message;
      }
    });
  });
}

function saveAndApplyKeys() {
  let changed = false;
  let reloadNeeded = false;
  const changedKeys = [];

  for (const keyId of Object.values(GEV_KEYS)) {
    const input = document.getElementById(`input-${keyId}`);
    if (input) {
      const oldVal = keyStore.getKey(keyId);
      const newVal = input.value.trim();
      if (oldVal !== newVal) {
        keyStore.setKey(keyId, newVal);
        changed = true;
        changedKeys.push(keyId);
        if (keyId === GEV_KEYS.GOOGLE_MAPS) {
          window.__GOOGLE_MAPS_API_KEY__ = newVal || undefined;
          if (window.Cesium) Cesium.GoogleMaps.defaultApiKey = newVal || undefined;
          reloadNeeded = true;
        }
        if (keyId === GEV_KEYS.CESIUM_ION) {
          if (window.Cesium) Cesium.Ion.defaultAccessToken = newVal || undefined;
          reloadNeeded = true;
        }
      }
    }
  }

  hideKeyConfigModal();

  if (changed) {
    try {
      window.dispatchEvent(new CustomEvent('gev:keys-updated', { detail: { changedKeys } }));
    } catch {}

    if (reloadNeeded) {
      const ok = confirm('Globe 3D map engine keys have been updated. Reload the page now to apply the new 3D engine?');
      if (ok) window.location.reload();
    } else {
      alert('✓ Configuration saved! Telemetry layers will use the updated credentials.');
    }
  }
}

function injectModalStyles() {
  if (document.getElementById('gev-config-styles')) return;

  const style = document.createElement('style');
  style.id = 'gev-config-styles';
  style.textContent = `
    .gev-config-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(4, 8, 16, 0.85);
      backdrop-filter: blur(8px);
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
      color: #e2e8f0;
      box-sizing: border-box;
    }

    .gev-config-dialog {
      background: #0b111e;
      border: 1px solid rgba(0, 255, 136, 0.25);
      border-radius: 8px;
      width: 90vw;
      max-width: 820px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 0 40px rgba(0, 255, 136, 0.1), 0 20px 40px rgba(0, 0, 0, 0.8);
      overflow: hidden;
    }

    .gev-config-header {
      padding: 16px 20px;
      background: rgba(15, 23, 42, 0.9);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .gev-config-title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .gev-config-icon {
      font-size: 24px;
    }

    .gev-config-title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #00ff88;
      text-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
    }

    .gev-config-subtitle {
      font-size: 11px;
      color: #94a3b8;
      letter-spacing: 0.05em;
      margin-top: 2px;
    }

    .gev-config-close-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #94a3b8;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .gev-config-close-btn:hover {
      color: #fff;
      border-color: #00ff88;
      background: rgba(0, 255, 136, 0.1);
    }

    .gev-config-status-bar {
      padding: 8px 20px;
      background: rgba(8, 14, 26, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      gap: 20px;
      font-size: 11px;
      letter-spacing: 0.05em;
      flex-wrap: wrap;
    }

    .gev-config-status-item .status-label {
      color: #64748b;
      margin-right: 6px;
    }

    .gev-config-status-item .status-val {
      font-weight: 600;
      color: #cbd5e1;
    }

    .gev-config-status-item .status-val.active {
      color: #00ff88;
    }

    .gev-config-body {
      padding: 16px 20px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .gev-key-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 14px 16px;
      transition: border-color 0.2s;
    }

    .gev-key-card:hover {
      border-color: rgba(0, 255, 136, 0.25);
    }

    .gev-key-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .gev-key-name {
      font-weight: 600;
      font-size: 13px;
      color: #f1f5f9;
    }

    .gev-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }

    .badge-configured {
      background: rgba(0, 255, 136, 0.15);
      color: #00ff88;
      border: 1px solid rgba(0, 255, 136, 0.4);
    }

    .badge-fallback {
      background: rgba(56, 189, 248, 0.1);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.25);
    }

    .gev-key-desc {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.4;
      margin-bottom: 8px;
    }

    .gev-key-meta-line {
      display: flex;
      gap: 8px;
      font-size: 11px;
    }

    .meta-tag {
      padding: 2px 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.04);
      color: #64748b;
    }

    .free-tag {
      color: #38bdf8;
    }

    .fallback-tag {
      color: #a855f7;
    }

    .gev-key-input-row {
      display: flex;
      gap: 8px;
      margin-top: 10px;
      align-items: center;
    }

    .gev-input-wrap {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }

    .gev-key-input {
      width: 100%;
      background: #060b14;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      padding: 8px 60px 8px 10px;
      color: #f8fafc;
      font-family: monospace;
      font-size: 12px;
      outline: none;
      transition: border-color 0.2s;
      -webkit-user-select: text;
      user-select: text;
      touch-action: manipulation;
    }

    .gev-key-input:focus {
      border-color: #00ff88;
      box-shadow: 0 0 8px rgba(0, 255, 136, 0.2);
    }

    .gev-input-btn {
      position: absolute;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 13px;
      padding: 3px 5px;
      border-radius: 3px;
      transition: all 0.15s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .gev-input-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    .gev-btn-clear {
      right: 32px;
      font-size: 11px;
      color: #64748b;
    }

    .gev-btn-clear:hover {
      color: #f87171;
    }

    .gev-toggle-vis-btn {
      right: 6px;
    }

    .paste-key-btn {
      background: rgba(0, 212, 255, 0.12);
      border: 1px solid rgba(0, 212, 255, 0.4);
      color: #00d4ff;
    }

    .paste-key-btn:hover {
      background: rgba(0, 212, 255, 0.25);
      border-color: #00d4ff;
      color: #fff;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
    }

    .gev-btn {
      padding: 7px 14px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: all 0.2s;
      outline: none;
    }

    .gev-btn-action {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #cbd5e1;
    }

    .gev-btn-action:hover, .gev-btn-action.active {
      border-color: #00ff88;
      color: #00ff88;
      background: rgba(0, 255, 136, 0.1);
    }

    .gev-btn-secondary {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #94a3b8;
    }

    .gev-btn-secondary:hover {
      color: #fff;
      border-color: rgba(255, 255, 255, 0.4);
    }

    .gev-btn-primary {
      background: #00ff88;
      border: 1px solid #00ff88;
      color: #040810;
      font-weight: 700;
    }

    .gev-btn-primary:hover {
      background: #05e079;
      box-shadow: 0 0 12px rgba(0, 255, 136, 0.4);
    }

    .gev-test-result {
      margin-top: 8px;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-family: monospace;
    }

    .result-loading {
      background: rgba(56, 189, 248, 0.1);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    .result-ok {
      background: rgba(0, 255, 136, 0.1);
      color: #00ff88;
      border: 1px solid rgba(0, 255, 136, 0.3);
    }

    .result-err {
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .result-warn {
      background: rgba(234, 179, 8, 0.1);
      color: #facc15;
      border: 1px solid rgba(234, 179, 8, 0.3);
    }

    .gev-key-guide {
      margin-top: 10px;
      background: rgba(2, 6, 23, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: 4px;
      padding: 12px 14px;
      animation: fadeIn 0.2s ease-out;
    }

    .gev-guide-title {
      font-size: 11px;
      font-weight: 700;
      color: #38bdf8;
      margin-bottom: 6px;
      letter-spacing: 0.05em;
    }

    .gev-guide-steps {
      margin: 0 0 10px 18px;
      padding: 0;
      font-size: 11px;
      color: #cbd5e1;
      line-height: 1.5;
    }

    .gev-guide-steps li {
      margin-bottom: 3px;
    }

    .gev-guide-link {
      display: inline-block;
      font-size: 11px;
      color: #00ff88;
      text-decoration: none;
      font-weight: 600;
      border-bottom: 1px dashed rgba(0, 255, 136, 0.5);
    }

    .gev-guide-link:hover {
      color: #5cffb2;
      border-bottom-style: solid;
    }

    .gev-config-footer {
      padding: 12px 20px;
      background: rgba(15, 23, 42, 0.9);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .gev-config-footer-right {
      display: flex;
      gap: 10px;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Tactical Handshake & Lockout Gate */
    .gev-gate-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.96);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999999;
      padding: 16px;
      font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      animation: fadeIn 0.3s ease-out;
    }

    .gev-gate-card {
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(4, 8, 16, 0.99) 100%);
      border: 1px solid rgba(0, 240, 255, 0.35);
      border-radius: 8px;
      box-shadow: 0 0 45px rgba(0, 240, 255, 0.15), 0 20px 40px rgba(0, 0, 0, 0.8);
      width: 100%;
      max-width: 460px;
      padding: 32px 28px;
      text-align: center;
      color: #fff;
    }

    .gev-gate-lockout {
      border-color: rgba(255, 77, 109, 0.45);
      box-shadow: 0 0 45px rgba(255, 77, 109, 0.2), 0 20px 40px rgba(0, 0, 0, 0.8);
    }

    .gev-gate-icon {
      font-size: 42px;
      margin-bottom: 12px;
      line-height: 1;
    }

    .gev-gate-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #fff;
      margin: 0 0 6px 0;
    }

    .gev-gate-sub {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: #00f0ff;
      margin-bottom: 14px;
    }

    .gev-gate-desc {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.55;
      margin: 0 0 20px 0;
    }

    .gev-gate-status {
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 11px;
      margin-bottom: 14px;
      text-align: left;
    }

    .gev-gate-status-err {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #f87171;
    }

    .gev-gate-status-ok {
      background: rgba(0, 255, 136, 0.15);
      border: 1px solid rgba(0, 255, 136, 0.4);
      color: #00ff88;
    }

    .gev-input-key {
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 700;
      text-align: center;
      font-size: 14px;
    }

    /* Trial Startup Toast */
    .gev-trial-toast {
      position: fixed;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.96);
      border: 1px solid rgba(255, 200, 59, 0.4);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
      border-radius: 6px;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      z-index: 999999;
      color: #fff;
      font-size: 12px;
      animation: slideDown 0.3s ease-out;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translate(-50%, -16px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    @media (max-width: 600px) {
      .gev-config-dialog {
        width: 96vw;
        max-height: 94vh;
      }
      .gev-key-input-row {
        flex-wrap: wrap;
        gap: 6px;
      }
      .gev-input-wrap {
        width: 100%;
        min-width: 100%;
      }
      .gev-key-input-row .gev-btn {
        flex: 1 1 calc(33.3% - 6px);
        text-align: center;
        padding: 6px 8px;
        font-size: 11px;
      }
      .gev-config-footer {
        flex-direction: column;
        gap: 10px;
      }
    }
  `;

  document.head.appendChild(style);
}
