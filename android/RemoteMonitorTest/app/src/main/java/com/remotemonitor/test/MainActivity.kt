package com.remotemonitor.test

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebChromeClient
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.ComponentActivity
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.net.URL
import java.nio.charset.StandardCharsets

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private var hasOpenedExternalFallback = false
    private var lastTargetUrl: String = BuildConfig.FALLBACK_PANEL_URL

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        webView.webViewClient = object : WebViewClient() {
            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    openInExternalBrowser(lastTargetUrl)
                }
            }

            override fun onReceivedHttpError(
                view: WebView?,
                request: WebResourceRequest?,
                errorResponse: WebResourceResponse?
            ) {
                super.onReceivedHttpError(view, request, errorResponse)
                if (request?.isForMainFrame == true && (errorResponse?.statusCode ?: 200) >= 400) {
                    openInExternalBrowser(lastTargetUrl)
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
    }

    private fun loadPanelFromBackend() {
        Thread {
            val runtimeUrl = fetchRuntimePanelUrl()
            val targetUrl = if (runtimeUrl.isNullOrBlank()) {
                BuildConfig.FALLBACK_PANEL_URL
            } else {
                runtimeUrl
            }
            lastTargetUrl = targetUrl

            runOnUiThread {
                if (shouldForceExternalBrowser(targetUrl)) {
                    openInExternalBrowser(targetUrl)
                    return@runOnUiThread
                }
                webView.loadUrl(targetUrl)
            }
        }.start()
    }

    private fun shouldForceExternalBrowser(url: String): Boolean {
        val host = try {
            Uri.parse(url).host?.lowercase() ?: return false
        } catch (_: Exception) {
            return false
        }

        // Some banking sites block Android WebView and render blank/unsupported pages.
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

    override fun onDestroy() {
        if (::webView.isInitialized) {
            webView.destroy()
        }
        super.onDestroy()
    }
}