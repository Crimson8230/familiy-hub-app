package com.familyhub.app.ui.accounts

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.familyhub.app.data.accounts.AccountSummary
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class DeleteAccountDialogTest {
    @get:Rule val rule = createComposeRule()

    @Test
    fun dialogNamesAccountAndSeparatesCancelFromDelete() {
        var cancellations = 0
        var confirmations = 0
        rule.setContent {
            AccountListScreen(
                AccountListUiState(
                    loading = false,
                    accounts = listOf(AccountSummary(1, "Mia", "grundschule")),
                    deleteTarget = AccountSummary(1, "Mia", "grundschule"),
                ),
                {}, {}, { cancellations++ }, { confirmations++ }, {},
            )
        }
        rule.onNodeWithText("Schulkonto für Mia (Grundschule St. Martin) löschen? Zugangsdaten und zugehörige lokale Daten werden entfernt.").assertExists()
        rule.onNodeWithText("Abbrechen").performClick()
        assertEquals(1, cancellations)
        assertEquals(0, confirmations)
        rule.onNodeWithText("Löschen").performClick()
        assertEquals(1, confirmations)
    }

    @Test
    fun failedDeletionShowsErrorWithoutCredentials() {
        rule.setContent {
            AccountListScreen(
                AccountListUiState(loading = false, deleteTarget = AccountSummary(1, "Mia", "grundschule"), deleteError = true),
                {}, {}, {}, {}, {},
            )
        }
        rule.onNodeWithText("Das Schulkonto konnte nicht gelöscht werden. Bitte erneut versuchen.").assertExists()
        rule.onNodeWithText("private-pass").assertDoesNotExist()
    }
}
