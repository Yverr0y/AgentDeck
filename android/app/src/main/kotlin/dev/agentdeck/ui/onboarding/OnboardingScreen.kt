package dev.agentdeck.ui.onboarding

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.agentdeck.AquariumBackground
import dev.agentdeck.data.DashboardType
import dev.agentdeck.data.DisplayPreferences
import dev.agentdeck.net.*
import dev.agentdeck.state.AgentStateHolder
import dev.agentdeck.state.DashboardState
import dev.agentdeck.terrarium.*
import dev.agentdeck.terrarium.creature.CrayfishCreature
import dev.agentdeck.terrarium.renderer.EinkTerrariumView
import dev.agentdeck.ui.common.ConnectionPanel
import dev.agentdeck.ui.monitor.ColorTerrariumBackground
import dev.agentdeck.ui.theme.LocalIsEink
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** Uses real empty renderers; preview data never enters the live session store. */
@Composable
fun OnboardingScreen(displayPrefs: DisplayPreferences, connection: BridgeConnection) {
    val scope = rememberCoroutineScope()
    val isEink = LocalIsEink.current
    var step by rememberSaveable { mutableIntStateOf(0) }
    var startedConnection by rememberSaveable { mutableStateOf(false) }
    var saving by remember { mutableStateOf(false) }
    var saveError by remember { mutableStateOf<String?>(null) }
    val appearance by displayPrefs.dashboardTypeFlow.collectAsState(initial = DashboardType.Default)
    val status by connection.status.collectAsState()
    val url by connection.url.collectAsState()
    val error by connection.lastError.collectAsState()
    val state by AgentStateHolder.instance.state.collectAsState()
    var bridges by remember { mutableStateOf(emptyList<DiscoveredBridge>()) }
    var searchElapsed by remember { mutableStateOf(false) }
    if (startedConnection) {
        // The same connection ladder used by the normal LCD and e-ink dashboards.
        BridgeAutoConnect(connection, displayPrefs) { bridges = it }
        LaunchedEffect(Unit) { delay(12_000); searchElapsed = true }
    }
    fun finish() {
        if (saving) return
        saving = true
        scope.launch {
            try { displayPrefs.setOnboardingCompleted(true) }
            catch (_: Exception) { saveError = "Could not save setup. Please try again." }
            finally { saving = false }
        }
    }
    BackHandler { if (step > 0) step-- else finish() }
    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Box(Modifier.fillMaxSize().safeDrawingPadding().imePadding(), contentAlignment = Alignment.TopCenter) {
            Column(
                Modifier.widthIn(max = 720.dp).fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text("Welcome to AgentDeck", style = MaterialTheme.typography.headlineSmall)
                Text("${step + 1} of 3 · ${listOf("Appearance", "Connect", "Ready")[step]}",
                    style = MaterialTheme.typography.labelLarge)
                Column(Modifier.weight(1f).verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    when (step) {
                        0 -> {
                            Text("Your AI work, at a glance", style = MaterialTheme.typography.titleLarge)
                            Text("See your computer’s agent sessions, recent activity and usage on this screen. Choose a view; you can change it later in Settings.")
                            if (isEink) {
                                Text("Made for your e-ink screen", style = MaterialTheme.typography.titleMedium)
                                Text("A clear, high-contrast view with restrained motion. Rotate the dashboard and adjust sleep settings whenever you need.")
                            } else {
                                DashboardType.available(false).forEach { type ->
                                    OutlinedButton(
                                        onClick = { scope.launch { displayPrefs.setDashboardType(type) } },
                                        modifier = Modifier.fillMaxWidth(),
                                        border = BorderStroke(if (appearance == type) 2.dp else 1.dp,
                                            MaterialTheme.colorScheme.outline),
                                    ) {
                                        Column(Modifier.fillMaxWidth()) {
                                            Text((if (appearance == type) "✓ " else "") + if (type == DashboardType.Default) "2D aquarium" else type.title)
                                            Text(type.description, style = MaterialTheme.typography.bodySmall)
                                        }
                                    }
                                }
                            }
                            AppearancePreview(appearance, isEink)
                        }
                        1 -> {
                            Text("Connect your computer", style = MaterialTheme.typography.titleLarge)
                            Text("Open AgentDeck on your computer and use the same Wi-Fi or local network. Choose that computer below.")
                            Text("If approval is needed, open Devices → Pair Device on your Mac and approve this screen, then retry here. You can also enter its six-digit pairing code; no camera is required.")
                            if (searchElapsed && bridges.isEmpty() && status != ConnectionStatus.CONNECTED) {
                                Text("No computer found yet. Check that AgentDeck is open and both devices are on the same network. You can enter its address below, or look around and connect later.")
                            }
                            ConnectionPanel(
                                connectionStatus = status, currentUrl = url, lastError = error,
                                discoveredBridges = bridges, retryUrl = url ?: connection.selectedUrl,
                                onConnectToBridge = { connection.connect(it.wsUrl(), it.fallbackWsUrl()) },
                                onConnectLocalhost = { connection.connect(BridgeConstants.LOCALHOST_WS_URL) },
                                onConnectManualUrl = { connection.connect(it) },
                                onDisconnect = { connection.disconnect() },
                                onPaired = { scope.launch { adoptPairedUrl(connection, displayPrefs, it) } },
                            )
                        }
                        else -> {
                            Text(when {
                                status != ConnectionStatus.CONNECTED -> "Connect whenever you’re ready"
                                state.siblingSessions.isNotEmpty() -> "Your sessions are arriving"
                                else -> "Connected · waiting for your first session"
                            }, style = MaterialTheme.typography.titleLarge)
                            Text(if (status == ConnectionStatus.CONNECTED)
                                "Start an enabled agent on your computer. Its activity appears here automatically. Configure agent integrations on the computer running them."
                            else "The preview below is available offline. Live sessions appear after you connect your computer from Settings.")
                            if (status == ConnectionStatus.CONNECTED && PairingCredential.isLoopback(url)) {
                                Text("This connection uses your computer’s USB bridge. Pair over Wi-Fi in Settings to keep connecting without that bridge.")
                            }
                            Text("Tap a session to focus it. Requests that need your attention stay visible. Settings contains connection, appearance, orientation and sleep controls.")
                            AppearancePreview(appearance, isEink)
                            Text("You can reopen this guide from Settings → Guided setup.")
                        }
                    }
                    saveError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                }
                // Pinned controls remain reachable on small readers and with a keyboard open.
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    if (step > 0) OutlinedButton(onClick = { step-- }, enabled = !saving) { Text("Back") }
                    if (step < 2) TextButton(onClick = { finish() }, enabled = !saving) { Text("Skip") }
                    Spacer(Modifier.weight(1f))
                    Button(onClick = {
                        if (step == 2) finish() else { step++; startedConnection = true }
                    }, enabled = !saving) {
                        Text(when (step) { 0 -> "Continue"; 1 -> if (status == ConnectionStatus.CONNECTED) "Continue" else "Look around"; else -> "Open dashboard" })
                    }
                }
            }
        }
    }
}

