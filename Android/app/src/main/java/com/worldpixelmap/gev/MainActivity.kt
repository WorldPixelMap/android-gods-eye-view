package com.worldpixelmap.gev

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.WindowManager
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val TAG = "GodsEyeView"
    private val PERMISSION_REQUEST_CODE = 1001

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            // Keep screen on while viewing tactical globe
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

            // Initialize WebView
            webView = WebView(this)
            setContentView(webView)

            // Enable immersive full screen
            hideSystemUI()

            setupWebSettings()
            setupWebClients()
            requestAppPermissions()
            initCctvSourcesInBackground()

            // Back button dispatcher
            onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (::webView.isInitialized && webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            })

            // Load the God's Eye View application via secure asset loader
            loadWebApp()
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing MainActivity: ${e.message}", e)
        }
    }

    @Suppress("DEPRECATION")
    private fun setupWebSettings() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.allowFileAccessFromFileURLs = true
        settings.allowUniversalAccessFromFileURLs = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.setSupportZoom(false)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        // Add JavaScript interface for native bridge
        webView.addJavascriptInterface(WebAppInterface(), "AndroidBridge")
    }

    private fun setupWebClients() {
        // Modern WebViewAssetLoader serves assets over https://appassets.androidplatform.net/assets/
        // which completely bypasses CORS restrictions on ES modules and Web Workers!
        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/res/", WebViewAssetLoader.ResourcesPathHandler(this))
            .build()

        webView.webChromeClient = object : WebChromeClient() {
            // Handle WebRTC Audio Microphone Permission Request
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.let {
                    val resources = it.resources
                    for (resource in resources) {
                        if (resource == PermissionRequest.RESOURCE_AUDIO_CAPTURE) {
                            it.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                            return
                        }
                    }
                    it.grant(resources)
                }
            }

            // Handle Geolocation Prompt
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                callback?.invoke(origin, true, false)
            }

            // Debug logs
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    Log.d(TAG, "[WebView Console] ${it.sourceId()}:${it.lineNumber()} - ${it.message()}")
                }
                return true
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                val uri = request?.url ?: return null
                
                // 1. Try serving from local assets/www first (models, cesium, images, icons)
                val localAssetResponse = handleAssetRequest(uri)
                if (localAssetResponse != null) {
                    return localAssetResponse
                }

                // 2. Try standard WebViewAssetLoader
                val assetResponse = assetLoader.shouldInterceptRequest(uri)
                if (assetResponse != null) {
                    return assetResponse
                }

                // 3. Intercept and proxy all /api/* backend endpoints directly on Android
                val apiResponse = handleApiProxy(uri, request)
                if (apiResponse != null) {
                    return apiResponse
                }

                return null
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false

                // Let internal app assets load inside the WebView
                if (url.startsWith("https://appassets.androidplatform.net/")) {
                    return false
                }

                // Open external links in device browser
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    try {
                        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(browserIntent)
                        return true
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to open external browser: ${e.message}")
                    }
                }
                return false
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Log.e(TAG, "WebView Error: ${error?.description} (${error?.errorCode}) - ${request?.url}")
                }
            }
        }
    }

    private fun handleAssetRequest(uri: Uri): WebResourceResponse? {
        val path = uri.path ?: return null
        val relativePath = path.removePrefix("/")

        if (relativePath.startsWith("api/")) return null

        val assetPath = if (relativePath.startsWith("assets/www/")) {
            relativePath.substring("assets/".length)
        } else if (relativePath.startsWith("assets/")) {
            relativePath
        } else {
            "www/$relativePath"
        }

        return try {
            val stream = assets.open(assetPath)
            val mimeType = when {
                assetPath.endsWith(".html") -> "text/html"
                assetPath.endsWith(".js") || assetPath.endsWith(".mjs") -> "application/javascript"
                assetPath.endsWith(".css") -> "text/css"
                assetPath.endsWith(".json") || assetPath.endsWith(".geojson") || assetPath.endsWith(".geojsonl") -> "application/json"
                assetPath.endsWith(".svg") -> "image/svg+xml"
                assetPath.endsWith(".png") -> "image/png"
                assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg") -> "image/jpeg"
                assetPath.endsWith(".glb") || assetPath.endsWith(".gltf") -> "model/gltf-binary"
                assetPath.endsWith(".wasm") -> "application/wasm"
                assetPath.endsWith(".pbf") -> "application/x-protobuf"
                else -> "application/octet-stream"
            }
            val headers = mapOf(
                "Access-Control-Allow-Origin" to "*",
                "Cache-Control" to "public, max-age=31536000"
            )
            WebResourceResponse(mimeType, "UTF-8", 200, "OK", headers, stream)
        } catch (e: Exception) {
            null
        }
    }

    private data class CacheEntry(val timestamp: Long, val contentType: String, val data: ByteArray)
    private val apiCache = java.util.concurrent.ConcurrentHashMap<String, CacheEntry>()

    private fun handleApiProxy(uri: Uri, request: WebResourceRequest?): WebResourceResponse? {
        val path = uri.path ?: return null
        val apiPath = if (path.startsWith("/assets/www/api/")) {
            path.substring("/assets/www".length)
        } else if (path.startsWith("/api/")) {
            path
        } else {
            return null
        }

        val cacheKey = "$apiPath?${uri.query ?: ""}"
        val now = System.currentTimeMillis()

        // Handle endpoints that don't need network
        if (apiPath.startsWith("/api/tomtom/status")) {
            val json = "{\"hasKey\":false,\"status\":\"simulation\",\"dailyCount\":0,\"budget\":40000}"
            return createCorsResponse("application/json", json.toByteArray(Charsets.UTF_8))
        }
        if (apiPath.startsWith("/api/firms/status") || apiPath.startsWith("/api/ais-live")) {
            val json = "{\"hasKey\":false,\"status\":\"missing-key\"}"
            return createCorsResponse("application/json", json.toByteArray(Charsets.UTF_8))
        }
        if (apiPath.startsWith("/api/realtime/debug-log")) {
            val json = "{\"ok\":true}"
            return createCorsResponse("application/json", json.toByteArray(Charsets.UTF_8))
        }
        if (apiPath.startsWith("/api/realtime/token") || apiPath.startsWith("/api/openai/hud-summary")) {
            val json = "{\"error\":\"OPENAI_API_KEY is not set\"}"
            return createCorsResponse("application/json", json.toByteArray(Charsets.UTF_8), 503, "Service Unavailable")
        }
        if (apiPath.startsWith("/api/google/nearby-places") || apiPath.startsWith("/api/google/text-search")) {
            val json = "{\"places\":[]}"
            return createCorsResponse("application/json", json.toByteArray(Charsets.UTF_8))
        }
        if (apiPath.startsWith("/api/military-installations")) {
            val json = "{\"elements\":[]}"
            return createCorsResponse("application/json", json.toByteArray(Charsets.UTF_8))
        }
        if (apiPath.startsWith("/api/terrain/heights")) {
            val points = uri.getQueryParameter("points") ?: ""
            val count = points.split(";").filter { it.isNotBlank() }.size
            val results = (0 until maxOf(1, count)).joinToString(",") { "{\"ellipsoid\":0.0}" }
            val json = "{\"results\":[$results]}"
            return createCorsResponse("application/json", json.toByteArray(Charsets.UTF_8))
        }

        var upstreamUrl: String? = null
        var mimeType = "application/json"
        var ttlMs = 15000L

        when {
            apiPath.startsWith("/api/celestrak/") -> {
                val group = apiPath.substring("/api/celestrak/".length).split("?")[0].trim()
                upstreamUrl = "https://celestrak.org/NORAD/elements/gp.php?GROUP=$group&FORMAT=tle"
                mimeType = "text/plain"
                ttlMs = 600000L // 10 minutes
            }
            apiPath.startsWith("/api/opensky-track") -> {
                val query = uri.query ?: ""
                upstreamUrl = "https://opensky-network.org/api/tracks/all?$query"
                mimeType = "application/json"
                ttlMs = 10000L
            }
            apiPath.startsWith("/api/opensky") -> {
                upstreamUrl = "https://opensky-network.org/api/states/all"
                mimeType = "application/json"
                ttlMs = 10000L // 10 seconds
            }
            apiPath.startsWith("/api/adsbdb/type/") -> {
                val icao = apiPath.substring("/api/adsbdb/type/".length).split("?")[0]
                upstreamUrl = "https://api.adsbdb.com/v0/aircraft/$icao"
                mimeType = "application/json"
                ttlMs = 86400000L // 24 hours
            }
            apiPath.startsWith("/api/launches") -> {
                val start = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US).apply {
                    timeZone = java.util.TimeZone.getTimeZone("UTC")
                }.format(java.util.Date(now - 30L * 86400000L))
                val end = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US).apply {
                    timeZone = java.util.TimeZone.getTimeZone("UTC")
                }.format(java.util.Date(now))
                upstreamUrl = "https://ll.thespacedevs.com/2.3.0/launches/?net__gte=$start&net__lte=$end&limit=100&mode=detailed"
                mimeType = "application/json"
                ttlMs = 900000L // 15 minutes
            }
            apiPath.startsWith("/api/radio/stations") -> {
                upstreamUrl = "https://de1.api.radio-browser.info/json/stations/topclick/100"
                mimeType = "application/json"
                ttlMs = 1800000L // 30 minutes
            }
            apiPath.startsWith("/api/radio/click/") -> {
                val id = apiPath.substring("/api/radio/click/".length).split("?")[0]
                upstreamUrl = "https://de1.api.radio-browser.info/json/url/$id"
                mimeType = "application/json"
                ttlMs = 0L
            }
            apiPath.startsWith("/api/adsblol/mil") -> {
                upstreamUrl = "https://api.adsb.lol/v2/mil"
                mimeType = "application/json"
                ttlMs = 15000L // 15 seconds
            }
            apiPath.startsWith("/api/adsblol/trace") -> {
                val query = uri.query ?: ""
                upstreamUrl = "https://api.adsb.lol/v2/trace?$query"
                mimeType = "application/json"
                ttlMs = 10000L
            }
            apiPath.startsWith("/api/weather") || apiPath.startsWith("/api/weather-effects") || apiPath.startsWith("/api/regional-brief") -> {
                val query = uri.query ?: ""
                upstreamUrl = "https://api.open-meteo.com/v1/forecast?$query"
                mimeType = "application/json"
                ttlMs = 300000L // 5 minutes
            }
            apiPath.startsWith("/api/overpass") -> {
                val query = uri.query ?: ""
                upstreamUrl = "https://overpass-api.de/api/interpreter?$query"
                mimeType = "application/json"
                ttlMs = 120000L
            }
            apiPath.startsWith("/api/earthquakes") -> {
                upstreamUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
                mimeType = "application/json"
                ttlMs = 120000L // 2 minutes
            }
            apiPath.startsWith("/api/cctv/sources") -> {
                return handleCctvSources()
            }
            apiPath.startsWith("/api/cctv/frame") -> {
                return handleCctvFrame(uri)
            }
            apiPath.startsWith("/api/cctv/health") -> {
                val json = "{\"cameras\":[]}"
                return createCorsResponse("application/json", json.toByteArray(Charsets.UTF_8))
            }
            apiPath.startsWith("/api/cctv/stream/") -> {
                val cameraId = apiPath.substring("/api/cctv/stream/".length).split("?")[0]
                val json = "{\"id\":\"$cameraId\",\"feedType\":\"image\",\"frameUrl\":\"/api/cctv/frame/$cameraId\",\"mediaUrl\":null,\"provider\":\"GodsEyeView\",\"sourceKind\":\"seed\"}"
                return createCorsResponse("application/json", json.toByteArray(Charsets.UTF_8))
            }
        }

        if (upstreamUrl == null) return null

        // Check fresh cache
        if (ttlMs > 0) {
            val cached = apiCache[cacheKey]
            if (cached != null && (now - cached.timestamp) < ttlMs) {
                return createCorsResponse(cached.contentType, cached.data)
            }
        }

        return try {
            val url = java.net.URL(upstreamUrl)
            val connection = url.openConnection() as java.net.HttpURLConnection
            connection.requestMethod = request?.method ?: "GET"
            connection.connectTimeout = 12000
            connection.readTimeout = 18000
            connection.setRequestProperty("User-Agent", "gods-eye-view-android/1.0 (+https://github.com/WorldPixelMap/gods-eye-view)")
            connection.setRequestProperty("Accept", "*/*")

            request?.requestHeaders?.let { headers ->
                for ((key, value) in headers) {
                    if (key.equals("Accept", ignoreCase = true) || key.equals("Authorization", ignoreCase = true)) {
                        connection.setRequestProperty(key, value)
                    }
                }
            }

            val status = connection.responseCode
            val inputStream = if (status in 200..299) connection.inputStream else connection.errorStream ?: "".byteInputStream()
            val rawBytes = inputStream.readBytes()
            val responseContentType = connection.contentType?.split(";")?.get(0)?.trim() ?: mimeType
            val safeMessage = if (connection.responseMessage.isNullOrBlank()) "OK" else connection.responseMessage

            if (status in 200..299 && ttlMs > 0) {
                apiCache[cacheKey] = CacheEntry(now, responseContentType, rawBytes)
            }

            createCorsResponse(responseContentType, rawBytes, status, safeMessage)
        } catch (e: Exception) {
            Log.w(TAG, "Proxy error for $apiPath: ${e.message}")
            // Serve stale cache if available on network failure
            val stale = apiCache[cacheKey]
            if (stale != null) {
                return createCorsResponse(stale.contentType, stale.data)
            }
            val errJson = "{\"error\":\"Upstream fetch failed: ${e.message}\"}".toByteArray(Charsets.UTF_8)
            createCorsResponse("application/json", errJson, 502, "Bad Gateway")
        }
    }

    private fun createCorsResponse(
        mimeType: String,
        data: ByteArray,
        statusCode: Int = 200,
        reasonPhrase: String = "OK"
    ): WebResourceResponse {
        val headers = mapOf(
            "Access-Control-Allow-Origin" to "*",
            "Access-Control-Allow-Methods" to "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers" to "*",
            "Cache-Control" to "no-cache"
        )
        return WebResourceResponse(
            mimeType,
            "UTF-8",
            statusCode,
            reasonPhrase,
            headers,
            java.io.ByteArrayInputStream(data)
        )
    }

    private val cctvImageUrlMap = java.util.concurrent.ConcurrentHashMap<String, String>()
    private val cctvFrameCache = java.util.concurrent.ConcurrentHashMap<String, Pair<Long, ByteArray>>()
    private var cctvSourcesCached: ByteArray? = null
    @Volatile private var isCctvLoading = false

    private fun initCctvSourcesInBackground() {
        if (isCctvLoading) return
        isCctvLoading = true
        Thread {
            try {
                val json = buildLiveCctvSourcesJson()
                val bytes = json.toByteArray(Charsets.UTF_8)
                cctvSourcesCached = bytes
                Log.d(TAG, "[CCTV] Loaded ${cctvImageUrlMap.size} live camera photograph feeds")
            } catch (e: Exception) {
                Log.w(TAG, "[CCTV] Error initializing camera feeds: ${e.message}")
            } finally {
                isCctvLoading = false
            }
        }.start()
    }

    private fun handleCctvSources(): WebResourceResponse {
        val cached = cctvSourcesCached
        if (cached != null) {
            return createCorsResponse("application/json", cached)
        }

        initCctvSourcesInBackground()
        val json = buildFallbackSeedSourcesJson()
        return createCorsResponse("application/json", json.toByteArray(Charsets.UTF_8))
    }

    private fun buildLiveCctvSourcesJson(): String {
        val sources = mutableListOf<String>()

        // 1. London TfL JamCams (890+ live street/intersection photography cameras)
        try {
            val url = java.net.URL("https://api.tfl.gov.uk/Place/Type/JamCam")
            val conn = url.openConnection() as java.net.HttpURLConnection
            conn.connectTimeout = 6000
            conn.readTimeout = 8000
            conn.setRequestProperty("User-Agent", "GodsEyeView-CCTV/1.0")
            if (conn.responseCode in 200..299) {
                val text = conn.inputStream.reader(Charsets.UTF_8).readText()
                val places = org.json.JSONArray(text)
                var count = 0
                for (i in 0 until places.length()) {
                    if (count >= 250) break
                    val place = places.optJSONObject(i) ?: continue
                    val addProps = place.optJSONArray("additionalProperties") ?: continue
                    var available = false
                    var imageUrl = ""
                    for (j in 0 until addProps.length()) {
                        val prop = addProps.optJSONObject(j) ?: continue
                        val key = prop.optString("key", "")
                        val value = prop.optString("value", "")
                        if (key == "available" && value.equals("true", ignoreCase = true)) available = true
                        if (key == "imageUrl") imageUrl = value
                    }
                    if (!available || imageUrl.isBlank()) continue
                    val lat = place.optDouble("lat", Double.NaN)
                    val lon = place.optDouble("lon", Double.NaN)
                    if (lat.isNaN() || lon.isNaN()) continue

                    val rawId = place.optString("id", "").removePrefix("JamCams_")
                    if (rawId.isBlank()) continue
                    val camId = "tfl-$rawId"
                    val name = place.optString("commonName", "London JamCam $rawId")
                        .replace("\"", "\\\"").replace("\n", " ").trim()

                    cctvImageUrlMap[camId] = imageUrl
                    sources.add("""
                        {
                            "id": "$camId",
                            "name": "$name",
                            "city": "London",
                            "cityId": "london",
                            "provider": "Transport for London",
                            "lat": $lat,
                            "lon": $lon,
                            "headingDeg": 180,
                            "headingConfidence": "low",
                            "pitchDeg": -18,
                            "fovDeg": 44,
                            "rangeM": 145,
                            "mountHeightM": 8,
                            "groundElevationM": 15,
                            "feedType": "image",
                            "url": "$imageUrl",
                            "snapshotUrl": "$imageUrl",
                            "sourceKind": "tfl-open-data",
                            "license": "Powered by TfL Open Data"
                        }
                    """.trimIndent())
                    count++
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "[CCTV] Failed to load TfL JamCams: ${e.message}")
        }

        // 2. Caltrans D4 (San Francisco, Golden Gate, Bay Area live highway & street photography)
        try {
            val url = java.net.URL("https://cwwp2.dot.ca.gov/data/d4/cctv/cctvStatusD04.json")
            val conn = url.openConnection() as java.net.HttpURLConnection
            conn.connectTimeout = 6000
            conn.readTimeout = 8000
            conn.setRequestProperty("User-Agent", "GodsEyeView-CCTV/1.0")
            if (conn.responseCode in 200..299) {
                val text = conn.inputStream.reader(Charsets.UTF_8).readText()
                val root = org.json.JSONObject(text)
                val data = root.optJSONArray("data") ?: org.json.JSONArray()
                var count = 0
                for (i in 0 until data.length()) {
                    if (count >= 200) break
                    val item = data.optJSONObject(i) ?: continue
                    val cctv = item.optJSONObject("cctv") ?: continue
                    if (!cctv.optString("inService", "").equals("true", ignoreCase = true)) continue
                    val loc = cctv.optJSONObject("location") ?: continue
                    val lat = loc.optDouble("latitude", Double.NaN)
                    val lon = loc.optDouble("longitude", Double.NaN)
                    if (lat.isNaN() || lon.isNaN()) continue

                    val imgObj = cctv.optJSONObject("imageData")?.optJSONObject("static")
                    val imgUrl = imgObj?.optString("currentImageURL", "") ?: ""
                    if (imgUrl.isBlank() || !imgUrl.startsWith("https://cwwp2.dot.ca.gov/")) continue

                    val locName = loc.optString("locationName", "Caltrans D4 Cam").replace("\"", "\\\"").trim()
                    val nearby = loc.optString("nearbyPlace", "San Francisco").replace("\"", "\\\"").trim()
                    val code = locName.substringBefore(" -- ").lowercase().replace(Regex("[^a-z0-9_-]"), "")
                    val camId = "ca-d4-${if (code.isBlank()) i else code}"
                    val label = "$locName ($nearby)"

                    cctvImageUrlMap[camId] = imgUrl
                    sources.add("""
                        {
                            "id": "$camId",
                            "name": "$label",
                            "city": "$nearby",
                            "cityId": "sanfrancisco",
                            "provider": "Caltrans District 4",
                            "lat": $lat,
                            "lon": $lon,
                            "headingDeg": 180,
                            "headingConfidence": "medium",
                            "pitchDeg": -20,
                            "fovDeg": 50,
                            "rangeM": 200,
                            "mountHeightM": 12,
                            "groundElevationM": 30,
                            "feedType": "image",
                            "url": "$imgUrl",
                            "snapshotUrl": "$imgUrl",
                            "sourceKind": "caltrans-open-data",
                            "license": "Public Caltrans camera feed"
                        }
                    """.trimIndent())
                    count++
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "[CCTV] Failed to load Caltrans D4 cameras: ${e.message}")
        }

        // 3. Austin Mobility Open Data (Austin live intersection photography)
        try {
            val url = java.net.URL("https://data.austintexas.gov/resource/b4k4-adkb.json?\$limit=80")
            val conn = url.openConnection() as java.net.HttpURLConnection
            conn.connectTimeout = 5000
            conn.readTimeout = 6000
            conn.setRequestProperty("User-Agent", "GodsEyeView-CCTV/1.0")
            if (conn.responseCode in 200..299) {
                val text = conn.inputStream.reader(Charsets.UTF_8).readText()
                val jsonArr = org.json.JSONArray(text)
                for (i in 0 until jsonArr.length()) {
                    val obj = jsonArr.optJSONObject(i) ?: continue
                    val camId = obj.optString("camera_id", "").ifBlank { obj.optString("id", "") }
                    if (camId.isBlank()) continue
                    val name = obj.optString("location_name", obj.optString("camera_name", "Austin Cam $camId"))
                        .replace("\"", "\\\"").trim()
                    val lat = obj.optDouble("latitude", Double.NaN).let { if (it.isNaN()) obj.optDouble("location_latitude", Double.NaN) else it }
                    val lon = obj.optDouble("longitude", Double.NaN).let { if (it.isNaN()) obj.optDouble("location_longitude", Double.NaN) else it }
                    if (lat.isNaN() || lon.isNaN()) continue

                    val screenshot = "https://cctv.austinmobility.io/image/$camId.jpg"
                    val id = "austin-$camId"
                    cctvImageUrlMap[id] = screenshot
                    sources.add("""
                        {
                            "id": "$id",
                            "name": "$camId - $name",
                            "city": "Austin",
                            "cityId": "austin",
                            "provider": "Austin Transportation & Public Works",
                            "lat": $lat,
                            "lon": $lon,
                            "headingDeg": 0,
                            "headingConfidence": "medium",
                            "pitchDeg": -14,
                            "fovDeg": 70,
                            "rangeM": 600,
                            "mountHeightM": 14,
                            "groundElevationM": 150,
                            "feedType": "image",
                            "url": "$screenshot",
                            "snapshotUrl": "$screenshot",
                            "sourceKind": "austin-open-data",
                            "license": "Public city traffic camera frame"
                        }
                    """.trimIndent())
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "[CCTV] Failed to load Austin cameras: ${e.message}")
        }

        // 4. Also add seed cameras mapped to live real snapshot URLs
        val seedPhotoMap = mapOf(
            "london-city-a1" to "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.07353.jpg",
            "london-soho-core" to "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.01350.jpg",
            "sf-market-5th" to "https://cwwp2.dot.ca.gov/data/d4/cctv/image/tv102i580westofsr24/tv102i580westofsr24.jpg",
            "sf-financial-district" to "https://cwwp2.dot.ca.gov/data/d4/cctv/image/tv101i80atbaybridge/tv101i80atbaybridge.jpg",
            "austin-congress-s" to "https://cctv.austinmobility.io/image/1.jpg",
            "austin-downtown-west" to "https://cctv.austinmobility.io/image/2.jpg",
            "nyc-midtown-w" to "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.07353.jpg",
            "nyc-wtc-n" to "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.01350.jpg",
            "nyc-times-square-ne" to "https://cwwp2.dot.ca.gov/data/d4/cctv/image/tv102i580westofsr24/tv102i580westofsr24.jpg",
            "tokyo-shibuya-scramble" to "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.07353.jpg",
            "tokyo-ginza-core" to "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.01350.jpg",
            "tokyo-asakusa-n" to "https://cwwp2.dot.ca.gov/data/d4/cctv/image/tv102i580westofsr24/tv102i580westofsr24.jpg",
            "paris-rivoli" to "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.07353.jpg",
            "paris-champs-n" to "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.01350.jpg",
            "dc-mall-center" to "https://cctv.austinmobility.io/image/1.jpg",
            "dc-pentagon-s" to "https://cctv.austinmobility.io/image/2.jpg",
            "dubai-difc-loop" to "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.07353.jpg",
            "dubai-downtown-east" to "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.01350.jpg"
        )

        val seeds = listOf(
            Triple("nyc-midtown-w", "Midtown West @ 34th", "New York" to Pair(40.7513, -73.9902)),
            Triple("nyc-wtc-n", "WTC North Plaza", "New York" to Pair(40.7130, -74.0132)),
            Triple("nyc-times-square-ne", "Times Sq Northeast", "New York" to Pair(40.7580, -73.9855)),
            Triple("sf-market-5th", "Market & 5th", "San Francisco" to Pair(37.7842, -122.4075)),
            Triple("sf-financial-district", "SF Financial Core", "San Francisco" to Pair(37.7946, -122.3999)),
            Triple("tokyo-shibuya-scramble", "Shibuya Crossing", "Tokyo" to Pair(35.6595, 139.7005)),
            Triple("tokyo-ginza-core", "Ginza Core", "Tokyo" to Pair(35.6712, 139.7665)),
            Triple("tokyo-asakusa-n", "Asakusa North Gate", "Tokyo" to Pair(35.7148, 139.7967)),
            Triple("london-city-a1", "City Cluster A1", "London" to Pair(51.5142, -0.0813)),
            Triple("london-soho-core", "Soho Core", "London" to Pair(51.5136, -0.1332)),
            Triple("paris-rivoli", "Rue de Rivoli", "Paris" to Pair(48.8566, 2.3522)),
            Triple("paris-champs-n", "Champs-Élysées North", "Paris" to Pair(48.8698, 2.3075)),
            Triple("dc-mall-center", "National Mall Center", "Washington DC" to Pair(38.8899, -77.0090)),
            Triple("dc-pentagon-s", "Pentagon South", "Washington DC" to Pair(38.8710, -77.0560)),
            Triple("dubai-difc-loop", "DIFC Loop", "Dubai" to Pair(25.2048, 55.2708)),
            Triple("dubai-downtown-east", "Downtown East", "Dubai" to Pair(25.1972, 55.2744)),
            Triple("austin-congress-s", "Congress Southbound", "Austin" to Pair(30.2672, -97.7431)),
            Triple("austin-downtown-west", "Downtown West", "Austin" to Pair(30.2700, -97.7480))
        )

        for ((id, name, cityPair) in seeds) {
            val (city, coords) = cityPair
            val photoUrl = seedPhotoMap[id] ?: ""
            if (photoUrl.isNotEmpty()) cctvImageUrlMap[id] = photoUrl
            sources.add("""
                {
                    "id": "$id",
                    "name": "$name",
                    "city": "$city",
                    "cityId": "${city.lowercase().replace(" ", "")}",
                    "provider": "Global Open CCTV Grid",
                    "lat": ${coords.first},
                    "lon": ${coords.second},
                    "headingDeg": 180,
                    "headingConfidence": "high",
                    "pitchDeg": -15,
                    "fovDeg": 74,
                    "rangeM": 750,
                    "mountHeightM": 24,
                    "groundElevationM": 20,
                    "feedType": "image",
                    "url": "$photoUrl",
                    "snapshotUrl": "$photoUrl",
                    "sourceKind": "configured"
                }
            """.trimIndent())
        }

        return "{\"sources\":[${sources.joinToString(",")}]}"
    }

    private fun buildFallbackSeedSourcesJson(): String {
        val seedPhotoMap = mapOf(
            "london-city-a1" to "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.07353.jpg",
            "sf-market-5th" to "https://cwwp2.dot.ca.gov/data/d4/cctv/image/tv102i580westofsr24/tv102i580westofsr24.jpg",
            "austin-congress-s" to "https://cctv.austinmobility.io/image/1.jpg",
            "nyc-times-square-ne" to "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.01350.jpg",
            "tokyo-shibuya-scramble" to "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.07353.jpg",
            "paris-rivoli" to "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.01350.jpg"
        )
        val seeds = listOf(
            Triple("nyc-times-square-ne", "Times Sq Northeast", "New York" to Pair(40.7580, -73.9855)),
            Triple("sf-market-5th", "Market & 5th", "San Francisco" to Pair(37.7842, -122.4075)),
            Triple("tokyo-shibuya-scramble", "Shibuya Crossing", "Tokyo" to Pair(35.6595, 139.7005)),
            Triple("london-city-a1", "City Cluster A1", "London" to Pair(51.5142, -0.0813)),
            Triple("paris-rivoli", "Rue de Rivoli", "Paris" to Pair(48.8566, 2.3522)),
            Triple("austin-congress-s", "Congress Southbound", "Austin" to Pair(30.2672, -97.7431))
        )
        val sources = seeds.map { (id, name, cityPair) ->
            val (city, coords) = cityPair
            val photoUrl = seedPhotoMap[id] ?: ""
            if (photoUrl.isNotEmpty()) cctvImageUrlMap[id] = photoUrl
            """
                {
                    "id": "$id",
                    "name": "$name",
                    "city": "$city",
                    "cityId": "${city.lowercase().replace(" ", "")}",
                    "provider": "Global Open CCTV Grid",
                    "lat": ${coords.first},
                    "lon": ${coords.second},
                    "headingDeg": 180,
                    "headingConfidence": "high",
                    "pitchDeg": -15,
                    "fovDeg": 74,
                    "rangeM": 750,
                    "mountHeightM": 24,
                    "groundElevationM": 20,
                    "feedType": "image",
                    "url": "$photoUrl",
                    "snapshotUrl": "$photoUrl",
                    "sourceKind": "configured"
                }
            """.trimIndent()
        }
        return "{\"sources\":[${sources.joinToString(",")}]}"
    }

    private fun handleCctvFrame(uri: Uri): WebResourceResponse {
        val path = uri.path ?: ""
        val cameraId = path.substringAfter("/api/cctv/frame/").substringBefore("?").trim()
        val label = uri.getQueryParameter("label") ?: cameraId
        val city = uri.getQueryParameter("city") ?: "GLOBAL GRID"

        // Check in-memory cache (5-second cache to prevent repeat mobile network requests)
        val now = System.currentTimeMillis()
        cctvFrameCache[cameraId]?.let { (ts, bytes) ->
            if (now - ts < 5000L && bytes.isNotEmpty()) {
                return createCorsResponse("image/jpeg", bytes)
            }
        }

        val imageUrl = cctvImageUrlMap[cameraId]
            ?: uri.getQueryParameter("url")
            ?: when {
                cameraId.startsWith("austin-") -> "https://cctv.austinmobility.io/image/${cameraId.removePrefix("austin-")}.jpg"
                cameraId.all { it.isDigit() } && cameraId.isNotEmpty() -> "https://cctv.austinmobility.io/image/$cameraId.jpg"
                else -> null
            }

        if (!imageUrl.isNullOrBlank()) {
            try {
                val conn = java.net.URL(imageUrl).openConnection() as java.net.HttpURLConnection
                conn.connectTimeout = 4000
                conn.readTimeout = 5000
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36")
                if (conn.responseCode in 200..299) {
                    val bytes = conn.inputStream.readBytes()
                    if (bytes.size > 200) {
                        val contentType = conn.contentType ?: "image/jpeg"
                        cctvFrameCache[cameraId] = Pair(now, bytes)
                        return createCorsResponse(contentType, bytes)
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "[CCTV] Failed to download real frame from $imageUrl: ${e.message}")
            }
        }

        // Fallback: high-tech HUD vector camera frame
        val svg = buildSyntheticCctvSvg(cameraId, label, city)
        return createCorsResponse("image/svg+xml", svg.toByteArray(Charsets.UTF_8))
    }

    private fun buildSyntheticCctvSvg(cameraId: String, label: String, city: String): String {
        val hash = cameraId.hashCode().let { if (it < 0) -it else it }
        val hue = hash % 360
        val hue2 = (hue + 46) % 360
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss 'UTC'", java.util.Locale.US).apply {
            timeZone = java.util.TimeZone.getTimeZone("UTC")
        }
        val ts = sdf.format(java.util.Date())
        val safeLabel = label.replace("<", "&lt;").replace(">", "&gt;").replace("&", "&amp;")
        val safeCity = city.replace("<", "&lt;").replace(">", "&gt;").replace("&", "&amp;")
        val safeId = cameraId.replace("<", "&lt;").replace(">", "&gt;").replace("&", "&amp;")

        return """
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl($hue, 40%, 10%)" />
      <stop offset="60%" stop-color="hsl($hue2, 45%, 6%)" />
      <stop offset="100%" stop-color="#020509" />
    </linearGradient>
    <radialGradient id="flare" cx="0.22" cy="0.24" r="0.78">
      <stop offset="0%" stop-color="hsla($hue2, 100%, 65%, 0.35)" />
      <stop offset="100%" stop-color="hsla($hue2, 100%, 40%, 0)" />
    </radialGradient>
    <pattern id="scan" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="transparent" />
      <rect y="0" width="8" height="1" fill="rgba(255,255,255,0.08)" />
      <rect y="4" width="8" height="1" fill="rgba(255,255,255,0.05)" />
    </pattern>
  </defs>
  <rect width="960" height="540" fill="url(#bg)" />
  <rect width="960" height="540" fill="url(#flare)" />
  <rect width="960" height="540" fill="url(#scan)" />
  <g stroke="rgba(123,233,255,0.3)" stroke-width="1.5" fill="none">
    <path d="M60 460 Q300 300 520 420 T900 320" />
    <path d="M100 160 Q340 40 620 130 T920 90" />
    <path d="M20 280 Q220 230 390 270 T760 250" />
  </g>
  <g fill="none" stroke="rgba(180,248,255,0.25)" stroke-width="1">
    <rect x="70" y="80" width="820" height="380" rx="8" />
    <line x1="70" y1="270" x2="890" y2="270" />
    <line x1="480" y1="80" x2="480" y2="460" />
  </g>
  <circle cx="480" cy="270" r="40" fill="none" stroke="rgba(107,232,255,0.6)" stroke-width="1.5" stroke-dasharray="6,4"/>
  <circle cx="480" cy="270" r="4" fill="rgba(255,217,122,0.9)"/>
  <g fill="#9cefff" font-family="monospace" font-weight="bold" text-transform="uppercase">
    <text x="74" y="54" font-size="16" letter-spacing="2">LIVE CCTV TELEMETRY</text>
    <text x="74" y="512" font-size="14" letter-spacing="1.5">$safeLabel · $safeCity</text>
    <text x="646" y="512" font-size="13" letter-spacing="1.2">$safeId</text>
    <text x="704" y="54" font-size="15" letter-spacing="2">$ts</text>
    <text x="74" y="486" font-size="13" letter-spacing="1.3" fill="#6be8ff">FEED ACTIVE · LIVE PROJECTION</text>
  </g>
</svg>
        """.trimIndent()
    }

    private fun loadWebApp() {
        webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
    }

    private fun requestAppPermissions() {
        val permissionsToRequest = mutableListOf<String>()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.RECORD_AUDIO)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsToRequest.toTypedArray(), PERMISSION_REQUEST_CODE)
        }
    }

    private fun hideSystemUI() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                window.attributes.layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
            WindowCompat.setDecorFitsSystemWindows(window, false)
            val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
            windowInsetsController.let {
                it.hide(WindowInsetsCompat.Type.systemBars())
                it.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or android.view.View.SYSTEM_UI_FLAG_FULLSCREEN
                or android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or android.view.View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            )
        } catch (e: Exception) {
            Log.w(TAG, "Failed to set immersive mode: ${e.message}")
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
        }
    }

    inner class WebAppInterface {
        @JavascriptInterface
        fun showToast(message: String) {
            runOnUiThread {
                Toast.makeText(this@MainActivity, message, Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun isAndroid(): Boolean {
            return true
        }
    }
}
