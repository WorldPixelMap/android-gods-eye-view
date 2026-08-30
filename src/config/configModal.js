/**
 * @file configModal.js
 * @description Tactical Cyberpunk In-App Configuration & Key Manager Modal.
 * Allows users to inspect, test, enter, and persist API keys directly in-app,
 * with step-by-step interactive guides and live connection diagnostics.
 */

import { KeyStore, KEY_IDS, KEY_METADATA } from './keyStore.js';

let modalContainer = null;
let isOpen = false;

/**
 * Creates and injects the Configuration Modal into the DOM if not present.
 */
export function initConfigModal() {
  if (modalContainer) return;

  modalContainer = document.createElement('div');
  modalContainer.id = 'gev-config-modal-backdrop';
  modalContainer.className = 'gev-config-backdrop';
  modalContainer.style.display = 'none';

  modalContainer.innerHTML = `
    <div class="gev-config-dialog" role="dialog" aria-modal="true" aria-labelledby="gev-config-title">
      <div class="gev-config-header">
        <div class="gev-config-title-wrap">
          <span class="gev-config-icon">⚙️</span>
          <div>
            <h2 id="gev-config-title" class="gev-config-title">SYSTEM CONFIGURATION & API KEYS</h2>
            <div class="gev-config-subtitle">BRING YOUR OWN KEY (BYOK) · ZERO-COST OPEN-SOURCE DEFAULTS</div>
          </div>
        </div>
        <button type="button" class="gev-config-close-btn" id="gev-config-close" title="Close [Esc]">✕</button>
      </div>

      <div class="gev-config-status-bar">
        <div class="gev-config-status-item">
          <span class="status-label">GLOBE ENGINE:</span>
          <span class="status-val" id="gev-engine-status">CHECKING...</span>
        </div>
        <div class="gev-config-status-item">
          <span class="status-label">KEYLESS LAYERS:</span>
          <span class="status-val active">10 ACTIVE (100% FREE)</span>
        </div>
        <div class="gev-config-status-item">
          <span class="status-label">STORAGE:</span>
          <span class="status-val">LOCAL SECURE STORAGE</span>
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

  document.body.appendChild(modalContainer);

  // Bind close buttons
  document.getElementById('gev-config-close').addEventListener('click', closeConfigModal);
  document.getElementById('gev-config-cancel').addEventListener('click', closeConfigModal);
  modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) closeConfigModal();
  });

  // Save button
  document.getElementById('gev-config-save').addEventListener('click', saveAllKeys);

  // Clear all button
  document.getElementById('gev-config-clear-all').addEventListener('click', () => {
    if (confirm('Clear all saved personal API keys and revert to open-source defaults?')) {
      for (const keyId of Object.values(KEY_IDS)) {
        KeyStore.removeKey(keyId);
      }
      renderKeyRows();
      updateEngineStatus();
    }
  });

  // ESC key listener
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeConfigModal();
    }
  });

  // Inject CSS styles for the config modal
  injectConfigStyles();
}

/**
 * Open the configuration modal.
 */
export function openConfigModal() {
  initConfigModal();
  renderKeyRows();
  updateEngineStatus();
  modalContainer.style.display = 'flex';
  isOpen = true;
}

/**
 * Close the configuration modal.
 */
export function closeConfigModal() {
  if (!modalContainer) return;
  modalContainer.style.display = 'none';
  isOpen = false;
}

/**
 * Toggle modal open/close.
 */
export function toggleConfigModal() {
  if (isOpen) {
    closeConfigModal();
  } else {
    openConfigModal();
  }
}

function updateEngineStatus() {
  const el = document.getElementById('gev-engine-status');
  if (!el) return;
  const hasGoogle = KeyStore.hasKey(KEY_IDS.GOOGLE_MAPS);
  if (hasGoogle) {
    el.innerHTML = '<span style="color:#00ff88;">● GOOGLE 3D TILES (PHOTOREALISTIC)</span>';
  } else {
    el.innerHTML = '<span style="color:#38bdf8;">● OPENSTREETMAP + RE:EARTH 3D (FREE)</span>';
  }
}

/**
 * Renders the key input rows and guides into the modal.
 */
function renderKeyRows() {
  const container = document.getElementById('gev-config-body');
  if (!container) return;

  container.innerHTML = '';

  const entries = Object.entries(KEY_METADATA);

  entries.forEach(([keyId, meta]) => {
    const currentValue = KeyStore.getKey(keyId);
    const hasVal = Boolean(currentValue);

    const row = document.createElement('div');
    row.className = 'gev-key-card';
    row.id = `card-${keyId}`;

    row.innerHTML = `
      <div class="gev-key-header">
        <div class="gev-key-info">
          <div class="gev-key-title-row">
            <span class="gev-key-name">${meta.name}</span>
            <span class="gev-badge ${hasVal ? 'badge-configured' : 'badge-fallback'}">
              ${hasVal ? '● CONFIGURED' : '○ KEYLESS FALLBACK'}
            </span>
          </div>
          <div class="gev-key-desc">${meta.description}</div>
          <div class="gev-key-meta-line">
            <span class="meta-tag free-tag">Quota: ${meta.freeQuota}</span>
            <span class="meta-tag fallback-tag">Fallback: ${meta.fallback}</span>
          </div>
        </div>
      </div>

      <div class="gev-key-input-row">
        <div class="gev-input-wrap">
          <input 
            type="password" 
            class="gev-key-input" 
            id="input-${keyId}" 
            placeholder="Paste your ${meta.name} here..." 
            value="${currentValue}"
            autocomplete="off"
            spellcheck="false"
          />
          <button type="button" class="gev-toggle-vis-btn" data-target="input-${keyId}" title="Toggle visibility">👁️</button>
        </div>
        <button type="button" class="gev-btn gev-btn-action test-key-btn" data-keyid="${keyId}">🧪 Test</button>
        <button type="button" class="gev-btn gev-btn-action guide-key-btn" data-target="guide-${keyId}">📖 Guide</button>
      </div>

      <div class="gev-test-result" id="result-${keyId}" style="display:none;"></div>

      <div class="gev-key-guide" id="guide-${keyId}" style="display:none;">
        <div class="gev-guide-inner">
          <div class="gev-guide-title">How to get your free key:</div>
          <ol class="gev-guide-steps">
            ${meta.guideSteps.map((step) => `<li>${step}</li>`).join('')}
          </ol>
          <a href="${meta.signupUrl}" target="_blank" rel="noopener noreferrer" class="gev-guide-link">
            Open Provider Portal ↗ (${new URL(meta.signupUrl).hostname})
          </a>
        </div>
      </div>
    `;

    container.appendChild(row);
  });

  // Attach event listeners for inputs & buttons
  container.querySelectorAll('.gev-toggle-vis-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const targetId = e.currentTarget.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    });
  });

  container.querySelectorAll('.guide-key-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const targetId = e.currentTarget.getAttribute('data-target');
      const guideEl = document.getElementById(targetId);
      if (guideEl) {
        const isHidden = guideEl.style.display === 'none';
        guideEl.style.display = isHidden ? 'block' : 'none';
        e.currentTarget.classList.toggle('active', isHidden);
      }
    });
  });

  container.querySelectorAll('.test-key-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const keyId = e.currentTarget.getAttribute('data-keyid');
      const input = document.getElementById(`input-${keyId}`);
      const resultEl = document.getElementById(`result-${keyId}`);
      if (!input || !resultEl) return;

      const candidateVal = input.value.trim();
      if (!candidateVal) {
        resultEl.style.display = 'block';
        resultEl.className = 'gev-test-result result-warn';
        resultEl.textContent = 'Input is empty. Enter a key to test.';
        return;
      }

      resultEl.style.display = 'block';
      resultEl.className = 'gev-test-result result-loading';
      resultEl.textContent = 'Testing connection with provider...';

      const res = await KeyStore.testKey(keyId, candidateVal);
      if (res.ok) {
        resultEl.className = 'gev-test-result result-ok';
        resultEl.textContent = '✓ ' + res.message;
      } else {
        resultEl.className = 'gev-test-result result-err';
        resultEl.textContent = '✕ ' + res.message;
      }
    });
  });
}

/**
 * Save all input keys to KeyStore and reload the viewer if needed.
 */
function saveAllKeys() {
  let changed = false;
  let googleChanged = false;

  for (const keyId of Object.values(KEY_IDS)) {
    const input = document.getElementById(`input-${keyId}`);
    if (input) {
      const oldVal = KeyStore.getKey(keyId);
      const newVal = input.value.trim();
      if (oldVal !== newVal) {
        KeyStore.setKey(keyId, newVal);
        changed = true;
        if (keyId === KEY_IDS.GOOGLE_MAPS || keyId === KEY_IDS.CESIUM_ION) {
          googleChanged = true;
        }
      }
    }
  }

  closeConfigModal();

  if (changed) {
    if (googleChanged) {
      if (confirm('Globe map keys have changed. Reload the page now to apply the new 3D map engine?')) {
        window.location.reload();
      }
    } else {
      alert('Configuration updated! Telemetry layers will use the updated credentials.');
    }
  }
}

/**
 * Injects CSS styles for the config modal.
 */
function injectConfigStyles() {
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
      letter-spacing: 0.03em;
    }

    .gev-badge {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 12px;
      letter-spacing: 0.06em;
      font-weight: 700;
    }

    .badge-configured {
      background: rgba(0, 255, 136, 0.15);
      color: #00ff88;
      border: 1px solid rgba(0, 255, 136, 0.4);
    }

    .badge-fallback {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.4);
    }

    .gev-key-desc {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 6px;
      line-height: 1.4;
    }

    .gev-key-meta-line {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }

    .meta-tag {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 3px;
      background: rgba(0, 0, 0, 0.4);
      color: #94a3b8;
    }

    .meta-tag.free-tag {
      color: #34d399;
      border: 1px solid rgba(52, 211, 153, 0.2);
    }

    .meta-tag.fallback-tag {
      color: #60a5fa;
      border: 1px solid rgba(96, 165, 250, 0.2);
    }

    .gev-key-input-row {
      display: flex;
      gap: 8px;
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
      background: rgba(2, 6, 23, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      padding: 8px 36px 8px 10px;
      color: #fff;
      font-family: 'Fira Code', monospace;
      font-size: 12px;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }

    .gev-key-input:focus {
      border-color: #00ff88;
      box-shadow: 0 0 8px rgba(0, 255, 136, 0.2);
    }

    .gev-toggle-vis-btn {
      position: absolute;
      right: 6px;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 14px;
      padding: 2px 4px;
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

    @media (max-width: 600px) {
      .gev-config-dialog {
        width: 96vw;
        max-height: 94vh;
      }
      .gev-key-input-row {
        flex-direction: column;
        align-items: stretch;
      }
      .gev-config-footer {
        flex-direction: column;
        gap: 10px;
      }
    }
  `;
  document.head.appendChild(style);
}
