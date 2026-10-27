import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Match } from '../domain/match';
import { teamName } from '../domain/doubles';
import { canRequestTimeout, TimeoutAction, timeoutRemaining, Timeouts } from '../domain/timeouts';
import { Button, Dialog, shared } from './Controls';

export function TimeoutPlayerButton({ player, color, match, timeouts, disabled, dispatch }: {
  player: 'A' | 'B'; color: string; match: Match; timeouts: Timeouts; disabled: boolean; dispatch: (action: TimeoutAction) => void;
}) {
      const remaining = timeoutRemaining(timeouts, player);
      const unavailable = disabled || !canRequestTimeout(timeouts, match, player);
      return <Pressable key={player} accessibilityRole="button" disabled={unavailable} accessibilityState={{ disabled: unavailable }}
        accessibilityLabel={`Tempo ${player}, ${remaining} ${remaining === 1 ? 'disponível' : 'disponíveis'}`}
        onPress={() => dispatch({ type: 'request', who: player })}
        style={({ pressed }) => [styles.button, { borderColor: color, opacity: unavailable ? 0.4 : pressed ? 0.7 : 1 }]}>
        <Text style={[styles.name, { color }]}>Tempo {player}</Text>
        <Text style={[styles.count, { color }]}>{remaining === 0 ? 'Tempo utilizado' : `${remaining} ${remaining === 1 ? 'disponível' : 'disponíveis'}`}</Text>
      </Pressable>;
}
export function TimeoutDialogs({ match, timeouts, dispatch }: {
  match: Match; timeouts: Timeouts; dispatch: (action: TimeoutAction) => void;
}) {
  const playerName = (player: 'A' | 'B') => teamName(match, player);
  const bothLabel = match.mode === 'doubles' ? 'Ambas as duplas' : 'Ambos os jogadores';
  if (timeouts.request) {
    const who = timeouts.request;
    return <Dialog eyebrow="TEMPO TÉCNICO" title={`Solicitar tempo técnico para ${who === 'both' ? bothLabel.toLowerCase() : playerName(who)}?`}>
      <Text style={shared.body}>Duração: {timeouts.config.timeoutSeconds} segundos. O cronômetro abrirá parado.</Text>
      <Text style={shared.strong}>{who === 'both'
        ? `Após confirmar: A ${timeoutRemaining(timeouts, 'A') - 1} · B ${timeoutRemaining(timeouts, 'B') - 1} disponíveis.`
        : `Após confirmar: ${timeoutRemaining(timeouts, who) - 1} ${timeoutRemaining(timeouts, who) - 1 === 1 ? 'tempo disponível' : 'tempos disponíveis'} para ${playerName(who)}.`}</Text>
      <View style={shared.actions}>
        <Button label={bothLabel} secondary disabled={who === 'both' || !canRequestTimeout(timeouts, match, 'both')} onPress={() => dispatch({ type: 'request', who: 'both' })} />
        <Button label="Confirmar tempo técnico" onPress={() => dispatch({ type: 'confirmRequest' })} />
        <Button label="Cancelar" secondary onPress={() => dispatch({ type: 'cancelRequest' })} />
      </View>
    </Dialog>;
  }
  if (timeouts.correction) return <Dialog eyebrow="CORREÇÃO DE OPERAÇÃO" title={`Restaurar um tempo técnico ao ${playerName(timeouts.correction)}?`}>
    <Text style={shared.body}>Use apenas para corrigir um registro indevido. O limite da partida não será ampliado e os pontos não serão alterados.</Text>
    <View style={shared.actions}>
      <Button label="Confirmar restauração" onPress={() => dispatch({ type: 'confirmRestore' })} />
      <Button label="Cancelar" secondary onPress={() => dispatch({ type: 'cancelRestore' })} />
    </View>
  </Dialog>;
  return null;
}
const styles = StyleSheet.create({
  button: { width: '100%', borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '800' }, count: { fontSize: 10 },
});
