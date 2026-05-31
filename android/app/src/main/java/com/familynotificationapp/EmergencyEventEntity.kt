package com.familynotificationapp

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "emergency_events")
data class EmergencyEventEntity(
    @PrimaryKey val messageId: String,
    val payload: String,
    val status: String,
    val timestamp: Long
)
