package com.worldpixelmap.gev.license

import android.app.Activity
import android.app.Dialog
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.widget.*
import androidx.appcompat.app.AlertDialog
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Tactical Cyberpunk UI Dialogs & Widgets for License Management, Trial Alerts, and Updates.
 */
object LicenseUI {

    // Color Palette matching God's Eye View HUD
    private const val COLOR_BG_DARK = "#09101a"
    private const val COLOR_CARD_BG = "#0e1826"
    private const val COLOR_CYAN_ACCENT = "#00f0ff"
    private const val COLOR_CYAN_MUTED = "#1a8b99"
    private const val COLOR_BORDER = "#1f334a"
    private const val COLOR_TEXT_PRIMARY = "#e6f8ff"
    private const val COLOR_TEXT_SECONDARY = "#8ea8c4"
    private const val COLOR_GOLD_ACCENT = "#ffc83b"
    private const val COLOR_RED_ALERT = "#ff4d6d"
    private const val COLOR_RED_BG = "#331018"
    private const val COLOR_GREEN_SUCCESS = "#00ff9d"

    /**
     * A. Activation Dialog (Card design, key formatting, activate, store & portal buttons)
     */
    fun showActivationDialog(
        activity: Activity,
        manager: LicenseManager,
        isCancelable: Boolean = true,
        isTrialExpired: Boolean = false,
        onActivated: (() -> Unit)? = null
    ): Dialog {
        val dialog = Dialog(activity)
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog.setCancelable(isCancelable)
        dialog.setCanceledOnTouchOutside(isCancelable)

        val window = dialog.window
        window?.setBackgroundDrawableResource(android.R.color.transparent)

        val scroll = ScrollView(activity).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
            isFillViewport = true
        }

