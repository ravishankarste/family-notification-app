package com.familynotificationapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || intent.action == "android.intent.action.QUICKBOOT_POWERON") {
            // 1. Sync any missed ACKs
            val syncManager = SyncRecoveryManager(context)
            syncManager.sync()

            // 2. Restart active emergency if unconfirmed
            val repo = EmergencyRepository(context)
            val pending = repo.getPending()
            if (pending.isNotEmpty()) {
                val serviceIntent = Intent(context, EmergencyService::class.java)
                serviceIntent.putExtra("message_id", pending.first().messageId)
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            }
        }
    }
}
