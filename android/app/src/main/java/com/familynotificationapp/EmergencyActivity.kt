package com.familynotificationapp

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import android.graphics.Color
import android.view.Gravity
import android.widget.LinearLayout

class EmergencyActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val messageId = intent.getStringExtra("message_id") ?: ""

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
        
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Create a simple UI natively since React Native might be frozen
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.RED)
        }

        val text = TextView(this).apply {
            text = "EMERGENCY ALERT"
            textSize = 32f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 100)
        }

        val stopButton = Button(this).apply {
            text = "ACKNOWLEDGE"
            setBackgroundColor(Color.WHITE)
            setTextColor(Color.RED)
            setOnClickListener {
                if (messageId.isNotEmpty()) {
                    val repo = EmergencyRepository(this@EmergencyActivity)
                    repo.updateStatus(messageId, "CONFIRMED")
                    EmergencyApi.ackConfirmed(messageId)
                }

                stopService(Intent(this@EmergencyActivity, EmergencyService::class.java))
                finish()
            }
        }

        layout.addView(text)
        layout.addView(stopButton)

        setContentView(layout)
    }
}
