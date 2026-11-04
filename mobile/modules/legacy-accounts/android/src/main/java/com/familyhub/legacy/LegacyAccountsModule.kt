package com.familyhub.legacy

import android.database.sqlite.SQLiteDatabase
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.security.KeyStore

class LegacyAccountsModule : Module() {
    private fun source(): File = (appContext.reactContext ?: error("Storage unavailable")).getDatabasePath("family_hub.db")
    private fun exists(): Boolean {
        val file = source()
        return file.exists() || listOf("-wal", "-shm", "-journal").any { File(file.path + it).exists() }
    }
    private fun snapshot(): Map<String, Any>? = readLegacySnapshot(source())
    override fun definition() = ModuleDefinition {
        Name("LegacyAccounts")
        AsyncFunction("exists") { exists() }
        AsyncFunction("snapshot") { snapshot() }
        AsyncFunction("removeDatabase") {
            val file = source()
            if (file.exists()) check(SQLiteDatabase.deleteDatabase(file)) { "Legacy cleanup failed" }
            for (suffix in listOf("-wal", "-shm", "-journal")) {
                val sidecar = File(file.path + suffix)
                check(!sidecar.exists() || sidecar.delete()) { "Legacy cleanup failed" }
            }
            check(!file.exists() && listOf("-wal", "-shm", "-journal").none { File(file.path + it).exists() }) { "Legacy cleanup failed" }
        }
        AsyncFunction("removeKey") {
            val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
            if (store.containsAlias("family_hub_register_credentials_v1")) store.deleteEntry("family_hub_register_credentials_v1")
        }
    }
}
