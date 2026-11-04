package com.familyhub.legacy
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertFalse
import org.junit.Test
class LegacyInfrastructureProbe {
    @Test fun runnerReportsIntentionalFailure() {
        assertFalse("Intentional infrastructure failure probe", InstrumentationRegistry.getArguments().getString("familyhubIntentionalFailure") == "true")
    }
}
