package com.worldpixelmap.gev.license

import android.content.Context
import android.content.SharedPreferences
import java.util.UUID

/**
 * Encrypted/Secure Persistent Storage Vault for God's Eye View License & Trial States.
 */
class LicenseStorage(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREFS_NAME = "gev_license_vault_secure"

        private const val KEY_IS_ACTIVATED = "is_activated"
        private const val KEY_LICENSE_KEY = "license_key"
        private const val KEY_CUSTOMER_NAME = "customer_name"
        private const val KEY_TIER = "tier"
        private const val KEY_EXPIRES_AT = "expires_at"
        private const val KEY_TOKEN = "token"
        private const val KEY_LAST_VERIFIED_AT = "last_verified_at"
        private const val KEY_TRIAL_ACTIVE = "trial_active"
        private const val KEY_TRIAL_DAYS_LEFT = "trial_days_left"
        private const val KEY_TRIAL_CHECKED_AT = "trial_checked_at"
        private const val KEY_TRIAL_EXPIRED = "trial_expired"
        private const val KEY_TRIAL_INITIALIZED = "trial_initialized"
        private const val KEY_TRIAL_EXPIRES_EPOCH = "trial_expires_epoch"
        private const val KEY_TRIAL_LAST_KNOWN_EPOCH = "trial_last_known_epoch"
        private const val KEY_TRIAL_TOKEN = "trial_token"
        private const val KEY_CACHED_TRIAL_MESSAGE = "cached_trial_message"
        private const val KEY_PERSISTENT_DEVICE_UUID = "persistent_device_uuid"
    }

    fun isActivated(): Boolean = prefs.getBoolean(KEY_IS_ACTIVATED, false)

    fun getLicenseKey(): String? = prefs.getString(KEY_LICENSE_KEY, null)

    fun getCustomerName(): String = prefs.getString(KEY_CUSTOMER_NAME, "Valued Commander") ?: "Valued Commander"

    fun getTier(): String = prefs.getString(KEY_TIER, "FREE") ?: "FREE"

    fun getExpiresAt(): String = prefs.getString(KEY_EXPIRES_AT, "Lifetime") ?: "Lifetime"

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun getLastVerifiedAt(): Long = prefs.getLong(KEY_LAST_VERIFIED_AT, 0L)

    fun isTrialActive(): Boolean = prefs.getBoolean(KEY_TRIAL_ACTIVE, false)

    fun getTrialDaysLeft(): Int = prefs.getInt(KEY_TRIAL_DAYS_LEFT, 0)

    fun isTrialExpired(): Boolean = prefs.getBoolean(KEY_TRIAL_EXPIRED, false)

    fun getTrialCheckedAt(): Long = prefs.getLong(KEY_TRIAL_CHECKED_AT, 0L)

    fun isTrialInitialized(): Boolean = prefs.getBoolean(KEY_TRIAL_INITIALIZED, false)

    fun getTrialExpiresEpoch(): Long = prefs.getLong(KEY_TRIAL_EXPIRES_EPOCH, 0L)

    fun getTrialLastKnownEpoch(): Long = prefs.getLong(KEY_TRIAL_LAST_KNOWN_EPOCH, 0L)

    fun getTrialToken(): String? = prefs.getString(KEY_TRIAL_TOKEN, null)

    fun getCachedTrialMessage(): String = prefs.getString(KEY_CACHED_TRIAL_MESSAGE, "") ?: ""

    fun saveActivation(
        licenseKey: String,
        customerName: String,
        tier: String,
        expiresAt: String,
        token: String
    ) {
        prefs.edit().apply {
            putBoolean(KEY_IS_ACTIVATED, true)
            putString(KEY_LICENSE_KEY, licenseKey.trim().uppercase())
            putString(KEY_CUSTOMER_NAME, customerName)
            putString(KEY_TIER, tier)
            putString(KEY_EXPIRES_AT, expiresAt)
            putString(KEY_TOKEN, token)
            putLong(KEY_LAST_VERIFIED_AT, System.currentTimeMillis())
            putBoolean(KEY_TRIAL_EXPIRED, false)
            apply()
        }
    }

    fun updateVerificationTimestamp(tier: String? = null, expiresAt: String? = null) {
        prefs.edit().apply {
            putLong(KEY_LAST_VERIFIED_AT, System.currentTimeMillis())
            if (!tier.isNullOrBlank()) putString(KEY_TIER, tier)
            if (!expiresAt.isNullOrBlank()) putString(KEY_EXPIRES_AT, expiresAt)
            apply()
        }
    }

    fun saveOnlineTrialState(
        trialActive: Boolean,
        daysLeft: Int,
        message: String,
        expiresEpoch: Long,
        token: String
    ) {
        val now = System.currentTimeMillis()
        prefs.edit().apply {
            putBoolean(KEY_TRIAL_INITIALIZED, true)
            putBoolean(KEY_TRIAL_ACTIVE, trialActive)
            putInt(KEY_TRIAL_DAYS_LEFT, daysLeft)
            putString(KEY_CACHED_TRIAL_MESSAGE, message)
            putLong(KEY_TRIAL_EXPIRES_EPOCH, expiresEpoch)
            putString(KEY_TRIAL_TOKEN, token)
            putLong(KEY_TRIAL_LAST_KNOWN_EPOCH, now)
            putLong(KEY_TRIAL_CHECKED_AT, now)
            putBoolean(KEY_TRIAL_EXPIRED, !trialActive || daysLeft <= 0)
            apply()
        }
    }

    fun updateOfflineTrialProgress(daysLeft: Int, now: Long) {
        val lastKnown = prefs.getLong(KEY_TRIAL_LAST_KNOWN_EPOCH, 0L)
        prefs.edit().apply {
            putInt(KEY_TRIAL_DAYS_LEFT, daysLeft)
            putLong(KEY_TRIAL_LAST_KNOWN_EPOCH, maxOf(lastKnown, now))
            apply()
        }
    }

    fun revokeTrial(reason: String) {
        prefs.edit().apply {
            putBoolean(KEY_TRIAL_ACTIVE, false)
            putInt(KEY_TRIAL_DAYS_LEFT, 0)
            putBoolean(KEY_TRIAL_EXPIRED, true)
            putString(KEY_CACHED_TRIAL_MESSAGE, reason)
            apply()
        }
    }

    fun clearActivation() {
        prefs.edit().apply {
            putBoolean(KEY_IS_ACTIVATED, false)
            putString(KEY_LICENSE_KEY, null)
            putString(KEY_CUSTOMER_NAME, "")
            putString(KEY_TIER, "FREE")
            putString(KEY_EXPIRES_AT, "")
            putString(KEY_TOKEN, null)
            putLong(KEY_LAST_VERIFIED_AT, 0L)
            apply()
        }
    }

    fun getOrCreateDeviceUuid(): String {
        var uuid = prefs.getString(KEY_PERSISTENT_DEVICE_UUID, null)
        if (uuid.isNullOrBlank()) {
            uuid = "GEV-" + UUID.randomUUID().toString().uppercase()
            prefs.edit().putString(KEY_PERSISTENT_DEVICE_UUID, uuid).apply()
        }
        return uuid
    }
}
