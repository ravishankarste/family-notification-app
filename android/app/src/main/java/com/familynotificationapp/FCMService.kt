package com.familynotificationapp

import android.content.Intent
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import android.os.Build

class FCMService : FirebaseMessagingService() {

    override fun onMessageReceived(message: RemoteMessage) {

        val messageId = message.data["message_id"] ?: return
        val payload = message.data.toString()

        val repo = EmergencyRepository(applicationContext)

        repo.insertPending(messageId, payload)

        val intent = Intent(this, EmergencyService::class.java)
        intent.putExtra("message_id", messageId)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }
}
