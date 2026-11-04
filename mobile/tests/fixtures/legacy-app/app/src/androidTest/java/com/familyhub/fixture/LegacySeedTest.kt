package com.familyhub.fixture

import android.security.keystore.KeyProperties
import androidx.room.Room
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.familyhub.app.data.accounts.FamilyHubDatabase
import com.familyhub.app.data.accounts.SchoolAccountEntity
import com.familyhub.app.security.EncryptedCredentials
import com.familyhub.app.security.KeystoreCredentialsCipher
import java.io.ByteArrayOutputStream
import java.io.DataOutputStream
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.SecretKey
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LegacySeedTest {
    @Test fun seedSyntheticAccounts() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        check(context.packageName == "com.familyhub.app")
        check(InstrumentationRegistry.getArguments().getString("familyhubFixture") == "synthetic-only")
        val empty = InstrumentationRegistry.getArguments().getString("empty") == "true"
        val database = Room.databaseBuilder(context, FamilyHubDatabase::class.java, "family_hub.db").build()
        try {
            check(database.accountDao().listSummaries().isEmpty()) { "Fixture installation must start empty" }
            if (!empty) {
                val cipher = KeystoreCredentialsCipher()
                for (i in 1..10) {
                    val username = if (i == 9) "x".repeat(70000) else " user-$i "
                    val password = " test-pass-$i-ä "
                    val format = (i - 1) % 3 + 1
                    val encrypted = if (format == 3) cipher.encrypt(username, password) else {
                        // Provision the original alias using the unchanged old implementation.
                        cipher.encrypt("fixture", "fixture")
                        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
                        val key = store.getKey("family_hub_register_credentials_v1", null) as SecretKey
                        val bytes = ByteArrayOutputStream().use { output ->
                            DataOutputStream(output).use { stream ->
                                for (value in listOf(username, password)) {
                                    if (format == 1) stream.writeUTF(value) else {
                                        val encoded = value.toByteArray(Charsets.UTF_8)
                                        stream.writeInt(encoded.size)
                                        stream.write(encoded)
                                        encoded.fill(0)
                                    }
                                }
                            }
                            output.toByteArray()
                        }
                        try {
                            val aes = Cipher.getInstance("AES/GCM/NoPadding")
                            aes.init(Cipher.ENCRYPT_MODE, key)
                            EncryptedCredentials(aes.doFinal(bytes), aes.iv.copyOf(), format)
                        } finally { bytes.fill(0) }
                    }
                    database.accountDao().insert(SchoolAccountEntity(
                        id = i.toLong(), childDisplayName = "Kind $i", childKey = "kind $i",
                        schoolCode = if (i % 2 == 0) "grundschule" else "mittelschule",
                        credentialsCiphertext = encrypted.ciphertext, credentialsIv = encrypted.iv,
                        credentialsFormatVersion = encrypted.formatVersion,
                    ))
                }
            }
            assertTrue("Synthetic fixture count", database.accountDao().listSummaries().size == if (empty) 0 else 10)
        } finally { database.close() }
    }
}
