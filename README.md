![Logo oficial do Saque Certo](assets/branding/logo.png)

# Saque Certo · v2.1.4

Assistente de arbitragem de tênis de mesa para **individual (1 × 1) e duplas (2 × 2)**, feito com React Native, Expo e TypeScript. Complementa o placar físico: registra pontos, indica quem saca/recebe, confirma trocas de lado e apresenta os resultados para transcrição da súmula.

## Baixar e instalar no Android

**[Baixar APK publicado v2.1.1 no GitHub](https://github.com/leomacedo2/saque-certo/releases/download/v2.1.1/SaqueCerto-v2.1.1-android.apk)**

O código atual é a **v2.1.4**, com proteção de configurações não salvas e sem troca automática aos cinco pontos no modo set único. Inclui também confirmação para Desfazer pelo Voltar do Android e controle do som dos pontos. A [build v2.1.4, compilação 7](https://expo.dev/accounts/leomacedo/projects/saque-certo/builds/b2af5458-7eca-44e8-add6-eb172d1422f8) foi enviada ao Expo. O download acima continua sendo a v2.1.1 até a nova versão ser publicada.

APK gerado com sucesso em 29/10/2026, compilação 3. Funciona como aplicativo independente, sem Expo Go, computador ou servidor Metro. A validação em aparelho físico ainda está pendente.

1. Abra este README no celular Android e toque no link de download acima.
2. Aguarde o download e abra o arquivo `.apk` pela notificação ou pela pasta Downloads.
3. Se o Android solicitar, permita que o navegador ou gerenciador de arquivos instale aplicativos dessa origem e retome a instalação.
4. Toque em **Instalar** e depois em **Abrir**. Procure o nome **Saque Certo** e o ícone com as duas raquetes; confira **V2.1.1** no menu.
5. Para testar sem internet, feche o aplicativo, ative o modo avião e abra novamente. Confira pontos, saques, duplas, aquecimento, tempo técnico e som. Feche e reabra para conferir a recuperação da partida.

O APK é para Android. O armazenamento é separado do Expo Go: partidas feitas nele não são transferidas automaticamente. Em futuras atualizações, instale o novo APK sobre o anterior, preservando pacote e assinatura; desinstalar ou limpar os dados apaga a partida salva.

O arquivo acima está hospedado no GitHub Releases. [Detalhes da build v2.1.1](https://expo.dev/accounts/leomacedo/projects/saque-certo/builds/6c7b4903-f974-4a0a-9de9-e312deeb09ce).

## Disponibilizar o APK no GitHub Releases

Para quem mantém o repositório, após testar o APK:

1. Faça commit e push dos arquivos desta versão para o GitHub.
2. No repositório, abra **Releases → Draft a new release**.
3. Escolha ou crie a tag `v2.1.1`, apontando para o commit desta versão, e use o título **Saque Certo v2.1.1**.
4. Descreva as mudanças e anexe o instalador com o nome `SaqueCerto-v2.1.1-android.apk` na área de arquivos da Release. O APK deve ser anexado ali, sem adicioná-lo às pastas do código.
5. Clique em **Publish release** quando estiver pronto para distribuir.
6. Copie o endereço do APK anexado e substitua o link de download no início deste README. Faça commit e push dessa atualização.

Os arquivos **Source code (zip/tar.gz)** gerados pelo GitHub são o código-fonte; para instalar no celular, baixe o arquivo com extensão **.apk**. Novas versões podem ter suas próprias Releases, preservando as anteriores. [Instruções oficiais do GitHub](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).

## Executar o projeto para desenvolvimento

Instale Node.js LTS e Expo Go compatível com SDK 58. Na raiz do projeto:

```powershell
npm ci
npx expo start --go --clear --port 8082
```

Leia o QR Code no Expo Go, com celular e computador na mesma rede. Alternativa por túnel: `npx expo start --go --tunnel`. Confira **V2.1.4** no menu.

## Configurações e set único

Ao tentar fechar configurações alteradas, o aplicativo pergunta se deseja salvar antes de sair. **Salvar** valida e aplica os valores; **Cancelar** mantém o menu aberto com as alterações. O aviso vale para Fechar, toque fora do painel, Voltar do Android e ações que saem do menu. Se não houve alteração ou os valores foram revertidos, o menu fecha diretamente. Cores escolhidas no seletor continuam sendo aplicadas imediatamente.

No formato **Set único**, não há troca automática de lados aos cinco pontos, nem mudança de recepção associada nas duplas. A inversão manual continua disponível. Nas melhores de 3, 5 ou 7, a troca do set decisivo continua conforme a configuração. Esta é uma escolha de funcionamento do formato set único no aplicativo.

## Voltar do Android e Desfazer

Na tela do placar, o botão ou gesto Voltar do Android pede confirmação antes de desfazer a última ação. **Cancelar** ou Voltar novamente fecha o aviso sem alterar a partida. O botão **Desfazer** do próprio aplicativo continua direto, sem aviso. Quando não há histórico para desfazer, Voltar pergunta se deseja sair.

Menus e seletores mantêm seu comportamento de fechar ou voltar à etapa anterior; aquecimento e tempo técnico mantêm seus próprios controles de saída. Confirmações obrigatórias de troca de lados e a súmula final continuam protegidas.

Com **Menu → Preferências → Som ao marcar ponto** ativado, cada ponto aceito emite um toque local de 50 milissegundos, em volume baixo, sem depender da internet. Para desativar, desligue essa opção e toque em **Salvar configurações**. A escolha permanece ao reabrir o aplicativo e não altera os alarmes de aquecimento e tempo técnico. A opção começa ativada, inclusive ao recuperar partidas de versões anteriores. Escolher o sacador, desfazer e toques bloqueados não emitem esse som. O volume de mídia do aparelho continua valendo.

## APK Android independente

O projeto está preparado para EAS Build, com o nome **Saque Certo**, pacote **com.saque.certo**, orientação landscape e identidade visual oficial. O ícone adaptativo usa fundo azul-escuro e margem para as máscaras Android; a abertura nativa é discreta e não adiciona etapas à partida.

```powershell
npm ci
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli build --platform android --profile preview
```

No primeiro `init`, vincule ao seu projeto Expo existente ou crie o projeto `saque-certo`. O EAS adicionará a identificação pública do projeto ao app.json. Na primeira build, autorize as credenciais Android pelo terminal; em atualizações, preserve a mesma assinatura. Não salve senhas ou chaves no repositório.

O perfil **preview** gera APK de distribuição interna, sem cliente de desenvolvimento: código e recursos ficam no aplicativo, sem depender do Metro ou do Expo Go. Baixe o APK pelo link ao final da build ou pelo painel Expo. O perfil **production** gera AAB para eventual distribuição pela loja; nenhuma publicação é automática.

Mantenha o pacote Android e a assinatura nas futuras atualizações. O EAS incrementa `android.versionCode` localmente em cada build; comite essa alteração para manter o contador. O guia completo **GUIA_APK.md** fica na subpasta de documentação da entrega em SaqueCertoBackups, fora do repositório.

**Situação desta entrega:** APK v2.1.1, compilação 3, gerado com sucesso no EAS. Projeto vinculado à conta Expo `leomacedo`, com assinatura Android mantida no Expo. A v2.1.1 corrige o arquivo de dependências que impediu a instalação na primeira build; a instalação limpa foi conferida com npm 10.9.9, usado pelo servidor. O teste real sem internet deve ser feito após instalar o APK. Referência: [criar APK com EAS Build](https://docs.expo.dev/build-reference/apk/).

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
