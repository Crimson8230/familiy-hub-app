package com.familyhub.app.security

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.familyhub.app.TestDatabaseFactory
import com.familyhub.app.data.accounts.AccountRepository
import com.familyhub.app.data.accounts.CreateAccountResult
import java.io.ByteArrayOutputStream
import java.io.DataOutputStream
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.SecretKey
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class CredentialsCipherTest {
    @Test
    fun eachEncryptionUsesFreshIvAndDecryptsExactCredentials() {
        val cipher = KeystoreCredentialsCipher()
        val first = cipher.encrypt(" user ", " pass ")
        val second = cipher.encrypt(" user ", " pass ")

        assertFalse(first.iv.contentEquals(second.iv))
        assertFalse(first.ciphertext.contentEquals(second.ciphertext))
        assertEquals(RegisterCredentials(" user ", " pass "), cipher.decrypt(first))
        assertEquals(3, first.formatVersion)
    }

    @Test
    fun longUnicodeCredentialsSurviveNamedDatabaseReopen() = runBlocking {
        val name = "long-credentials-${System.nanoTime()}.db"
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        val username = "ä👨‍👩‍👧".repeat(12000)
        val password = "🔐ß".repeat(14000)
        val cipher = KeystoreCredentialsCipher()
        var database = TestDatabaseFactory.named(name, context)
        try {
            assertTrue(AccountRepository(database, cipher).create("Long", "grundschule", username, password) is CreateAccountResult.Created)
            database.close()
            database = TestDatabaseFactory.named(name, context)
            val stored = database.accountDao().getByChildKey("long")!!
            assertEquals(3, stored.credentialsFormatVersion)
            assertEquals(RegisterCredentials(username, password), cipher.decrypt(EncryptedCredentials(
                stored.credentialsCiphertext, stored.credentialsIv, stored.credentialsFormatVersion,
            )))
        } finally {
            database.close()
            context.deleteDatabase(name)
        }
    }

    @Test
    fun decryptsExistingVersionOneAndTwoCredentials() {
        val cipher = KeystoreCredentialsCipher()
        cipher.encrypt("setup", "key")
        val key = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
            .getKey("family_hub_register_credentials_v1", null) as SecretKey
        for (version in 1..2) {
            val plaintext = ByteArrayOutputStream().use { output ->
                DataOutputStream(output).use { stream ->
                    for (value in listOf("old-user", "old-pass")) {
                        if (version == 1) stream.writeUTF(value) else {
                            val bytes = value.toByteArray(Charsets.UTF_8)
                            stream.writeInt(bytes.size)
                            stream.write(bytes)
                        }
                    }
                }
                output.toByteArray()
            }
            val encrypted = try {
                Cipher.getInstance("AES/GCM/NoPadding").run {
                    init(Cipher.ENCRYPT_MODE, key)
                    EncryptedCredentials(doFinal(plaintext), iv.copyOf(), version)
                }
            } finally {
                plaintext.fill(0)
            }
            assertEquals(RegisterCredentials("old-user", "old-pass"), cipher.decrypt(encrypted))
        }
    }

    @Test
    fun databaseAndErrorResultDoNotContainPlaintext() = runBlocking {
        val database = TestDatabaseFactory.inMemory()
        try {
            val repository = AccountRepository(database, KeystoreCredentialsCipher())
            assertTrue(repository.create("Lia", "grundschule", "secret-user-123", "secret-pass-123") is CreateAccountResult.Created)
            val raw = database.accountDao().getByChildKey("lia")!!
            assertFalse(raw.credentialsCiphertext.toString(Charsets.UTF_8).contains("secret-user-123"))
            assertFalse(raw.credentialsCiphertext.toString(Charsets.UTF_8).contains("secret-pass-123"))
            assertFalse(repository.create("Lia", "grundschule", "secret-user-123", "secret-pass-123").toString().contains("secret-pass-123"))
        } finally {
            database.close()
        }
    }
}
