package com.familyhub.app.ui.accounts

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.familyhub.app.R
import com.familyhub.app.data.accounts.AccountSummary
import com.familyhub.app.data.accounts.School

@Composable
fun AccountListScreen(
    state: AccountListUiState,
    onAdd: () -> Unit,
    onDeleteRequest: (AccountSummary) -> Unit,
    onCancelDelete: () -> Unit,
    onConfirmDelete: () -> Unit,
    onRetry: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(stringResource(R.string.accounts_title))
        Button(onClick = onAdd) { Text(stringResource(R.string.add_account)) }
        when {
            state.loading -> CircularProgressIndicator()
            state.readError -> {
                Text(stringResource(R.string.read_failed))
                TextButton(onClick = onRetry) { Text(stringResource(R.string.retry)) }
            }
            state.accounts.isEmpty() -> {
                Text(stringResource(R.string.empty_accounts))
                Text(stringResource(R.string.empty_accounts_hint))
            }
            else -> state.accounts.forEach { account ->
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(account.childDisplayName)
                    Text(schoolLabel(account.schoolCode))
                    val deleteDescription = stringResource(R.string.delete_account_for, account.childDisplayName)
                    TextButton(
                        onClick = { onDeleteRequest(account) },
                        modifier = Modifier.semantics { contentDescription = deleteDescription },
                    ) {
                        Text(stringResource(R.string.delete_account))
                    }
                    HorizontalDivider()
                }
            }
        }
    }

    state.deleteTarget?.let { target ->
        AlertDialog(
            onDismissRequest = onCancelDelete,
            title = { Text(stringResource(R.string.delete_account)) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(stringResource(R.string.delete_confirmation, target.childDisplayName, schoolLabel(target.schoolCode)))
                    if (state.deleteError) Text(stringResource(R.string.delete_failed))
                }
            },
            confirmButton = {
                Button(onClick = onConfirmDelete, enabled = !state.deleting) {
                    Text(stringResource(R.string.delete))
                }
            },
            dismissButton = {
                TextButton(onClick = onCancelDelete, enabled = !state.deleting) {
                    Text(stringResource(R.string.cancel))
                }
            },
        )
    }
}

@Composable
private fun schoolLabel(code: String): String =
    stringResource(School.fromCode(code)?.labelRes ?: R.string.school)
