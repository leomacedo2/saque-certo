# Histórico de versões

## 1.0.2 · 20/10/2026

- Corrige o dimensionamento dos números do placar após relato de dígitos minúsculos no Android.
- Mede a área disponível entre os rótulos para definir explicitamente o tamanho dos números, sem o encolhimento automático do texto nativo.
- Aplica o mesmo dimensionamento ao cronômetro de aquecimento.
- Mantém tamanho estável ao passar de um para dois dígitos; placares mais longos se adaptam à largura disponível.
- Mantém SDK 57 e o formato da partida salva.

## 1.0.1 · 20/10/2026

- Corrige a incompatibilidade com o Expo Go 57.0.9 instalado no celular do usuário.
- Alinha Expo, React, React Native, módulos nativos e ferramentas ao SDK 57.
- Atualiza instruções para reiniciar o servidor com cache limpo e ler um novo QR Code.
- Preserva regras, interface e formato dos dados salvos.

## 1.0.0 · 20/10/2026

Primeira implementação do Saque Certo para testes em Android via Expo Go.

- Placar em paisagem com jogadores azul e laranja.
- Motor de saques e sets separado da interface.
- Trocas obrigatórias com confirmação, incluindo cinco pontos do decisivo.
- Desfazer consistente, persistência local e retomada.
- Cronômetro de aquecimento e configurações de partida e preferências.
- Testes automatizados, guia em português e capturas da prévia web.
- Backup versionado na pasta externa indicada pelo usuário.

Validação em aparelho físico e geração de APK pendentes; consulte `VALIDACAO_V1.md`.
