package com.familyhub.app.ui.accounts

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Density
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.familyhub.app.data.accounts.AccountSummary
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AccountAccessibilityTest {
    @get:Rule val rule = createComposeRule()

    @Test
    fun overviewActionsRemainNamedAtDoubleFontScale() {
        var deleteRequested = false
        rule.setContent {
            CompositionLocalProvider(LocalDensity provides Density(1f, 2f)) {
                AccountListScreen(
                    AccountListUiState(loading = false, accounts = listOf(AccountSummary(1, "Mia", "grundschule"))),
                    {}, { deleteRequested = true }, {}, {}, {},
                )
            }
        }
        rule.onNodeWithText("Mia").performScrollTo().assertIsDisplayed()
        rule.onNodeWithText("Grundschule St. Martin").performScrollTo().assertIsDisplayed()
        rule.onNodeWithText("Schulkonto hinzufügen").performScrollTo().assertIsDisplayed()
        rule.onNodeWithText("Schulkonto löschen").performScrollTo().assertIsDisplayed().performClick()
        rule.runOnIdle { assertTrue(deleteRequested) }
    }

    @Test
    fun createFieldsRemainNamedAtDoubleFontScale() {
        var selectedSchool = ""
        var saved = false
        rule.setContent {
            CompositionLocalProvider(LocalDensity provides Density(1f, 2f)) {
                CreateAccountScreen(CreateAccountUiState(), {}, { selectedSchool = it }, {}, {}, { saved = true }, {})
            }
        }
        rule.onNodeWithText("Kind").performScrollTo().assertIsDisplayed()
        rule.onNodeWithText("Schule").performScrollTo().assertIsDisplayed()
        rule.onNodeWithText("Grundschule St. Martin").performScrollTo().assertIsDisplayed().performClick()
        rule.onNodeWithText("Benutzername").performScrollTo().assertIsDisplayed()
        rule.onNodeWithText("Passwort").performScrollTo().assertIsDisplayed()
        rule.onNodeWithText("Speichern").performScrollTo().assertIsDisplayed().performClick()
        rule.runOnIdle {
            assertEquals("grundschule", selectedSchool)
            assertTrue(saved)
        }
    }
}
