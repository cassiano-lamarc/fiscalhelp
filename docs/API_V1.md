# API Fiscal Help V1

OpenAPI atualizado em `/openapi/v1.json` nos ambientes Development/Testing. Prefixo de aplicação `/api/v1`. Cookie HttpOnly; mutações exigem `X-XSRF-TOKEN` obtido em `GET /auth/csrf`. Nunca enviar UserId, plano, quota, IssuedAtUtc ou totais calculados.

| Rota | Contrato |
| --- | --- |
| GET /auth/google/start?returnUrl=/orcamentos | Challenge OAuth Google; retorno limitado a rotas internas |
| POST /auth/logout | Encerra/revoga sessão |
| GET /me | Sessão, onboarding, empresa, planTier, quota, pdfBranding e hasGoogleLogin |
| GET /me/profile | contactPhone, preparedByName e version |
| PATCH /me/profile | Atualiza os dois campos opcionais com version |
| GET /company | Empresa da sessão |
| PUT /company | name, cnpj, logoAssetId, showHeaderLogo, showWatermark, version; permite editar após onboarding |
| POST /company/confirm | Confirma onboarding com version |
| POST/DELETE /company/logo | Upload multipart ou remoção, mantendo assets históricos |
| PATCH /company/appearance | Flags de logo com version |
| POST /quotes/calculate | Validação/cálculo sem consumo de cota |
| POST /quotes | Criação com Idempotency-Key e consumo atômico de cota |
| GET /quotes?page=1&pageSize=10 | items, totalCount, page e pageSize; tamanho máximo 100 |
| GET/PUT /quotes/{id} | Consulta/edição com version, sem alterar emissão/snapshot |
| GET /quotes/{id}/pdf | PDF da versão salva, privado e sem cache |

Exemplo de criação:

```json
{
  "issueDate": "2026-10-09",
  "customerName": "Cliente exemplo",
  "items": [ { "description": "Serviço", "quantity": "2", "unitPrice": "100.00" } ],
  "discountAmount": "25.00",
  "vehicleName": "Máquina JCB",
  "vehicleNumber": "ABC-01",
  "licensePlate": "PLACA-EXTERNA",
  "subject": "Reparo do sistema de injeção",
  "validityDays": 15,
  "commercialConditions": {
    "includePaymentTerms": true,
    "paymentTerms": "Pix ou cartão em 6x sem juros",
    "includeWarranty": true,
    "warrantyTerms": "90 dias para o serviço realizado",
    "includeNotes": false,
    "notes": null
  },
  "includeContactPhone": true,
  "contactPhone": "+12025550123",
  "includePreparedByName": true,
  "preparedByName": "Nome do preparador"
}
```

PUT adiciona `version`. Datas comerciais são ISO; instantes UTC ISO; dinheiro e quantidade são strings decimais. Resposta inclui `issuedAtUtc` nullable para legados, detalhes opcionais, condições, contato/preparador, snapshot e totais calculados. Opções desmarcadas tornam o texto correspondente null mesmo se um cliente o enviar.

Exemplo parcial de `/me`:

```json
{
  "planTier": "Free",
  "quota": { "used": 12, "limit": 50, "remaining": 38 },
  "pdfBranding": {
    "showOriginBranding": true,
    "text": "Fiscal Help • Criado por cassianolamarc.com.br",
    "url": "https://cassianolamarc.com.br"
  }
}
```

Erros retornam status, code, title/detail, fieldErrors e traceId. Cota: `403 QUOTE_LIMIT_REACHED`; conflito de versão/idempotência: 409; validação: 422; recurso ausente/de outra conta: 404; sessão ausente: 401. Campos desconhecidos, incluindo plano/flag de marca, são rejeitados com 400. `fieldErrors` usa caminhos como `commercialConditions.paymentTerms` e `items.0.quantity`, preservados na UI após desaparecer a notificação.

Endpoints de senha/e-mail/OTP foram removidos. Vinculação legada autenticada e tickets administrativos de migração estão documentados no README; não há endpoint público que emita tickets ou escolha uma conta por e-mail.
