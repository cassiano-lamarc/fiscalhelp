# Fiscal Help — frontend

Repositório independente da interface Angular. Requer Node 24 e npm.

```powershell
npm ci
npm start
```

Interface: http://localhost:4200. O proxy em `proxy.conf.json` encaminha `/api`, `/health` e `/signin-google` à API https://localhost:7032. Execute o backend separadamente.

```powershell
npm run build
npm run test:dates
npm run test:e2e
```

Os testes de navegador requerem o frontend em execução e Chromium instalado com `npx playwright install chromium`. Usam API simulada.

Contrato da API e requisitos ficam em `docs/`. ClientSecret do Google deve ser configurado exclusivamente no backend, em `src/Api/appsettings.Local.json` (seção `Google`).
