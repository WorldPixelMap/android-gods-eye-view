<div align="center">

# 🌐 Android God's Eye View
### By **WorldPixelMap**

<p align="center">
  <img src="public/icon-192.png" alt="God's Eye View - WorldPixelMap" width="128" />
</p>

### A real-time geospatial intelligence console for planet Earth.

Photorealistic 3D globe, live aircraft, global maritime vessels, orbital satellites, seismic monitors, wildfire sensors, and public photographic CCTV feeds. Powered by a hands-free realtime AI agent. Available for modern web browsers and Android devices.
### "Special Thanks to @bilawalsidhu"

*No place left behind.*  
Try other Apps: *https://worldpixelmap.in/apps_suite/*

[![License](https://img.shields.io/badge/License-WorldPixelMap%20Custom-cyan.svg)](LICENSE)
[![Android](https://img.shields.io/badge/Platform-Web%20%7C%20Android%20APK-emerald.svg)](Android/)
[![Cesium](https://img.shields.io/badge/Engine-CesiumJS%203D-blue.svg)](https://cesium.com/)
[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-2680%2B%20Passing-brightgreen.svg)](scripts/run-unit-tests.mjs)
[![License Server](https://img.shields.io/badge/License%20Server-Titan%20Active-brightgreen.svg)](https://worldpixelmap.in/apps_suite/portal.php)
[![Release](https://img.shields.io/badge/Release-v1.0.1-orange.svg)](https://github.com/WorldPixelMap/android-gods-eye-view/releases)

---

**[⚡ Quick Start](#-quick-start-web-application) · [📱 Android App](#-android-app--release-apk) · [🔒 Hardware Licensing](#-hardware-bound-titan-licensing-system) · [🎛️ Key Features](#️-key-features) · [🎮 Controls](#-keyboard-shortcuts--tactical-optics) · [🎙️ Voice Agent](#️-voice-agent) · [🛰️ Live Layers](#️-live-layers--data-stack) · [🔑 API Setup](#-api-keys--configuration) · [📜 License](#-license--attribution)**

</div>

---

## 🌍 Overview

**God's Eye View** fuses disparate real-time open signals into a single unified 3D operational picture. From transponder state vectors in the upper atmosphere to AIS vessel beacons crossing oceans, orbital satellite ephemerides, active wildfire perimeters, and live municipal street cameras — the entire planet is modeled in high-fidelity 3D with zero lag.

> Built with **CesiumJS**, **Google Photorealistic 3D Tiles**, and **OpenAI Realtime Voice**, God's Eye View delivers the visual language of an advanced intelligence operations center.

---

## 🎛️ Key Features

- **🌐 Photorealistic 3D Globe:** High-resolution 3D photogrammetry and terrain meshes rendered via Google 3D Tiles and CesiumJS.
- **✈️ Live Flight Tracking & Cockpit Mode:** Track thousands of commercial and military aircraft in real time. Jump into the cockpit of any tracked flight with real-world orientation and terrain-following cameras.
- **🚢 Global Marine Navigation (AIS):** Track commercial shipping lanes, tankers, cargo vessels, and tugs worldwide with live course projection.
- **🛰️ Orbital Satellites & Space Missions:** Propagate real-time SGP4 orbits for the ISS, Starlink constellations, and weather satellites with orbital footprint projections and launch schedules.
- **📹 Live Photographic CCTV Engine:** Connects to real-world municipal camera networks across London (TfL JamCams), San Francisco & Bay Area (Caltrans D4), and Austin Mobility with estimated camera viewsheds.
- **🚗 Speed-Calibrated Traffic Simulation:** Realistic street-level traffic vector flow integrated with OpenStreetMap geometry.
- **🎨 Multi-Sensor Optics (GLSL Shaders):** Cycle through Night Vision (NVG), Forward Looking Infrared (FLIR Ironbow), CRT, Noir, and Snow sensor filters in real time.
- **🎖️ Tactical Military HUD:** Clean, non-colliding military HUD displaying MGRS coordinates, geodetic lat/lon, satellite identification, NIIRS scale, and AI scene summaries.
- **🎙️ Realtime AI Voice Co-Pilot:** Natural spoken interaction to fly camera routes, query visible objects, inspect telemetry, measure distances, and manage layers hands-free.
- **🔒 Hardware-Bound Titan Licensing:** Built-in tamper-proof device fingerprinting, 7-day zero-friction evaluation, cryptographic epoch countdown, and online license validation.

---

## 🔒 Hardware-Bound Titan Licensing System

God's Eye View incorporates an enterprise-grade, hardware-bound licensing architecture integrated with the **WorldPixelMap Titan License Server**.

### Key Licensing Capabilities:
- **7-Day Free Offline Evaluation:** Every new device receives an automatic 7-day full-access trial upon first launch with zero initial configuration required.
- **Hardware Device Fingerprinting (`device_id`):** Cryptographically generates and securely persists a persistent hardware fingerprint bound to the specific device.
- **Tamper-Resistant Offline Epoch Countdown:** The trial expiration is anchored to a cryptographic epoch timestamp (`titan_hw_epoch`). If the system clock is manipulated backward, the built-in anti-clock rollback guard automatically revokes the trial.
- **One-Click License Activation:** Seamlessly upgrade from trial to full VIP access by entering an activation key in the in-app license manager dialog.
- **License Management Dialog (`Ctrl + L`):** Displays real-time device ID, current license tier (Trial, Active VIP, or Expired), remaining days, and instant unbind/rebind options.

### License Endpoints & Store Links:
- **🛒 Product Store:** [Purchase a License Key](https://worldpixelmap.in/apps_suite/product.php?slug=agev)
- **👤 Customer Portal:** [Manage Devices & Licenses](https://worldpixelmap.in/apps_suite/portal.php)
- **🌐 License Validation Server:** `https://worldpixelmap.in/apps_suite/license.php`

---

## 🎮 Keyboard Shortcuts & Tactical Optics

| Key / Shortcut | Action | Description |
|---|---|---|
| **`1`** | **Standard Optics** | True-color satellite imagery and 3D photogrammetric tiles. |
| **`2`** | **Night Vision (NVG)** | Phosphor-green light amplification shader with scanning lines. |
| **`3`** | **FLIR Thermal (Ironbow)** | Long-wave infrared false-color thermal heat signature spectrum. |
| **`4`** | **CRT Tactical Console** | Scanline raster monitor simulation with barrel curvature. |
| **`5`** | **Noir High-Contrast** | Desaturated monochrome high-contrast shadow filter. |
| **`6`** | **Snow / Arctic** | Cool high-latitude atmospheric scatter and frost correction. |
| **`7`** | **Satellite False-Color** | Multi-band multispectral vegetation/urban reflectance. |
| **`H`** | **Toggle Tactical HUD** | Shows/hides the MGRS coordinate grid, compass rose, and NIIRS readout. |
| **`C`** | **Aircraft Cockpit View** | Toggles first-person pilot cockpit camera for selected aircraft. |
| **`D`** | **Attribution & Credits** | Opens data layer provenance, provider notices, and licenses drawer. |
| **`Ctrl + L`** | **License Manager** | Opens the Titan Hardware-Bound Licensing configuration dialog. |
| **`Esc`** | **Close Overlays** | Closes any active modal, dialog, or flight camera lock. |
| **`Space` / Click** | **Voice Agent** | Initiates real-time conversational voice interaction. |

---

## 📱 Android App & Release APK

God's Eye View includes a native Android wrapper optimized for landscape tablets and smartphones, utilizing hardware-accelerated WebView rendering and low-latency touch controls.

### Pre-Built Signed Release APK
The pre-compiled, signed Android APK is ready for deployment:
- **Direct Path:** [`Android/app/build/outputs/apk/release/app-release.apk`](Android/app/build/outputs/apk/release/) or the root [`gods-eye-view-release.apk`](gods-eye-view-release.apk)
- **Releases:** Download directly from [GitHub Releases](https://github.com/WorldPixelMap/android-gods-eye-view/releases).

### Building from Source (Android Studio / Gradle):

1. **Build & Sync Web Assets:**
   ```bash
   node Android/scripts/build-apk-assets.mjs
   ```

2. **Assemble Release APK:**
   ```bash
   cd Android
   ./gradlew assembleRelease
   ```
   *The signed APK will be generated at `Android/app/build/outputs/apk/release/app-release.apk`.*

3. **Install on Connected Device via ADB:**
   ```bash
   adb install -r Android/app/build/outputs/apk/release/app-release.apk
   adb shell am start -n com.worldpixelmap.gev/.MainActivity
   ```

---

## ⚡ Quick Start (Web Application)

### Prerequisites
- **Node.js** 24.14.x or 26.x
- **npm** 10+

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/WorldPixelMap/android-gods-eye-view.git
   cd android-gods-eye-view
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to configure your API keys (see [API Setup](#-api-keys--configuration)).*

3. **Install dependencies and start development server:**
   ```bash
   npm install
   npm run dev -- --host localhost --port 4173
   ```

4. **Launch:**
   Open **`http://localhost:4173`** in your browser.

---

## 🎙️ Voice Agent

The integrated voice agent is powered by OpenAI's Realtime WebSocket protocol, providing sub-second latency voice commands and spatial understanding:

- **Navigation:** *"Take me to Tokyo."*, *"Orbit around downtown Austin."*, *"Fly the route from LAX to the coast."*
- **Intelligence Analysis:** *"What is the nearest airborne aircraft?"*, *"Which ships are approaching San Francisco Bay?"*, *"Show active fires in California."*
- **Whiteboard Annotations:** *"Outline the boundary of Central Park."*, *"Measure the distance from London Bridge to Heathrow Airport."*
- **Tactical Controls:** *"Switch to Night Vision."*, *"Turn on live satellite orbits."*, *"Enter the cockpit of the selected plane."*

---

## 🛰️ Live Layers & Data Stack

| Layer | Source / Provider | Auth | Description |
|---|---|---|---|
| 🗺️ **3D Photorealistic Mesh** | Google Maps 3D Tiles | 🔴 API Key | Global high-density 3D photogrammetric cities & terrain. |
| ✈️ **Live Flights (ADS-B)** | OpenSky Network / adsb.lol | 🟢 100% Free | Global aircraft telemetry, speed, altitude, and heading. |
| 🚢 **Live Vessels (AIS)** | AISStream.io | 🟡 Free API Key | Global maritime vessel positions, ship types, and destinations. |
| 🛰️ **Satellites (TLE)** | CelesTrak / Space-Track | 🟢 100% Free | SGP4 orbital propagation for Starlink, ISS, GPS, and scientific satellites. |
| 🚀 **Space Missions** | Launch Library 2 | 🟢 100% Free | Upcoming rocket launches, launch complexes, and mission telemetry. |
| 📹 **City CCTV Feeds** | TfL / Caltrans / Austin Open Data | 🟢 100% Free | Live photographic snapshot camera feeds projected into 3D space. |
| 🌦️ **Global Weather** | Open-Meteo | 🟢 100% Free | High-resolution cloud cover, temperature, and atmospheric forecasts. |
| 🌍 **Earthquakes** | USGS Hazard Program | 🟢 100% Free | Real-time global seismic event epicenter and magnitude telemetry. |
| 🔥 **Wildfires** | NASA FIRMS (VIIRS/MODIS) | 🟡 Free API Key | Satellite thermal anomaly detection identifying active wildfire zones. |
| 📻 **World Radio** | Radio-Browser Community | 🟢 100% Free | 30,000+ geo-located international live audio broadcast streams. |

*Full license terms and source provenance are detailed in **[`DATA_SOURCES.md`](DATA_SOURCES.md)**.*

---

## 🔑 API Keys & Configuration

Configure your credentials in `.env` (refer to `.env.example` for details):

| Environment Variable | Service | Required? | Notes |
|---|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Google Maps Platform | **Yes** | Required for Photorealistic 3D Tiles. |
| `OPENAI_API_KEY` | OpenAI Platform | Optional | Powers the AI Realtime voice agent & HUD summaries. |
| `AISSTREAM_API_KEY` | AISStream.io | Optional | Enables live global vessel maritime tracking. |
| `NASA_FIRMS_MAP_KEY` | NASA FIRMS | Optional | Enables active wildfire thermal detection layer. |
| `TOMTOM_API_KEY` | TomTom Traffic | Optional | Powers real-time road traffic congestion. |

---

## 🧪 Testing & Validation

God's Eye View maintains an automated test suite of **2,680+ automated unit tests** verifying camera kinematics, real-time voice protocol framing, Titan license protection, credit attribution clearance, and telemetry converters:

```bash
npm test
```

To run licensing verification tests specifically:
```bash
node --test src/license.test.mjs
```

---

## 📂 Repository Structure

```text
android-gods-eye-view/
├── Android/                    # Native Android application source & Gradle project
│   ├── app/                    # Android app module with WebView & native bindings
│   └── scripts/                # Asset syncing & APK build automation
├── public/                     # Static assets, icons, shaders, and 3D models
│   ├── icon-192.png            # App launcher icons
│   ├── icon-512.png
│   └── models/                 # Optimized glTF aircraft, satellite, and ship models
├── scripts/                    # Build, test, attribution, and QA tooling
│   └── run-unit-tests.mjs      # Test discovery and execution engine
├── src/                        # Core application source code
│   ├── annotations/            # Whiteboard drawing, containment, and measurement
│   ├── audio/                  # Spatial sound effects and radio streaming
│   ├── data/                   # Live telemetry ingest (ADS-B, AIS, TLE, CCTV, FIRMS)
│   ├── hud/                    # Military HUD, MGRS grid, and compass overlay
│   ├── overlays/               # Tactical optics shaders (NVG, FLIR, CRT)
│   ├── voice/                  # OpenAI Realtime WebSocket protocol client
│   ├── license.js              # Hardware-bound Titan license client
│   ├── licenseModal.js         # Titan license in-app management dialog
│   └── main.js                 # Cesium viewer orchestration & lifecycle
├── .env.example                # Template for environment configuration
├── package.json                # Project dependencies and script declarations
├── vite.config.js              # Vite bundler configuration & secure proxies
└── README.md                   # Project documentation
```

---

## 📜 License & Attribution

- **Source Code License:** Copyright © 2026 **WorldPixelMap**. All rights reserved. Usage, modification, and distribution require explicit prior written permission from WorldPixelMap. See [`LICENSE`](LICENSE) for details.
- **Special Thanks:** Sincere appreciation to **@bilawalsidhu** for original project inspiration and foundational geospatial exploratory work.
- **Third-Party Data & Models:** Data feeds and 3D assets remain subject to their respective upstream licenses. See [`DATA_SOURCES.md`](DATA_SOURCES.md) and [`public/models/README.md`](public/models/README.md).
- **Disclaimer:** God's Eye View is an exploratory geospatial visualization console. It is not certified for aviation, maritime navigation, or emergency dispatch.