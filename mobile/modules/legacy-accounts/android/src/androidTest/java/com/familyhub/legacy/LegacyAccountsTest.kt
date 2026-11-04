package com.familyhub.legacy

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import android.database.sqlite.SQLiteDatabase
import com.familyhub.legacy.testfixtures.KeystoreCredentialsCipher
import java.io.ByteArrayOutputStream
import java.io.DataOutputStream
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.SecretKey
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LegacyAccountsTest {
    private val alias = "family_hub_register_credentials_v1"
    @Before fun isolatedTestIdentity() {
        check(InstrumentationRegistry.getInstrumentation().targetContext.packageName.endsWith(".nativetest"))
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        if (store.containsAlias(alias)) store.deleteEntry(alias)
    }
    @Test fun missingKeyIsNeverGenerated() {
        var failed = false
        try { LegacyCredentialsDecoder().decrypt(EncryptedCredentials(ByteArray(32), ByteArray(12), 1)) }
        catch (_: Exception) { failed = true }
        assertTrue("Missing key must fail", failed)
        assertFalse("Missing key must stay missing", KeyStore.getInstance("AndroidKeyStore").apply { load(null) }.containsAlias(alias))
    }
    @Test fun formatThreePreservesLongValuesAndSpecialCharacters() {
        val username = "ä😀".repeat(20000)
        val password = " password-ß "
        val encrypted = KeystoreCredentialsCipher().encrypt(username, password)
        val actual = LegacyCredentialsDecoder().decrypt(EncryptedCredentials(encrypted.ciphertext, encrypted.iv, encrypted.formatVersion))
        assertTrue("Long-value roundtrip", actual.username == username && actual.password == password)
    }
    @Test fun oldFormatsOneAndTwoStayReadable() {
        for (format in 1..2) {
            val username = if (format == 2) "u".repeat(70000) else " user-ä "
            val password = " pass-ß "
            KeystoreCredentialsCipher().encrypt("fixture", "fixture")
            val key = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }.getKey(alias, null) as SecretKey
            val plaintext = ByteArrayOutputStream().use { output ->
                DataOutputStream(output).use { stream ->
                    for (value in listOf(username, password)) {
                        if (format == 1) stream.writeUTF(value) else {
                            val bytes = value.toByteArray(Charsets.UTF_8)
                            stream.writeInt(bytes.size); stream.write(bytes); bytes.fill(0)
                        }
                    }
                }
                output.toByteArray()
            }
            try {
                val cipher = Cipher.getInstance("AES/GCM/NoPadding")
                cipher.init(Cipher.ENCRYPT_MODE, key)
                val actual = LegacyCredentialsDecoder().decrypt(EncryptedCredentials(cipher.doFinal(plaintext), cipher.iv, format))
                assertTrue("Legacy format roundtrip", actual.username == username && actual.password == password)
            } finally { plaintext.fill(0) }
        }
    }
    @Test fun unsupportedFormatFailsWithoutKey() {
        var failed = false
        try { LegacyCredentialsDecoder().decrypt(EncryptedCredentials(ByteArray(0), ByteArray(0), 4)) }
        catch (_: IllegalArgumentException) { failed = true }
        assertTrue("Unknown format rejected", failed)
    }
    @Test fun readOnlySnapshotReadsCommittedWalRowsWithoutChangingSource() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val file = context.getDatabasePath("legacy-snapshot-regression.db")
        SQLiteDatabase.deleteDatabase(file)
        try {
            SQLiteDatabase.openOrCreateDatabase(file, null).use { writer ->
                writer.enableWriteAheadLogging()
                writer.execSQL("CREATE TABLE school_accounts (id INTEGER PRIMARY KEY,child_display_name TEXT,child_key TEXT,school_code TEXT,credentials_ciphertext BLOB,credentials_iv BLOB,credentials_format_version INTEGER)")
                writer.version = 1
                val encrypted = KeystoreCredentialsCipher().encrypt(" synthetic-user ", " synthetic-pass ")
                writer.beginTransactionNonExclusive()
                try {
                    writer.execSQL("INSERT INTO school_accounts VALUES (?,?,?,?,?,?,?)", arrayOf(1, "Fixture", "fixture", "grundschule", encrypted.ciphertext, encrypted.iv, encrypted.formatVersion))
                    writer.setTransactionSuccessful()
                } finally { writer.endTransaction() }
                val snapshot = readLegacySnapshot(file)!!
                val rows = snapshot["accounts"] as List<*>
                val row = rows.single() as Map<*, *>
                assertTrue("Read-only snapshot preserves values", row["username"] == " synthetic-user " && row["password"] == " synthetic-pass ")
                assertTrue("Source is retained", file.exists() && writer.rawQuery("SELECT COUNT(*) FROM school_accounts", null).use { it.moveToFirst(); it.getInt(0) == 1 })
            }
        } finally { SQLiteDatabase.deleteDatabase(file) }
    }
    @Test fun readOnlyEmptySnapshotDoesNotRequireOrCreateKey() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val file = context.getDatabasePath("legacy-empty-regression.db")
        SQLiteDatabase.deleteDatabase(file)
        try {
            SQLiteDatabase.openOrCreateDatabase(file, null).use { writer ->
                writer.execSQL("CREATE TABLE school_accounts (id INTEGER PRIMARY KEY,child_display_name TEXT,child_key TEXT,school_code TEXT,credentials_ciphertext BLOB,credentials_iv BLOB,credentials_format_version INTEGER)")
                writer.version = 1
            }
            assertTrue("Empty source remains readable", (readLegacySnapshot(file)!!["accounts"] as List<*>).isEmpty())
            assertFalse("No legacy key is generated", KeyStore.getInstance("AndroidKeyStore").apply { load(null) }.containsAlias(alias))
            assertTrue("Source is retained", file.exists())
        } finally { SQLiteDatabase.deleteDatabase(file) }
    }
}
