import { Text, View } from 'react-native';
import { Action, Match, other } from '../domain/match';
import { athletesOf, teamName } from '../domain/doubles';
import { GamePhase } from '../domain/game';
import { Button, Dialog, shared } from './Controls';
import { ServiceNotice } from './ServiceNotice';
import { AthleteColors } from '../domain/colors';

export function DoublesPreparation({ match, phase, colors, dispatch }: { match: Match; phase: GamePhase; colors: AthleteColors; dispatch: (action: Action) => void }) {
  if (!match.doubles || !match.firstServer) return null;
  if (phase === 'setOrderPrompt') return <Dialog title={`Iniciar set ${match.completed.length + 1}?`}>
    <ServiceNotice match={match} colors={colors} />
    <Text style={shared.body}>Recebedor definido pela ordem do set anterior.</Text>
    <View style={shared.actions}><Button label="Confirmar ordem e iniciar set" onPress={() => dispatch({ type: 'confirmSetOrder' })} />
      <Button label="Corrigir sacador" secondary onPress={() => dispatch({ type: 'undo' })} /></View>
  </Dialog>;
  const choosingServer = phase === 'awaitingAthleteServer';
  if (!choosingServer && phase !== 'awaitingAthleteReceiver') return null;
  const team = choosingServer ? match.firstServer : other(match.firstServer);
  return <Dialog title={choosingServer ? 'Quem fará o primeiro saque?' : 'Quem receberá o primeiro saque?'}>
    <Text style={shared.strong}>{teamName(match, team)} · {match.completed.length ? `Set ${match.completed.length + 1}` : 'Primeiro set'}</Text>
    <View style={shared.actions}>{athletesOf(team).map(athlete => <Button key={athlete} label={athlete} onPress={() => dispatch({ type: choosingServer ? 'selectAthleteServer' : 'selectAthleteReceiver', athlete })} />)}
      <Button label="Voltar à escolha anterior" secondary onPress={() => dispatch({ type: 'undo' })} /></View>
  </Dialog>;
}
