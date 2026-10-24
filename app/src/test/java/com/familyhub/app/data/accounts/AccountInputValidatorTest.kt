package com.familyhub.app.data.accounts

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AccountInputValidatorTest {
    @Test
    fun childKeyIgnoresOuterSpacesAndCase() {
        val first = AccountInputValidator.validate("Anna", "grundschule", "user", "secret")
        val second = AccountInputValidator.validate(" anna ", "grundschule", "user", "secret")
        val third = AccountInputValidator.validate("ANNA", "grundschule", "user", "secret")

        assertEquals("anna", first.value?.childKey)
        assertEquals(first.value?.childKey, second.value?.childKey)
        assertEquals(first.value?.childKey, third.value?.childKey)
        assertEquals("Anna", first.value?.childDisplayName)
    }

    @Test
    fun allBlankFieldsAndUnsupportedSchoolAreRejected() {
        val result = AccountInputValidator.validate("  ", "unknown", "\t", "  ")

        assertNull(result.value)
        assertEquals(
            setOf(AccountField.CHILD, AccountField.SCHOOL, AccountField.USERNAME, AccountField.PASSWORD),
            result.errors,
        )
    }

    @Test
    fun credentialsKeepTheirOriginalCharacters() {
        val result = AccountInputValidator.validate("  Lea  ", "mittelschule", " user ", " pass ")

        assertTrue(result.errors.isEmpty())
        assertEquals("Lea", result.value?.childDisplayName)
        assertEquals(" user ", result.value?.username)
        assertEquals(" pass ", result.value?.password)
    }
}
