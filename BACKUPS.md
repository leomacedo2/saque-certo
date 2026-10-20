# Backups do Saque Certo

Destino: `C:\Users\Leonardo\Desktop\MinhaVida\VSCodeNew\SaqueCertoBackups`.

Ao concluir cada versão, execute na pasta do projeto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

O comando lê a versão do `package.json`. Enquanto esse arquivo não existir, usa `inicial`. Para informar uma versão explicitamente:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\backup.ps1 -Version 0.1.0
```

Cada execução cria um ZIP com versão, data, hora e identificador único, preservando os backups anteriores. Inclui fontes, arquivos de configuração e documentação, inclusive arquivos ocultos. Não inclui dependências instaladas, histórico Git, caches, relatórios de cobertura, pastas de compilação ou links simbólicos. Arquivos locais de configuração podem conter segredos; mantenha a pasta de backups privada.

Para restaurar, extraia o ZIP para uma pasta separada. Quando o aplicativo estiver implementado, reinstale as dependências com `npm ci` (se houver `package-lock.json`) ou `npm install` e siga o guia de testes do projeto.

O backup é acionado pelo comando acima; não há monitoramento automático de alterações. Ele copia o projeto, não os dados de partidas armazenados no celular.
