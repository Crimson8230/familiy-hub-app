package com.familyhub.app.ui.accounts

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import com.familyhub.app.R
import com.familyhub.app.data.accounts.AccountField
import com.familyhub.app.data.accounts.School

@Composable
fun CreateAccountScreen(
    state: CreateAccountUiState,
    onChildNameChange: (String) -> Unit,
    onSchoolChange: (String) -> Unit,
    onUsernameChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onSave: () -> Unit,
    onBack: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        TextButton(onClick = onBack) { Text(stringResource(R.string.back)) }
        Text(stringResource(R.string.add_account))
        OutlinedTextField(
            value = state.childName,
            onValueChange = onChildNameChange,
            label = { Text(stringResource(R.string.child_name)) },
            isError = AccountField.CHILD in state.errors,
            supportingText = if (AccountField.CHILD in state.errors) {
                { Text(stringResource(R.string.required_field)) }
            } else null,
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Text(stringResource(R.string.school))
        Column(modifier = Modifier.selectableGroup()) {
            School.entries.forEach { school ->
                Row(
                    modifier = Modifier.fillMaxWidth().selectable(
                        selected = state.schoolCode == school.code,
                        onClick = { onSchoolChange(school.code) },
                        role = Role.RadioButton,
                    ).padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    RadioButton(selected = state.schoolCode == school.code, onClick = null)
                    Text(stringResource(school.labelRes))
                }
            }
        }
        OutlinedTextField(
            value = state.username,
            onValueChange = onUsernameChange,
            label = { Text(stringResource(R.string.username)) },
            isError = AccountField.USERNAME in state.errors,
            supportingText = if (AccountField.USERNAME in state.errors) {
                { Text(stringResource(R.string.required_field)) }
            } else null,
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = state.password,
            onValueChange = onPasswordChange,
            label = { Text(stringResource(R.string.password)) },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            isError = AccountField.PASSWORD in state.errors,
            supportingText = if (AccountField.PASSWORD in state.errors) {
                { Text(stringResource(R.string.required_field)) }
            } else null,
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        if (state.duplicate) Text(stringResource(R.string.duplicate_account))
        if (state.saveError) Text(stringResource(R.string.save_failed))
        Button(onClick = onSave, enabled = !state.saving, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.save))
        }
    }
}
