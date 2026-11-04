package com.familyhub.app.data.accounts

import java.text.Normalizer
import java.util.Locale

enum class AccountField { CHILD, SCHOOL, USERNAME, PASSWORD }

data class ValidatedAccountInput(
    val childDisplayName: String,
    val childKey: String,
    val school: School,
    val username: String,
    val password: String,
) {
    override fun toString(): String = "ValidatedAccountInput([REDACTED])"
}

data class AccountValidation(
    val value: ValidatedAccountInput?,
    val errors: Set<AccountField>,
)

object AccountInputValidator {
    fun validate(
        childName: String,
        schoolCode: String,
        username: String,
        password: String,
    ): AccountValidation {
        val errors = mutableSetOf<AccountField>()
        val displayName = childName.trim()
        if (displayName.isBlank()) errors += AccountField.CHILD
        val school = School.fromCode(schoolCode)
        if (school == null) errors += AccountField.SCHOOL
        if (username.isBlank()) errors += AccountField.USERNAME
        if (password.isBlank()) errors += AccountField.PASSWORD
        if (errors.isNotEmpty()) return AccountValidation(null, errors)

        return AccountValidation(
            ValidatedAccountInput(
                childDisplayName = displayName,
                childKey = childKey(displayName),
                school = requireNotNull(school),
                username = username,
                password = password,
            ),
            emptySet(),
        )
    }

    fun childKey(displayName: String): String = Normalizer.normalize(
        Normalizer.normalize(displayName.trim(), Normalizer.Form.NFC).lowercase(Locale.ROOT),
        Normalizer.Form.NFC,
    )
}
