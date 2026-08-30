# 🌐 God's Eye View — Android Application

Native Android implementation of **God's Eye View** — the real-time 3D planetary intelligence console.

---

## 🚀 Key Features of the Android App

- **3D Globe Engine:** Full hardware-accelerated WebGL2 rendering with Google Photorealistic 3D Tiles and keyless OpenStreetMap / Re:Earth 3D Terrain fallback.
- **Open-Source Default Tier:** 10+ layers (Satellites, Military Flights, Earthquakes, Live Radio, CCTV feeds, Rocket Launches, Infrastructure) work out of the box with **zero configuration and $0 cost**.
- **In-App BYOK Key Configuration:** Tap the `⚙️` (Settings) icon on the HUD to enter your personal free or paid keys (Google 3D Tiles, OpenAI Voice, AISStream ships, NASA FIRMS wildfires, TomTom traffic) with interactive step-by-step guides.
- **Immersive Fullscreen:** Automatically hides status bars and navigation bars for a true tactical cockpit display on mobile and tablet screens.
- **WebRTC Microphone Integration:** Complete native permission handling for OpenAI Realtime Voice commands.

---

## 🛠️ Project Structure

```
Android/
├── app/
│   ├── build.gradle.kts           # App-level Android build config
│   ├── src/main/
│   │   ├── AndroidManifest.xml    # Permissions (Audio, GPS, Network), Landscape orientation
│   │   ├── java/com/godseyeview/app/MainActivity.kt  # Native WebView & ChromeClient
│   │   ├── res/                   # Themes, strings, colors, security config
│   │   └── assets/www/            # Bundled web distribution (built via sync script)
├── scripts/
│   └── build-apk-assets.mjs       # Build & sync script
├── build.gradle.kts               # Root build config
├── settings.gradle.kts            # Gradle settings
└── README.md
```

---

## 📱 How to Build & Run

### Step 1: Build and Sync Web Assets
From the root repository or inside `Android/`, run:

```bash
node Android/scripts/build-apk-assets.mjs
```
This compiles the Cesium + Vite bundle and syncs all HTML, JS, CSS, and 3D glTF models directly into `Android/app/src/main/assets/www/`.

### Step 2: Open in Android Studio or Build via Gradle

#### Option A: Using Android Studio (Recommended)
1. Open **Android Studio**.
2. Select **"Open"** and choose the `Android/` folder.
3. Wait for Gradle sync to complete.
4. Select your connected Android device or emulator and click **▶️ Run**.

#### Option B: Using Gradle CLI
```bash
cd Android
./gradlew assembleDebug
```
The compiled debug APK will be located at:
`Android/app/build/outputs/apk/debug/app-debug.apk`

Install directly to a connected device:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔑 In-App Telemetry & API Key Guides

The Android app includes a tactical **Configuration Manager**:
1. Tap the **`⚙️`** icon at the top of the HUD.
2. View real-time status of all layers.
3. Tap **`📖 Guide`** on any key for step-by-step instructions on obtaining free keys:
   - **Google 3D Tiles:** 1,000 free 3-hour sessions/month from Google Cloud Console.
   - **AISStream:** 100% Free instant developer key for live ships.
   - **NASA FIRMS:** 100% Free key for live wildfire detections.
   - **TomTom Traffic:** Free tier for live traffic flow vectors.
   - **OpenAI Realtime:** Voice agent commands.
4. Tap **`🧪 Test`** to verify your key before saving.
5. Tap **`💾 Save & Apply`** to reload the globe with your updated keys.
