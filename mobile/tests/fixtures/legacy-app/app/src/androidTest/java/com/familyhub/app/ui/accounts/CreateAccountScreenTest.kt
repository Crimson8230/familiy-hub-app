package com.familyhub.app.ui.accounts

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.familyhub.app.FamilyHubApplication
import com.familyhub.app.MainActivity
import kotlinx.coroutines.runBlocking
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class CreateAccountScreenTest {
    @get:Rule val composeRule = createAndroidComposeRule<MainActivity>()

    @Before
    fun clearAccounts() {
        val app = composeRule.activity.application as FamilyHubApplication
        runBlocking { app.database.clearAllTables() }
    }

    @Test
    fun accountCanBeCreatedAndSeenAfterActivityRecreation() {
        composeRule.onNodeWithText("Schulkonto hinzufügen").performClick()
        composeRule.onNodeWithText("Kind").performTextInput("Tina")
        composeRule.onNodeWithText("Benutzername").performTextInput("test-user")
        composeRule.onNodeWithText("Passwort").performTextInput("test-pass")
        composeRule.onNodeWithText("Speichern").performClick()

        composeRule.onNodeWithText("Tina").assertExists()
        composeRule.activityRule.scenario.recreate()
        composeRule.onNodeWithText("Tina").assertExists()
    }

    @Test
    fun missingFieldsAreNamedAndDoNotCreateAccount() {
        composeRule.onNodeWithText("Schulkonto hinzufügen").performClick()
        composeRule.onNodeWithText("Speichern").performClick()
        composeRule.onAllNodesWithText("Bitte ausfüllen.").onFirst().assertExists()
    }
}
