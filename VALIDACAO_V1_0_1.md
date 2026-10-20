# Validação da v1.0.1 · 20/10/2026

## Problema e correção

O usuário apresentou Expo Go **57.0.9** no Android e erro de projeto incompatível. A v1.0.0 usava SDK 58. O [anúncio oficial do SDK 58](https://expo.dev/changelog/sdk-58) informa que o Expo Go correspondente chegaria às lojas algumas semanas após o lançamento. A indicação genérica de atualizar pela Play Store não resolvia esse cenário.

A v1.0.1 usa **Expo SDK 57**, com dependências alinhadas às versões indicadas pelo próprio SDK:

- Expo 57.0.30.
- React/React DOM 19.2.3 e React Native 0.86.3.
- Expo Audio, Asset, Haptics, Keep Awake e Status Bar nas versões compatíveis com SDK 57.
- Safe Area Context 5.7 e React Native Web 0.21.
- Jest 29.7, jest-expo 57.0.6 e configuração ESLint do SDK 57.

Não foram alteradas regras de arbitragem ou a versão do formato dos dados salvos. O backup v1.0.0 permanece preservado.

## Executado após a correção

| Verificação | Resultado |
|---|---|
| `npm run check` | Tipagem e lint sem erros; 43 testes aprovados em duas suítes |
| `npx expo-doctor` | 21/21 verificações aprovadas |
| `npx expo install --check` | Dependências compatíveis |
| `npx expo export --platform android --platform web` | Android/Hermes e web exportados com sucesso |
| `npm ls react react-native expo jest jest-expo --depth=0` | Versões instaladas conferidas, sem dependências inválidas reportadas |
| Servidor iniciado com `--go --clear` em porta temporária 8090 | Resposta Android conferida: nome Saque Certo, versão 1.0.1, `sdkVersion: 57.0.0`, orientação `landscape` |

O servidor temporário de validação foi encerrado. O usuário deve encerrar seu servidor anterior com `Ctrl+C`, executar `npx expo start --go --clear --port 8082` e ler o novo QR Code no Expo Go já instalado.

## Limites

Não houve acesso ao celular do usuário para confirmar a abertura após a correção. A validação física, áudio, vibração e funcionamento offline continuam pendentes. Não foi gerado APK.

`npm audit` nesta combinação de dependências reportou 58 alertas transitivos (12 moderados e 46 altos, nenhum crítico). A atualização para SDK 57 resolve a compatibilidade relatada, mas não elimina a dívida de atualização das ferramentas. Não foi aplicada correção forçada que trocasse o SDK.

O registro histórico da v1.0.0 está em `VALIDACAO_V1.md`. O backup da v1.0.1 é gerado ao final desta correção e sua leitura é conferida antes da entrega.
