# Fiscal Help — frontend

## Publicar no Cloudflare Workers

O `wrangler.jsonc` publica os arquivos de `dist/frontend/browser` e permite abrir diretamente as rotas Angular, conforme a [configuração de SPA do Cloudflare](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/).

```powershell
npm ci
npx wrangler login
npm run deploy
```

O comando compila antes de publicar o Worker `fiscal-help-frontend`. Para validar sem publicar, use `npm run deploy:check`; para prévia local da versão compilada, use `npm run preview:cloudflare`. Em CI, configure `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no ambiente de execução, sem salvar os valores no repositório.

Após publicar, configure `PublicUrl` no backend do Render com a origem HTTPS exibida pelo Wrangler (ou seu domínio próprio), para autorizar CORS e o retorno do login. A API continua apontando para `https://fiscalhelp-backend.onrender.com`; as chaves do Google permanecem no backend.

Repositório independente da interface Angular. Requer Node 24 e npm.

```powershell
npm ci
npm start
```

Interface local: http://localhost:4200. Em desenvolvimento e produção, o frontend usa sempre https://fiscalhelp-backend.onrender.com. A URL fica em `src/app/core/http/api.config.ts`; não há substituição por ambiente. O proxy local também aponta para esse endereço.

O backend publicado deve permitir CORS para `http://localhost:4200` e para a origem do frontend de produção, incluindo os headers `Authorization`, `X-XSRF-TOKEN` e `Idempotency-Key`. Novos logins usam JWT emitido pela API após validar o Google. O frontend gera uma prova PKCE, troca o código de uso único em `/auth/callback` por JWT, guarda o token no `sessionStorage` da aba e envia `Authorization: Bearer` nas chamadas à API, PDFs e logos, sem cookies de terceiros. O token é removido no logout, expiração ou resposta 401. Sessões legadas por cookie continuam exigindo CSRF. Configure `Jwt__SigningKey`, o callback Google `https://fiscalhelp-backend.onrender.com/signin-google` e `PublicUrl` no backend. Publique as alterações de ambos os repositórios juntas.

```powershell
npm run build
npm run test:dates
npm run test:e2e
```

Os testes de navegador requerem o frontend em execução e Chromium instalado com `npx playwright install chromium`. Usam API simulada.

Contrato da API e requisitos ficam em `docs/`. ClientSecret do Google deve ser configurado exclusivamente no backend, em `src/Api/appsettings.Local.json` (seção `Google`).
