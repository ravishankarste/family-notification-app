package com.familynotificationapp

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface EmergencyDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    fun insert(event: EmergencyEventEntity)

    @Query("SELECT * FROM emergency_events WHERE messageId = :id")
    fun get(id: String): EmergencyEventEntity?

    @Query("UPDATE emergency_events SET status = :status WHERE messageId = :id")
    fun updateStatus(id: String, status: String)

    @Query("SELECT * FROM emergency_events WHERE status != 'CONFIRMED'")
    fun getUnconfirmed(): List<EmergencyEventEntity>
}
