const Jt={SERVER_URL:"https://worldpixelmap.in/apps_suite/license.php",APP_SLUG:"agev",APP_NAME:"God's Eye View",APP_VERSION:"1.0.0",STORE_URL:"https://worldpixelmap.in/apps_suite/product.php?slug=agev",PORTAL_URL:"https://worldpixelmap.in/apps_suite/portal.php",OFFLINE_GRACE_MS:10080*60*1e3},st={ACTIVATED:"gev_lic_activated",KEY:"gev_lic_key",CUSTOMER:"gev_lic_customer",TIER:"gev_lic_tier",EXPIRES:"gev_lic_expires",TOKEN:"gev_lic_token",LAST_VERIFIED:"gev_lic_last_verified",TRIAL_ACTIVE:"gev_trial_active",TRIAL_DAYS:"gev_trial_days",DEVICE_ID:"gev_web_device_id"};class tr{static isAndroid(){return typeof window<"u"&&!!(window.AndroidBridge&&window.AndroidBridge.isAndroid&&window.AndroidBridge.isAndroid())}static getDeviceId(){let t=localStorage.getItem(st.DEVICE_ID);return t||(t="WEB-"+crypto.randomUUID().toUpperCase(),localStorage.setItem(st.DEVICE_ID,t)),t}static getDeviceModel(){const t=navigator.userAgent;return t.includes("Windows")?"Windows Desktop (Web)":t.includes("Macintosh")?"macOS Workstation (Web)":t.includes("Linux")?"Linux Station (Web)":t.includes("Android")?"Android Device (Web)":t.includes("iPhone")||t.includes("iPad")?"Apple iOS (Web)":"Web Intelligence Console"}static getLicenseInfo(){if(this.isAndroid()&&window.AndroidBridge.getLicenseInfo)try{return JSON.parse(window.AndroidBridge.getLicenseInfo())}catch(s){console.warn("[LicenseBridge] Error parsing Android license info:",s)}const t=localStorage.getItem(st.ACTIVATED)==="true",n=localStorage.getItem(st.TRIAL_ACTIVE)==="true",i=parseInt(localStorage.getItem(st.TRIAL_DAYS)||"7",10);return{isActivated:t,licenseKey:localStorage.getItem(st.KEY)||"",customerName:localStorage.getItem(st.CUSTOMER)||"Valued Commander",tier:localStorage.getItem(st.TIER)||"FREE",expiresAt:localStorage.getItem(st.EXPIRES)||"Lifetime",status:t?"ACTIVE":n?"TRIAL_ACTIVE":"TRIAL_EXPIRED",isTrialActive:n,trialDaysLeft:i,isTrialExpired:!t&&(!n||i<=0),deviceId:this.getDeviceId(),deviceModel:this.getDeviceModel(),appVersion:Jt.APP_VERSION,lastVerifiedAt:parseInt(localStorage.getItem(st.LAST_VERIFIED)||"0",10)}}static async activate(t){const n=t.trim().toUpperCase();if(!n)return{success:!1,error:"License key cannot be empty."};try{const i={action:"activate",app_slug:Jt.APP_SLUG,license_key:n,device_id:this.getDeviceId(),device_model:this.getDeviceModel(),app_version:Jt.APP_VERSION},o=await(await fetch(Jt.SERVER_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)})).json();return o.success?(localStorage.setItem(st.ACTIVATED,"true"),localStorage.setItem(st.KEY,n),localStorage.setItem(st.CUSTOMER,o.customer_name||"Valued Commander"),localStorage.setItem(st.TIER,o.tier||"PRO"),localStorage.setItem(st.EXPIRES,o.expires_at||"Lifetime"),localStorage.setItem(st.TOKEN,o.token||""),localStorage.setItem(st.LAST_VERIFIED,Date.now().toString()),{success:!0,message:o.message||"Activated Successfully!",data:o}):{success:!1,error:o.error||"Activation failed."}}catch(i){return{success:!1,error:"Network error connecting to license server: "+i.message}}}static async verify(){const t=localStorage.getItem(st.KEY);if(!t)return{success:!1,status:"UNACTIVATED"};try{const n={action:"verify",app_slug:Jt.APP_SLUG,license_key:t,device_id:this.getDeviceId()},s=await(await fetch(Jt.SERVER_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)})).json();return s.success&&s.status==="ACTIVE"?(localStorage.setItem(st.LAST_VERIFIED,Date.now().toString()),s.tier&&localStorage.setItem(st.TIER,s.tier),s.expires_at&&localStorage.setItem(st.EXPIRES,s.expires_at),{success:!0,status:"ACTIVE",data:s}):(localStorage.setItem(st.ACTIVATED,"false"),{success:!1,status:s.status||"UNBOUND",error:s.error})}catch{const i=parseInt(localStorage.getItem(st.LAST_VERIFIED)||"0",10);return i>0&&Date.now()-i<Jt.OFFLINE_GRACE_MS?{success:!0,status:"OFFLINE_GRACE",isOfflineGrace:!0}:{success:!1,status:"OFFLINE_EXPIRED",error:"Offline grace expired."}}}static async checkTrial(){try{const t={action:"check_trial",device_id:this.getDeviceId(),device_model:this.getDeviceModel(),app_slug:Jt.APP_SLUG},i=await(await fetch(Jt.SERVER_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})).json();return i.success?(localStorage.setItem(st.TRIAL_ACTIVE,i.trial_active?"true":"false"),localStorage.setItem(st.TRIAL_DAYS,(i.days_left||0).toString()),i):{success:!1,trial_active:!1,days_left:0}}catch{return{success:!0,trial_active:localStorage.getItem(st.TRIAL_ACTIVE)==="true",days_left:parseInt(localStorage.getItem(st.TRIAL_DAYS)||"7",10)}}}static async checkUpdate(){try{const t={action:"check_update",app_slug:Jt.APP_SLUG},i=await(await fetch(Jt.SERVER_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})).json();if(i.success){const s=i.latest_version||Jt.APP_VERSION,o=this.compareVersions(s,Jt.APP_VERSION)>0;return{...i,isUpdateAvailable:o}}return{success:!1,isUpdateAvailable:!1}}catch(t){return{success:!1,isUpdateAvailable:!1,error:t.message}}}static async deactivate(){const t=localStorage.getItem(st.KEY);if(t)try{await fetch(Jt.SERVER_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"deactivate",license_key:t,device_id:this.getDeviceId()})})}catch(n){console.warn("[License] Deactivate network error:",n)}return localStorage.removeItem(st.ACTIVATED),localStorage.removeItem(st.KEY),localStorage.removeItem(st.CUSTOMER),localStorage.removeItem(st.TOKEN),{success:!0}}static compareVersions(t,n){const i=t.replace(/^v/i,"").split(".").map(a=>parseInt(a,10)||0),s=n.replace(/^v/i,"").split(".").map(a=>parseInt(a,10)||0),o=Math.max(i.length,s.length);for(let a=0;a<o;a++){const r=i[a]||0,l=s[a]||0;if(r!==l)return r>l?1:-1}return 0}}let Di=null,bI=!1;function f3(){Di||(Di=document.createElement("div"),Di.id="gev-config-modal-backdrop",Di.className="gev-config-backdrop",Di.style.display="none",Di.innerHTML=`
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
          <span class="status-val">v${Jt.APP_VERSION}</span>
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
  `,document.body.appendChild(Di),document.getElementById("gev-config-close").addEventListener("click",Qh),document.getElementById("gev-config-cancel").addEventListener("click",Qh),Di.addEventListener("click",e=>{e.target===Di&&Qh()}),document.getElementById("gev-config-save").addEventListener("click",ble),document.getElementById("gev-config-clear-all").addEventListener("click",()=>{if(confirm("Clear all saved personal API keys and revert to open-source defaults?")){for(const e of Object.values(Yt))Ia.removeKey(e);CI(),_I()}}),window.addEventListener("keydown",e=>{e.key==="Escape"&&bI&&Qh()}),_le())}function yle(){f3(),CI(),_I(),Di.style.display="flex",bI=!0}function Qh(){Di&&(Di.style.display="none",bI=!1)}function _I(){const e=document.getElementById("gev-engine-status");e&&(Ia.hasKey(Yt.GOOGLE_MAPS)?e.innerHTML='<span style="color:#00ff88;">● GOOGLE 3D TILES</span>':e.innerHTML='<span style="color:#38bdf8;">● OSM + RE:EARTH (FREE)</span>');const t=document.getElementById("gev-license-status");if(t){const n=tr.getLicenseInfo();n.isActivated?t.innerHTML=`<span style="color:#00f0ff; font-weight:700;">● ${n.tier} VIP</span>`:n.isTrialActive&&!n.isTrialExpired?t.innerHTML=`<span style="color:#ffc83b; font-weight:700;">● TRIAL (${n.trialDaysLeft}d left)</span>`:t.innerHTML='<span style="color:#ff4d6d; font-weight:700;">✕ EXPIRED</span>'}}function CI(){var a,r;const e=document.getElementById("gev-config-body");if(!e)return;e.innerHTML="";const t=tr.getLicenseInfo(),n=document.createElement("div");n.className="gev-key-card gev-license-card",n.id="card-titan-license";let i="#ffc83b",s=`○ TRIAL (${t.trialDaysLeft} DAYS LEFT)`;t.isActivated?(i="#00f0ff",s=`● ${t.tier} VIP ACTIVE`):t.isTrialExpired&&(i="#ff4d6d",s="✕ EXPIRED / LOCKED"),n.innerHTML=`
    <div class="gev-key-header">
      <div class="gev-key-info">
        <div class="gev-key-title-row">
          <span class="gev-key-name" style="color:#00f0ff; font-weight:700; display:flex; align-items:center; gap:8px;">
            <span>🛡️</span> TITAN HARDWARE LICENSE VAULT
          </span>
          <span class="gev-badge" style="background:${i}22; color:${i}; border:1px solid ${i};">
            ${s}
          </span>
        </div>
        <div class="gev-key-desc">
          ${t.isActivated?`Licensed to <strong>${t.customerName}</strong> (${t.expiresAt}) · Device: <code>${t.deviceId.slice(0,16)}...</code>`:`Hardware fingerprint bound to device (${t.deviceModel}). Full access to satellite, ADS-B, radar & CCTV telemetry.`}
        </div>
      </div>
    </div>

    <div class="gev-license-actions-row" style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
      <button type="button" class="gev-btn gev-btn-action" id="gev-btn-manage-lic" style="background:rgba(0,240,255,0.15); border:1px solid #00f0ff; color:#00f0ff;">
        ${t.isActivated?"⚙️ Manage / Unlink Device":"⚡ Enter License Key"}
      </button>
      <a href="${Jt.STORE_URL}" target="_blank" rel="noopener noreferrer" class="gev-btn gev-btn-action" style="background:rgba(255,200,59,0.15); border:1px solid #ffc83b; color:#ffc83b; text-decoration:none; display:inline-flex; align-items:center;">
        🛒 Buy License Key
      </a>
      <button type="button" class="gev-btn gev-btn-action" id="gev-btn-check-update" style="background:rgba(15,23,42,0.8); border:1px solid #1f334a; color:#8ea8c4;">
        🔄 Check Updates
      </button>
      <a href="${Jt.PORTAL_URL}" target="_blank" rel="noopener noreferrer" class="gev-btn gev-btn-action" style="background:rgba(15,23,42,0.8); border:1px solid #1f334a; color:#8ea8c4; text-decoration:none; display:inline-flex; align-items:center;">
        🖥️ Device Portal
      </a>
    </div>
  `,e.appendChild(n),(a=n.querySelector("#gev-btn-manage-lic"))==null||a.addEventListener("click",()=>{if(tr.isAndroid())t.isActivated?window.AndroidBridge.showLicenseManagementDialog():window.AndroidBridge.showActivationDialog();else{const l=prompt("Enter Titan License Key (e.g. AGEV-XXXX-XXXX):",t.licenseKey||"");l&&tr.activate(l).then(c=>{c.success?(alert("✓ "+c.message),CI(),_I()):alert("✕ "+c.error)})}}),(r=n.querySelector("#gev-btn-check-update"))==null||r.addEventListener("click",()=>{tr.isAndroid()?window.AndroidBridge.checkForUpdates():tr.checkUpdate().then(l=>{l.isUpdateAvailable?confirm(`New Version Available: v${l.latest_version}

Features:
${l.features||"General performance & telemetry improvements"}

Download now?`)&&window.open(l.download_url||Jt.STORE_URL,"_blank"):l.success?alert(`✓ God's Eye View is up to date (v${Jt.APP_VERSION})`):alert("Could not reach update server.")})}),Object.entries(pae).forEach(([l,c])=>{const u=Ia.getKey(l),d=!!u,h=document.createElement("div");h.className="gev-key-card",h.id=`card-${l}`,h.innerHTML=`
      <div class="gev-key-header">
        <div class="gev-key-info">
          <div class="gev-key-title-row">
            <span class="gev-key-name">${c.name}</span>
            <span class="gev-badge ${d?"badge-configured":"badge-fallback"}">
              ${d?"● CONFIGURED":"○ KEYLESS FALLBACK"}
            </span>
          </div>
          <div class="gev-key-desc">${c.description}</div>
          <div class="gev-key-meta-line">
            <span class="meta-tag free-tag">Quota: ${c.freeQuota}</span>
            <span class="meta-tag fallback-tag">Fallback: ${c.fallback}</span>
          </div>
        </div>
      </div>

      <div class="gev-key-input-row">
        <div class="gev-input-wrap">
          <input 
            type="password" 
            class="gev-key-input" 
            id="input-${l}" 
            placeholder="Paste your ${c.name} here..." 
            value="${u}"
            autocomplete="off"
            spellcheck="false"
          />
          <button type="button" class="gev-toggle-vis-btn" data-target="input-${l}" title="Toggle visibility">👁️</button>
        </div>
        <button type="button" class="gev-btn gev-btn-action test-key-btn" data-keyid="${l}">🧪 Test</button>
        <button type="button" class="gev-btn gev-btn-action guide-key-btn" data-target="guide-${l}">📖 Guide</button>
      </div>

      <div class="gev-test-result" id="result-${l}" style="display:none;"></div>

      <div class="gev-key-guide" id="guide-${l}" style="display:none;">
        <div class="gev-guide-inner">
          <div class="gev-guide-title">How to get your free key:</div>
          <ol class="gev-guide-steps">
            ${c.guideSteps.map(f=>`<li>${f}</li>`).join("")}
          </ol>
          <a href="${c.signupUrl}" target="_blank" rel="noopener noreferrer" class="gev-guide-link">
            Open Provider Portal ↗ (${new URL(c.signupUrl).hostname})
          </a>
        </div>
      </div>
    `,e.appendChild(h)}),e.querySelectorAll(".gev-toggle-vis-btn").forEach(l=>{l.addEventListener("click",c=>{const u=c.currentTarget.getAttribute("data-target"),d=document.getElementById(u);d&&(d.type=d.type==="password"?"text":"password")})}),e.querySelectorAll(".guide-key-btn").forEach(l=>{l.addEventListener("click",c=>{const u=c.currentTarget.getAttribute("data-target"),d=document.getElementById(u);if(d){const h=d.style.display==="none";d.style.display=h?"block":"none",c.currentTarget.classList.toggle("active",h)}})}),e.querySelectorAll(".test-key-btn").forEach(l=>{l.addEventListener("click",async c=>{const u=c.currentTarget.getAttribute("data-keyid"),d=document.getElementById(`input-${u}`),h=document.getElementById(`result-${u}`);if(!d||!h)return;const f=d.value.trim();if(!f){h.style.display="block",h.className="gev-test-result result-warn",h.textContent="Input is empty. Enter a key to test.";return}h.style.display="block",h.className="gev-test-result result-loading",h.textContent="Testing connection with provider...";const m=await Ia.testKey(u,f);m.ok?(h.className="gev-test-result result-ok",h.textContent="✓ "+m.message):(h.className="gev-test-result result-err",h.textContent="✕ "+m.message)})})}function ble(){let e=!1,t=!1;for(const n of Object.values(Yt)){const i=document.getElementById(`input-${n}`);if(i){const s=Ia.getKey(n),o=i.value.trim();s!==o&&(Ia.setKey(n,o),e=!0,(n===Yt.GOOGLE_MAPS||n===Yt.CESIUM_ION)&&(t=!0))}}Qh(),e&&(t?confirm("Globe map keys have changed. Reload the page now to apply the new 3D map engine?")&&window.location.reload():alert("Configuration updated! Telemetry layers will use the updated credentials."))}function _le(){if(document.getElementById("gev-config-styles"))return;const e=document.createElement("style");e.id="gev-config-styles",e.textContent=`
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
      padding: 8px 34px 8px 10px;
      color: #f8fafc;
      font-family: monospace;
      font-size: 12px;
      outline: none;
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
  `,document.head.appendChild(e)}qre();function XL(e){if(!e)return"Unknown initialization error";if(e instanceof Error)return e.message&&e.message.trim()?e.message.trim():e.name||"Initialization error";if(typeof e=="string"&&e.trim())return e.trim();if(typeof e=="object"){const t=String(e.message||e.error||"").trim();if(t)return t;try{const n=JSON.stringify(e);if(n&&n!=="{}")return n}catch{}}return String(e)}async function Cle(){const e=document.getElementById("loading-screen"),t=e.querySelector(".loader-status");try{t.textContent="Configuring viewer...";const n=Ia.getKey(Yt.CESIUM_ION);n&&(Cesium.Ion.defaultAccessToken=n);const i=Ia.getKey(Yt.GOOGLE_MAPS);i&&(Cesium.GoogleMaps.defaultApiKey=i,window.__GOOGLE_MAPS_API_KEY__=i);const s=new Cesium.Viewer("cesiumContainer",{timeline:!1,animation:!1,baseLayerPicker:!1,geocoder:!1,homeButton:!1,sceneModePicker:!1,navigationHelpButton:!1,fullscreenButton:!1,vrButton:!1,selectionIndicator:!1,infoBox:!1,baseLayer:!1,creditContainer:(()=>{const p=document.createElement("div");return p.id="cesium-credits",document.body.appendChild(p),p})(),msaaSamples:4,contextOptions:{webgl:{preserveDrawingBuffer:!0}}});s.targetFrameRate=60,tB(s),s.scene.globe.show=!i,s.scene.skyAtmosphere.show=!0,s.scene.skyAtmosphere.atmosphereLightIntensity=18,s.scene.skyAtmosphere.saturationShift=-.12,s.scene.skyAtmosphere.brightnessShift=-.08,t.textContent=i?"Loading Google 3D Tiles...":"Initializing Open-Source Globe (OSM)...";let o=null;if(i)try{o=await Cesium.createGooglePhotorealistic3DTileset({onlyUsingWithGoogleGeocoder:!0}),s.scene.primitives.add(o),s.scene.globe.show=!1}catch(p){console.warn("[Init] Google 3D Tiles unavailable, falling back to Cesium globe:",p);const g=XL(p);t.textContent=`Google 3D Tiles unavailable (${g}). Continuing in fallback mode...`,s.scene.globe.show=!0}else console.info("[Init] Starting in keyless open-source mode (OSM + Re:Earth Terrain). Tap ⚙️ to add a Google key for 3D Photorealism."),s.scene.globe.show=!0;t.textContent="Initializing systems...",f3();const a=document.getElementById("gev-config-btn");a&&a.addEventListener("click",()=>yle()),tr.isAndroid()||tr.checkTrial().catch(()=>{});const r=new rre(s,{googleTileset:o,cesiumToken:n,initialStack:o?"photoreal":"osm",onChange:p=>{window.dispatchEvent(new CustomEvent("gev:map-stack-changed",{detail:p}))},onError:p=>console.warn("[MapStack]",p)});await r.setStack(o?"photoreal":"osm",{silent:!0});const l=new vse(s,{mapStackController:r}),c=null,u=ale(s);l.hasShareState?t.textContent="Restoring shared view...":(t.textContent="Flying to Austin, TX...",Mse(s));const d=new cj(s,{allowQaRegistration:!1});d.register(Ue),d.register(je),d.register(Rse),d.register(Kn),d.register(Ya),Ya.attachDataManager(d),d.register(Oa),d.register(nn),d.register(sn),d.register(dO),d.register(cn),d.register(Uo),d.register(Qe),Qe.attachDataManager(d);for(const p of Joe)d.register(p);d.finalizeRegistrations(fo),d.buildTogglePanel(document.getElementById("data-toggles")),l.attachDataManager(d);const h=new lae(s,l,d),f=Gre({viewer:s,tileset:o});Promise.all([l.initialRestorePromise,new Promise(p=>setTimeout(p,1e3))]).finally(()=>{e.classList.add("hidden");let p=!1;const g=()=>{p||(p=!0,gle({styleManager:l,dataManager:d}))};e.addEventListener("transitionend",g,{once:!0}),setTimeout(g,900)}),m5(s),CJ(s),s.trackedEntityChanged.addEventListener(()=>{s.trackedEntity?fn("tracked-entity"):Et("tracked-entity")});const m=()=>{var g;const p=document.hidden;s.useDefaultRenderLoop=!p,(g=u==null?void 0:u.setSuspended)==null||g.call(u,p),p||(d._panelRefreshPendingOnVisible&&(d._panelRefreshPendingOnVisible=!1,d._refreshTogglePanel()),ut("visibility-restore"))};document.addEventListener("visibilitychange",m),m(),window.__godsEyeView={viewer:s,styleManager:l,tileset:o,dataManager:d,sceneDirector:h,mapStackController:r,annotations:f,weatherEffects:c,cockpitCloudEffects:u,getRenderGovernorDiagnostics:p5,requestRender:ut},window.__godsEyeView.voiceCommands=xae({viewer:s,styleManager:l,dataManager:d,sceneDirector:h,annotations:f})}catch(n){console.error("God's Eye View initialization failed:",n),t.textContent=`Error: ${XL(n)}`,t.style.color="#ff4444"}}Cle();const m3=Object.freeze(Object.defineProperty({__proto__:null},Symbol.toStringTag,{value:"Module"}));
