package com.familyhub.app.data.accounts

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface AccountDao {
    @Insert
    suspend fun insert(account: SchoolAccountEntity): Long

    @Query("SELECT id, child_display_name AS childDisplayName, school_code AS schoolCode FROM school_accounts ORDER BY child_display_name COLLATE NOCASE, id")
    suspend fun listSummaries(): List<AccountSummary>

    @Query("SELECT id, child_display_name AS childDisplayName, school_code AS schoolCode FROM school_accounts ORDER BY child_display_name COLLATE NOCASE, id")
    fun observeSummaries(): Flow<List<AccountSummary>>

    @Query("SELECT * FROM school_accounts WHERE child_key = :key LIMIT 1")
    suspend fun getByChildKey(key: String): SchoolAccountEntity?

    @Query("DELETE FROM school_accounts WHERE id = :id")
    suspend fun deleteById(id: Long): Int
}
