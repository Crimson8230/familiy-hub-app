package com.familyhub.app.data.accounts

import androidx.room.withTransaction
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.familyhub.app.TestDatabaseFactory
import com.familyhub.app.security.KeystoreCredentialsCipher
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AccountDeletionTest {
    @Test
    fun deletingOneAccountKeepsOthersAndAllowsSameChildAgain() = runBlocking {
        val database = TestDatabaseFactory.inMemory()
        try {
            val repository = AccountRepository(database, KeystoreCredentialsCipher())
            val first = repository.create("Nina", "grundschule", "n-user", "n-pass") as CreateAccountResult.Created
            repository.create("Paul", "mittelschule", "p-user", "p-pass")

            assertEquals(DeleteAccountResult.Deleted, repository.delete(first.id))
            assertEquals(listOf("Paul"), database.accountDao().listSummaries().map { it.childDisplayName })
            assertTrue(repository.create("Nina", "grundschule", "new-user", "new-pass") is CreateAccountResult.Created)
        } finally {
            database.close()
        }
    }

    @Test
    fun failedTransactionRestoresDeletedAccount() = runBlocking {
        val database = TestDatabaseFactory.inMemory()
        try {
            val repository = AccountRepository(database, KeystoreCredentialsCipher())
            val account = repository.create("Oli", "grundschule", "user", "pass") as CreateAccountResult.Created
            try {
                database.withTransaction {
                    database.accountDao().deleteById(account.id)
                    error("simulated failure")
                }
            } catch (_: IllegalStateException) {
                // The transaction must roll back.
            }
            assertEquals("Oli", database.accountDao().listSummaries().single().childDisplayName)
        } finally {
            database.close()
        }
    }
}
