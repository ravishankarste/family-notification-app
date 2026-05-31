package com.familynotificationapp

import android.util.Log
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

object EmergencyApi {
    
    private const val FUNCTION_URL = "https://rkzjcyiqphodkkwgrdmu.supabase.co/functions/v1/emergency-ack"
    private const val ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrempjeWlxcGhvZGtrd2dyZG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTk1MDAsImV4cCI6MjA5MzkzNTUwMH0.mxdHSOlx2VmMk_3bpd1_ij6EnnidqmchuDRh28Qy7rk"

    fun ackDelivered(messageId: String) {
        post(messageId, "DELIVERED")
    }

    fun ackConfirmed(messageId: String) {
        post(messageId, "CONFIRMED")
    }

    private fun post(id: String, status: String, attempt: Int = 1) {
        thread {
            try {
                val url = URL(FUNCTION_URL)
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("Authorization", "Bearer $ANON_KEY")
                conn.doOutput = true

                val json = JSONObject()
                json.put("message_id", id)
                json.put("status", status)

                val writer = OutputStreamWriter(conn.outputStream)
                writer.write(json.toString())
                writer.flush()
                writer.close()

                val responseCode = conn.responseCode
                Log.d("EmergencyApi", "ACK POST $status: $responseCode")
                
                if (responseCode !in 200..299 && attempt <= 3) {
                    val delays = listOf(0L, 2000L, 5000L, 10000L)
                    Thread.sleep(delays[attempt])
                    post(id, status, attempt + 1)
                }
            } catch (e: Exception) {
                Log.e("EmergencyApi", "Failed to send ACK", e)
                if (attempt <= 3) {
                    val delays = listOf(0L, 2000L, 5000L, 10000L)
                    Thread.sleep(delays[attempt])
                    post(id, status, attempt + 1)
                }
            }
        }
    }
}
