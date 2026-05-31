package com.familynotificationapp

import android.content.Context

class SyncRecoveryManager(private val context: Context) {

    private val repo = EmergencyRepository(context)

    fun sync() {
        val pending = repo.getPending()

        for (event in pending) {
            val status = event["status"]
            val messageId = event["messageId"]
            
            if (status == "DELIVERED" && messageId != null) {
                EmergencyApi.ackDelivered(messageId)
            }
            
            if (status == "PENDING") {
                // Was received by FCM but EmergencyService failed to start or update it.
                // It will likely be picked up or restarted, but we can attempt to send DELIVERED just in case.
            }
        }
    }
}
