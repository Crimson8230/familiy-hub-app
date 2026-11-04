package com.familyhub.app.data.accounts

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.familyhub.app.TestDatabaseFactory
import com.familyhub.app.security.CredentialsCipher
import com.familyhub.app.security.EncryptedCredentials
import com.familyhub.app.security.KeystoreCredentialsCipher
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

@RunWith(AndroidJUnit4::class)
class AccountCreationTest {
    @Test
    fun tenAccountsRemainAfterDatabaseReopenAndDuplicateIsRejected() = runBlocking {
        val name = "creation-${UUID.randomUUID()}.db"
        val firstDatabase = TestDatabaseFactory.named(name)
        val repository = AccountRepository(firstDatabase, KeystoreCredentialsCipher())
        repeat(10) { index ->
            assertTrue(repository.create("Kind $index", "grundschule", "user-$index", "pass-$index") is CreateAccountResult.Created)
        }
        assertTrue(repository.create(" kind 0 ", "mittelschule", "other", "other") is CreateAccountResult.Duplicate)
        val raw = firstDatabase.accountDao().getByChildKey("kind 0")!!
        assertFalse(raw.credentialsCiphertext.toString(Charsets.UTF_8).contains("user-0"))
        assertFalse(raw.credentialsCiphertext.toString(Charsets.UTF_8).contains("pass-0"))
        firstDatabase.close()

        val reopened = TestDatabaseFactory.named(name)
        try {
            assertEquals(10, reopened.accountDao().listSummaries().size)
        } finally {
            reopened.close()
        }
    }

    @Test
    fun encryptionFailureDoesNotCreatePartialAccount() = runBlocking {
        val database = TestDatabaseFactory.inMemory()
        try {
            val failingCipher = object : CredentialsCipher {
                override fun encrypt(username: String, password: String): EncryptedCredentials =
                    error("test failure")

                override fun decrypt(encrypted: EncryptedCredentials) = error("unused")
            }
            val result = AccountRepository(database, failingCipher)
                .create("Nina", "grundschule", "username", "password")

            assertTrue(result is CreateAccountResult.Failed)
            assertTrue(database.accountDao().listSummaries().isEmpty())
        } finally {
            database.close()
        }
    }
}
