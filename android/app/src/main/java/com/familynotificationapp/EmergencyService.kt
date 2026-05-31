package com.familynotificationapp

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.MediaPlayer
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.core.app.NotificationCompat

class EmergencyService : Service() {

    companion object {
        var isAlarmRunning = false
    }

    private var mediaPlayer: MediaPlayer? = null
    private val CHANNEL_ID = "emergency_channel"
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val messageId = intent?.getStringExtra("message_id") ?: return START_NOT_STICKY

        if (isAlarmRunning) return START_STICKY
        isAlarmRunning = true

        // Start as foreground service to prevent silent kill
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Emergency Alert Active")
            .setContentText("Emergency Protocol Executing")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .build()

        startForeground(2, notification)

        // Load specific message state
        val repo = EmergencyRepository(this)
        val message = repo.getMessage(messageId)

        if (message != null) {
            repo.updateStatus(messageId, "DELIVERED")
            EmergencyApi.ackDelivered(messageId)
        }

        triggerAlarm()
        launchUI(messageId)

        return START_STICKY
    }

    private fun triggerAlarm() {
        // 1. WAKE SCREEN
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.FULL_WAKE_LOCK or
            PowerManager.ACQUIRE_CAUSES_WAKEUP or
            PowerManager.ON_AFTER_RELEASE,
            "emergency:wakelock"
        )
        wakeLock?.acquire(10 * 60 * 1000L) // 10 minutes

        // 2. CHECK TIMINGS (UK Timezone)
        val londonTimeZone = java.util.TimeZone.getTimeZone("Europe/London")
        val calendar = java.util.Calendar.getInstance(londonTimeZone)
        val hour = calendar.get(java.util.Calendar.HOUR_OF_DAY)
        
        // 9:00 AM (9) to 3:59 PM (15) inclusive
        val isSchoolHours = hour in 9..15

        if (!isSchoolHours) {
            playAlarmAudio()
        }

        // 3. VIBRATION (Always vibrate)
        val vib = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vib.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 500, 500), 0))
        } else {
            @Suppress("DEPRECATION")
            vib.vibrate(longArrayOf(0, 500, 500), 0)
        }
    }

    private fun playAlarmAudio() {
        if (mediaPlayer == null) {
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as android.media.AudioManager
            val maxVolume = audioManager.getStreamMaxVolume(android.media.AudioManager.STREAM_ALARM)
            audioManager.setStreamVolume(android.media.AudioManager.STREAM_ALARM, maxVolume, 0)

            val ringtoneUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_ALARM)
            mediaPlayer = MediaPlayer().apply {
                setDataSource(applicationContext, ringtoneUri)
                val audioAttributes = android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
                setAudioAttributes(audioAttributes)
                isLooping = true
                prepare()
                start()
            }
        }
    }

    private fun launchUI(messageId: String) {
        val i = Intent(this, EmergencyActivity::class.java)
        i.putExtra("message_id", messageId)
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        startActivity(i)
    }

    override fun onDestroy() {
        super.onDestroy()
        isAlarmRunning = false
        mediaPlayer?.stop()
        mediaPlayer?.release()
        mediaPlayer = null
        wakeLock?.takeIf { it.isHeld }?.release()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Emergency Alarm Channel",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                setBypassDnd(true)
                description = "Critical emergency alerts that override Do Not Disturb"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }
}
