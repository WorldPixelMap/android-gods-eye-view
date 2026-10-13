import { createStandaloneApplication } from './standalone/application.js';
import { describeError } from './standalone/errors.js';
import {
  keyStore,
  GEV_KEYS,
  initKeyConfigModal,
  showKeyConfigModal,
  flyToDeviceLocation,
  TitanLicense,
  installKeyStoreFetchInterceptor,
} from './androidBridge.js';

// Auto-inject stored API keys to proxy requests
installKeyStoreFetchInterceptor();

// Initialize Web Fullscreen Toggle Button immediately with F11 emulation
function setupFullscreenToggle() {
  const fsBtn = document.getElementById('fullscreen-view-btn');
  if (!fsBtn || fsBtn._gevFullscreenWired) return;
  fsBtn._gevFullscreenWired = true;

  const isAndroid =
    (typeof window !== 'undefined' &&
      window.AndroidBridge &&
      Boolean(window.AndroidBridge.isAndroid?.())) ||
    (typeof navigator !== 'undefined' &&
      /android/i.test(navigator.userAgent));

  if (isAndroid) {
    fsBtn.style.display = 'none';
    return;
  }

  const dispatchF11Key = () => {
    const eventParams = {
      key: 'F11',
      code: 'F11',
      keyCode: 122,
      which: 122,
      charCode: 0,
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
    };
    try {
      window.dispatchEvent(new KeyboardEvent('keydown', eventParams));
      document.dispatchEvent(new KeyboardEvent('keydown', eventParams));
      document.documentElement.dispatchEvent(new KeyboardEvent('keydown', eventParams));
      window.dispatchEvent(new KeyboardEvent('keyup', eventParams));
      document.dispatchEvent(new KeyboardEvent('keyup', eventParams));
      document.documentElement.dispatchEvent(new KeyboardEvent('keyup', eventParams));
    } catch {}
  };

  const getIsFullscreen = () => {
    return Boolean(
      document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        (window.innerHeight === screen.height && window.innerWidth === screen.width)
    );
  };

  const updateFsUI = () => {
    const isFs = getIsFullscreen();
    const icon = fsBtn.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = isFs ? 'fullscreen_exit' : 'fullscreen';
    }
    const label = isFs ? 'Exit full screen view' : 'Toggle full screen view';
    const title = isFs
      ? 'Exit full screen view in browser (F11)'
      : 'Toggle full screen view in browser (F11)';
    fsBtn.setAttribute('aria-label', label);
    fsBtn.setAttribute('title', title);
    fsBtn.setAttribute('aria-pressed', String(isFs));
  };

  const toggleFullscreen = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Emulate F11 key event as requested by operator
    dispatchF11Key();

    // Toggle browser Fullscreen API
    const isFs = Boolean(
      document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement,
    );

    if (isFs) {
      const exit =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;
      if (exit) {
        try {
          const p = exit.call(document);
          if (p?.catch) p.catch(() => {});
        } catch {}
      }
    } else {
      const root = document.documentElement || document.body;
      const req =
        root.requestFullscreen ||
        root.webkitRequestFullscreen ||
        root.mozRequestFullScreen ||
        root.msRequestFullscreen;
      if (req) {
        try {
          const p = req.call(root, { navigationUI: 'hide' });
          if (p?.catch) {
            p.catch(() => {
              try {
                if (document.body && document.body !== root) {
                  const bReq =
                    document.body.requestFullscreen ||
                    document.body.webkitRequestFullscreen;
                  bReq?.call(document.body);
                }
              } catch {}
            });
          }
        } catch {
          try {
            if (document.body && document.body !== root) {
              const bReq =
                document.body.requestFullscreen ||
                document.body.webkitRequestFullscreen;
              bReq?.call(document.body);
            }
          } catch {}
        }
      }
    }

    setTimeout(updateFsUI, 50);
  };

  fsBtn.addEventListener('click', toggleFullscreen);

  for (const evt of [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange',
    'resize',
  ]) {
    document.addEventListener(evt, updateFsUI);
    window.addEventListener(evt, updateFsUI);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'F11' || e.keyCode === 122) {
      setTimeout(updateFsUI, 150);
    }
  });

  updateFsUI();
}

setupFullscreenToggle();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupFullscreenToggle);
}

const application = createStandaloneApplication({
  googleApiKey: keyStore.getKey(GEV_KEYS.GOOGLE_MAPS) || import.meta.env.GOOGLE_MAPS_API_KEY,
  cesiumToken: keyStore.getKey(GEV_KEYS.CESIUM_ION) || import.meta.env.CESIUM_ION_TOKEN,
  allowQaRegistration: import.meta.env.DEV,
});

application.start().then((components) => {
  // Initialize Tactical In-App BYOK Configuration Modal
  initKeyConfigModal();
  const configBtn = document.getElementById('gev-config-btn');
  if (configBtn) {
    configBtn.addEventListener('click', () => showKeyConfigModal());
  }

  // Initialize Native GPS Fly-to Handler
  const myLocationBtn = document.getElementById('my-location-btn');
  if (myLocationBtn) {
    myLocationBtn.addEventListener('click', () => {
      myLocationBtn.classList.add('locating');
      const viewer =
        components?.scene?.viewer ||
        window.__godsEyeView?.application?.getComponents?.()?.scene?.viewer ||
        globalThis.viewer;
      flyToDeviceLocation(viewer, (msg) => {
        myLocationBtn.classList.remove('locating');
        const toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = msg;
          toast.classList.add('visible');
          setTimeout(() => toast.classList.remove('visible'), 4000);
        }
      });
    });
  }

  // Initialize Titan Hardware Licensing & Verification
  TitanLicense.initProtection().catch((err) => {
    console.warn('[TitanLicense] Protection initialization error:', err);
  });

  // Expose global for debugging and bridge inspection
  window.__godsEyeView = {
    application,
    components,
    viewer: components?.scene?.viewer,
    styleManager: components?.controls?.styleManager,
    dataManager: components?.data?.dataManager,
  };
}).catch((error) => {
  console.error("God's Eye View initialization failed:", error);
  const loaderStatus = document.querySelector('#loading-screen .loader-status');
  if (loaderStatus) {
    loaderStatus.textContent = `Error: ${describeError(error)}`;
    loaderStatus.style.color = '#ff4444';
  }
});

export { application };

