package com.familyhub.app.data.accounts

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(entities = [SchoolAccountEntity::class], version = 1, exportSchema = true)
abstract class FamilyHubDatabase : RoomDatabase() {
    abstract fun accountDao(): AccountDao
}
