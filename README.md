# Saque Certo · v2.0.0

Assistente de arbitragem de tênis de mesa para **individual (1 × 1) e duplas (2 × 2)**, feito com React Native, Expo e TypeScript. Complementa o placar físico: registra pontos, indica quem saca/recebe, confirma trocas de lado e apresenta os resultados para transcrição da súmula.

## Executar no Windows e Android

Instale Node.js LTS e Expo Go compatível com SDK 57. Na raiz do projeto:

```powershell
npm ci
npx expo start --go --clear --port 8082
```

Leia o QR Code no Expo Go, com celular e computador na mesma rede. Alternativa por túnel: `npx expo start --go --tunnel`. Confira **V2.0.0** no menu.

## Nova partida e preparação

No **Menu → Nova partida**, escolha Individual ou Duplas e confirme. A modalidade fica fixa até a próxima partida. Nova partida substitui a anterior após confirmação; cores e configurações são mantidas.

No individual, toque no lado de quem saca primeiro, sem adicionar ponto. Em duplas, escolha primeiro a dupla sacadora, depois o atleta sacador e o primeiro recebedor adversário. A preparação mostra nomes em vez dos números gigantes e bloqueia pontos e tempos técnicos.

Após definir a ordem, escolha se haverá aquecimento. **Sim, iniciar aquecimento** abre o contador configurado parado, aguardando Iniciar. **Não, ir para partida** libera o placar 0 × 0. Corrija pelo botão da pergunta ou por Desfazer, voltando uma etapa por vez. Saia do cronômetro antes de corrigir a seleção.

## Duplas: identidades e sequência

**A1/A2 pertencem à Dupla A; B1/B2 pertencem à Dupla B.** Esses identificadores representam atletas, não posições físicas permanentes. No painel, atleta 1 aparece no alto e atleta 2 embaixo por convenção visual. SAQUE e RECEBE acompanham o atleta correto. Tocar em um painel marca ponto para a dupla que está naquele lado.

Pontos, sets e tempos técnicos pertencem às duplas. A1 define a cor principal de A; B1 define a de B. As quatro cores podem ser ajustadas no cabeçalho antes da seleção inicial ou pelo menu durante a partida, sem modificar o jogo. Cores iguais e combinações muito próximas ficam indisponíveis; os padrões são azul, verde, laranja e rosa. Não há gesto de toque longo.

No padrão, o saque troca a cada dois pontos e a cada ponto após 10 × 10. A cada troca, quem recebia passa a sacar e o parceiro de quem sacava passa a receber. Com início A1 → B1:

| Total de pontos | Sacador | Recebedor |
|---:|---|---|
| 0–1 | A1 | B1 |
| 2–3 | B1 | A2 |
| 4–5 | A2 | B2 |
| 6–7 | B2 | A1 |
| 8–9 | A1 | B1 |

A dupla que recebeu primeiro começa sacando no set seguinte. Após confirmar a troca física de lados, escolha qual atleta dela sacará: o aplicativo calcula o recebedor como quem servia para esse atleta no set anterior. Confira a combinação e toque em **Confirmar ordem e iniciar set**. Não há escolha livre de recebedor nos sets seguintes.

No último set possível, o ponto que faz alguém atingir cinco bloqueia a pontuação e abre a confirmação obrigatória. A dupla que receberá **a próxima jogada** muda sua ordem de recepção. O aviso já mostra o próximo sacador e o novo recebedor; a inversão visual ocorre ao confirmar. Essa mudança afeta toda a sequência restante e acontece uma vez. Desfazer o ponto restaura a ordem anterior e os lados, inclusive depois da confirmação.

