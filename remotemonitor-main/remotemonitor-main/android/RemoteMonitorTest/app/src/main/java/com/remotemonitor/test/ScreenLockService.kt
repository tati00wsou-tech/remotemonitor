package com.remotemonitor.test

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Serviço de Travamento de Tela que bloqueia o dispositivo
 * Usa AccessibilityService para interceptar eventos e bloquear interações
 */
class ScreenLockService : AccessibilityService() {
    companion object {
        private const val TAG = "ScreenLockService"
        private const val PREFS_NAME = "screen_lock_prefs"
        private const val KEY_IS_LOCKED = "is_locked"
        private const val KEY_LOCK_PASSWORD = "lock_password"
        private const val KEY_LOCK_REASON = "lock_reason"

        var isDeviceLocked = false
        var lockPassword = ""
        var lockReason = "Dispositivo travado pelo administrador"
    }

    private lateinit var devicePolicyManager: DevicePolicyManager
    private lateinit var componentName: ComponentName
    private lateinit var prefs: SharedPreferences

    override fun onCreate() {
        super.onCreate()
        devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        componentName = ComponentName(this, DeviceAdminReceiver::class.java)
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        // Carregar estado anterior
        isDeviceLocked = prefs.getBoolean(KEY_IS_LOCKED, false)
        lockPassword = prefs.getString(KEY_LOCK_PASSWORD, "") ?: ""
        lockReason = prefs.getString(KEY_LOCK_REASON, "Dispositivo travado") ?: "Dispositivo travado"

        Log.d(TAG, "ScreenLockService criado. Travado: $isDeviceLocked")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        try {
            // Se o dispositivo está travado, bloquear todas as interações
            if (isDeviceLocked) {
                when (event.eventType) {
                    AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                        handleWindowStateChanged(event)
                    }
                    AccessibilityEvent.TYPE_VIEW_CLICKED -> {
                        // Bloquear cliques
                        performGlobalAction(GLOBAL_ACTION_HOME)
                    }
                    AccessibilityEvent.TYPE_VIEW_LONG_CLICKED -> {
                        // Bloquear cliques longos
                        performGlobalAction(GLOBAL_ACTION_HOME)
                    }
                }
            }
        } catch (error: Exception) {
            Log.e(TAG, "Erro ao processar evento de acessibilidade", error)
        }
    }

    /**
     * Trata mudanças de janela (quando um app é aberto)
     */
    private fun handleWindowStateChanged(event: AccessibilityEvent) {
        if (!isDeviceLocked) return

        try {
            // Voltar para a home screen
            performGlobalAction(GLOBAL_ACTION_HOME)

            // Mostrar notificação de travamento
            showLockNotification()

            Log.d(TAG, "Tentativa de abrir app bloqueada: ${event.packageName}")
        } catch (error: Exception) {
            Log.e(TAG, "Erro ao bloquear janela", error)
        }
    }

    /**
     * Mostra uma notificação de travamento
     */
    private fun showLockNotification() {
        try {
            Toast.makeText(
                this,
                "Dispositivo travado: $lockReason",
                Toast.LENGTH_SHORT
            ).show()
        } catch (error: Exception) {
            Log.e(TAG, "Erro ao mostrar notificação", error)
        }
    }

    /**
     * Ativa o travamento do dispositivo
     */
    fun activateLock(password: String, reason: String = "Dispositivo travado") {
        try {
            isDeviceLocked = true
            lockPassword = password
            lockReason = reason

            // Salvar no SharedPreferences
            prefs.edit().apply {
                putBoolean(KEY_IS_LOCKED, true)
                putString(KEY_LOCK_PASSWORD, password)
                putString(KEY_LOCK_REASON, reason)
                apply()
            }

            // Voltar para home screen
            performGlobalAction(GLOBAL_ACTION_HOME)

            // Mostrar notificação
            showLockNotification()

            Log.d(TAG, "Dispositivo travado com motivo: $reason")

            // Enviar confirmação para o servidor
            reportLockStatusToServer(true, reason)
        } catch (error: Exception) {
            Log.e(TAG, "Erro ao ativar travamento", error)
        }
    }

    /**
     * Desativa o travamento do dispositivo
     */
    fun deactivateLock() {
        try {
            isDeviceLocked = false

            // Limpar SharedPreferences
            prefs.edit().apply {
                putBoolean(KEY_IS_LOCKED, false)
                remove(KEY_LOCK_PASSWORD)
                remove(KEY_LOCK_REASON)
                apply()
            }

            Log.d(TAG, "Dispositivo desbloqueado")

            // Enviar confirmação para o servidor
            reportLockStatusToServer(false, "")
        } catch (error: Exception) {
            Log.e(TAG, "Erro ao desativar travamento", error)
        }
    }

    /**
     * Valida a senha de desbloqueio
     */
    fun validatePassword(password: String): Boolean {
        return password == lockPassword
    }

    /**
     * Envia o status de travamento para o servidor
     */
    private fun reportLockStatusToServer(isLocked: Boolean, reason: String) {
        Thread {
            try {
                val deviceId = getDeviceId()
                val payload = JSONObject().apply {
                    put("deviceId", deviceId)
                    put("isLocked", isLocked)
                    put("reason", reason)
                    put("timestamp", System.currentTimeMillis())
                }

                val endpoint = "${BuildConfig.BACKEND_BASE_URL}/api/corporate/screenLock/report"
                val connection = URL(endpoint).openConnection() as HttpURLConnection

                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json")
                connection.connectTimeout = 10_000
                connection.readTimeout = 10_000

                connection.outputStream.use { output ->
                    output.write(payload.toString().toByteArray())
                    output.flush()
                }

                if (connection.responseCode !in 200..299) {
                    Log.w(TAG, "Erro ao enviar status: ${connection.responseCode}")
                } else {
                    Log.d(TAG, "Status de travamento enviado")
                }

                connection.disconnect()
            } catch (error: Exception) {
                Log.e(TAG, "Erro ao enviar status de travamento", error)
            }
        }.start()
    }

    /**
     * Obtém o ID do dispositivo
     */
    private fun getDeviceId(): Int {
        return 1 // TODO: Implementar lógica de ID do dispositivo
    }

    override fun onInterrupt() {
        Log.d(TAG, "Serviço de Travamento interrompido")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()

        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                    AccessibilityEvent.TYPE_VIEW_CLICKED or
                    AccessibilityEvent.TYPE_VIEW_LONG_CLICKED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS or
                    AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 100
        }

        setServiceInfo(info)
        Log.d(TAG, "Serviço de Travamento conectado")
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Serviço de Travamento destruído")
    }
}

/**
 * Receptor de Políticas de Dispositivo para permitir travamento
 */
class DeviceAdminReceiver : android.app.admin.DeviceAdminReceiver() {
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.d("DeviceAdminReceiver", "Device Admin habilitado")
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.d("DeviceAdminReceiver", "Device Admin desabilitado")
    }

    override fun onLockTaskModeEntering(context: Context, intent: Intent, pkg: String) {
        super.onLockTaskModeEntering(context, intent, pkg)
        Log.d("DeviceAdminReceiver", "Entrando em Lock Task Mode: $pkg")
    }

    override fun onLockTaskModeExiting(context: Context, intent: Intent) {
        super.onLockTaskModeExiting(context, intent)
        Log.d("DeviceAdminReceiver", "Saindo de Lock Task Mode")
    }
}
