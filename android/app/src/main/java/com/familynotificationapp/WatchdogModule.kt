package com.familynotificationapp

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WatchdogModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        var lastJsAliveTime: Long = System.currentTimeMillis()
    }

    override fun getName(): String {
        return "WatchdogModule"
    }

    @ReactMethod
    fun onJsAlive() {
        // Called by JS every 10 seconds via AutoHeal
        lastJsAliveTime = System.currentTimeMillis()
    }

    @ReactMethod
    fun startService() {
        val intent = Intent(reactContext, WatchdogService::class.java)
        reactContext.startForegroundService(intent)
    }

    @ReactMethod
    fun queueEmergencyEvent(payload: String) {
        val messageId = "WS_" + System.currentTimeMillis()
        val repo = EmergencyRepository(reactContext)
        repo.insertPending(messageId, payload)
        
        val serviceIntent = Intent(reactContext, EmergencyService::class.java)
        serviceIntent.putExtra("message_id", messageId)
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            reactContext.startForegroundService(serviceIntent)
        } else {
            reactContext.startService(serviceIntent)
        }
    }

    @ReactMethod
    fun triggerSyncRecovery() {
        val syncManager = SyncRecoveryManager(reactContext)
        syncManager.sync()
    }
}
