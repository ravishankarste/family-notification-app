package com.familynotificationapp

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.ReactApplication
import com.facebook.react.modules.core.DeviceEventManagerModule

class WatchdogService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private val CHANNEL_ID = "watchdog_channel"
    private val HEARTBEAT_INTERVAL = 15000L // 15 seconds
    private val JS_FREEZE_TIMEOUT = 30000L // 30 seconds

    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            checkJsHealth()
            sendNativeHeartbeatToJs()
            handler.postDelayed(this, HEARTBEAT_INTERVAL)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Emergency System Active")
            .setContentText("System Monitoring Active")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .build()

        startForeground(1, notification)
        
        // Start heartbeats
        handler.removeCallbacks(heartbeatRunnable)
        handler.post(heartbeatRunnable)

        return START_STICKY
    }

    private fun checkJsHealth() {
        val now = System.currentTimeMillis()
        val lastJs = WatchdogModule.lastJsAliveTime
        
        if (now - lastJs > JS_FREEZE_TIMEOUT) {
            Log.e("WatchdogService", "JS is Frozen! Restarting App!")
            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                startActivity(launchIntent)
            }
        }
    }

    private fun sendNativeHeartbeatToJs() {
        try {
            val reactApp = applicationContext as ReactApplication
            val reactContext = reactApp.reactNativeHost.reactInstanceManager.currentReactContext
            
            if (reactContext != null) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("NATIVE_HEARTBEAT", null)
            }
        } catch (e: Exception) {
            Log.e("WatchdogService", "Failed to send native heartbeat", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(heartbeatRunnable)
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Watchdog Service Channel",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }
}
