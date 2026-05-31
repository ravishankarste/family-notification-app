package com.familynotificationapp

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class EmergencyRepository(context: Context) : SQLiteOpenHelper(context, "emergency_db", null, 1) {

    companion object {
        private const val TABLE_NAME = "emergency_events"
        private const val COL_ID = "messageId"
        private const val COL_PAYLOAD = "payload"
        private const val COL_STATUS = "status"
        private const val COL_TIMESTAMP = "timestamp"
    }

    override fun onCreate(db: SQLiteDatabase) {
        val createTable = """
            CREATE TABLE $TABLE_NAME (
                $COL_ID TEXT PRIMARY KEY,
                $COL_PAYLOAD TEXT NOT NULL,
                $COL_STATUS TEXT NOT NULL,
                $COL_TIMESTAMP INTEGER NOT NULL
            )
        """.trimIndent()
        db.execSQL(createTable)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // No upgrades needed yet
    }

    fun insertPending(id: String, payload: String) {
        val db = this.writableDatabase
        val values = ContentValues().apply {
            put(COL_ID, id)
            put(COL_PAYLOAD, payload)
            put(COL_STATUS, "PENDING")
            put(COL_TIMESTAMP, System.currentTimeMillis())
        }
        db.insertWithOnConflict(TABLE_NAME, null, values, SQLiteDatabase.CONFLICT_IGNORE)
    }

    fun getMessage(id: String): Map<String, String>? {
        val db = this.readableDatabase
        val cursor = db.query(
            TABLE_NAME, null, "$COL_ID = ?", arrayOf(id),
            null, null, null
        )
        var result: Map<String, String>? = null
        if (cursor.moveToFirst()) {
            result = mapOf(
                "messageId" to cursor.getString(cursor.getColumnIndexOrThrow(COL_ID)),
                "payload" to cursor.getString(cursor.getColumnIndexOrThrow(COL_PAYLOAD)),
                "status" to cursor.getString(cursor.getColumnIndexOrThrow(COL_STATUS)),
                "timestamp" to cursor.getLong(cursor.getColumnIndexOrThrow(COL_TIMESTAMP)).toString()
            )
        }
        cursor.close()
        return result
    }

    fun updateStatus(id: String, newStatus: String) {
        val current = getMessage(id)
        if (current != null) {
            val ranks = mapOf("PENDING" to 1, "DELIVERED" to 2, "CONFIRMED" to 3)
            val currentRank = ranks[current["status"]] ?: 0
            val newRank = ranks[newStatus] ?: 0

            if (newRank > currentRank) {
                val db = this.writableDatabase
                val values = ContentValues().apply {
                    put(COL_STATUS, newStatus)
                }
                db.update(TABLE_NAME, values, "$COL_ID = ?", arrayOf(id))
            }
        }
    }

    fun getPending(): List<Map<String, String>> {
        val db = this.readableDatabase
        val cursor = db.query(
            TABLE_NAME, null, "$COL_STATUS = ?", arrayOf("PENDING"),
            null, null, "$COL_TIMESTAMP ASC"
        )
        val list = mutableListOf<Map<String, String>>()
        while (cursor.moveToNext()) {
            list.add(
                mapOf(
                    "messageId" to cursor.getString(cursor.getColumnIndexOrThrow(COL_ID)),
                    "payload" to cursor.getString(cursor.getColumnIndexOrThrow(COL_PAYLOAD)),
                    "status" to cursor.getString(cursor.getColumnIndexOrThrow(COL_STATUS)),
                    "timestamp" to cursor.getLong(cursor.getColumnIndexOrThrow(COL_TIMESTAMP)).toString()
                )
            )
        }
        cursor.close()
        return list
    }
}
