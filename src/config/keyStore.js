/**
 * @file keyStore.js
 * @description Centralized API Key Management & Open-Source Fallback Controller.
 * Manages user-configured keys in localStorage, falls back to build-time .env values,
 * and provides live connection test routines and guided metadata for each telemetry source.
 */

// Storage keys
const STORAGE_PREFIX = 'GEV_KEY_';
export const KEY_IDS = {
  GOOGLE_MAPS: 'GOOGLE_MAPS_API_KEY',
  OPENAI: 'OPENAI_API_KEY',
  AISSTREAM: 'AISSTREAM_API_KEY',
  NASA_FIRMS: 'FIRMS_MAP_KEY',
  TOMTOM: 'TOMTOM_API_KEY',
  CESIUM_ION: 'CESIUM_ION_TOKEN',
};

/**
 * Metadata and guide definitions for each API key
 */
export const KEY_METADATA = {
  [KEY_IDS.GOOGLE_MAPS]: {
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
  [KEY_IDS.OPENAI]: {
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
  [KEY_IDS.AISSTREAM]: {
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
  [KEY_IDS.NASA_FIRMS]: {
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
  [KEY_IDS.TOMTOM]: {
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
  [KEY_IDS.CESIUM_ION]: {
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
 * KeyStore class manages retrieval, storage, and testing of API keys.
 */
class KeyStoreManager {
  constructor() {
    this._listeners = new Set();
  }

  /**
   * Get an API key. Checks localStorage first, then falls back to build-time import.meta.env.
   * @param {string} keyId
   * @returns {string}
   */
  getKey(keyId) {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + keyId);
      if (stored && stored.trim()) {
        return stored.trim();
      }
    } catch {
      // localStorage may be disabled or inaccessible
    }

    // Fallback to Vite environment variables
    const envKey = import.meta.env[keyId];
    if (envKey && typeof envKey === 'string' && envKey.trim()) {
      return envKey.trim();
    }

    return '';
  }

  /**
   * Save an API key to localStorage.
   * @param {string} keyId
   * @param {string} value
   */
  setKey(keyId, value) {
    const cleanValue = (value || '').trim();
    try {
      if (cleanValue) {
        localStorage.setItem(STORAGE_PREFIX + keyId, cleanValue);
      } else {
        localStorage.removeItem(STORAGE_PREFIX + keyId);
      }
    } catch (e) {
      console.warn('[KeyStore] Failed to write to localStorage:', e);
    }
    this._notify(keyId, cleanValue);
  }

  /**
   * Remove an API key.
   * @param {string} keyId
   */
  removeKey(keyId) {
    this.setKey(keyId, '');
  }

  /**
   * Check if a specific key is configured (either in localStorage or env).
   * @param {string} keyId
   * @returns {boolean}
   */
  hasKey(keyId) {
    return Boolean(this.getKey(keyId));
  }

  /**
   * Subscribe to key changes.
   * @param {Function} callback (keyId, newValue)
   * @returns {Function} unsubscribe function
   */
  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notify(keyId, value) {
    for (const listener of this._listeners) {
      try {
        listener(keyId, value);
      } catch (err) {
        console.error('[KeyStore] Listener error:', err);
      }
    }
  }

  /**
   * Test connection validity for a given key.
   * @param {string} keyId
   * @param {string} [candidateKey] - Optional test candidate (if not yet saved)
   * @returns {Promise<{ ok: boolean, message: string }>}
   */
  async testKey(keyId, candidateKey) {
    const key = candidateKey !== undefined ? candidateKey.trim() : this.getKey(keyId);
    if (!key) {
      return { ok: false, message: 'Key is empty' };
    }

    try {
      switch (keyId) {
        case KEY_IDS.GOOGLE_MAPS: {
          // Test Google Map Tiles API session initialization endpoint
          const url = `https://tile.googleapis.com/v1/createSession?key=${encodeURIComponent(key)}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mapType: 'satellite', language: 'en-US', region: 'US' }),
          });
          if (res.ok) {
            return { ok: true, message: 'Google 3D Tiles API key is valid!' };
          }
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}: ${res.statusText}`;
          return { ok: false, message: `Google Maps Error: ${errMsg}` };
        }

        case KEY_IDS.OPENAI: {
          // Test OpenAI API key using models endpoint
          const res = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${key}` },
          });
          if (res.ok) {
            return { ok: true, message: 'OpenAI API key is valid!' };
          }
          return { ok: false, message: `OpenAI Error: HTTP ${res.status} (Unauthorized or invalid key)` };
        }

        case KEY_IDS.NASA_FIRMS: {
          // Test NASA FIRMS map key with transaction count or live test query
          const url = `https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/${encodeURIComponent(key)}/VIIRS_NOAA20_NRT`;
          const res = await fetch(url);
          if (res.ok) {
            const text = await res.text();
            if (!text.toLowerCase().includes('invalid') && !text.toLowerCase().includes('error')) {
              return { ok: true, message: 'NASA FIRMS key is valid!' };
            }
          }
          return { ok: false, message: 'NASA FIRMS Key invalid or unrecognized' };
        }

        case KEY_IDS.TOMTOM: {
          // Test TomTom API Key
          const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point=30.2672,-97.7431&unit=KMPH&key=${encodeURIComponent(key)}`;
          const res = await fetch(url);
          if (res.ok) {
            return { ok: true, message: 'TomTom API key is valid!' };
          }
          return { ok: false, message: `TomTom Error: HTTP ${res.status}` };
        }

        case KEY_IDS.CESIUM_ION: {
          // Test Cesium Ion token
          const res = await fetch(`https://api.cesium.com/v1/assets?access_token=${encodeURIComponent(key)}`);
          if (res.ok) {
            return { ok: true, message: 'Cesium Ion token is valid!' };
          }
          return { ok: false, message: `Cesium Ion Error: HTTP ${res.status}` };
        }

        case KEY_IDS.AISSTREAM: {
          // Basic syntax check for AISStream
          if (key.length >= 10) {
            return { ok: true, message: 'Key format verified (AISStream activates on ship layer connect).' };
          }
          return { ok: false, message: 'AISStream key seems too short.' };
        }

        default:
          return { ok: true, message: 'Key saved.' };
      }
    } catch (err) {
      return { ok: false, message: `Connection test failed: ${err.message || err}` };
    }
  }
}

export const KeyStore = new KeyStoreManager();
