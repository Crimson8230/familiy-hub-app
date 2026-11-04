package com.familyhub.app.data.accounts

import androidx.room.withTransaction
import com.familyhub.app.security.CredentialsCipher
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

sealed interface CreateAccountResult {
    data class Created(val id: Long) : CreateAccountResult
    data class ValidationFailed(val fields: Set<AccountField>) : CreateAccountResult
    data object Duplicate : CreateAccountResult
    data object Failed : CreateAccountResult
}

sealed interface AccountListResult {
    data class Items(val accounts: List<AccountSummary>) : AccountListResult
    data object Failed : AccountListResult
}

sealed interface DeleteAccountResult {
    data object Deleted : DeleteAccountResult
    data object Failed : DeleteAccountResult
}

class AccountRepository(
    private val database: FamilyHubDatabase,
    private val cipher: CredentialsCipher,
) {
    suspend fun create(
        childName: String,
        schoolCode: String,
        username: String,
        password: String,
    ): CreateAccountResult = withContext(Dispatchers.IO) {
        val validation = AccountInputValidator.validate(childName, schoolCode, username, password)
        val input = validation.value ?: return@withContext CreateAccountResult.ValidationFailed(validation.errors)

        try {
            val encrypted = cipher.encrypt(input.username, input.password)
            val id = database.withTransaction {
                database.accountDao().insert(
                    SchoolAccountEntity(
                        childDisplayName = input.childDisplayName,
                        childKey = input.childKey,
                        schoolCode = input.school.code,
                        credentialsCiphertext = encrypted.ciphertext,
                        credentialsIv = encrypted.iv,
                        credentialsFormatVersion = encrypted.formatVersion,
                    ),
                )
            }
            CreateAccountResult.Created(id)
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            val duplicate = try {
                database.accountDao().getByChildKey(input.childKey) != null
            } catch (_: Exception) {
                false
            }
            if (duplicate) CreateAccountResult.Duplicate else CreateAccountResult.Failed
        }
    }

    fun observeAccounts(): Flow<AccountListResult> = flow {
        emitAll(database.accountDao().observeSummaries())
    }
        .map<List<AccountSummary>, AccountListResult> { AccountListResult.Items(it) }
        .catch { cause ->
            if (cause is CancellationException) throw cause
            emit(AccountListResult.Failed)
        }

    suspend fun delete(id: Long): DeleteAccountResult = withContext(Dispatchers.IO) {
        try {
            val deleted = database.withTransaction { database.accountDao().deleteById(id) }
            if (deleted == 1) DeleteAccountResult.Deleted else DeleteAccountResult.Failed
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (_: Exception) {
            DeleteAccountResult.Failed
        }
    }
}