Referência: [ITTF Statutes 2026, 2.13.3–2.13.7](https://documents.ittf.sport/document/389). O sistema de aceleração está fora do escopo. Desativar a troca decisiva no menu cria um **formato personalizado**, sem troca física nem mudança de recepção associada; a opção vale para a próxima partida.

## Teste rápido de duplas no Expo Go

1. Use 11 pontos, melhor de 3 e troca decisiva ativada. Inicie Duplas, escolha A, A1 e B1; recuse aquecimento.
2. Some pontos aos pares e confira o ciclo da tabela. Alterne pontos de A/B até 10 × 10: A2 deve sacar para B2; após um ponto, B2 saca para A1. Mais um ponto de A encerra em 12 × 10.
3. Confirme os lados, escolha B2 para o segundo set e confira A2 recebendo. Confirme a ordem. Dê 11 pontos a B: segundo set 0 × 11.
4. Confirme os lados, escolha A1 no decisivo: B1 recebe. Em 4 × 0, A2 saca para B2. No quinto ponto de A, o aviso deve mostrar **A2 → B1**. Confirme e confira A à direita, B à esquerda.
5. Desfaça: deve voltar a 4 × 0, aos lados anteriores e A2 → B2. Marque o quinto ponto e confirme novamente. No sexto ponto, B1 saca para A1. Desfazer deve manter a troca confirmada e retornar a A2 → B1 em 5 × 0.
6. Termine o set e confira a tabela A/B, mesmo com lados invertidos. Reabra o app durante a preparação, a troca pendente ou após confirmar e use Retomar partida.

O guia completo e os relatórios ficam na pasta externa de documentação dos backups, conforme a organização deste projeto.

## Funcionalidades compartilhadas

- Placar em paisagem com números grandes, sets numéricos no centro do cabeçalho e identidades que acompanham os lados.
- Set com diferença mínima de dois; set único e melhor de 3, 5 ou 7.
- Confirmação de troca entre sets e aos cinco do decisivo, com lembrete de inverter pontos e sets no placar físico.
- Inversão manual com confirmação; Desfazer restaura pontos, sets, saques, recepção, ordem e transições.
- Partida, preparação, histórico e tempos salvos no AsyncStorage, com retomada explícita ao reabrir.
- Aquecimento de dois minutos, com pausa, continuação, reinício e alarme local contínuo até intervenção.
- Tela mantida acesa, vibração opcional, proteção de 250 ms e alto contraste.
- Formatos casuais: regras e duração/quantidade dos tempos mudam apenas na próxima partida.

## Tempos técnicos e aquecimento

O padrão é **um tempo de até 60 segundos por jogador ou dupla durante a partida inteira**. O direito não é renovado em cada set nem concedido a cada integrante de uma dupla. Tempo A/B acompanha seu titular após trocar de lado. Confirme o pedido individual ou conjunto; só a confirmação consome o direito. O contador abre parado; use Iniciar, Pausar/Continuar e Encerrar tempo.

Cancelar solicitação antes do primeiro início exige confirmação e devolve o tempo. Encerrar antecipadamente mantém o consumo. Ao chegar a zero, o alarme repete até encerrar. Correções posteriores usam **Menu → Restaurar tempo técnico → titular → confirmação**, sem ampliar o limite. A entrada fica no topo do menu apenas quando aplicável em partida em andamento, sem duplicação. Desfazer pontos não devolve tempos técnicos.

O aquecimento inicial e o tempo técnico são recuperados com seu prazo absoluto ou pausa. Se o contador venceu enquanto fechado, retorna em zero aguardando intervenção. O aquecimento avulso pelo menu mantém seu funcionamento anterior e não é recuperado depois de sair/fechar. O áudio respeita volume, modo silencioso, saída de som e restrições do aparelho; mantenha o app em primeiro plano. Nenhuma permissão de microfone é usada.

## Súmula final

A tela final mostra o vencedor, o resultado em sets e uma tabela cronológica. As colunas pertencem sempre a A e B, independentemente dos lados; nas duplas, exibem Dupla A/B. A cor destaca o vencedor de cada set e a última linha mostra os sets conquistados. Role o modal para consultar todas as linhas e Nova partida. Desfazer continua corrigindo o último ponto e atualizando os resultados.

## Capturas

Capturas da versão web em paisagem, 844 × 390; não são capturas de Android físico.

![Duplas após a troca decisiva, com A2 sacando para B1](docs/screenshots/duplas-v2-0-0.png)

![Súmula final de duplas](docs/screenshots/sumula-duplas-v2-0-0.png)

## Arquitetura e verificações

`src/domain/match.ts` mantém o motor de pontos, sets, lados e snapshots de Desfazer; `src/domain/doubles.ts` calcula a ordem por identidades. `src/domain/game.ts` coordena as fases, o aquecimento e os tempos. Componentes próprios cuidam de seleção, identificação de atletas e avisos de saque; cronômetros e tabela são compartilhados. O esquema de armazenamento 5 migra partidas individuais dos esquemas 1–4 preservando histórico, cores e fase. Dados inválidos mostram erro e não são descartados silenciosamente.

```powershell
npm run check
npx expo install --check
npx expo export --platform android --platform web
npm run backup
```

Backups por versão ficam fora do repositório em SaqueCertoBackups, sem sobrescrever os anteriores. O ZIP é conferido antes de ser informado como pronto.

## Limitações

- Falta validação em Android físico: recortes/safe area, tamanhos de fonte, áudio, vibração, botão Voltar e retomada após fechamento real.
- Exportar para Android valida o empacotamento JavaScript, sem gerar APK. Expo Go precisa de versão compatível e do servidor de desenvolvimento para carregar o projeto; um app instalado independente exige compilação nativa.
- Só uma partida e seu histórico ficam salvos. Nova partida substitui a anterior após confirmação; limpar dados ou desinstalar remove o armazenamento. Partidas muito longas aumentam o histórico.
- Não há garantia de alarme em segundo plano, tela bloqueada ou app encerrado. A aplicação não altera o volume global.
- Cores usam uma proteção simples de distância RGB; não substituem avaliação de acessibilidade no aparelho. Os identificadores de atletas e indicadores continuam visíveis.
- Fora do escopo: sistema de aceleração, regras específicas de paradesporto, nomes personalizados, ranking, torneios, contas, sincronização online e integração com placares eletrônicos. Não há backend, anúncios nem homologação para torneios.
- Dependências transitivas de desenvolvimento possuem alertas conhecidos; consulte `npm audit`.

Repositório: [leomacedo2/saque-certo](https://github.com/leomacedo2/saque-certo). A licença de distribuição poderá ser escolhida pelo autor.
