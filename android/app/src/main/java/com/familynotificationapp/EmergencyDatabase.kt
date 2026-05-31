package com.familynotificationapp

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(entities = [EmergencyEventEntity::class], version = 1, exportSchema = false)
abstract class EmergencyDatabase : RoomDatabase() {
    abstract fun dao(): EmergencyDao
}
