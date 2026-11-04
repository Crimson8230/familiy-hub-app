package com.familyhub.tests

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import android.database.sqlite.SQLiteDatabase
import java.io.File
import java.io.ByteArrayOutputStream
import java.io.DataOutputStream
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.SecretKey
import org.json.JSONObject
import com.familyhub.tests.cipher.KeystoreCredentialsCipher

class FamilyHubTestPackage : ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(FamilyHubTestSupport(context))
    override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
class FamilyHubTestSupport(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName() = "FamilyHubTestSupport"
    private val report get() = File(context.filesDir, "familyhub-test-report.json")
    private fun testOnlyReset() {
        check(context.packageName.endsWith(".nativetest")) { "Reset forbidden for upgrade identity" }
        File(context.filesDir, "familyhub").deleteRecursively()
        SQLiteDatabase.deleteDatabase(context.getDatabasePath("family_hub.db"))
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        if (store.containsAlias("family_hub_register_credentials_v1")) store.deleteEntry("family_hub_register_credentials_v1")
    }
    private fun seed(empty: Boolean) {
        check(context.packageName.endsWith(".nativetest"))
        val file = context.getDatabasePath("family_hub.db")
        file.parentFile?.mkdirs()
        SQLiteDatabase.openOrCreateDatabase(file, null).use { db ->
            db.execSQL("CREATE TABLE school_accounts (id INTEGER PRIMARY KEY,child_display_name TEXT,child_key TEXT,school_code TEXT,credentials_ciphertext BLOB,credentials_iv BLOB,credentials_format_version INTEGER)")
            db.version = 1
            if (!empty) for (i in 1..10) {
                val user = if (i == 9) "x".repeat(70000) else " user-$i "
                val pass = " pass-$i-ä "
                val format = (i - 1) % 3 + 1
                val encrypted = KeystoreCredentialsCipher().encrypt(user, pass)
                var payload = encrypted.ciphertext
                var iv = encrypted.iv
                if (format < 3) {
                    val plain = ByteArrayOutputStream().use { output ->
                        DataOutputStream(output).use { stream ->
                            for (value in listOf(user, pass)) {
                                if (format == 1) stream.writeUTF(value) else {
                                    val bytes = value.toByteArray(Charsets.UTF_8)
                                    stream.writeInt(bytes.size); stream.write(bytes); bytes.fill(0)
                                }
                            }
                        }
                        output.toByteArray()
                    }
                    try {
                        val key = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }.getKey("family_hub_register_credentials_v1", null) as SecretKey
                        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
                        cipher.init(Cipher.ENCRYPT_MODE, key)
                        payload = cipher.doFinal(plain); iv = cipher.iv
                    } finally { plain.fill(0) }
                }
                db.execSQL("INSERT INTO school_accounts VALUES (?,?,?,?,?,?,?)", arrayOf(i, "Kind $i", "kind $i", if (i % 2 == 0) "grundschule" else "mittelschule", payload, iv, format))
            }
        }
    }
    @ReactMethod fun control(command: String, raw: String, promise: Promise) {
        try {
            val data = JSONObject(raw)
            val folder = File(context.filesDir, "familyhub")
            val result: String? = when (command) {
                "reset" -> { testOnlyReset(); null }
                "seedLegacy" -> { seed(data.optBoolean("empty", false)); null }
                "removeLegacyKey" -> {
                    val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
                    if (store.containsAlias("family_hub_register_credentials_v1")) store.deleteEntry("family_hub_register_credentials_v1")
                    null
                }
                "mutateLegacy" -> {
                    SQLiteDatabase.openDatabase(context.getDatabasePath("family_hub.db").path, null, SQLiteDatabase.OPEN_READWRITE).use { db ->
                        when (data.getString("kind")) {
                            "schema" -> db.execSQL("PRAGMA user_version=2")
                            "format" -> db.execSQL("UPDATE school_accounts SET credentials_format_version=99 WHERE id=1")
                            "identity" -> db.execSQL("UPDATE school_accounts SET child_key='wrong' WHERE id=1")
                        }
                    }; null
                }
                "writeFile", "removeFile" -> {
                    val name = data.getString("name")
                    check(name in listOf("installation.json", "family_hub_v2.db", "family_hub_v2.db-wal", "family_hub_v2.db-shm", "family_hub_v2.db-journal"))
                    folder.mkdirs(); val file = File(folder, name)
                    if (command == "writeFile") file.writeText(data.getString("value")) else file.delete()
                    null
                }
                "report" -> { report.writeText(raw); null }
                "readReport" -> if (report.exists()) report.readText() else null
                else -> error("Unknown synthetic test command")
            }
            promise.resolve(result)
        } catch (_: Exception) { promise.reject("SYNTHETIC_TEST_FAILURE", "Synthetic test operation failed") }
    }
}
