# Fiscal Help — frontend

Repositório independente da interface Angular. Requer Node 24 e npm.

```powershell
npm ci
npm start
```

Interface local: http://localhost:4200. Em desenvolvimento e produção, o frontend usa sempre https://fiscalhelp-backend.onrender.com. A URL fica em `src/app/core/http/api.config.ts`; não há substituição por ambiente. O proxy local também aponta para esse endereço.

O backend publicado deve permitir CORS com credenciais para `http://localhost:4200` e para a origem do frontend de produção, incluindo os headers `X-XSRF-TOKEN` e `Idempotency-Key`. Cookies de sessão e antiforgery precisam ser compatíveis com chamadas entre sites (`SameSite=None; Secure`), sujeitos às regras do navegador. Configure o callback Google `https://fiscalhelp-backend.onrender.com/signin-google` e `PublicUrl` no backend para a origem do frontend desejada.

```powershell
npm run build
npm run test:dates
npm run test:e2e
```

Os testes de navegador requerem o frontend em execução e Chromium instalado com `npx playwright install chromium`. Usam API simulada.

Contrato da API e requisitos ficam em `docs/`. ClientSecret do Google deve ser configurado exclusivamente no backend, em `src/Api/appsettings.Local.json` (seção `Google`).
