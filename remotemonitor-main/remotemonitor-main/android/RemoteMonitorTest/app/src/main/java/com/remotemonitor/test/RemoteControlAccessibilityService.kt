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

class RemoteControlAccessibilityService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // No-op: this service is used for gesture dispatch.
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
