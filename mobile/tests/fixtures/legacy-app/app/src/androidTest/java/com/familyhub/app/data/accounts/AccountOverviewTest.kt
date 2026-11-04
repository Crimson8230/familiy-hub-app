package com.familyhub.app.data.accounts

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.familyhub.app.TestDatabaseFactory
import com.familyhub.app.security.KeystoreCredentialsCipher
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

@RunWith(AndroidJUnit4::class)
class AccountOverviewTest {
    @Test
    fun tenSummariesRemainAvailableAfterReopen() = runBlocking {
        val name = "overview-${UUID.randomUUID()}.db"
        val first = TestDatabaseFactory.named(name)
        val repository = AccountRepository(first, KeystoreCredentialsCipher())
        repeat(10) { index ->
            repository.create("Kind $index", "grundschule", "user-$index", "pass-$index")
        }
        first.close()

        val reopened = TestDatabaseFactory.named(name)
        try {
            val summaries = reopened.accountDao().listSummaries()
            assertEquals(10, summaries.size)
            assertEquals((0..9).map { "Kind $it" }, summaries.map { it.childDisplayName })
        } finally {
            reopened.close()
        }
    }

    @Test
    fun overviewContainsOnlySummariesAndCanBeReloaded() = runBlocking {
        val database = TestDatabaseFactory.inMemory()
        try {
            val repository = AccountRepository(database, KeystoreCredentialsCipher())
            repository.create("Mia", "grundschule", "private-user", "private-pass")
            repository.create("Leo", "mittelschule", "other-user", "other-pass")

            val result = repository.observeAccounts().first() as AccountListResult.Items
            assertEquals(listOf("Leo", "Mia"), result.accounts.map { it.childDisplayName })
            assertTrue(result.accounts.none { it.toString().contains("private-user") })
        } finally {
            database.close()
        }
    }

    @Test
    fun closedDatabaseIsReportedAsReadFailure() = runBlocking {
        val database = TestDatabaseFactory.inMemory()
        val repository = AccountRepository(database, KeystoreCredentialsCipher())
        database.close()

        assertEquals(AccountListResult.Failed, repository.observeAccounts().first())
    }
}
