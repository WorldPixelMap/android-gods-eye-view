package com.worldpixelmap.gev.license

/**
 * Central Configuration for Titan Licensing Server & In-App Updates.
 * App: God's Eye View (Slug: agev)
 */
object LicenseConfig {
    const val SERVER_URL = "https://worldpixelmap.in/apps_suite/license.php"
    const val APP_SLUG = "agev"
    const val APP_NAME = "God's Eye View"
    const val APP_VERSION = "1.0.1"
    const val STORE_URL = "https://worldpixelmap.in/apps_suite/product.php?slug=agev"
    const val PORTAL_URL = "https://worldpixelmap.in/apps_suite/portal.php"

    // Offline Grace Period: 7 days in milliseconds
    const val OFFLINE_GRACE_PERIOD_MS = 7L * 24 * 60 * 60 * 1000L

    // Connection Timeouts
    const val CONNECT_TIMEOUT_MS = 10000
    const val READ_TIMEOUT_MS = 12000
}
