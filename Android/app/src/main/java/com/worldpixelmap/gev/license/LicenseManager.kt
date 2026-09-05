package com.worldpixelmap.gev.license

import android.content.Context
import android.os.Build
import android.provider.Settings
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Titan Hardware-Bound Licensing & In-App Update Engine.
 * Manages device fingerprinting, activation, periodic verification, trial checks, and update notifications.
 */
class LicenseManager(private val context: Context) {

    private val storage = LicenseStorage(context)
    private val TAG = "LicenseManager"

    val currentStorage: LicenseStorage
        get() = storage

    /**
     * Generates a unique, persistent hardware fingerprint for the device.
     */
    fun getDeviceId(): String {
        return try {
            val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
            if (!androidId.isNullOrBlank() && androidId != "9774d56d682e549c") {
                androidId
            } else {
                storage.getOrCreateDeviceUuid()
            }
        } catch (e: Exception) {
            storage.getOrCreateDeviceUuid()
        }
    }

    /**
     * Human-readable device model string.
     */
    fun getDeviceModel(): String {
        val manufacturer = Build.MANUFACTURER ?: "Android"
        val model = Build.MODEL ?: "Device"
        val release = Build.VERSION.RELEASE ?: ""
        return "${manufacturer.replaceFirstChar { it.uppercase() }} $model (Android $release)"
    }

    fun isActivated(): Boolean = storage.isActivated()

    fun getLicenseKey(): String? = storage.getLicenseKey()

    fun getTier(): String = storage.getTier()

    fun getExpiresAt(): String = storage.getExpiresAt()

    fun getCustomerName(): String = storage.getCustomerName()

    /**
     * Complete License State Summary
     */
    fun getLicenseStateInfo(): LicenseStateInfo {
        val isAct = storage.isActivated()
        val isTrialAct = storage.isTrialActive()
        val trialDays = storage.getTrialDaysLeft()
        val isTrialExp = storage.isTrialExpired()
        val status = when {
            isAct -> "ACTIVE"
            isTrialExp -> "TRIAL_EXPIRED"
            isTrialAct -> "TRIAL_ACTIVE"
            else -> "UNACTIVATED"
        }

        val isTrialInit = storage.isTrialInitialized()
        val trialExpires = storage.getTrialExpiresEpoch()

        return LicenseStateInfo(
            isActivated = isAct,
            licenseKey = storage.getLicenseKey(),
            customerName = storage.getCustomerName(),
            tier = storage.getTier(),
            expiresAt = storage.getExpiresAt(),
            status = status,
            isTrialActive = isTrialAct,
            trialDaysLeft = trialDays,
            isTrialExpired = isTrialExp,
            isTrialInitialized = isTrialInit,
            trialExpiresEpoch = trialExpires,
            deviceId = getDeviceId(),
            deviceModel = getDeviceModel(),
            appVersion = LicenseConfig.APP_VERSION,
            lastVerifiedAt = storage.getLastVerifiedAt()
        )
    }