@Composable
private fun AppearancePreview(appearance: DashboardType, isEink: Boolean) {
    val emptyHabitat = remember { DashboardState().toTerrariumState().copy(
        environment = EnvironmentVisualState.CALM, tetra = TetraVisualState.CIRCLING) }
    var unavailable by remember { mutableStateOf(false) }
    Box(Modifier.fillMaxWidth().height(210.dp).clip(RoundedCornerShape(12.dp))
        .semantics { contentDescription = "Appearance preview, no live sessions" }) {
        when {
            isEink || appearance == DashboardType.Paper -> EinkTerrariumView(emptyHabitat, Modifier.fillMaxSize(), snapshotMode = isEink)
            appearance == DashboardType.Aquarium3D && !unavailable -> AquariumBackground(
                Modifier.fillMaxSize(), state = emptyHabitat, onUnavailable = { unavailable = true })
            else -> ColorTerrariumBackground(emptyHabitat,
                remember { CrayfishCreature(TerrariumLayout.CRAYFISH_CENTER_X_FRACTION, TerrariumLayout.CRAYFISH_CENTER_Y_FRACTION) },
                TerrariumLayout.CRAYFISH_CENTER_X_FRACTION, TerrariumLayout.CRAYFISH_CENTER_Y_FRACTION,
                drawMainCrayfishInBackground = false)
        }
    }
    Text(if (unavailable && appearance == DashboardType.Aquarium3D)
        "3D is unavailable on this device. Showing the 2D preview."
    else "Appearance preview · No live sessions", style = MaterialTheme.typography.bodySmall)
}

@Composable
fun GuidedSetupButton(displayPrefs: DisplayPreferences) {
    val scope = rememberCoroutineScope()
    OutlinedButton(onClick = { scope.launch { displayPrefs.setOnboardingCompleted(false) } }) { Text("Guided setup") }
}
