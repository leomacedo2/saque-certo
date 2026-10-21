import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PlayerId, nextServer, playerName } from './src/domain/match';
import { useGame } from './src/hooks/useGame';
import { Button, Dialog, shared } from './src/ui/Controls';
import { Scoreboard } from './src/ui/Scoreboard';
import { SettingsPanel } from './src/ui/SettingsPanel';
import { Warmup } from './src/ui/Warmup';
import { palette, playerColors } from './src/ui/theme';

function Game() {
  useKeepAwake();
  const game = useGame();
  const match = game.session.current;
  const [menu, setMenu] = useState(false);
  const [warmup, setWarmup] = useState(false);
  const [newMatchPrompt, setNewMatchPrompt] = useState(false);
  const lastTap = useRef(-Infinity);
  const server = nextServer(match);
  const ready = game.status === 'ready';
  const blocked = !ready || menu || warmup || newMatchPrompt;
  useEffect(() => {
    // The full-screen timer owns Back, including its alarm exit confirmation.
    if (warmup) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (menu) { setMenu(false); return true; }
      if (newMatchPrompt) { setNewMatchPrompt(false); return true; }
      if (match.pending === 'manual') { game.dispatch({ type: 'cancelManual' }); return true; }
      // Official confirmations must never be dismissed using Android Back.
      if (match.pending || !ready) return true;
      return false;
    });
    return () => subscription.remove();
  }, [menu, warmup, newMatchPrompt, match.pending, ready, game]);
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
  if (warmup && ready) return <SafeAreaView style={styles.warmupSafe}>
    <StatusBar hidden />
    <Warmup seconds={game.settings.warmupSeconds} onClose={() => setWarmup(false)} />
  </SafeAreaView>;
  return <SafeAreaView style={styles.safe}>
    <StatusBar hidden />
    <View style={styles.header}>
      <Button label={menu ? '☰ Fechar' : '☰ Menu'} secondary disabled={!ready || newMatchPrompt} onPress={() => setMenu(value => !value)} />
      <Button label="↶ Desfazer" secondary disabled={!ready || !game.session.history.length || menu || newMatchPrompt || warmup} onPress={() => { game.dispatch({ type: 'undo' }); lastTap.current = -Infinity; }} />
    </View>
    {game.error && ready && <Pressable accessibilityRole="button" onPress={game.retrySave} style={styles.saveError}><Text style={styles.saveErrorText}>{game.error} · Tentar salvar</Text></Pressable>}
    <View style={styles.body}>
      <Scoreboard match={match} highContrast={game.settings.highContrast} blocked={blocked} onPlayer={touchPlayer} />
      {game.status === 'loading' && <Dialog title="Abrindo o Saque Certo"><ActivityIndicator color={palette.green} /><Text style={shared.body}>Conferindo a partida salva…</Text></Dialog>}
      {(game.status === 'recover' || game.status === 'error') && <Dialog eyebrow="RECUPERAÇÃO" title={game.status === 'recover' ? 'Retomar a partida?' : 'Falha ao abrir a partida'}>
        <Text style={shared.body}>{game.status === 'recover' ? 'Os pontos, sets, posições, saques e o histórico de desfazer foram preservados.' : game.error}</Text>
        {game.saved && <Text style={shared.strong}>A {game.saved.session.current.points.A} × {game.saved.session.current.points.B} B · Sets {game.saved.session.current.sets.A} × {game.saved.session.current.sets.B}</Text>}
        <View style={shared.actions}><Button label={game.status === 'recover' ? 'Retomar partida' : 'Tentar novamente'} onPress={game.status === 'recover' ? game.resume : () => { void game.retryLoad(); }} /><Button label="Iniciar nova partida" secondary onPress={() => setNewMatchPrompt(true)} /></View>
      </Dialog>}
      {ready && !warmup && match.pending && !newMatchPrompt && <Dialog eyebrow={match.pending === 'deciding' ? 'SET DECISIVO · 5 PONTOS' : match.pending === 'manual' ? 'CORREÇÃO MANUAL' : 'SET ENCERRADO'} title="TROCA DE LADOS">
        {match.pending === 'betweenSets' && lastSet && <Text style={shared.strong}>{playerName(lastSet.winner)} venceu o set · A {lastSet.points.A} × {lastSet.points.B} B</Text>}
        <Text style={shared.body}>Oriente os jogadores a trocar de lado.</Text>
        <Text style={shared.strong}>Não esqueça de inverter os pontos e sets no placar físico.</Text>
        {server && <Text style={[shared.strong, { color: playerColors[server] }]}>Próximo saque: {playerName(server)} ({server === 'A' ? 'azul' : 'laranja'})</Text>}
        <View style={shared.actions}><Button label="CONFIRMAR TROCA" onPress={() => { game.dispatch({ type: 'confirmSwitch' }); lastTap.current = Date.now(); }} />{match.pending === 'manual' && <Button label="Cancelar" secondary onPress={() => game.dispatch({ type: 'cancelManual' })} />}</View>
      </Dialog>}
      {ready && !warmup && match.winner && !newMatchPrompt && <Dialog eyebrow="PARTIDA ENCERRADA" title={`${playerName(match.winner)} venceu!`}>
        <Text style={shared.strong}>Sets · A {match.sets.A} × {match.sets.B} B</Text>
        <Text style={shared.body}>{match.completed.map((set, index) => `Set ${index + 1}: ${set.points.A} × ${set.points.B}`).join('   ·   ')}</Text>
        <Text style={shared.body}>Pontuação bloqueada. Use Desfazer para corrigir o último ponto.</Text>
        <View style={shared.actions}><Button label="Nova partida" onPress={confirmNew} /></View>
      </Dialog>}
      {menu && ready && <SettingsPanel settings={game.settings} onClose={() => setMenu(false)} onSave={settings => { game.setSettings(settings); setMenu(false); }} onNewMatch={confirmNew} onWarmup={() => { setMenu(false); setWarmup(true); }} swapDisabled={!!match.pending || !!match.winner || warmup} onSwap={() => { setMenu(false); game.dispatch({ type: 'requestManual' }); }} />}
      {newMatchPrompt && <Dialog eyebrow="NOVA PARTIDA" title="Zerar pontos e sets?">
        <Text style={shared.body}>O sacador inicial e o histórico da partida serão apagados. Suas configurações serão mantidas.</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, gap: 10 },
  body: { flex: 1, position: 'relative', minHeight: 0 },
  saveError: { padding: 7, backgroundColor: '#473B23', borderRadius: 6 }, saveErrorText: { color: palette.warning, fontSize: 12, textAlign: 'center' },
});