    /**
     * A. License Activation (action: activate)
     */
    suspend fun activate(key: String): ActivationResult = withContext(Dispatchers.IO) {
        val cleanKey = key.trim().uppercase()
        if (cleanKey.isBlank()) {
            return@withContext ActivationResult(
                success = false,
                error = "License key cannot be empty."
            )
        }

        try {
            val payload = JSONObject().apply {
                put("action", "activate")
                put("app_slug", LicenseConfig.APP_SLUG)
                put("license_key", cleanKey)
                put("device_id", getDeviceId())
                put("device_model", getDeviceModel())
                put("app_version", LicenseConfig.APP_VERSION)
            }

            Log.d(TAG, "Sending activation request for key: $cleanKey, device: ${getDeviceId()}")
            val responseText = postJson(LicenseConfig.SERVER_URL, payload)
            val res = JSONObject(responseText)

            if (res.optBoolean("success", false)) {
                val customerName = res.optString("customer_name", "Valued Commander")
                val appName = res.optString("app_name", LicenseConfig.APP_NAME)
                val appSlug = res.optString("app_slug", LicenseConfig.APP_SLUG)
                val tier = res.optString("tier", "PRO")
                val expiresAt = res.optString("expires_at", "Lifetime")
                val token = res.optString("token", "")
                val maxDevices = res.optInt("max_devices", 1)
                val message = res.optString("message", "License Activated Successfully!")

                storage.saveActivation(
                    licenseKey = cleanKey,
                    customerName = customerName,
                    tier = tier,
                    expiresAt = expiresAt,
                    token = token
                )

                ActivationResult(
                    success = true,
                    message = message,
                    licenseKey = cleanKey,
                    customerName = customerName,
                    appName = appName,
                    appSlug = appSlug,
                    tier = tier,
                    expiresAt = expiresAt,
                    token = token,
                    maxDevices = maxDevices
                )
            } else {
                val errorMsg = res.optString("error", "Invalid or unrecognized License Key.")
                ActivationResult(
                    success = false,
                    error = errorMsg
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Activation failed with network exception: ${e.message}", e)
            ActivationResult(
                success = false,
                error = "Network connection failed: ${e.localizedMessage ?: "Unable to connect to license server."}"
            )
        }
    }

    /**
     * B. Startup / Background Heartbeat Verification (action: verify)
     */
    suspend fun verify(): VerifyResult = withContext(Dispatchers.IO) {
        if (!storage.isActivated()) {
            return@withContext VerifyResult(
                success = false,
                status = "UNACTIVATED",
                error = "Application is not activated."
            )
        }

        val key = storage.getLicenseKey()
        if (key.isNullOrBlank()) {
            storage.clearActivation()
            return@withContext VerifyResult(
                success = false,
                status = "UNBOUND",
                error = "No license key found on device."
            )
        }

        try {
            val payload = JSONObject().apply {
                put("action", "verify")
                put("app_slug", LicenseConfig.APP_SLUG)
                put("license_key", key)
                put("device_id", getDeviceId())
            }

            Log.d(TAG, "Sending heartbeat verification for key: $key")
            val responseText = postJson(LicenseConfig.SERVER_URL, payload)
            val res = JSONObject(responseText)

            if (res.optBoolean("success", false)) {
                val status = res.optString("status", "ACTIVE")
                val tier = res.optString("tier", storage.getTier())
                val expiresAt = res.optString("expires_at", storage.getExpiresAt())

                storage.updateVerificationTimestamp(tier, expiresAt)

                VerifyResult(
                    success = true,
                    status = status,
                    tier = tier,
                    expiresAt = expiresAt
                )
            } else {
                val status = res.optString("status", "UNBOUND").uppercase()
                val errorMsg = res.optString("error", "License is no longer active.")

                // Server invalidated the device/license
                storage.clearActivation()

                VerifyResult(
                    success = false,
                    status = status,
                    error = errorMsg
                )
            }
        } catch (e: Exception) {
            Log.w(TAG, "Verification network error: ${e.message}. Checking offline grace period.")

            // Check offline grace period (up to 7 days since last online verification)
            val now = System.currentTimeMillis()
            val lastVerified = storage.getLastVerifiedAt()
            val hasToken = !storage.getToken().isNullOrBlank()

            if (hasToken && lastVerified > 0L && (now - lastVerified) < LicenseConfig.OFFLINE_GRACE_PERIOD_MS) {
                val daysRemaining = ((LicenseConfig.OFFLINE_GRACE_PERIOD_MS - (now - lastVerified)) / (24 * 60 * 60 * 1000L)).toInt()
                Log.d(TAG, "Operating in offline grace mode. Days left: $daysRemaining")

                VerifyResult(
                    success = true,
                    status = "OFFLINE_GRACE",
                    tier = storage.getTier(),
                    expiresAt = storage.getExpiresAt(),
                    isOfflineGraceValid = true
                )
            } else {
                Log.w(TAG, "Offline grace period expired or invalid.")
                VerifyResult(
                    success = false,
                    status = "OFFLINE_EXPIRED",
                    error = "Offline grace period has expired. Please connect to the internet to verify your license."
                )
            }
        }
    }

    /**
     * C. Device Deactivation (action: deactivate)
     */
    suspend fun deactivate(): Result<String> = withContext(Dispatchers.IO) {
        val key = storage.getLicenseKey()
        if (key.isNullOrBlank()) {
            storage.clearActivation()
            return@withContext Result.success("Device already unlinked.")
        }

        try {
            val payload = JSONObject().apply {
                put("action", "deactivate")
                put("license_key", key)
                put("device_id", getDeviceId())
            }

            postJson(LicenseConfig.SERVER_URL, payload)
        } catch (e: Exception) {
            Log.w(TAG, "Server notification during deactivate failed: ${e.message}")
        } finally {
            storage.clearActivation()
        }

        Result.success("Device unlinked successfully.")
    }

    /**
     * D. Trial Check & Mandatory One-Time Online Handshake (action: check_trial)
     * Enforces mandatory online handshake on fresh installation. Once initialized,
     * counts down offline with anti-clock rollback detection and guaranteed expiration epoch.
     */
    suspend fun checkTrial(): TrialResult = withContext(Dispatchers.IO) {
        if (isActivated()) {
            return@withContext TrialResult(
                success = true,
                trialActive = false,
                daysLeft = 0,
                message = "Licensed",
                isHandshakeRequired = false
            )
        }

        try {
            val payload = JSONObject().apply {
                put("action", "check_trial")
                put("app_slug", LicenseConfig.APP_SLUG)
                put("app_name", LicenseConfig.APP_NAME)
                put("device_id", getDeviceId())
                put("device_model", getDeviceModel())
            }

            Log.d(TAG, "Querying trial server for device: ${getDeviceId()}")
            val responseText = postJson(LicenseConfig.SERVER_URL, payload)
            val res = JSONObject(responseText)

            if (res.optBoolean("success", false)) {
                val trialActive = res.optBoolean("trial_active", true)
                val daysLeft = res.optInt("days_left", 7)
                val secondsLeft = res.optInt("seconds_left", daysLeft * 86400)
                val message = res.optString("message", if (trialActive) "Trial is active ($daysLeft days remaining)." else "Trial has expired.")
                val expiresEpoch = res.optLong("trial_expires_epoch", System.currentTimeMillis() + (daysLeft.toLong() * 86400000L))
                val token = res.optString("token", "")

                storage.saveOnlineTrialState(
                    trialActive = trialActive,
                    daysLeft = daysLeft,
                    message = message,
                    expiresEpoch = expiresEpoch,
                    token = token
                )

                TrialResult(
                    success = true,
                    trialActive = trialActive,
                    daysLeft = daysLeft,
                    secondsLeft = secondsLeft,
                    message = message,
                    isHandshakeRequired = false,
                    trialExpiresEpoch = expiresEpoch,
                    token = token
                )
            } else {
                val error = res.optString("error", "Failed to verify trial status.")
                storage.revokeTrial(error)
                TrialResult(
                    success = false,
                    trialActive = false,
                    daysLeft = 0,
                    error = error,
                    isHandshakeRequired = false
                )
            }
        } catch (e: Exception) {
            Log.w(TAG, "Trial check network connection failed: ${e.message}. Evaluating offline policy.")

            // 1. Check if the mandatory one-time online handshake was ever completed
            if (!storage.isTrialInitialized()) {
                return@withContext TrialResult(
                    success = false,
                    trialActive = false,
                    daysLeft = 0,
                    message = "One-time internet connection required to start your free trial.",
                    error = "Handshake required.",
                    isHandshakeRequired = true
                )
            }

            val now = System.currentTimeMillis()
            val lastKnown = storage.getTrialLastKnownEpoch()
            val expiresEpoch = storage.getTrialExpiresEpoch()

            // 2. Anti-Clock Rollback Guard (1-min tolerance)
            if (lastKnown > 0L && now < (lastKnown - 60_000L)) {
                val rollbackMsg = "Clock rollback detected. Please restore correct system time."
                Log.w(TAG, rollbackMsg)
                storage.revokeTrial(rollbackMsg)
                return@withContext TrialResult(
                    success = false,
                    trialActive = false,
                    daysLeft = 0,
                    message = rollbackMsg,
                    error = rollbackMsg,
                    isHandshakeRequired = false
                )
            }

            // 3. Guaranteed Expiration Epoch Check
            if (expiresEpoch > 0L && now >= expiresEpoch) {
                val expiredMsg = "Trial has expired."
                storage.revokeTrial(expiredMsg)
                return@withContext TrialResult(
                    success = true,
                    trialActive = false,
                    daysLeft = 0,
                    message = expiredMsg,
                    isHandshakeRequired = false
                )
            }

            // 4. Calculate Remaining Offline Time
            val msRemaining = if (expiresEpoch > 0L) expiresEpoch - now else 0L
            val calculatedDays = if (msRemaining > 0L) Math.ceil(msRemaining.toDouble() / 86400000.0).toInt() else 0
            val secondsRemaining = (msRemaining / 1000L).toInt()

            if (calculatedDays <= 0) {
                val expiredMsg = "Trial has expired."
                storage.revokeTrial(expiredMsg)
                return@withContext TrialResult(
                    success = true,
                    trialActive = false,
                    daysLeft = 0,
                    message = expiredMsg,
                    isHandshakeRequired = false
                )
            }

            storage.updateOfflineTrialProgress(calculatedDays, now)

            TrialResult(
                success = true,
                trialActive = true,
                daysLeft = calculatedDays,
                secondsLeft = secondsRemaining,
                message = "Trial active ($calculatedDays days remaining offline).",
                isHandshakeRequired = false,
                trialExpiresEpoch = expiresEpoch,
                token = storage.getTrialToken()
            )
        }
    }

    /**
     * E. In-App Update Checker (action: check_update)
     */
    suspend fun checkUpdate(): UpdateResult = withContext(Dispatchers.IO) {
        try {
            val payload = JSONObject().apply {
                put("action", "check_update")
                put("app_slug", LicenseConfig.APP_SLUG)
            }

            val responseText = postJson(LicenseConfig.SERVER_URL, payload)
            val res = JSONObject(responseText)

            if (res.optBoolean("success", false)) {
                val appName = res.optString("app_name", LicenseConfig.APP_NAME)
                val latestVer = res.optString("latest_version", LicenseConfig.APP_VERSION)
                val minReq = res.optString("min_requirements", "Android 8.0+")
                val rawDownloadUrl = res.optString("download_url", "")
                val downloadUrl = if (rawDownloadUrl.startsWith("http://") || rawDownloadUrl.startsWith("https://")) {
                    rawDownloadUrl
                } else if (rawDownloadUrl.isNotBlank()) {
                    "https://worldpixelmap.in/apps_suite/$rawDownloadUrl"
                } else {
                    LicenseConfig.STORE_URL
                }
                val fileSize = res.optString("file_size", "25 MB")
                val features = res.optString("features", "")

                val isNewer = compareVersions(latestVer, LicenseConfig.APP_VERSION) > 0

                UpdateResult(
                    success = true,
                    appName = appName,
                    latestVersion = latestVer,
                    minRequirements = minReq,
                    downloadUrl = downloadUrl,
                    fileSize = fileSize,
                    features = features,
                    isUpdateAvailable = isNewer
                )
            } else {
                UpdateResult(
                    success = false,
                    error = res.optString("error", "Application update check returned no product data.")
                )
            }
        } catch (e: Exception) {
            Log.w(TAG, "Update check network error: ${e.message}")
            UpdateResult(
                success = false,
                error = "Could not check for updates: ${e.localizedMessage}"
            )
        }
    }

    /**
     * Semantic version comparison helper (e.g. "1.2.0" > "1.0.0" -> >0)
     */
    fun compareVersions(versionA: String, versionB: String): Int {
        try {
            val cleanA = versionA.trim().removePrefix("v").removePrefix("V")
            val cleanB = versionB.trim().removePrefix("v").removePrefix("V")

            val partsA = cleanA.split(".").map { it.filter { ch -> ch.isDigit() }.toIntOrNull() ?: 0 }
            val partsB = cleanB.split(".").map { it.filter { ch -> ch.isDigit() }.toIntOrNull() ?: 0 }

            val maxLen = maxOf(partsA.size, partsB.size)
            for (i in 0 until maxLen) {
                val a = partsA.getOrElse(i) { 0 }
                val b = partsB.getOrElse(i) { 0 }
                if (a != b) {
                    return a.compareTo(b)
                }
            }
            return 0
        } catch (e: Exception) {
            return versionA.compareTo(versionB)
        }
    }

    private fun postJson(urlString: String, payload: JSONObject): String {
        val url = URL(urlString)
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("User-Agent", "GodsEyeView-Android/${LicenseConfig.APP_VERSION} (Titan-Licensing-Client)")
            doOutput = true
            connectTimeout = LicenseConfig.CONNECT_TIMEOUT_MS
            readTimeout = LicenseConfig.READ_TIMEOUT_MS
        }

        OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { writer ->
            writer.write(payload.toString())
            writer.flush()
        }

        val status = conn.responseCode
        val inputStream = if (status in 200..299) conn.inputStream else conn.errorStream ?: "".byteInputStream()
        return BufferedReader(InputStreamReader(inputStream, Charsets.UTF_8)).use { it.readText() }
    }
}
