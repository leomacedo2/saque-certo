# Validação da v1.0.0

Data: 20/10/2026. Ambiente: Windows, Node.js 24.12.0, npm 11.6.2, Expo SDK 58.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| `npm run typecheck` | Aprovado, sem erros de TypeScript |
| `npm run lint` | Aprovado, sem erros ou avisos |
| `npm test` | 43 testes aprovados, 2 suítes |
| `npm test -- --coverage` | 43 aprovados; cobertura de linhas de domínio: 100%; domínio + armazenamento: 98,03% |
| `npx expo install --check` | Dependências compatíveis com o SDK |
| `npx expo-doctor` | 20/20 verificações aprovadas |
| `npx expo export --platform android --platform web` | Empacotamento Android/Hermes e web concluído |

A cobertura é dos arquivos de domínio e armazenamento, não da interface ou do hook de integração com AsyncStorage. Os testes de persistência verificam serialização, validação e fila de gravação; o armazenamento nativo deve ser testado no Android.

O Expo Doctor inicialmente identificou a ausência da dependência direta `expo-asset`, necessária ao áudio. Ela foi instalada e a checagem final passou nos vinte itens.

## Conferência da interface no navegador

Executada na prévia local, em janela horizontal de 844 × 390:

- Primeiro toque definiu A como sacador e manteve 0 × 0.
- Primeiro set terminou em 11 × 0, abriu confirmação e bloqueou os dois botões de pontos.
- Confirmação mudou os lados e o primeiro sacador do segundo set foi B.
- Segundo set terminou com vitória de B e deixou os sets em 1 × 1.
- No terceiro set, a sequência A,A,A,A,B,B,B,A chegou a 5 × 3 e abriu o aviso decisivo com A como próximo sacador.
- Após confirmar, A foi para a direita com cinco pontos e permaneceu como sacador.
- Desfazer após confirmar voltou a 4 × 3, A à esquerda e B sacando.
- Recarregar abriu a oferta de retomada com 4 × 3 e sets 1 × 1; a retomada exibiu esse estado.
- Menu e opções de configuração foram inspecionados.

Capturas em `docs/screenshots/placar-v1.png` e `docs/screenshots/troca-decisiva.png`. Elas documentam a prévia web e não comprovam o comportamento nativo.

## Dependências

`npm audit` reportou **49 alertas transitivos: 25 moderados e 24 altos**, sem críticos. `npm audit fix` foi executado sem forçar alterações incompatíveis; os alertas remanescentes envolvem a cadeia de ferramentas Expo/React Native/Jest e pacotes como braces, node-forge, sprintf-js e uuid. A proposta de correção forçada inclui regressão de versões principais do Expo, por isso não foi aplicada. Isso permanece como dívida de atualização; não há alegação de auditoria sem vulnerabilidades.

## Pendências

- Testes em aparelho físico e emulador Android não foram executados; `adb` não estava disponível no ambiente.
- Bloqueio nativo de orientação, áreas seguras, áudio, vibração, manutenção da tela acesa, recuperação nativa e uso offline precisam seguir o checklist do guia.
- O cronômetro foi testado por testes automatizados do cálculo de tempo, pausa, retomada e término. Não houve validação completa de áudio e interface do cronômetro no Android.
- Não foi gerado APK, executada uma compilação Gradle ou publicado repositório no GitHub.
- Exportação de JavaScript Android não equivale a um instalador Android nem a uma homologação de torneio.

## Backup

Após concluir a implementação e esta documentação, a rotina de backup deve criar o ZIP v1.0.0 e conferir sua leitura. O arquivo inclui fontes, testes, documentação, capturas e arquivo de dependências. Exclui dependências instaladas e arquivos gerados de compilação/cobertura. O caminho exato do ZIP é informado na entrega.
