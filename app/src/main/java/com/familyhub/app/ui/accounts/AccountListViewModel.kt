package com.familyhub.app.ui.accounts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.familyhub.app.data.accounts.AccountListResult
import com.familyhub.app.data.accounts.AccountRepository
import com.familyhub.app.data.accounts.AccountSummary
import com.familyhub.app.data.accounts.DeleteAccountResult
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AccountListUiState(
    val loading: Boolean = true,
    val accounts: List<AccountSummary> = emptyList(),
    val readError: Boolean = false,
    val deleteTarget: AccountSummary? = null,
    val deleting: Boolean = false,
    val deleteError: Boolean = false,
)

class AccountListViewModel(private val repository: AccountRepository) : ViewModel() {
    private val mutableState = MutableStateFlow(AccountListUiState())
    val state = mutableState.asStateFlow()
    private var observation: Job? = null

    init { refresh() }

    fun refresh() {
        observation?.cancel()
        mutableState.update { it.copy(loading = true, readError = false) }
        observation = viewModelScope.launch {
            repository.observeAccounts().collect { result ->
                when (result) {
                    is AccountListResult.Items -> mutableState.update {
                        it.copy(loading = false, readError = false, accounts = result.accounts)
                    }
                    AccountListResult.Failed -> mutableState.update {
                        it.copy(loading = false, readError = true)
                    }
                }
            }
        }
    }

    fun requestDelete(account: AccountSummary) = mutableState.update {
        it.copy(deleteTarget = account, deleteError = false)
    }

    fun cancelDelete() {
        if (!mutableState.value.deleting) {
            mutableState.update { it.copy(deleteTarget = null, deleteError = false) }
        }
    }

    fun confirmDelete() {
        val target = mutableState.value.deleteTarget ?: return
        if (mutableState.value.deleting) return
        mutableState.update { it.copy(deleting = true, deleteError = false) }
        viewModelScope.launch {
            when (repository.delete(target.id)) {
                DeleteAccountResult.Deleted -> mutableState.update {
                    it.copy(deleteTarget = null, deleting = false, deleteError = false)
                }
                DeleteAccountResult.Failed -> mutableState.update {
                    it.copy(deleting = false, deleteError = true)
                }
            }
        }
    }
}
