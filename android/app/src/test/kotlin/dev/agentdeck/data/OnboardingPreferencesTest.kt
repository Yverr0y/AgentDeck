package dev.agentdeck.data

import dev.agentdeck.net.AutoConnectRules
import dev.agentdeck.net.ConnectionStatus
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class OnboardingPreferencesTest {
    @Test fun `fresh install keeps setup open while appearance changes and remembers dismissal`() = runBlocking {
        val prefs = DisplayPreferences(RuntimeEnvironment.getApplication())
        prefs.initializeOnboarding(isUpgrade = false)
        assertEquals(false, prefs.onboardingCompletedFlow.first())
        prefs.setDashboardType(DashboardType.Paper)
        prefs.initializeOnboarding(isUpgrade = false)
        assertEquals(false, prefs.onboardingCompletedFlow.first())
        prefs.setOnboardingCompleted(true)
        assertEquals(true, DisplayPreferences(RuntimeEnvironment.getApplication()).onboardingCompletedFlow.first())
        assertEquals(DashboardType.Paper, prefs.dashboardTypeFlow.first())
    }

    @Test fun `upgrade preserves credentials and can explicitly reopen setup`() = runBlocking {
        val prefs = DisplayPreferences(RuntimeEnvironment.getApplication())
        val paired = "ws://computer.local:9120?token=kept"
        prefs.setLastBridgeUrl(paired)
        prefs.initializeOnboarding(isUpgrade = true)
        assertEquals(true, prefs.onboardingCompletedFlow.first())
        prefs.setOnboardingCompleted(false)
        prefs.initializeOnboarding(isUpgrade = true)
        assertEquals(false, prefs.onboardingCompletedFlow.first())
        assertEquals(paired, prefs.lastBridgeUrlFlow.first())
        prefs.setOnboardingCompleted(true)
        assertEquals(paired, prefs.lastBridgeUrlFlow.first())
    }

    @Test fun `legacy settings migrate even when install timestamp is unavailable`() = runBlocking {
        val prefs = DisplayPreferences(RuntimeEnvironment.getApplication())
        prefs.setDashboardType(DashboardType.Aquarium3D)
        prefs.initializeOnboarding(isUpgrade = false)
        assertEquals(true, prefs.onboardingCompletedFlow.first())
        assertEquals(DashboardType.Aquarium3D, prefs.dashboardTypeFlow.first())
    }

    @Test fun `leaving setup never replaces a connecting or chosen host with loopback`() {
        assertFalse(AutoConnectRules.shouldProbeOnEntry(ConnectionStatus.CONNECTING, null))
        assertFalse(AutoConnectRules.shouldProbeOnEntry(ConnectionStatus.CONNECTED, null))
        assertFalse(AutoConnectRules.shouldProbeOnEntry(ConnectionStatus.DISCONNECTED, "ws://chosen:9120"))
        assertTrue(AutoConnectRules.shouldProbeOnEntry(ConnectionStatus.DISCONNECTED, null))
    }
}
