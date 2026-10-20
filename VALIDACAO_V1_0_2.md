# Validação da v1.0.2 · 20/10/2026

O usuário apresentou uma captura Android com os pontos 4 e 6 minúsculos, embora houvesse espaço livre nos painéis. O dimensionamento anterior combinava tamanho calculado a partir da janela, `flexShrink` e `adjustsFontSizeToFit` no texto nativo. A causa exata dentro do renderizador Android não foi confirmada em dispositivo.

A correção remove esse encolhimento automático dos números e usa um componente compartilhado que mede com `onLayout` o espaço entre os rótulos e controles. O tamanho é calculado explicitamente a partir da largura, altura e quantidade de caracteres. Os pontos reservam duas colunas para não variar de tamanho entre 9 e 10. O mesmo componente mostra o tempo de aquecimento. O texto numérico usa tamanho controlado pela área; os demais textos mantêm suas configurações de acessibilidade.

Verificações executadas:

- `npm run check`: tipagem e lint aprovados; 43 testes de domínio/armazenamento aprovados. Esses testes não comprovam o desenho do texto no Android.
- `npx expo export --platform android --platform web`: exportação Android/Hermes e web concluída.
- Prévia web em 844 × 390: placar 4 × 6 conferido, seguido de 10 × 6. O número 10 foi medido com fonte de 144 px, dentro da área disponível de 366 × 162 px, sem corte.
- Cronômetro 02:00 conferido visualmente no mesmo tamanho de janela.
- Capturas em `docs/screenshots/placar-v1-0-2.png` e `docs/screenshots/aquecimento-v1-0-2.png`.

A confirmação no Android físico continua pendente. O usuário pode recarregar o projeto no Expo Go; se continuar vendo a versão anterior, deve reiniciar o servidor com `npx expo start --go --clear --port 8082` e ler o novo QR Code. O menu exibe V1.0.2.

SDK 57, regras de arbitragem e formato da partida salva foram mantidos. O backup versionado é criado e sua leitura conferida ao final da entrega. Os alertas de dependências registrados em `VALIDACAO_V1_0_1.md` permanecem como limitação da base atual.
