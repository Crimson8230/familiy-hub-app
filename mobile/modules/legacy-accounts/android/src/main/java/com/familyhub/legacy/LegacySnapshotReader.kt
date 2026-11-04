package com.familyhub.legacy

import android.database.sqlite.SQLiteDatabase
import java.io.File

fun readLegacySnapshot(file: File): Map<String, Any>? {
    if (!file.exists()) return null
    try {
        SQLiteDatabase.openDatabase(file.path, null, SQLiteDatabase.OPEN_READONLY).use { db ->
            check(db.version == 1) { "Legacy schema unsupported" }
            val accounts = mutableListOf<Map<String, Any>>()
            // A single SELECT reads a consistent SQLite snapshot, including committed WAL
            // rows. Android maps execSQL("BEGIN") to an exclusive (writing) transaction,
            // which is not valid on this deliberately read-only connection.
            db.rawQuery("SELECT id,child_display_name,child_key,school_code,credentials_ciphertext,credentials_iv,credentials_format_version FROM school_accounts ORDER BY id", null).use { cursor ->
                while (cursor.moveToNext()) {
                    val id = cursor.getLong(0)
                    check(id > 0 && id <= 9007199254740991L)
                    val credentials = LegacyCredentialsDecoder().decrypt(EncryptedCredentials(cursor.getBlob(4), cursor.getBlob(5), cursor.getInt(6)))
                    accounts.add(mapOf("id" to id.toDouble(), "childDisplayName" to cursor.getString(1),
                        "childKey" to cursor.getString(2), "schoolCode" to cursor.getString(3),
                        "username" to credentials.username, "password" to credentials.password))
                }
            }
            return mapOf("sourceVersion" to 1, "accounts" to accounts)
        }
    } catch (_: Exception) { error("Legacy source unavailable") }
}
