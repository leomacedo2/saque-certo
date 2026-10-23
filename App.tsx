import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PlayerId, nextServer, playerName } from './src/domain/match';
import { changePlayerColor, playerHexColors, PLAYER_PALETTE } from './src/domain/colors';
import { timeoutBlocksPlay } from './src/domain/timeouts';
import { useGame } from './src/hooks/useGame';
import { Button, Dialog, shared } from './src/ui/Controls';
import { Scoreboard } from './src/ui/Scoreboard';
import { SettingsPanel } from './src/ui/SettingsPanel';
import { Warmup } from './src/ui/Warmup';
import { CountdownScreen } from './src/ui/CountdownScreen';
import { TimeoutDialogs } from './src/ui/TimeoutControls';
import { MatchHeader } from './src/ui/MatchHeader';
import { ColorPicker } from './src/ui/ColorPicker';
import { promoteTimeoutRestore } from './src/ui/matchPresentation';
import { palette } from './src/ui/theme';

function Game() {
  useKeepAwake();
  const game = useGame();
  const match = game.session.current;
  const [menu, setMenu] = useState(false);
  const [warmup, setWarmup] = useState(false);
  const [newMatchPrompt, setNewMatchPrompt] = useState(false);
  const [colorPlayer, setColorPlayer] = useState<PlayerId | null>(null);
  const playerColors = playerHexColors(game.settings.colors);
  const lastTap = useRef(-Infinity);
  const server = nextServer(match);
  const ready = game.status === 'ready';
  const timeoutBusy = timeoutBlocksPlay(game.timeouts);
  const activeTimeout = game.timeouts.active;
  const blocked = !ready || menu || warmup || newMatchPrompt || timeoutBusy || !!colorPlayer;
  useEffect(() => {
    // The full-screen timer owns Back, including its alarm exit confirmation.
    if (warmup || (ready && activeTimeout)) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (colorPlayer) { setColorPlayer(null); return true; }
      if (menu) { setMenu(false); return true; }
      if (newMatchPrompt) { setNewMatchPrompt(false); return true; }
      if (game.timeouts.request) { game.dispatchTimeout({ type: 'cancelRequest' }); return true; }
      if (game.timeouts.correction) { game.dispatchTimeout({ type: 'cancelRestore' }); return true; }
      if (match.pending === 'manual') { game.dispatch({ type: 'cancelManual' }); return true; }
      // Official confirmations must never be dismissed using Android Back.
      if (match.pending || !ready) return true;
      return false;
    });
    return () => subscription.remove();
  }, [menu, warmup, newMatchPrompt, match.pending, ready, game, activeTimeout, colorPlayer]);
  const touchPlayer = (player: PlayerId) => {
    if (blocked || match.pending || match.winner) return;
    const now = Date.now();
    if (game.settings.doubleTapGuard && now - lastTap.current < 250) return;
    lastTap.current = now;
    game.dispatch({ type: match.firstServer ? 'point' : 'selectServer', player });
    if (game.settings.haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };
  const confirmNew = () => { setMenu(false); setNewMatchPrompt(true); };
  const lastSet = match.completed.at(-1);
  if (activeTimeout && ready) return <SafeAreaView style={styles.warmupSafe}>
    <StatusBar hidden />
    {game.error && <Pressable accessibilityRole="button" onPress={game.retrySave} style={styles.saveError}><Text style={styles.saveErrorText}>{game.error} · Tentar salvar</Text></Pressable>}
    <CountdownScreen timer={activeTimeout.timer} initialSeconds={game.timeouts.config.timeoutSeconds}
      onToggle={now => game.dispatchTimeout({ type: 'toggleTimer', now })}
      onClose={() => game.dispatchTimeout({ type: 'end' })}
      technical={{
        label: activeTimeout.who === 'both' ? 'Tempo técnico · Jogador A' : `Tempo técnico · ${playerName(activeTimeout.who)}`,
        color: activeTimeout.who === 'both' ? playerColors.A : playerColors[activeTimeout.who],
        secondLabel: activeTimeout.who === 'both' ? { label: ' e Jogador B', color: playerColors.B } : undefined,
        started: activeTimeout.started,
        onCancel: () => game.dispatchTimeout({ type: 'cancelBeforeStart' }),
      }} />
  </SafeAreaView>;
  if (warmup && ready) return <SafeAreaView style={styles.warmupSafe}>
    <StatusBar hidden />
    <Warmup seconds={game.settings.warmupSeconds} onClose={() => setWarmup(false)} />
  </SafeAreaView>;
  return <SafeAreaView style={styles.safe}>
    <StatusBar hidden />
    <MatchHeader match={match} timeouts={game.timeouts} colors={playerColors} disabled={blocked} onColor={setColorPlayer} dispatch={game.dispatchTimeout}
      leading={<Button label={menu ? '☰ Fechar' : '☰ Menu'} secondary disabled={!ready || newMatchPrompt || timeoutBusy || !!colorPlayer} onPress={() => setMenu(value => !value)} />}
      trailing={<Button label="↶ Desfazer" secondary disabled={!ready || !game.session.history.length || menu || newMatchPrompt || warmup || timeoutBusy || !!colorPlayer} onPress={() => { game.dispatch({ type: 'undo' }); lastTap.current = -Infinity; }} />} />
    {game.error && ready && <Pressable accessibilityRole="button" onPress={game.retrySave} style={styles.saveError}><Text style={styles.saveErrorText}>{game.error} · Tentar salvar</Text></Pressable>}
    <View style={styles.body}>
      <Scoreboard match={match} colors={playerColors} highContrast={game.settings.highContrast} blocked={blocked} onPlayer={touchPlayer} />
      {game.status === 'loading' && <Dialog title="Abrindo o Saque Certo"><ActivityIndicator color={palette.green} /><Text style={shared.body}>Conferindo a partida salva…</Text></Dialog>}
      {(game.status === 'recover' || game.status === 'error') && <Dialog eyebrow="RECUPERAÇÃO" title={game.status === 'recover' ? 'Retomar a partida?' : 'Falha ao abrir a partida'}>
        <Text style={shared.body}>{game.status === 'recover' ? 'Pontos, sets, posições, saques, tempos técnicos e histórico de desfazer foram preservados.' : game.error}</Text>
        {game.saved && <Text style={shared.strong}>A {game.saved.session.current.points.A} × {game.saved.session.current.points.B} B · Sets {game.saved.session.current.sets.A} × {game.saved.session.current.sets.B}</Text>}
        <View style={shared.actions}><Button label={game.status === 'recover' ? 'Retomar partida' : 'Tentar novamente'} onPress={game.status === 'recover' ? game.resume : () => { void game.retryLoad(); }} /><Button label="Iniciar nova partida" secondary onPress={() => setNewMatchPrompt(true)} /></View>
      </Dialog>}
      {ready && !warmup && match.pending && !newMatchPrompt && <Dialog eyebrow={match.pending === 'deciding' ? 'SET DECISIVO · 5 PONTOS' : match.pending === 'manual' ? 'CORREÇÃO MANUAL' : 'SET ENCERRADO'} title="TROCA DE LADOS">
        {match.pending === 'betweenSets' && lastSet && <Text style={shared.strong}>{playerName(lastSet.winner)} venceu o set · A {lastSet.points.A} × {lastSet.points.B} B</Text>}
        <Text style={shared.body}>Oriente os jogadores a trocar de lado.</Text>
        <Text style={shared.strong}>Não esqueça de inverter os pontos e sets no placar físico.</Text>
        {server && <Text style={[shared.strong, { color: playerColors[server] }]}>Próximo saque: {playerName(server)} ({PLAYER_PALETTE[game.settings.colors[server]].name})</Text>}
        <View style={shared.actions}><Button label="CONFIRMAR TROCA" onPress={() => { game.dispatch({ type: 'confirmSwitch' }); lastTap.current = Date.now(); }} />{match.pending === 'manual' && <Button label="Cancelar" secondary onPress={() => game.dispatch({ type: 'cancelManual' })} />}</View>
      </Dialog>}
      {ready && !warmup && match.winner && !newMatchPrompt && <Dialog eyebrow="PARTIDA ENCERRADA" title={`${playerName(match.winner)} venceu!`}>
        <Text style={shared.strong}>Sets · A {match.sets.A} × {match.sets.B} B</Text>
        <Text style={shared.body}>{match.completed.map((set, index) => `Set ${index + 1}: ${set.points.A} × ${set.points.B}`).join('   ·   ')}</Text>
        <Text style={shared.body}>Pontuação bloqueada. Use Desfazer para corrigir o último ponto.</Text>
        <View style={shared.actions}><Button label="Nova partida" onPress={confirmNew} /></View>
      </Dialog>}
      {menu && ready && <SettingsPanel settings={game.settings} timeouts={game.timeouts} restoreDisabled={!!match.pending || timeoutBusy}
        promoteRestore={promoteTimeoutRestore(match, game.timeouts, !!match.pending || timeoutBusy)} onColor={setColorPlayer}
        onRestore={player => { setMenu(false); game.dispatchTimeout({ type: 'requestRestore', player }); }}
        onClose={() => setMenu(false)} onSave={settings => { game.setSettings(settings); setMenu(false); }} onNewMatch={confirmNew} onWarmup={() => { setMenu(false); setWarmup(true); }} swapDisabled={!!match.pending || !!match.winner || warmup} onSwap={() => { setMenu(false); game.dispatch({ type: 'requestManual' }); }} />}
      {ready && <TimeoutDialogs match={match} timeouts={game.timeouts} dispatch={game.dispatchTimeout} />}
      {colorPlayer && ready && <View style={styles.colorOverlay}><ColorPicker player={colorPlayer} colors={game.settings.colors} onClose={() => setColorPlayer(null)} onSelect={color => {
        game.setSettings(settings => ({ ...settings, colors: changePlayerColor(settings.colors, colorPlayer, color) }));
        setColorPlayer(null);
      }} /></View>}
      {newMatchPrompt && <Dialog eyebrow="NOVA PARTIDA" title="Zerar pontos e sets?">
        <Text style={shared.body}>O sacador inicial e o histórico serão apagados. Os tempos técnicos serão restaurados conforme suas configurações.</Text>
        <View style={shared.actions}><Button label="Confirmar nova partida" onPress={() => {
          if (ready) game.restart(); else game.discard();
          setNewMatchPrompt(false); setWarmup(false); lastTap.current = -Infinity;
        }} /><Button label="Cancelar" secondary onPress={() => setNewMatchPrompt(false)} /></View>
      </Dialog>}
    </View>
  </SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><Game /></SafeAreaProvider>; }
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background, paddingHorizontal: 14 },
  warmupSafe: { flex: 1, backgroundColor: palette.background },
  body: { flex: 1, position: 'relative', minHeight: 0 },
  colorOverlay: { ...StyleSheet.absoluteFill, zIndex: 20 },
  saveError: { padding: 7, backgroundColor: '#473B23', borderRadius: 6 }, saveErrorText: { color: palette.warning, fontSize: 12, textAlign: 'center' },
});
