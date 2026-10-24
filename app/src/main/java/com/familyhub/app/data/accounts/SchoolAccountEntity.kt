package com.familyhub.app.data.accounts

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "school_accounts", indices = [Index(value = ["child_key"], unique = true)])
data class SchoolAccountEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "child_display_name") val childDisplayName: String,
    @ColumnInfo(name = "child_key") val childKey: String,
    @ColumnInfo(name = "school_code") val schoolCode: String,
    @ColumnInfo(name = "credentials_ciphertext", typeAffinity = ColumnInfo.BLOB)
    val credentialsCiphertext: ByteArray,
    @ColumnInfo(name = "credentials_iv", typeAffinity = ColumnInfo.BLOB)
    val credentialsIv: ByteArray,
    @ColumnInfo(name = "credentials_format_version") val credentialsFormatVersion: Int = 1,
) {
    override fun toString(): String = "SchoolAccountEntity(id=$id, data=[REDACTED])"
}

data class AccountSummary(
    val id: Long,
    val childDisplayName: String,
    val schoolCode: String,
)
