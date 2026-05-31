package com.familynotificationapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.modules.core.DeviceEventManagerModule

class UserPresentReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_USER_PRESENT) {
            Log.d("UserPresentReceiver", "Screen unlocked, triggering JS reconnect")
            try {
                val reactApp = context.applicationContext as ReactApplication
                val reactContext = reactApp.reactNativeHost.reactInstanceManager.currentReactContext
                
                if (reactContext != null) {
                    reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("USER_UNLOCKED", null)
                }
            } catch (e: Exception) {
                Log.e("UserPresentReceiver", "Failed to send unlock event", e)
            }
        }
    }
}
