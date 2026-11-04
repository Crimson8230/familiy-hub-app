package com.familyhub.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.core.view.WindowCompat
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.familyhub.app.ui.accounts.AccountListScreen
import com.familyhub.app.ui.accounts.AccountListViewModel
import com.familyhub.app.ui.accounts.CreateAccountScreen
import com.familyhub.app.ui.accounts.CreateAccountViewModel
import com.familyhub.app.ui.theme.FamilyHubTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.getInsetsController(window, window.decorView).isAppearanceLightStatusBars = true
        val accounts = (application as FamilyHubApplication).accounts
        val factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T = when (modelClass) {
                CreateAccountViewModel::class.java -> CreateAccountViewModel(accounts) as T
                AccountListViewModel::class.java -> AccountListViewModel(accounts) as T
                else -> error("Unknown ViewModel")
            }
        }
        val createModel = ViewModelProvider(this, factory)[CreateAccountViewModel::class.java]
        val listModel = ViewModelProvider(this, factory)[AccountListViewModel::class.java]
        setContent {
            val createState by createModel.state.collectAsState()
            val listState by listModel.state.collectAsState()
            var showCreate by rememberSaveable { mutableStateOf(false) }
            LaunchedEffect(createState.created) {
                if (createState.created) {
                    showCreate = false
                    createModel.clearCreated()
                    listModel.refresh()
                }
            }
            FamilyHubTheme {
                if (showCreate) {
                    CreateAccountScreen(
                        state = createState,
                        onChildNameChange = createModel::childNameChanged,
                        onSchoolChange = createModel::schoolChanged,
                        onUsernameChange = createModel::usernameChanged,
                        onPasswordChange = createModel::passwordChanged,
                        onSave = createModel::save,
                        onBack = { showCreate = false },
                    )
                } else {
                    AccountListScreen(
                        state = listState,
                        onAdd = { showCreate = true },
                        onDeleteRequest = listModel::requestDelete,
                        onCancelDelete = listModel::cancelDelete,
                        onConfirmDelete = listModel::confirmDelete,
                        onRetry = listModel::refresh,
                    )
                }
            }
        }
    }
}
