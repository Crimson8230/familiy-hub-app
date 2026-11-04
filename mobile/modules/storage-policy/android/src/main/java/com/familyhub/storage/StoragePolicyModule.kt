package com.familyhub.storage

import android.util.AtomicFile
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class StoragePolicyModule : Module() {
    private fun directory(): File {
        val context = appContext.reactContext ?: error("Storage unavailable")
        val folder = File(context.filesDir, "familyhub")
        check(folder.isDirectory || folder.mkdirs()) { "Storage unavailable" }
        return folder
    }
    override fun definition() = ModuleDefinition {
        Name("StoragePolicy")
        AsyncFunction("inspect") {
            val folder = directory()
            val target = File(folder, "family_hub_v2.db")
            val marker = File(folder, "installation.json")
            val hasMarker = marker.exists() || File(folder, "installation.json.bak").exists()
            mapOf(
                "directory" to folder.absolutePath,
                "database" to target.exists(),
                "orphanedFiles" to (!target.exists() && listOf("-wal", "-shm", "-journal").any { File(folder, "family_hub_v2.db$it").exists() }),
                "marker" to if (hasMarker) AtomicFile(marker).readFully().toString(Charsets.UTF_8) else null,
            )
        }
        AsyncFunction("writeMarker") { value: String ->
            check(value.length < 2048) { "Invalid storage marker" }
            val file = AtomicFile(File(directory(), "installation.json"))
            val output = file.startWrite()
            try { output.write(value.toByteArray(Charsets.UTF_8)); file.finishWrite(output) }
            catch (_: Exception) { file.failWrite(output); error("Storage marker write failed") }
        }
        AsyncFunction("protect") { directory(); Unit }
    }
}
