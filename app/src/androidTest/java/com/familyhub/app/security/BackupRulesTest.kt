package com.familyhub.app.security

import android.content.pm.ApplicationInfo
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.familyhub.app.R
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.xmlpull.v1.XmlPullParser

@RunWith(AndroidJUnit4::class)
class BackupRulesTest {
    private val context get() = InstrumentationRegistry.getInstrumentation().targetContext

    @Test
    fun cloudAndDeviceTransferExcludeDatabase() {
        val xml = context.resources.getXml(R.xml.data_extraction_rules)
        val sections = mutableMapOf<String, Boolean>()
        var section = ""
        xml.use {
            while (it.eventType != XmlPullParser.END_DOCUMENT) {
                if (it.eventType == XmlPullParser.START_TAG) {
                    when (it.name) {
                        "cloud-backup", "device-transfer" -> section = it.name
                        "exclude" -> if (it.getAttributeValue(null, "domain") == "database" &&
                            it.getAttributeValue(null, "path") == ".") {
                            sections[section] = true
                        }
                    }
                }
                it.next()
            }
        }
        assertTrue(sections["cloud-backup"] == true)
        assertTrue(sections["device-transfer"] == true)
    }

    @Test
    fun legacyBackupExcludesDatabaseAndManifestDisablesBackup() {
        val xml = context.resources.getXml(R.xml.backup_rules)
        var excluded = false
        xml.use {
            while (it.eventType != XmlPullParser.END_DOCUMENT) {
                if (it.eventType == XmlPullParser.START_TAG && it.name == "exclude") {
                    excluded = it.getAttributeValue(null, "domain") == "database" &&
                        it.getAttributeValue(null, "path") == "."
                }
                it.next()
            }
        }
        assertTrue(excluded)
        val application = context.applicationInfo
        assertEquals(0, application.flags and ApplicationInfo.FLAG_ALLOW_BACKUP)
    }
}
