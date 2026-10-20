# Guia de testes · Saque Certo v1.0.2

Instruções para Windows, Visual Studio Code e celular Android. A primeira validação deve acontecer em uma simulação, antes de usar o aplicativo em uma partida real.

## 1. Preparação

1. Instale uma versão LTS do [Node.js](https://nodejs.org/). O npm vem junto. Esta entrega foi verificada com Node 24.12.0 e npm 11.6.2.
2. Instale o [Visual Studio Code](https://code.visualstudio.com/) se necessário.
3. Instale o [Expo Go para Android compatível com SDK 57](https://expo.dev/go?device=true&platform=android&sdkVersion=57). Este projeto usa SDK 57, alinhado à versão 57.0.9 mostrada no celular do usuário. O SDK 58 da primeira entrega exigia uma versão do Expo Go que ainda não estava disponível na Play Store, conforme o [anúncio do Expo](https://expo.dev/changelog/sdk-58).
4. Conecte o celular e o computador à mesma rede Wi-Fi. A instalação das ferramentas e o primeiro carregamento precisam de internet.
5. No VS Code, use **Arquivo → Abrir Pasta** e selecione `C:\Users\Leonardo\Desktop\MinhaVida\VSCodeNew\SaqueCerto`.
6. Abra **Terminal → Novo Terminal**. Confirme que está na pasta do projeto:

```powershell
cd C:\Users\Leonardo\Desktop\MinhaVida\VSCodeNew\SaqueCerto
node --version
npm --version
npm ci
```

`npm ci` instala as versões do arquivo de dependências. Aguarde terminar. As dependências já foram instaladas na preparação desta v1, mas o comando é necessário após restaurar um backup ou clonar o repositório.

Se o PowerShell disser que `npm.ps1` não pode ser executado, use `npm.cmd` no lugar de `npm` e `npx.cmd` no lugar de `npx`, sem alterar a política de execução do Windows.

## 2. Abrir no celular

Se o servidor da v1.0.0 ainda estiver aberto, encerre com `Ctrl+C` antes de iniciar esta versão. Após a correção de compatibilidade, use `npx expo start --go --clear --port 8082` e leia o novo QR Code. Não reutilize um servidor antigo que ainda esteja executando o SDK 58.

Na pasta do projeto:

```powershell
npm start
```

Mantenha o terminal aberto. Aguarde o QR Code. Abra o Expo Go, escolha a leitura de QR Code e aponte a câmera para ele. Autorize a câmera no seu celular se desejar usar essa função. Aguarde o carregamento.

Se não conectar:

- Confira se ambos estão na mesma rede e se a rede permite comunicação entre dispositivos. Redes de convidados podem impedir isso.
- Confira a autorização do Node.js no firewall para a rede privada, sem desativar o firewall.
- Se houver VPN, verifique se ela está impedindo a conexão local.
- Encerre o servidor com `Ctrl+C` e tente o túnel:

```powershell
npx expo start --tunnel
```

O Expo pode oferecer a instalação da ferramenta de túnel `@expo/ngrok`. O túnel depende de internet e pode demorar mais. Leia o novo QR Code no Expo Go.

Se houver cache antigo:

```powershell
npx expo start --clear
```

### Emulador Android, se disponível

Instale o Android Studio, configure um dispositivo virtual no Device Manager e inicie esse dispositivo. Depois, na pasta do projeto:

```powershell
npm run android
```

Também é possível iniciar `npm start` e pressionar `a`. Sem emulador e SDK Android configurados, use o celular com Expo Go.

### Conferir a orientação

No Android, a tela do app deve permanecer **horizontal**, inclusive ao abrir configurações e aquecimento. Gire o aparelho fisicamente e confira que não aparece uma interface vertical. Se estiver vendo apenas a página inicial do Expo Go, abra o projeto primeiro. O navegador de computador serve como prévia e não comprova o bloqueio de orientação nativa.

## 3. Primeiro sacador e saques normais

Use **Menu → Nova partida → Confirmar nova partida**. Configuração: 11 pontos, melhor de três e troca decisiva ativada. Se precisar alterar, salve as configurações e só depois abra uma nova partida.

O jogador A é azul e começa à esquerda; B é laranja e começa à direita. Toque uma vez em A: esse toque escolhe o sacador e mantém **0 × 0**.

Todas as pontuações neste guia são **A × B**, independentemente do lado da tela.

| Ação | Pontos A × B | Próximo sacador |
|---|---|---|
| Escolher A para sacar | 0 × 0 | A |
| Ponto para A | 1 × 0 | A |
| Ponto para B | 1 × 1 | B |
| Ponto para A | 2 × 1 | B |
| Ponto para B | 2 × 2 | A |

Toque em **Desfazer**: deve voltar a 2 × 1, com B sacando. O botão fica no canto superior direito.

## 4. Simulação completa do set decisivo (teste principal)

Recomece a partida com as configurações padrão.

### Primeiro set

1. Escolha A como primeiro sacador, mantendo 0 × 0.
2. Toque em A onze vezes. Resultado: A vence por 11 × 0; sets 1 × 0.
3. Deve aparecer **TROCA DE LADOS**, com B como próximo sacador.
4. Tocar nas áreas de pontuação não pode registrar pontos enquanto o aviso estiver aberto.
5. Oriente a troca real e inverta pontos e sets do placar físico. Confirme a troca no aplicativo.
6. Segundo set começa em 0 × 0: **B à esquerda**, A à direita, B sacando. As cores acompanham os jogadores.

### Segundo set

1. Toque onze vezes em **B, agora à esquerda**.
2. B vence por 0 × 11; sets 1 × 1. Deve aparecer outra troca, com A como próximo sacador.
3. Confirme a troca após ajustar os jogadores e o placar físico.
4. Terceiro set: 0 × 0, A à esquerda e B à direita, A sacando. A tela indica **SET DECISIVO**.

### Terceiro set até 5 × 3

| Ação no terceiro set | Placar A × B | Próximo sacador | Comportamento |
|---|---|---|---|
| Início | 0 × 0 | A | Sem ponto automático |
| A marca 1 | 1 × 0 | A | Normal |
| A marca 2 | 2 × 0 | B | Normal |
| A marca 3 | 3 × 0 | B | Normal |
| A marca 4 | 4 × 0 | A | Normal |
| B marca 1 | 4 × 1 | A | Normal |
| B marca 2 | 4 × 2 | B | Normal |
| B marca 3 | 4 × 3 | B | Normal |
| A marca 5 | 5 × 3 | **A** | **Aviso obrigatório de troca** |

O quinto ponto já deve estar registrado. O aviso deve lembrar explicitamente de inverter **pontos e sets no placar físico** e mostrar **Próximo saque: Jogador A (azul)**.

Antes da confirmação, A continua à esquerda. Pontos ficam bloqueados. Após confirmar:

- B fica à esquerda com 3 pontos e 1 set.
- A fica à direita com 5 pontos e 1 set.
- **A continua sendo o próximo sacador.**

### Desfazer depois de confirmar

Toque em **Desfazer**. O aplicativo deve voltar a **4 × 3**, sets 1 × 1, A à esquerda, B à direita e B sacando. A confirmação é tratada como parte do ponto que a originou. Reajuste também os jogadores e o placar físico ao estado restaurado.

Toque em A mais uma vez: deve voltar a 5 × 3, solicitar a troca e indicar A sacando. Confirme novamente.

### Finalizar a partida

Toque em A, que está à direita, mais seis vezes. Os placares serão 6 × 3, 7 × 3, 8 × 3, 9 × 3, 10 × 3 e 11 × 3. Antes dos pontos seguintes, os sacadores devem ser A, B, B, A e A, respectivamente; após o último ponto a partida encerra.

A vence por 2 × 1 em sets. Não deve ser solicitada outra troca. Novos pontos ficam bloqueados. **Desfazer** deve voltar a 10 × 3 e remover a vitória definitiva.

## 5. Empate em 10 × 10

Reinicie com 11 pontos. Alterne um ponto para A e um para B dez vezes, chegando a 10 × 10 no primeiro set. Como o primeiro sacador foi A:

| Ação | Placar | Próximo sacador |
|---|---|---|
| Chegou a 10 × 10 | 10 × 10 | A |
| A marca | 11 × 10 | B |
| B marca | 11 × 11 | A |
| A marca | 12 × 11 | B |
| A marca novamente | 13 × 11 | B no próximo set |

11 × 10 e 12 × 11 não encerram o set. Somente a vantagem de dois encerra. O aviso de fim de set informa o vencedor e conserva o placar final até a confirmação.

## 6. Outros testes manuais

- **Desfazer fim de set:** no primeiro set, faça 11 × 0 e use Desfazer com o aviso aberto. Deve voltar a 10 × 0, sets 0 × 0. Repita, confirme a troca e desfaça: deve restaurar o mesmo estado anterior ao ponto final, inclusive os lados.
- **Inversão manual:** em 3 × 0, registre o sacador atual. Use Menu → Inverter lados agora. Confira que os lados só mudam ao confirmar e que pontos, sets e próximo sacador não mudam. Cancelar mantém tudo igual.
- **Troca decisiva desativada:** desative a opção, salve e abra nova partida. As trocas entre sets continuam obrigatórias. No decisivo, cinco pontos não geram aviso. A configuração não altera a partida que já estava em andamento.
- **Melhor de cinco/sete:** configure e inicie nova partida. A vitória exige três/quatro sets, respectivamente. Para forçar o decisivo, alterne os vencedores até 2 × 2/3 × 3; a troca aos cinco deve ocorrer no quinto/sétimo set.
- **Set único:** vence um set; com a opção ativada, há troca aos cinco por ser o último set possível. Não há troca após o ponto da vitória.
- **Formato casual:** altere o alvo, salve e inicie nova partida. Exige dois de vantagem; saques de um ponto começam quando ambos atingem alvo − 1. A troca decisiva continua aos cinco, se o set durar até lá.
- **Proteção de toques:** ativada, ignora toques separados por menos de 250 ms, inclusive entre jogadores diferentes. Desativada, aceita pontos rápidos. Ajuste conforme o uso real.
- **Nova partida:** cancelar mantém o estado; confirmar limpa pontos, sets, sacador e histórico, mantendo configurações.
- **Persistência:** marque pontos, aguarde “PARTIDA SALVA NO DISPOSITIVO”, feche o app e reabra. Escolha Retomar partida. Confira pontos, posições, sacador e Desfazer. Repita com uma troca obrigatória ainda pendente.
- **Falha de armazenamento:** se aparecer aviso de salvamento pendente, mantenha o app aberto e use Tentar salvar. Não considere salvo antes da mensagem de sucesso.

## 7. Aquecimento

Em uma partida com pontos já registrados, abra **Menu → Aquecimento**. O padrão é 02:00, inicialmente parado.

1. Inicie, pause e confira que os números não diminuem enquanto pausado.
2. Continue e confira a contagem. Reiniciar deve voltar a 02:00 parado.
3. Volte à partida e confira que nenhum ponto, set ou sacador mudou.
4. Nas configurações, escolha 10 segundos e salve. Abra o aquecimento novamente, inicie e aguarde o aviso **TEMPO ENCERRADO**.
5. O som vem desativado. Ative se quiser testar e confira o volume do aparelho.
6. Durante a contagem, coloque o app em segundo plano por alguns segundos. Ao voltar, o tempo deve considerar esse intervalo, sem acumular atraso dos ticks.

Sair da tela encerra a sessão desse cronômetro; ao entrar novamente, ele recomeça na duração configurada. A partida não é afetada. Não há garantia de som enquanto o aplicativo está em segundo plano.

## 8. Testes automatizados e ferramentas

Execute no terminal, na pasta do projeto:

```powershell
npm test
npm run typecheck
npm run lint
```

Para todos os três em sequência:

```powershell
npm run check
```

Para acompanhar testes durante alterações ou investigar uma falha:

```powershell
npm run test:watch
npm test -- --verbose
npm test -- --runTestsByPath __tests__/match.test.ts
npm test -- --coverage
```

`PASS` indica aprovação; `FAIL` indica falha e mostra o nome do caso e a diferença entre resultado esperado e recebido. Não altere expectativas apenas para esconder falhas: confira a regra e o cenário. O registro desta entrega está em `VALIDACAO_V1.md`.

Conferir dependências Expo e exportação:

```powershell
npx expo install --check
npx expo-doctor
npx expo export --platform android --platform web
```

Se a porta do Expo estiver ocupada, encerre o servidor anterior com `Ctrl+C` ou escolha outra porta com `npx expo start --port 8082`. Se faltarem módulos, rode `npm ci`. A instalação pode informar alertas de dependências transitivas; não execute `npm audit fix --force` indiscriminadamente, pois pode trocar o SDK por versões incompatíveis.

## 9. Checklist no Android físico (ainda pendente)

- [ ] Áreas de toque grandes, sem pontos acidentais ao abrir o menu ou desfazer.
- [ ] Paisagem bloqueada no placar, menu, avisos e cronômetro.
- [ ] Recortes, cantos e barras do sistema não cobrem botões nem números.
- [ ] “SAQUE” legível, além da cor; jogadores reconhecíveis após mudar de lado.
- [ ] Números do cronômetro legíveis à distância do placar físico.
- [ ] Tela permanece acesa com o app em primeiro plano.
- [ ] Avisos de troca claros, com pontuação bloqueada e lembrete do placar físico.
- [ ] Sequência completa do decisivo 5 × 3 validada.
- [ ] Desfazer antes e depois de confirmar trocas validado.
- [ ] Retomada após fechar/reabrir preserva estado e histórico.
- [ ] Pontos rápidos sem lentidão, com proteção de toques ligada e desligada.
- [ ] Vibração opcional e som opcional funcionam conforme o aparelho.
- [ ] Após carregar o app, ativar modo avião e conferir pontuação, menu e cronômetro sem rede.

O Expo Go precisa carregar o projeto do computador. Reabrir o projeto em modo avião pode depender do cache e não substitui um app instalado. Para testar lançamento totalmente offline, será necessário gerar e instalar uma compilação Android nativa. Não foi gerado APK nesta entrega.

## 10. Backup desta versão e das próximas

```powershell
npm run backup
```

O arquivo será criado em `C:\Users\Leonardo\Desktop\MinhaVida\VSCodeNew\SaqueCertoBackups`. O nome inclui a versão do `package.json`, data, hora e identificador. Veja `BACKUPS.md` para restauração. O ZIP contém o projeto; não inclui as partidas do celular.