        val card = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(activity, 24), dp(activity, 24), dp(activity, 24), dp(activity, 24))
            background = createCardDrawable(COLOR_CARD_BG, COLOR_CYAN_ACCENT, 2, dp(activity, 14))
            layoutParams = LinearLayout.LayoutParams(
                dp(activity, 520),
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER
                setMargins(dp(activity, 16), dp(activity, 16), dp(activity, 16), dp(activity, 16))
            }
        }

        // Header Title Row
        val headerLayout = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        val iconTv = TextView(activity).apply {
            text = "🛡️"
            textSize = 24f
            setPadding(0, 0, dp(activity, 12), 0)
        }

        val titleCol = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }

        val titleTv = TextView(activity).apply {
            text = "GOD'S EYE VIEW · LICENSE ACTIVATION"
            setTextColor(Color.parseColor(COLOR_CYAN_ACCENT))
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
        }

        val subtitleTv = TextView(activity).apply {
            text = if (isTrialExpired) "Trial expired. Please activate your license to continue." else "Enter your license key to unlock tactical intelligence access."
            setTextColor(Color.parseColor(if (isTrialExpired) COLOR_RED_ALERT else COLOR_TEXT_SECONDARY))
            textSize = 12f
            setPadding(0, dp(activity, 2), 0, 0)
        }

        titleCol.addView(titleTv)
        titleCol.addView(subtitleTv)
        headerLayout.addView(iconTv)
        headerLayout.addView(titleCol)

        if (isCancelable) {
            val closeBtn = TextView(activity).apply {
                text = "✕"
                setTextColor(Color.parseColor(COLOR_TEXT_SECONDARY))
                textSize = 18f
                setPadding(dp(activity, 8), dp(activity, 4), dp(activity, 8), dp(activity, 4))
                setOnClickListener { dialog.dismiss() }
            }
            headerLayout.addView(closeBtn)
        }

        card.addView(headerLayout)

        // Trial Expired Alert Banner
        if (isTrialExpired) {
            val alertBanner = LinearLayout(activity).apply {
                orientation = LinearLayout.HORIZONTAL
                setPadding(dp(activity, 12), dp(activity, 10), dp(activity, 12), dp(activity, 10))
                background = createCardDrawable(COLOR_RED_BG, COLOR_RED_ALERT, 1, dp(activity, 8))
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    setMargins(0, dp(activity, 16), 0, 0)
                }
            }

            val alertIcon = TextView(activity).apply {
                text = "⚠️ "
                textSize = 14f
            }

            val alertText = TextView(activity).apply {
                text = "Your hardware-bound trial has concluded. An active license key is required to access satellite, ADS-B, radar, and CCTV telemetry."
                setTextColor(Color.parseColor(COLOR_TEXT_PRIMARY))
                textSize = 12f
            }

            alertBanner.addView(alertIcon)
            alertBanner.addView(alertText)
            card.addView(alertBanner)
        }

        // License Key Input Field
        val inputLabel = TextView(activity).apply {
            text = "ENTER LICENSE KEY"
            setTextColor(Color.parseColor(COLOR_TEXT_SECONDARY))
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.1f
            setPadding(0, dp(activity, 16), 0, dp(activity, 6))
        }
        card.addView(inputLabel)

        val keyInput = EditText(activity).apply {
            hint = "e.g. AGEV-XXXX-XXXX-XXXX"
            setHintTextColor(Color.parseColor("#4f6b8a"))
            setTextColor(Color.parseColor(COLOR_TEXT_PRIMARY))
            textSize = 15f
            typeface = Typeface.MONOSPACE
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS
            background = createCardDrawable(COLOR_BG_DARK, COLOR_BORDER, 1, dp(activity, 8))
            setPadding(dp(activity, 14), dp(activity, 12), dp(activity, 14), dp(activity, 12))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
            setText(manager.getLicenseKey() ?: "")
        }

        // Auto uppercase formatting
        keyInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val upper = s?.toString()?.uppercase() ?: ""
                if (upper != s.toString()) {
                    keyInput.setText(upper)
                    keyInput.setSelection(upper.length)
                }
            }
        })
        card.addView(keyInput)

        // Error Message Box (Hidden by default)
        val errorTv = TextView(activity).apply {
            visibility = View.GONE
            setTextColor(Color.parseColor(COLOR_RED_ALERT))
            textSize = 12f
            setPadding(dp(activity, 10), dp(activity, 8), dp(activity, 10), dp(activity, 8))
            background = createCardDrawable(COLOR_RED_BG, COLOR_RED_ALERT, 1, dp(activity, 6))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, dp(activity, 10), 0, 0)
            }
        }
        card.addView(errorTv)

        // Device Info Tag
        val deviceTag = TextView(activity).apply {
            text = "HARDWARE ID: ${manager.getDeviceId().take(16)}... · ${manager.getDeviceModel().take(28)}"
            setTextColor(Color.parseColor("#5e7e9e"))
            textSize = 10f
            typeface = Typeface.MONOSPACE
            setPadding(0, dp(activity, 8), 0, dp(activity, 16))
        }
        card.addView(deviceTag)

        // Progress Bar
        val progressBar = ProgressBar(activity).apply {
            visibility = View.GONE
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER_HORIZONTAL
                setMargins(0, dp(activity, 6), 0, dp(activity, 6))
            }
        }
        card.addView(progressBar)

        // Action Buttons Row
        val activateBtn = Button(activity).apply {
            text = "⚡ ACTIVATE LICENSE"
            setTextColor(Color.parseColor(COLOR_BG_DARK))
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
            background = createButtonDrawable(COLOR_CYAN_ACCENT, dp(activity, 8))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(activity, 46)
            )
        }
        card.addView(activateBtn)

        val secondaryRow = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, dp(activity, 10), 0, 0)
            }
        }

        val buyBtn = Button(activity).apply {
            text = "🛒 Buy License Key"
            setTextColor(Color.parseColor(COLOR_GOLD_ACCENT))
            textSize = 12f
            background = createCardDrawable(COLOR_BG_DARK, COLOR_GOLD_ACCENT, 1, dp(activity, 8))
            layoutParams = LinearLayout.LayoutParams(0, dp(activity, 40), 1f).apply {
                setMargins(0, 0, dp(activity, 6), 0)
            }
            setOnClickListener {
                openBrowser(activity, LicenseConfig.STORE_URL)
            }
        }

        val portalBtn = Button(activity).apply {
            text = "🖥️ Customer Portal"
            setTextColor(Color.parseColor(COLOR_TEXT_PRIMARY))
            textSize = 12f
            background = createCardDrawable(COLOR_BG_DARK, COLOR_BORDER, 1, dp(activity, 8))
            layoutParams = LinearLayout.LayoutParams(0, dp(activity, 40), 1f).apply {
                setMargins(dp(activity, 6), 0, 0, 0)
            }
            setOnClickListener {
                openBrowser(activity, LicenseConfig.PORTAL_URL)
            }
        }

        secondaryRow.addView(buyBtn)
        secondaryRow.addView(portalBtn)
        card.addView(secondaryRow)

        // Activation Execution Logic
        activateBtn.setOnClickListener {
            val key = keyInput.text.toString().trim()
            if (key.isBlank()) {
                errorTv.text = "⚠️ Please enter your license key."
                errorTv.visibility = View.VISIBLE
                return@setOnClickListener
            }

            errorTv.visibility = View.GONE
            progressBar.visibility = View.VISIBLE
            activateBtn.isEnabled = false
            activateBtn.text = "CONNECTING..."

            CoroutineScope(Dispatchers.Main).launch {
                val result = manager.activate(key)
                progressBar.visibility = View.GONE
                activateBtn.isEnabled = true
                activateBtn.text = "⚡ ACTIVATE LICENSE"

                if (result.success) {
                    Toast.makeText(
                        activity,
                        "✓ ${result.message}\nWelcome, ${result.customerName}!",
                        Toast.LENGTH_LONG
                    ).show()
                    dialog.dismiss()
                    onActivated?.invoke()
                } else {
                    errorTv.text = "✕ ${result.error ?: "Activation failed. Please check key or device limits."}"
                    errorTv.visibility = View.VISIBLE
                }
            }
        }

        scroll.addView(card)
        dialog.setContentView(scroll)
        dialog.show()
        return dialog
    }

    /**
     * B. Trial Startup Alert Popup
     * Displays remaining trial days with "Activate Now" and "Continue" buttons.
     */
    fun showTrialPopup(
        activity: Activity,
        manager: LicenseManager,
        daysLeft: Int,
        onActivateNow: () -> Unit,
        onDismiss: () -> Unit
    ): Dialog {
        val dialog = Dialog(activity)
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog.setCancelable(true)
        dialog.setCanceledOnTouchOutside(false)
        dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)

        val card = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(activity, 24), dp(activity, 24), dp(activity, 24), dp(activity, 24))
            background = createCardDrawable(COLOR_CARD_BG, COLOR_CYAN_ACCENT, 2, dp(activity, 14))
            layoutParams = LinearLayout.LayoutParams(
                dp(activity, 480),
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER
                setMargins(dp(activity, 16), dp(activity, 16), dp(activity, 16), dp(activity, 16))
            }
        }

        // Header
        val header = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val icon = TextView(activity).apply {
            text = "⏳"
            textSize = 22f
            setPadding(0, 0, dp(activity, 10), 0)
        }

        val title = TextView(activity).apply {
            text = "TRIAL ACTIVE · $daysLeft DAYS REMAINING"
            setTextColor(Color.parseColor(COLOR_CYAN_ACCENT))
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.06f
        }

        header.addView(icon)
        header.addView(title)
        card.addView(header)

        // Body Text
        val body = TextView(activity).apply {
            text = "You are on a hardware-bound trial. You have $daysLeft days left.\n\nAfter your trial period, you must activate by buying a license key to continue accessing satellite orbits, ADS-B radar, and CCTV telemetry feeds."
            setTextColor(Color.parseColor(COLOR_TEXT_PRIMARY))
            textSize = 13f
            setLineSpacing(dp(activity, 4).toFloat(), 1f)
            setPadding(0, dp(activity, 14), 0, dp(activity, 20))
        }
        card.addView(body)

        // Buttons Row
        val buttonsRow = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(activity, 44)
            )
        }

        val dismissBtn = Button(activity).apply {
            text = "Continue Session"
            setTextColor(Color.parseColor(COLOR_TEXT_SECONDARY))
            textSize = 12f
            background = createCardDrawable(COLOR_BG_DARK, COLOR_BORDER, 1, dp(activity, 8))
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f).apply {
                setMargins(0, 0, dp(activity, 6), 0)
            }
            setOnClickListener {
                dialog.dismiss()
                onDismiss()
            }
        }

        val activateBtn = Button(activity).apply {
            text = "⚡ Activate Now"
            setTextColor(Color.parseColor(COLOR_BG_DARK))
            textSize = 13f
            typeface = Typeface.DEFAULT_BOLD
            background = createButtonDrawable(COLOR_CYAN_ACCENT, dp(activity, 8))
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1.2f).apply {
                setMargins(dp(activity, 6), 0, 0, 0)
            }
            setOnClickListener {
                dialog.dismiss()
                onActivateNow()
            }
        }

        buttonsRow.addView(dismissBtn)
        buttonsRow.addView(activateBtn)
        card.addView(buttonsRow)

        dialog.setContentView(card)
        dialog.show()
        return dialog
    }

    /**
     * C. In-App License Management & Status Widget
     * Displays plan tier, customer name, expiration, device unbind option, update check.
     */
    fun showLicenseStatusDialog(
        activity: Activity,
        manager: LicenseManager,
        onDeactivated: (() -> Unit)? = null
    ): Dialog {
        val dialog = Dialog(activity)
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog.setCancelable(true)
        dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)

        val scroll = ScrollView(activity).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }

        val card = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(activity, 24), dp(activity, 24), dp(activity, 24), dp(activity, 24))
            background = createCardDrawable(COLOR_CARD_BG, COLOR_CYAN_ACCENT, 2, dp(activity, 14))
            layoutParams = LinearLayout.LayoutParams(
                dp(activity, 520),
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER
                setMargins(dp(activity, 16), dp(activity, 16), dp(activity, 16), dp(activity, 16))
            }
        }

        val info = manager.getLicenseStateInfo()

        // Header Row
        val header = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val title = TextView(activity).apply {
            text = "TITAN LICENSE & HARDWARE BINDING"
            setTextColor(Color.parseColor(COLOR_CYAN_ACCENT))
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }

        val closeBtn = TextView(activity).apply {
            text = "✕"
            setTextColor(Color.parseColor(COLOR_TEXT_SECONDARY))
            textSize = 18f
            setPadding(dp(activity, 8), dp(activity, 4), dp(activity, 8), dp(activity, 4))
            setOnClickListener { dialog.dismiss() }
        }

        header.addView(title)
        header.addView(closeBtn)
        card.addView(header)

        // Status Card
        val statusCard = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(activity, 16), dp(activity, 14), dp(activity, 16), dp(activity, 14))
            background = createCardDrawable(COLOR_BG_DARK, COLOR_BORDER, 1, dp(activity, 10))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, dp(activity, 16), 0, dp(activity, 16))
            }
        }

        fun addRow(label: String, value: String, valueColor: String = COLOR_TEXT_PRIMARY, isBadge: Boolean = false) {
            val row = LinearLayout(activity).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(0, dp(activity, 4), 0, dp(activity, 4))
            }

            val labelTv = TextView(activity).apply {
                text = label
                setTextColor(Color.parseColor(COLOR_TEXT_SECONDARY))
                textSize = 12f
                typeface = Typeface.DEFAULT_BOLD
                layoutParams = LinearLayout.LayoutParams(dp(activity, 120), ViewGroup.LayoutParams.WRAP_CONTENT)
            }

            val valueTv = TextView(activity).apply {
                text = value
                setTextColor(Color.parseColor(valueColor))
                textSize = 12f
                typeface = if (isBadge) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
                if (isBadge) {
                    setPadding(dp(activity, 8), dp(activity, 2), dp(activity, 8), dp(activity, 2))
                    background = createCardDrawable("#002b33", COLOR_CYAN_ACCENT, 1, dp(activity, 4))
                }
            }

            row.addView(labelTv)
            row.addView(valueTv)
            statusCard.addView(row)
        }

        if (info.isActivated) {
            addRow("LICENSE TIER", "${info.tier} VIP ACCESS", COLOR_CYAN_ACCENT, isBadge = true)
            addRow("LICENSEE", info.customerName ?: "Valued Commander")
            addRow("LICENSE KEY", maskKey(info.licenseKey))
            addRow("EXPIRATION", info.expiresAt, COLOR_GOLD_ACCENT)
            addRow("DEVICE ID", "${info.deviceId.take(18)}...")
            addRow("DEVICE MODEL", info.deviceModel)
            addRow("STATUS", "ACTIVE & BOUND", COLOR_GREEN_SUCCESS)
        } else if (info.isTrialActive && !info.isTrialExpired) {
            addRow("STATUS", "TRIAL ACTIVE (${info.trialDaysLeft} DAYS REMAINING)", COLOR_GOLD_ACCENT, isBadge = true)
            addRow("DEVICE ID", "${info.deviceId.take(18)}...")
            addRow("DEVICE MODEL", info.deviceModel)
            addRow("TIER", "TRIAL ACCESS")
        } else {
            addRow("STATUS", "UNACTIVATED / EXPIRED", COLOR_RED_ALERT, isBadge = true)
            addRow("DEVICE ID", "${info.deviceId.take(18)}...")
            addRow("DEVICE MODEL", info.deviceModel)
        }

        card.addView(statusCard)

        // Action Buttons Row
        val btnRow = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(activity, 42)
            )
        }

        val updateBtn = Button(activity).apply {
            text = "🔄 Check Updates"
            setTextColor(Color.parseColor(COLOR_CYAN_ACCENT))
            textSize = 12f
            background = createCardDrawable(COLOR_BG_DARK, COLOR_CYAN_MUTED, 1, dp(activity, 8))
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f).apply {
                setMargins(0, 0, dp(activity, 6), 0)
            }
            setOnClickListener {
                dialog.dismiss()
                checkForUpdatesManual(activity, manager)
            }
        }

        val portalBtn = Button(activity).apply {
            text = "🖥️ Device Portal"
            setTextColor(Color.parseColor(COLOR_TEXT_PRIMARY))
            textSize = 12f
            background = createCardDrawable(COLOR_BG_DARK, COLOR_BORDER, 1, dp(activity, 8))
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f).apply {
                setMargins(dp(activity, 6), 0, 0, 0)
            }
            setOnClickListener {
                openBrowser(activity, LicenseConfig.PORTAL_URL)
            }
        }

        btnRow.addView(updateBtn)
        btnRow.addView(portalBtn)
        card.addView(btnRow)

        // Unlink or Activate Button
        if (info.isActivated) {
            val unlinkBtn = Button(activity).apply {
                text = "⚠️ Unlink This Device"
                setTextColor(Color.parseColor(COLOR_RED_ALERT))
                textSize = 12f
                background = createCardDrawable(COLOR_BG_DARK, COLOR_RED_ALERT, 1, dp(activity, 8))
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    dp(activity, 40)
                ).apply {
                    setMargins(0, dp(activity, 10), 0, 0)
                }
                setOnClickListener {
                    confirmUnlinkDevice(activity, manager, dialog, onDeactivated)
                }
            }
            card.addView(unlinkBtn)
        } else {
            val activateNowBtn = Button(activity).apply {
                text = "⚡ Enter License Key"
                setTextColor(Color.parseColor(COLOR_BG_DARK))
                textSize = 13f
                typeface = Typeface.DEFAULT_BOLD
                background = createButtonDrawable(COLOR_CYAN_ACCENT, dp(activity, 8))
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    dp(activity, 42)
                ).apply {
                    setMargins(0, dp(activity, 10), 0, 0)
                }
                setOnClickListener {
                    dialog.dismiss()
                    showActivationDialog(activity, manager, isCancelable = true)
                }
            }
            card.addView(activateNowBtn)
        }

        scroll.addView(card)
        dialog.setContentView(scroll)
        dialog.show()
        return dialog
    }

    /**
     * D. In-App Update Dialog
     * Shows changelog, new version, file size, download link.
     */
    fun showUpdateDialog(
        activity: Activity,
        update: UpdateResult,
        onDismiss: (() -> Unit)? = null
    ): Dialog {
        val dialog = Dialog(activity)
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog.setCancelable(true)
        dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)

        val card = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(activity, 24), dp(activity, 24), dp(activity, 24), dp(activity, 24))
            background = createCardDrawable(COLOR_CARD_BG, COLOR_CYAN_ACCENT, 2, dp(activity, 14))
            layoutParams = LinearLayout.LayoutParams(
                dp(activity, 520),
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER
                setMargins(dp(activity, 16), dp(activity, 16), dp(activity, 16), dp(activity, 16))
            }
        }

        // Header
        val header = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val icon = TextView(activity).apply {
            text = "🚀"
            textSize = 24f
            setPadding(0, 0, dp(activity, 10), 0)
        }

        val titleCol = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
        }

        val title = TextView(activity).apply {
            text = "NEW VERSION AVAILABLE: v${update.latestVersion}"
            setTextColor(Color.parseColor(COLOR_CYAN_ACCENT))
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
        }

        val sub = TextView(activity).apply {
            text = "Current Installed Version: v${LicenseConfig.APP_VERSION} · Size: ${update.fileSize}"
            setTextColor(Color.parseColor(COLOR_TEXT_SECONDARY))
            textSize = 11f
        }

        titleCol.addView(title)
        titleCol.addView(sub)
        header.addView(icon)
        header.addView(titleCol)
        card.addView(header)

        // Features Box
        val featuresBox = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(activity, 14), dp(activity, 12), dp(activity, 14), dp(activity, 12))
            background = createCardDrawable(COLOR_BG_DARK, COLOR_BORDER, 1, dp(activity, 8))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, dp(activity, 14), 0, dp(activity, 16))
            }
        }

        val featuresLabel = TextView(activity).apply {
            text = "WHAT'S NEW IN THIS UPDATE:"
            setTextColor(Color.parseColor(COLOR_TEXT_SECONDARY))
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.06f
            setPadding(0, 0, 0, dp(activity, 6))
        }
        featuresBox.addView(featuresLabel)

        val featuresText = TextView(activity).apply {
            text = if (update.features.isNotBlank()) update.features else "• Performance optimizations\n• Security & telemetry feed stability updates\n• Bug fixes and UI enhancements"
            setTextColor(Color.parseColor(COLOR_TEXT_PRIMARY))
            textSize = 12f
            setLineSpacing(dp(activity, 3).toFloat(), 1f)
        }
        featuresBox.addView(featuresText)
        card.addView(featuresBox)

        // Buttons Row
        val buttonsRow = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(activity, 46)
            )
        }

        val laterBtn = Button(activity).apply {
            text = "Remind Later"
            setTextColor(Color.parseColor(COLOR_TEXT_SECONDARY))
            textSize = 12f
            background = createCardDrawable(COLOR_BG_DARK, COLOR_BORDER, 1, dp(activity, 8))
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f).apply {
                setMargins(0, 0, dp(activity, 6), 0)
            }
            setOnClickListener {
                dialog.dismiss()
                onDismiss?.invoke()
            }
        }

        val downloadBtn = Button(activity).apply {
            text = "⬇️ Download & Update"
            setTextColor(Color.parseColor(COLOR_BG_DARK))
            textSize = 13f
            typeface = Typeface.DEFAULT_BOLD
            background = createButtonDrawable(COLOR_CYAN_ACCENT, dp(activity, 8))
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1.4f).apply {
                setMargins(dp(activity, 6), 0, 0, 0)
            }
            setOnClickListener {
                dialog.dismiss()
                openBrowser(activity, update.downloadUrl)
            }
        }

        buttonsRow.addView(laterBtn)
        buttonsRow.addView(downloadBtn)
        card.addView(buttonsRow)

        dialog.setContentView(card)
        dialog.show()
        return dialog
    }

    private fun checkForUpdatesManual(activity: Activity, manager: LicenseManager) {
        val toast = Toast.makeText(activity, "Checking for updates...", Toast.LENGTH_SHORT)
        toast.show()

        CoroutineScope(Dispatchers.Main).launch {
            val result = manager.checkUpdate()
            if (result.isUpdateAvailable) {
                showUpdateDialog(activity, result)
            } else if (result.success) {
                Toast.makeText(
                    activity,
                    "✓ You have the latest version (v${LicenseConfig.APP_VERSION})",
                    Toast.LENGTH_LONG
                ).show()
            } else {
                Toast.makeText(
                    activity,
                    "Could not check for updates: ${result.error ?: "Server unreachable"}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun confirmUnlinkDevice(
        activity: Activity,
        manager: LicenseManager,
        parentDialog: Dialog,
        onDeactivated: (() -> Unit)?
    ) {
        AlertDialog.Builder(activity)
            .setTitle("Unlink This Device?")
            .setMessage("Are you sure you want to deactivate this device? You will need to enter your license key again to access the app.")
            .setPositiveButton("Unlink") { _, _ ->
                CoroutineScope(Dispatchers.Main).launch {
                    manager.deactivate()
                    parentDialog.dismiss()
                    Toast.makeText(activity, "Device unlinked successfully.", Toast.LENGTH_SHORT).show()
                    onDeactivated?.invoke()
                    showActivationDialog(activity, manager, isCancelable = false, isTrialExpired = true)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    /**
     * E. Mandatory Initial Online Handshake Screen (Setup Gate)
     * Shown when newly installed app has never completed online trial registration.
     */
    fun showInitialHandshakeDialog(
        activity: Activity,
        manager: LicenseManager,
        onHandshakeSuccess: (() -> Unit)? = null
    ): Dialog {
        val dialog = Dialog(activity)
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog.setCancelable(false)
        dialog.setCanceledOnTouchOutside(false)

        val window = dialog.window
        window?.setBackgroundDrawableResource(android.R.color.transparent)

        val scroll = ScrollView(activity).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
            isFillViewport = true
        }

        val card = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(activity, 24), dp(activity, 24), dp(activity, 24), dp(activity, 24))
            background = createCardDrawable(COLOR_CARD_BG, COLOR_CYAN_ACCENT, 2, dp(activity, 14))
            layoutParams = LinearLayout.LayoutParams(
                dp(activity, 520),
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER
                setMargins(dp(activity, 16), dp(activity, 16), dp(activity, 16), dp(activity, 16))
            }
        }

        // Header
        val headerLayout = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val iconTv = TextView(activity).apply {
            text = "⚡"
            textSize = 26f
            setPadding(0, 0, dp(activity, 12), 0)
        }

        val titleCol = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }

        val titleTv = TextView(activity).apply {
            text = "ONE-TIME SETUP REQUIRED"
            setTextColor(Color.parseColor(COLOR_CYAN_ACCENT))
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            letterSpacing = 0.08f
        }

        val subtitleTv = TextView(activity).apply {
            text = "Hardware-Bound Trial Registration"
            setTextColor(Color.parseColor(COLOR_TEXT_SECONDARY))
            textSize = 12f
        }

        titleCol.addView(titleTv)
        titleCol.addView(subtitleTv)
        headerLayout.addView(iconTv)
        headerLayout.addView(titleCol)
        card.addView(headerLayout)

        // Description Card
        val descBox = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(activity, 14), dp(activity, 14), dp(activity, 14), dp(activity, 14))
            background = createCardDrawable("#0d1b2a", COLOR_BORDER, 1, dp(activity, 8))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, dp(activity, 16), 0, dp(activity, 16))
            }
        }

        val descTv = TextView(activity).apply {
            text = "Connect to the internet once to register your device and start your 7-day free trial.\n\nAfter this 5-second one-time setup, God's Eye View works 100% offline with full satellite telemetry and 3D globe features!"
            setTextColor(Color.parseColor(COLOR_TEXT_PRIMARY))
            textSize = 13f
            lineHeight = dp(activity, 20)
        }

        val deviceFingerprintTv = TextView(activity).apply {
            text = "Hardware ID: ${manager.getDeviceId().take(16)}... (${manager.getDeviceModel()})"
            setTextColor(Color.parseColor(COLOR_CYAN_MUTED))
            textSize = 11f
            setPadding(0, dp(activity, 10), 0, 0)
        }

        descBox.addView(descTv)
        descBox.addView(deviceFingerprintTv)
        card.addView(descBox)

        // Status Error TextView
        val errorTv = TextView(activity).apply {
            setTextColor(Color.parseColor(COLOR_RED_ALERT))
            textSize = 12f
            visibility = View.GONE
            setPadding(0, 0, 0, dp(activity, 12))
        }
        card.addView(errorTv)

        // Loading ProgressBar
        val progressBar = ProgressBar(activity).apply {
            visibility = View.GONE
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                gravity = Gravity.CENTER
                setMargins(0, 0, 0, dp(activity, 12))
            }
        }
        card.addView(progressBar)

        // Connect Button
        val connectBtn = Button(activity).apply {
            text = "📡 Connect & Start Free Trial"
            setTextColor(Color.parseColor(COLOR_BG_DARK))
            textSize = 13f
            typeface = Typeface.DEFAULT_BOLD
            background = createButtonDrawable(COLOR_CYAN_ACCENT, dp(activity, 8))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(activity, 48)
            )
        }
        card.addView(connectBtn)

        // License Key Alternative
        val licenseBtn = Button(activity).apply {
            text = "🔑 I Have a License Key"
            setTextColor(Color.parseColor(COLOR_CYAN_ACCENT))
            textSize = 13f
            typeface = Typeface.DEFAULT_BOLD
            background = createButtonDrawable("#152538", dp(activity, 8))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(activity, 44)
            ).apply {
                setMargins(0, dp(activity, 8), 0, 0)
            }
        }
        card.addView(licenseBtn)

        connectBtn.setOnClickListener {
            connectBtn.isEnabled = false
            progressBar.visibility = View.VISIBLE
            errorTv.visibility = View.GONE

            CoroutineScope(Dispatchers.Main).launch {
                val trial = manager.checkTrial()
                progressBar.visibility = View.GONE
                connectBtn.isEnabled = true

                if (trial.trialActive && trial.daysLeft > 0) {
                    Toast.makeText(activity, "✓ Setup complete! 7-day trial activated.", Toast.LENGTH_LONG).show()
                    dialog.dismiss()
                    onHandshakeSuccess?.invoke()
                } else if (!trial.isHandshakeRequired && !trial.trialActive) {
                    dialog.dismiss()
                    showHardLockoutDialog(activity, manager)
                } else {
                    errorTv.text = "Connection failed: ${trial.message.ifBlank { "Could not connect to license server. Check your internet connection and try again." }}"
                    errorTv.visibility = View.VISIBLE
                }
            }
        }

        licenseBtn.setOnClickListener {
            showActivationDialog(activity, manager, isCancelable = false, isTrialExpired = true) {
                dialog.dismiss()
                onHandshakeSuccess?.invoke()
            }
        }

        scroll.addView(card)
        dialog.setContentView(scroll)
        dialog.show()
        return dialog
    }

    /**
     * F. Hard Lockout Screen
     * Shown when trial period has ended and no active license is present.
     */
    fun showHardLockoutDialog(
        activity: Activity,
        manager: LicenseManager,
        onActivated: (() -> Unit)? = null
    ): Dialog {
        return showActivationDialog(
            activity = activity,
            manager = manager,
            isCancelable = false,
            isTrialExpired = true,
            onActivated = onActivated
        )
    }

    private fun openBrowser(context: Context, url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(context, "Could not open URL: $url", Toast.LENGTH_SHORT).show()
        }
    }

    private fun maskKey(key: String?): String {
        if (key.isNullOrBlank()) return "NOT SET"
        if (key.length <= 8) return key
        val prefix = key.take(5)
        val suffix = key.takeLast(4)
        return "$prefix-****-****-$suffix"
    }

    private fun dp(context: Context, value: Int): Int {
        return (value * context.resources.displayMetrics.density).toInt()
    }

    private fun createCardDrawable(bgColor: String, borderColor: String, borderWidthDp: Int, cornerRadiusDp: Int): GradientDrawable {
        return GradientDrawable().apply {
            setColor(Color.parseColor(bgColor))
            setStroke(borderWidthDp, Color.parseColor(borderColor))
            cornerRadius = cornerRadiusDp.toFloat()
        }
    }

    private fun createButtonDrawable(color: String, cornerRadiusDp: Int): GradientDrawable {
        return GradientDrawable().apply {
            setColor(Color.parseColor(color))
            cornerRadius = cornerRadiusDp.toFloat()
        }
    }
}
