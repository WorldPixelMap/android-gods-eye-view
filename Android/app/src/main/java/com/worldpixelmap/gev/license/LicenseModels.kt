package com.worldpixelmap.gev.license

import org.json.JSONObject

/**
 * Data models for License Server API responses and local state.
 */
data class ActivationResult(
    val success: Boolean,
    val message: String = "",
    val error: String? = null,
    val licenseKey: String? = null,
    val customerName: String? = null,
    val appName: String? = null,
    val appSlug: String? = null,
    val tier: String? = null,
    val expiresAt: String? = null,
    val token: String? = null,
    val maxDevices: Int = 1
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("success", success)
            put("message", message)
            if (error != null) put("error", error)
            if (licenseKey != null) put("license_key", licenseKey)
            if (customerName != null) put("customer_name", customerName)
            if (appName != null) put("app_name", appName)
            if (appSlug != null) put("app_slug", appSlug)
            if (tier != null) put("tier", tier)
            if (expiresAt != null) put("expires_at", expiresAt)
            if (token != null) put("token", token)
            put("max_devices", maxDevices)
        }
    }
}

data class VerifyResult(
    val success: Boolean,
    val status: String = "UNKNOWN", // ACTIVE, UNBOUND, EXPIRED, SUSPENDED, REVOKED, OFFLINE_GRACE, ERROR
    val tier: String = "FREE",
    val expiresAt: String = "Lifetime",
    val error: String? = null,
    val isOfflineGraceValid: Boolean = false
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("success", success)
            put("status", status)
            put("tier", tier)
            put("expires_at", expiresAt)
            if (error != null) put("error", error)
            put("isOfflineGraceValid", isOfflineGraceValid)
        }
    }
}

data class TrialResult(
    val success: Boolean,
    val trialActive: Boolean = false,
    val daysLeft: Int = 0,
    val secondsLeft: Int = 0,
    val message: String = "",
    val error: String? = null,
    val isHandshakeRequired: Boolean = false,
    val trialExpiresEpoch: Long = 0L,
    val token: String? = null
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("success", success)
            put("trial_active", trialActive)
            put("days_left", daysLeft)
            put("seconds_left", secondsLeft)
            put("message", message)
            if (error != null) put("error", error)
            put("isHandshakeRequired", isHandshakeRequired)
            put("trial_expires_epoch", trialExpiresEpoch)
            if (token != null) put("token", token)
        }
    }
}

data class UpdateResult(
    val success: Boolean,
    val appName: String = LicenseConfig.APP_NAME,
    val latestVersion: String = LicenseConfig.APP_VERSION,
    val minRequirements: String = "Android 8.0+",
    val downloadUrl: String = LicenseConfig.STORE_URL,
    val fileSize: String = "25 MB",
    val features: String = "",
    val isUpdateAvailable: Boolean = false,
    val error: String? = null
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("success", success)
            put("app_name", appName)
            put("latest_version", latestVersion)
            put("min_requirements", minRequirements)
            put("download_url", downloadUrl)
            put("file_size", fileSize)
            put("features", features)
            put("isUpdateAvailable", isUpdateAvailable)
            if (error != null) put("error", error)
        }
    }
}

data class LicenseStateInfo(
    val isActivated: Boolean,
    val licenseKey: String?,
    val customerName: String?,
    val tier: String,
    val expiresAt: String,
    val status: String,
    val isTrialActive: Boolean,
    val trialDaysLeft: Int,
    val isTrialExpired: Boolean,
    val isTrialInitialized: Boolean,
    val trialExpiresEpoch: Long,
    val deviceId: String,
    val deviceModel: String,
    val appVersion: String,
    val lastVerifiedAt: Long
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("isActivated", isActivated)
            put("licenseKey", licenseKey ?: "")
            put("customerName", customerName ?: "")
            put("tier", tier)
            put("expiresAt", expiresAt)
            put("status", status)
            put("isTrialActive", isTrialActive)
            put("trialDaysLeft", trialDaysLeft)
            put("isTrialExpired", isTrialExpired)
            put("isTrialInitialized", isTrialInitialized)
            put("trialExpiresEpoch", trialExpiresEpoch)
            put("deviceId", deviceId)
            put("deviceModel", deviceModel)
            put("appVersion", appVersion)
            put("lastVerifiedAt", lastVerifiedAt)
        }
    }
}
