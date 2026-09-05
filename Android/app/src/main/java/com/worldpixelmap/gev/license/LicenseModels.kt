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
)

data class VerifyResult(
    val success: Boolean,
    val status: String = "UNKNOWN", // ACTIVE, UNBOUND, EXPIRED, SUSPENDED, REVOKED, OFFLINE_GRACE, ERROR
    val tier: String = "FREE",
    val expiresAt: String = "Lifetime",
    val error: String? = null,
    val isOfflineGraceValid: Boolean = false
)

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
)

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
)

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
