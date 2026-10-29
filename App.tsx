import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PlayerId, nextServer } from './src/domain/match';
import { changeAthleteColor, changePlayerColor, ColorIdentity, teamHexColors, PLAYER_PALETTE } from './src/domain/colors';
import { Mode, teamName } from './src/domain/doubles';
import { timeoutBlocksPlay } from './src/domain/timeouts';
import { useGame } from './src/hooks/useGame';
import { usePointSound } from './src/hooks/usePointSound';
import { Button, Dialog, shared } from './src/ui/Controls';
import { Scoreboard } from './src/ui/Scoreboard';
import { MatchSummary } from './src/ui/MatchSummary';
import { SettingsPanel } from './src/ui/SettingsPanel';
import { Warmup } from './src/ui/Warmup';
import { CountdownScreen } from './src/ui/CountdownScreen';
import { TimeoutDialogs } from './src/ui/TimeoutControls';
import { MatchHeader } from './src/ui/MatchHeader';
import { ColorPicker } from './src/ui/ColorPicker';
import { promoteTimeoutRestore } from './src/ui/matchPresentation';
import { palette } from './src/ui/theme';
import { DoublesPreparation } from './src/ui/DoublesPreparation';
import { ServiceNotice } from './src/ui/ServiceNotice';
import { NewMatchDialog } from './src/ui/NewMatchDialog';

