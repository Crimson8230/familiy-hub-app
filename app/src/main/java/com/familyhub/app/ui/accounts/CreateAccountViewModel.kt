package com.familyhub.app.ui.accounts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.familyhub.app.data.accounts.AccountField
import com.familyhub.app.data.accounts.AccountRepository
import com.familyhub.app.data.accounts.CreateAccountResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CreateAccountUiState(
    val childName: String = "",
    val schoolCode: String = "grundschule",
    val username: String = "",
    val password: String = "",
    val errors: Set<AccountField> = emptySet(),
    val saving: Boolean = false,
    val saveError: Boolean = false,
    val duplicate: Boolean = false,
    val created: Boolean = false,
) {
    override fun toString(): String = "CreateAccountUiState([REDACTED])"
}

class CreateAccountViewModel(private val repository: AccountRepository) : ViewModel() {
    private val mutableState = MutableStateFlow(CreateAccountUiState())
    val state = mutableState.asStateFlow()

    fun childNameChanged(value: String) = mutableState.update { it.copy(childName = value, errors = it.errors - AccountField.CHILD) }
    fun schoolChanged(value: String) = mutableState.update { it.copy(schoolCode = value, errors = it.errors - AccountField.SCHOOL) }
    fun usernameChanged(value: String) = mutableState.update { it.copy(username = value, errors = it.errors - AccountField.USERNAME) }
    fun passwordChanged(value: String) = mutableState.update { it.copy(password = value, errors = it.errors - AccountField.PASSWORD) }

    fun save() {
        val current = mutableState.value
        if (current.saving) return
        mutableState.update { it.copy(saving = true, saveError = false, duplicate = false) }
        viewModelScope.launch {
            when (val result = repository.create(current.childName, current.schoolCode, current.username, current.password)) {
                is CreateAccountResult.Created -> mutableState.value = CreateAccountUiState(created = true)
                is CreateAccountResult.ValidationFailed -> mutableState.update { it.copy(saving = false, errors = result.fields) }
                CreateAccountResult.Duplicate -> mutableState.update { it.copy(saving = false, duplicate = true) }
                CreateAccountResult.Failed -> mutableState.update { it.copy(saving = false, saveError = true) }
            }
        }
    }

    fun clearCreated() = mutableState.update { it.copy(created = false) }
}
