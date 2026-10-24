package com.familyhub.app

import android.app.Application
import androidx.room.Room
import com.familyhub.app.data.accounts.AccountRepository
import com.familyhub.app.data.accounts.FamilyHubDatabase
import com.familyhub.app.security.KeystoreCredentialsCipher

class FamilyHubApplication : Application() {
    val database: FamilyHubDatabase by lazy {
        Room.databaseBuilder(this, FamilyHubDatabase::class.java, "family_hub.db")
            .build()
    }

    val accounts: AccountRepository by lazy {
        AccountRepository(database, KeystoreCredentialsCipher())
    }
}
