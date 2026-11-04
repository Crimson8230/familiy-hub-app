package com.familyhub.app.ui.accounts

import android.os.SystemClock
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.familyhub.app.TestDatabaseFactory
import com.familyhub.app.data.accounts.AccountListResult
import com.familyhub.app.data.accounts.AccountRepository
import com.familyhub.app.data.accounts.CreateAccountResult
import com.familyhub.app.data.accounts.DeleteAccountResult
import com.familyhub.app.security.KeystoreCredentialsCipher
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AccountPerformanceTest {
    @get:Rule val rule = createComposeRule()

    @Test
    fun tenAccountOverviewAndMutationsMeetPlanLimits() = runBlocking {
        val database = TestDatabaseFactory.inMemory()
        try {
            val cipher = KeystoreCredentialsCipher()
            cipher.encrypt("warmup", "warmup")
            val repository = AccountRepository(database, cipher)
            repeat(9) { index ->
                assertTrue(repository.create("Kind ${index + 1}", "grundschule", "user", "pass") is CreateAccountResult.Created)
            }

            val saveStart = SystemClock.elapsedRealtimeNanos()
            val created = repository.create("Kind 10", "grundschule", "user", "pass")
            val saveMs = (SystemClock.elapsedRealtimeNanos() - saveStart) / 1_000_000
            assertTrue(created is CreateAccountResult.Created)
            assertTrue("Speichern dauerte ${saveMs} ms", saveMs <= 2_000)

            val overviewStart = SystemClock.elapsedRealtimeNanos()
            val accounts = (repository.observeAccounts().first() as AccountListResult.Items).accounts
            assertTrue(accounts.size == 10)
            rule.setContent {
                AccountListScreen(AccountListUiState(loading = false, accounts = accounts), {}, {}, {}, {}, {})
            }
            rule.onNodeWithText("Kind 10").assertExists()
            val overviewMs = (SystemClock.elapsedRealtimeNanos() - overviewStart) / 1_000_000
            assertTrue("Übersicht dauerte ${overviewMs} ms", overviewMs <= 1_000)

            val deleteStart = SystemClock.elapsedRealtimeNanos()
            val deleted = repository.delete((created as CreateAccountResult.Created).id)
            val deleteMs = (SystemClock.elapsedRealtimeNanos() - deleteStart) / 1_000_000
            assertTrue(deleted is DeleteAccountResult.Deleted)
            assertTrue("Löschen dauerte ${deleteMs} ms", deleteMs <= 2_000)
        } finally {
            database.close()
        }
    }
}