function Game() {
  useKeepAwake();
  const game = useGame();
  const match = game.session.current;
  const [menu, setMenu] = useState(false);
  const [warmup, setWarmup] = useState(false);
  const [newMatchPrompt, setNewMatchPrompt] = useState(false);
  const [colorPlayer, setColorPlayer] = useState<ColorIdentity | null>(null);
  const [newMode, setNewMode] = useState<Mode>('singles');
  const playerColors = teamHexColors(game.settings, match.mode);
  const playerName = (player: PlayerId) => teamName(match, player);
  const lastTap = useRef(-Infinity);
  const backAlertOpen = useRef(false);
  const server = nextServer(match);
  const ready = game.status === 'ready';
  const timeoutBusy = timeoutBlocksPlay(game.timeouts);
  const activeTimeout = game.timeouts.active;
  const preparing = ['warmupPrompt', 'warmup', 'awaitingAthleteServer', 'awaitingAthleteReceiver', 'setOrderPrompt'].includes(game.phase);
  const preMatch = game.phase === 'awaitingInitialServer';
  const blocked = !ready || menu || warmup || preparing || newMatchPrompt || timeoutBusy || !!colorPlayer;
  const playPointSound = usePointSound(!blocked);
  useEffect(() => {
    // The full-screen timer owns Back, including its alarm exit confirmation.
    if (warmup || (ready && (activeTimeout || game.phase === 'warmup'))) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (backAlertOpen.current) return true;
      if (colorPlayer) { setColorPlayer(null); return true; }
      if (game.phase === 'warmupPrompt') { game.dispatchPreparation({ type: 'cancelInitialServer' }); return true; }
      if (['awaitingAthleteServer', 'awaitingAthleteReceiver', 'setOrderPrompt'].includes(game.phase)) { game.dispatch({ type: 'undo' }); return true; }
      if (menu) { setMenu(false); return true; }
      if (newMatchPrompt) { setNewMatchPrompt(false); return true; }
      if (game.timeouts.request) { game.dispatchTimeout({ type: 'cancelRequest' }); return true; }
      if (game.timeouts.correction) { game.dispatchTimeout({ type: 'cancelRestore' }); return true; }
      if (match.pending === 'manual') { game.dispatch({ type: 'cancelManual' }); return true; }
      // Official confirmations must never be dismissed using Android Back.
      if (match.pending || match.winner || !ready) return true;
      backAlertOpen.current = true;
      const closeAlert = () => { backAlertOpen.current = false; };
      if (game.session.history.length) {
        Alert.alert('Desfazer a última ação?',
          'Deseja realmente desfazer a última ação da partida? Para desfazer diretamente, sem esta confirmação, use o botão Desfazer do aplicativo.', [
            { text: 'Cancelar', style: 'cancel', onPress: closeAlert },
            { text: 'Desfazer', onPress: () => {
              closeAlert(); game.dispatch({ type: 'undo' }); lastTap.current = -Infinity;
            } },
          ], { cancelable: true, onDismiss: closeAlert });
      } else {
        Alert.alert('Sair do Saque Certo?', 'Não há nenhuma ação para desfazer. Deseja sair do aplicativo?', [
          { text: 'Cancelar', style: 'cancel', onPress: closeAlert },
          { text: 'Sair', onPress: () => { closeAlert(); BackHandler.exitApp(); } },
        ], { cancelable: true, onDismiss: closeAlert });
      }
      return true;
    });
    return () => subscription.remove();
  }, [menu, warmup, newMatchPrompt, match.pending, match.winner, ready, game, activeTimeout, colorPlayer]);
  const touchPlayer = (player: PlayerId) => {
    if (blocked || match.pending || match.winner) return;
    const now = Date.now();
    if (game.settings.doubleTapGuard && now - lastTap.current < 250) return;
    lastTap.current = now;
    game.dispatch({ type: preMatch ? 'selectServer' : 'point', player });
    if (!preMatch && game.phase === 'playing') playPointSound();
    if (game.settings.haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };
  const confirmNew = () => { setMenu(false); setNewMode(ready ? match.mode : game.saved?.settings.mode ?? 'singles'); setNewMatchPrompt(true); };
  const lastSet = match.completed.at(-1);
  if (game.phase === 'warmup' && game.warmup && ready) return <SafeAreaView style={styles.warmupSafe}>
    <StatusBar hidden />
    {game.error && <Pressable accessibilityRole="button" onPress={game.retrySave} style={styles.saveError}><Text style={styles.saveErrorText}>{game.error} · Tentar salvar</Text></Pressable>}
    <CountdownScreen timer={game.warmup.timer} initialSeconds={game.warmup.seconds}
      onToggle={now => game.dispatchPreparation({ type: 'toggleWarmup', now })}
      onRestart={() => game.dispatchPreparation({ type: 'restartWarmup' })}
      onClose={() => game.dispatchPreparation({ type: 'closeWarmup' })} />
  </SafeAreaView>;
  if (activeTimeout && ready) return <SafeAreaView style={styles.warmupSafe}>
    <StatusBar hidden />
    {game.error && <Pressable accessibilityRole="button" onPress={game.retrySave} style={styles.saveError}><Text style={styles.saveErrorText}>{game.error} · Tentar salvar</Text></Pressable>}
    <CountdownScreen timer={activeTimeout.timer} initialSeconds={game.timeouts.config.timeoutSeconds}
      onToggle={now => game.dispatchTimeout({ type: 'toggleTimer', now })}
      onClose={() => game.dispatchTimeout({ type: 'end' })}
      technical={{
        label: `Tempo técnico · ${playerName(activeTimeout.who === 'both' ? 'A' : activeTimeout.who)}`,
        color: activeTimeout.who === 'both' ? playerColors.A : playerColors[activeTimeout.who],
        secondLabel: activeTimeout.who === 'both' ? { label: ` e ${playerName('B')}`, color: playerColors.B } : undefined,
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
    <MatchHeader match={match} preMatch={preMatch} timeouts={game.timeouts} colors={playerColors} athleteColors={game.settings.athleteColors} disabled={blocked} onColor={setColorPlayer} dispatch={game.dispatchTimeout}
      leading={<Button label={menu ? '☰ Fechar' : '☰ Menu'} secondary disabled={!ready || preparing || newMatchPrompt || timeoutBusy || !!colorPlayer} onPress={() => setMenu(value => !value)} />}
      trailing={<Button label="↶ Desfazer" secondary disabled={!ready || !game.session.history.length || menu || newMatchPrompt || warmup || timeoutBusy || !!colorPlayer} onPress={() => { game.dispatch({ type: 'undo' }); lastTap.current = -Infinity; }} />} />
    {game.error && ready && <Pressable accessibilityRole="button" onPress={game.retrySave} style={styles.saveError}><Text style={styles.saveErrorText}>{game.error} · Tentar salvar</Text></Pressable>}
    <View style={styles.body}>
      <Scoreboard match={match} preMatch={preMatch || (match.mode === 'doubles' && preparing)} colors={playerColors} athleteColors={game.settings.athleteColors} highContrast={game.settings.highContrast} blocked={blocked} onPlayer={touchPlayer} />
      {ready && !newMatchPrompt && <DoublesPreparation match={match} phase={game.phase} colors={game.settings.athleteColors} dispatch={game.dispatch} />}
      {ready && game.phase === 'warmupPrompt' && <Dialog title="Deseja iniciar o aquecimento?">
        {match.mode === 'doubles' ? <ServiceNotice match={match} colors={game.settings.athleteColors} /> : <Text style={[shared.strong, { color: playerColors[match.firstServer!] }]}>Sacador inicial: {playerName(match.firstServer!)}</Text>}
        <View style={shared.actions}>
          <Button label="Sim, iniciar aquecimento" onPress={() => game.dispatchPreparation({ type: 'acceptWarmup', seconds: game.settings.warmupSeconds })} />
          <Button label="Não, ir para partida" secondary onPress={() => game.dispatchPreparation({ type: 'skipWarmup' })} />
          <Button label={match.mode === 'doubles' ? 'Corrigir ordem inicial' : 'Corrigir sacador inicial'} secondary onPress={() => { game.dispatchPreparation({ type: 'cancelInitialServer' }); lastTap.current = -Infinity; }} />
        </View>
      </Dialog>}
      {game.status === 'loading' && <Dialog title="Abrindo o Saque Certo"><ActivityIndicator color={palette.green} /><Text style={shared.body}>Conferindo a partida salva…</Text></Dialog>}
      {(game.status === 'recover' || game.status === 'error') && <Dialog eyebrow="RECUPERAÇÃO" title={game.status === 'recover' ? 'Retomar a partida?' : 'Falha ao abrir a partida'}>
        <Text style={shared.body}>{game.status === 'recover' ? 'Pontos, sets, posições, saques, tempos técnicos e histórico de desfazer foram preservados.' : game.error}</Text>
        {game.saved && <Text style={shared.strong}>A {game.saved.session.current.points.A} × {game.saved.session.current.points.B} B · Sets {game.saved.session.current.sets.A} × {game.saved.session.current.sets.B}</Text>}
        <View style={shared.actions}><Button label={game.status === 'recover' ? 'Retomar partida' : 'Tentar novamente'} onPress={game.status === 'recover' ? game.resume : () => { void game.retryLoad(); }} /><Button label="Iniciar nova partida" secondary onPress={confirmNew} /></View>
      </Dialog>}
      {ready && !warmup && match.pending && !newMatchPrompt && <Dialog eyebrow={match.pending === 'deciding' ? 'SET DECISIVO · 5 PONTOS' : match.pending === 'manual' ? 'CORREÇÃO MANUAL' : 'SET ENCERRADO'} title="TROCA DE LADOS">
        {match.pending === 'betweenSets' && lastSet && <Text style={shared.strong}>{playerName(lastSet.winner)} venceu o set · A {lastSet.points.A} × {lastSet.points.B} B</Text>}
        <Text style={shared.body}>Oriente {match.mode === 'doubles' ? 'as duplas' : 'os jogadores'} a trocar de lado.</Text>
        <Text style={shared.strong}>Não esqueça de inverter os pontos e sets no placar físico.</Text>
        {match.mode === 'doubles' ? <ServiceNotice match={match} colors={game.settings.athleteColors} /> : server && <Text style={[shared.strong, { color: playerColors[server] }]}>Próximo saque: {playerName(server)} ({PLAYER_PALETTE[game.settings.colors[server]].name})</Text>}
        <View style={shared.actions}><Button label="CONFIRMAR TROCA" onPress={() => { game.dispatch({ type: 'confirmSwitch' }); lastTap.current = Date.now(); }} />{match.pending === 'manual' && <Button label="Cancelar" secondary onPress={() => game.dispatch({ type: 'cancelManual' })} />}</View>
      </Dialog>}
      {ready && !warmup && match.winner && !newMatchPrompt && <Dialog eyebrow="PARTIDA ENCERRADA" title={`${playerName(match.winner)} venceu!`}>
        <Text style={shared.strong}>Resultado: {match.sets.A} × {match.sets.B} em sets</Text>
        <MatchSummary match={match} colors={playerColors} />
        <Text style={shared.body}>Pontuação bloqueada. Use Desfazer para corrigir o último ponto.</Text>
        <View style={shared.actions}><Button label="Nova partida" onPress={confirmNew} /></View>
      </Dialog>}
      {menu && ready && <SettingsPanel settings={game.settings} mode={match.mode} timeouts={game.timeouts} restoreDisabled={!!match.pending || timeoutBusy}
        promoteRestore={promoteTimeoutRestore(match, game.timeouts, !!match.pending || timeoutBusy)} onColor={setColorPlayer}
        onRestore={player => { setMenu(false); game.dispatchTimeout({ type: 'requestRestore', player }); }}
        onClose={() => setMenu(false)} onSave={settings => { game.setSettings(settings); setMenu(false); }} onNewMatch={confirmNew} onWarmup={() => { setMenu(false); setWarmup(true); }} swapDisabled={!!match.pending || !!match.winner || warmup} onSwap={() => { setMenu(false); game.dispatch({ type: 'requestManual' }); }} />}
      {ready && <TimeoutDialogs match={match} timeouts={game.timeouts} dispatch={game.dispatchTimeout} />}
      {colorPlayer && ready && <View style={styles.colorOverlay}><ColorPicker player={colorPlayer} colors={colorPlayer === 'A' || colorPlayer === 'B' ? game.settings.colors : game.settings.athleteColors} onClose={() => setColorPlayer(null)} onSelect={color => {
        game.setSettings(settings => colorPlayer === 'A' || colorPlayer === 'B' ? { ...settings, colors: changePlayerColor(settings.colors, colorPlayer, color) }
          : { ...settings, athleteColors: changeAthleteColor(settings.athleteColors, colorPlayer, color) });
        setColorPlayer(null);
      }} /></View>}
      {newMatchPrompt && <NewMatchDialog mode={newMode} onMode={setNewMode} onConfirm={() => {
          if (ready) game.restart(newMode); else game.discard(newMode);
          setNewMatchPrompt(false); setWarmup(false); lastTap.current = -Infinity;
        }} onCancel={() => setNewMatchPrompt(false)} />}
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
