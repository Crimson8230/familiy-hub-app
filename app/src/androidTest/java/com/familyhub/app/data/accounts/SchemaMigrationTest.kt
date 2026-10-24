package com.familyhub.app.data.accounts

import androidx.room.testing.MigrationTestHelper
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

@RunWith(AndroidJUnit4::class)
class SchemaMigrationTest {
    @get:Rule
    val helper = MigrationTestHelper(
        InstrumentationRegistry.getInstrumentation(),
        FamilyHubDatabase::class.java,
    )

    @Test
    fun exportedInitialSchemaHasSchoolAccountsTableAndUniqueChildKey() {
        val name = "schema-${UUID.randomUUID()}.db"
        helper.createDatabase(name, 1).use { database ->
            val table = database.query("PRAGMA table_info(school_accounts)")
            table.use {
                val names = mutableSetOf<String>()
                while (it.moveToNext()) names += it.getString(it.getColumnIndexOrThrow("name"))
                assertEquals(
                    setOf("id", "child_display_name", "child_key", "school_code", "credentials_ciphertext", "credentials_iv", "credentials_format_version"),
                    names,
                )
            }
        }
        helper.runMigrationsAndValidate(name, 1, true).close()
    }
}
