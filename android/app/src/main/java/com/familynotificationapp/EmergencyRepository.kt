package com.familynotificationapp

import android.content.Context
import androidx.room.Room

class EmergencyRepository(context: Context) {
    private val db = Room.databaseBuilder(
        context.applicationContext,
        EmergencyDatabase::class.java,
        "emergency_db"
    ).allowMainThreadQueries().build()

    private val dao = db.dao()

    fun insertPending(id: String, payload: String) {
        dao.insert(
            EmergencyEventEntity(
                messageId = id,
                payload = payload,
                status = "PENDING",
                timestamp = System.currentTimeMillis()
            )
        )
    }

    fun getMessage(id: String) = dao.get(id)

    fun updateStatus(id: String, newStatus: String) {
        val current = dao.get(id)
        if (current != null) {
            val ranks = mapOf("PENDING" to 1, "DELIVERED" to 2, "CONFIRMED" to 3)
            val currentRank = ranks[current.status] ?: 0
            val newRank = ranks[newStatus] ?: 0
            
            if (newRank > currentRank) {
                dao.updateStatus(id, newStatus)
            }
        }
    }

    fun getPending() = dao.getUnconfirmed()
}
