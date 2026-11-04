package com.familyhub.app.ui.accounts

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.familyhub.app.data.accounts.AccountSummary
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AccountListScreenTest {
    @get:Rule val rule = createComposeRule()

    @Test
    fun emptyAndReadErrorAreDifferentStates() {
        var state by mutableStateOf(AccountListUiState(loading = false))
        rule.setContent {
            AccountListScreen(state, {}, {}, {}, {}, {})
        }
        rule.onNodeWithText("Noch keine Schulkonten eingerichtet.").assertExists()

        rule.runOnIdle { state = AccountListUiState(loading = false, readError = true) }
        rule.onNodeWithText("Die gespeicherten Schulkonten konnten nicht geladen werden.").assertExists()
        rule.onNodeWithText("Erneut versuchen").assertExists()
    }

    @Test
    fun twoChildrenAndSchoolsAreVisibleWithoutCredentials() {
        rule.setContent {
            AccountListScreen(
                AccountListUiState(
                    loading = false,
                    accounts = listOf(
                        AccountSummary(1, "Mia", "grundschule"),
                        AccountSummary(2, "Leo", "mittelschule"),
                    ),
                ),
                {}, {}, {}, {}, {},
            )
        }
        rule.onNodeWithText("Mia").assertExists()
        rule.onNodeWithText("Leo").assertExists()
        rule.onNodeWithText("Grundschule St. Martin").assertExists()
        rule.onNodeWithText("Mittelschule St. Martin").assertExists()
        rule.onNodeWithText("private-pass").assertDoesNotExist()
    }
}
