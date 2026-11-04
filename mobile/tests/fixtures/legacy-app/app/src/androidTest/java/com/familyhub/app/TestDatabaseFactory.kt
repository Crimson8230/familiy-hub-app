package com.familyhub.app

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.familyhub.app.data.accounts.FamilyHubDatabase

object TestDatabaseFactory {
    fun inMemory(context: Context = ApplicationProvider.getApplicationContext()): FamilyHubDatabase =
        Room.inMemoryDatabaseBuilder(context, FamilyHubDatabase::class.java)
            .allowMainThreadQueries()
            .build()

    fun named(name: String, context: Context = ApplicationProvider.getApplicationContext()): FamilyHubDatabase =
        Room.databaseBuilder(context, FamilyHubDatabase::class.java, name)
            .allowMainThreadQueries()
            .build()
}
