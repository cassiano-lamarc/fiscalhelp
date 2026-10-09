# Fiscal Help — Especificação de modificações V1

Data: 09/10/2026. Documento para implementação no frontend Angular e backend .NET existentes.

Implementar os 17 ajustes abaixo no projeto atual. Estas decisões substituem requisitos anteriores conflitantes: autenticação passa a ser exclusivamente Google; nome/CNPJ ficam editáveis; domínio da origem passa a ser cassianolamarc.com.br; modelo anexado passa a ser a referência visual do PDF. Preservar isolamento entre usuários, cálculo decimal no backend, idempotência, concorrência otimista e snapshots históricos. Manter SOLID, Clean Architecture, DDD, EF Core Migrations, Repository e Unit of Work, código legível e componentes separados em .ts, .html e .scss.

Este documento descreve mudanças a implementar; não representa funcionalidades já entregues. Não implementar cobrança nem emissão fiscal nesta etapa.

## 1. Nome do projeto

Usar **Fiscal Help** como nome comercial em cabeçalho, títulos das páginas, marketing, login, rodapé, mensagens, metadados, manifest e README. Buscar referências ao nome antigo e atualizar textos apresentados ao usuário. Identificadores técnicos podem usar FiscalHelp/fiscal-help quando a renomeação for segura. Não renomear banco, migrations, rotas, namespaces ou recursos de infraestrutura indiscriminadamente; manter compatibilidade e documentar mudanças necessárias. Nome de empresa cadastrado pelo usuário permanece independente da marca Fiscal Help.

## 2. Tempo das notificações

Centralizar notificações transitórias em um serviço usando MatSnackBar. Sucesso/informação: 5 segundos; aviso/erro transitório: 8 segundos. Valores configuráveis em um único lugar. Incluir ação Fechar e evitar mensagens duplicadas/empilhamento excessivo. Mensagens não devem cobrir ações principais no celular. Erros de validação permanecem associados aos campos enquanto inválidos; operações em andamento usam indicador próprio. Alertas que exigem decisão ficam em diálogo/banner com ação explícita. Ao desaparecer o snackbar, o usuário ainda consegue identificar e corrigir erros no formulário. Usar anúncios acessíveis sem roubar foco. Este prazo trata avisos visuais, não apaga registros de um eventual histórico de notificações.

## 3. Texto do botão Criar conta

Corrigir a cor do texto para contrastar com o fundo real do botão. Usar tokens do tema/Angular Material, evitando regras globais que afetem todos os botões. Validar estado normal, hover, foco e disabled, temas suportados e celular. Texto permanece visível com contraste mínimo de 4,5:1 para texto comum. Na página de marketing preferir “Comece grátis”; no fluxo Google usar o rótulo descrito na seção 7.

## 4. Página de marketing

Posicionar Fiscal Help como um serviço que evoluirá para uma solução fiscal completa e prática, deixando claras as funções disponíveis e futuras.

Conteúdo sugerido:

- Título: “Fiscal Help: comece com orçamentos, prepare sua empresa para o próximo passo.”
- Apoio: “Crie orçamentos profissionais com a identidade da sua empresa. Estamos construindo uma solução fiscal completa e prática para simplificar sua rotina.”
- CTA principal: “Comece grátis”.
- Disponível agora: orçamento personalizado, logo, condições comerciais, histórico e download em PDF.
- Evolução planejada: novos documentos e serviços fiscais, incluindo emissão fiscal, identificados como “Em breve”.
- Passos: entre com Google, cadastre sua empresa, preencha seu orçamento e gere o PDF.

Não anunciar nota fiscal, recibos, obrigações fiscais, integrações ou recursos futuros como já disponíveis. Não apresentar orçamento como documento fiscal. Links e CTAs devem funcionar; remover ações fictícias.

## 5. Gratuidade em destaque

Usar “Comece grátis”, “Crie sua conta grátis” e “Gere seus primeiros orçamentos gratuitamente” em pontos pertinentes. Informar perto do CTA e na área de uso: “Plano gratuito: até 50 orçamentos por conta. Mais orçamentos estarão disponíveis na versão paga.” Não prometer criação ilimitada. Cadastro Google gratuito não deve exigir cartão. A versão paga é futura; não disponibilizar compra simulada.

## 6. Cadastro e login somente Google

Remover formulários e ações públicos de e-mail/senha, recuperação de senha, cadastro por telefone e OTP. Telefone será apenas dado opcional do perfil e não método de login.

Usar o mesmo fluxo Google para entrar ou criar conta: identidade Google existente inicia sessão; identidade nova cria usuário e inicia onboarding. OAuth validado no backend com identidade única Provider + Subject e proteção state/nonce/PKCE conforme a integração. Nunca confiar apenas no e-mail enviado pelo navegador. Manter sessão segura, revogação, CSRF quando aplicável e autorização real da API.

Desabilitar também endpoints públicos dos métodos removidos, não apenas ocultar botões. Se houver usuários antigos sem Google, definir e documentar uma migração/vinculação autenticada antes de desativar o acesso deles. Não apagar contas, orçamentos ou vincular automaticamente por e-mail sem verificação segura. Não expor vinculação pública que permita tomar outra conta.

## 7. Botão Google

Usar o botão oficial Google Identity Services quando compatível com o fluxo; se houver botão próprio, usar o asset oficial multicolorido do Google e as diretrizes vigentes, preservando proporção e área de respiro. Não usar emoji, letra G desenhada ou ícone genérico como substituto. Validar documentação oficial na implementação.

Rótulo sugerido: “Continuar com Google”, tanto para cadastro quanto login. Manter texto legível, ícone alinhado, área clicável confortável, foco visível e layout responsivo. Loading desabilita envio duplicado; erro permite tentar de novo. Credenciais secretas ficam no backend.

## 8. Tela de login e sessão

Aguardar resolução da sessão antes de renderizar login. Durante a consulta inicial, usar estado de carregamento para evitar flash da tela de login.

Usuário autenticado que acessa /login ou /register é redirecionado com substituição de histórico: onboarding se incompleto; histórico/dashboard se completo. Usuário sem sessão acessando rota protegida vai ao login. Preservar retorno somente para rotas internas autorizadas, sem redirecionamento externo arbitrário. CTAs de marketing para usuário logado levam à área de orçamento, sem repetir Google. Logout encerra a sessão; expiração volta ao fluxo de autenticação sem loops.

## 9. Empresa editável

Permitir editar nome e CNPJ em Minha empresa, além de adicionar/substituir/remover logo e alterar opções visuais. Remover COMPANY_IDENTITY_LOCKED e bloqueios de formulário relativos à identidade confirmada. ConfirmedAtUtc pode continuar indicando onboarding concluído, mas não restringe edição.

Nome continua obrigatório; CNPJ e logo opcionais. Validar CNPJ segundo formato vigente na implementação, mantendo frontend/backend coerentes. Salvar com versão para evitar sobrescrita concorrente. Backend restringe atualização à conta autenticada.

Novos orçamentos capturam os dados atuais da empresa. Orçamentos existentes mantêm snapshot de nome, CNPJ, telefone quando incluído e logo usados na criação; editar perfil ou baixar novamente não deve alterar sua identidade histórica. Edição de itens/condições também não troca automaticamente esse snapshot. Preservar assets referenciados. Uma conta continua com uma empresa; não criar seletor multiempresa nesta etapa.

## 10. Emissão com horário

Persistir `IssuedAtUtc` como instante UTC (`timestamp with time zone` no PostgreSQL) atribuído pelo servidor na primeira criação bem-sucedida do orçamento. Não atualizar o instante ao editar ou baixar PDF. Se já existir IssueDate editável, mantê-la como data comercial separada; não inventar horário para uma data antiga. Listagem usa o instante de emissão registrado. PDFs podem mostrar a data comercial e o horário registrado de forma identificada quando ambos forem diferentes.

Converter para fuso do usuário; usar America/Sao_Paulo como padrão do projeto. Comparar dias de calendário nesse fuso, não intervalos de 24 horas:

| Situação | Exibição no histórico |
| --- | --- |
| Emitido no dia atual | Hoje às 10h52 |
| Emitido no dia anterior | Ontem às 23h00 |
| Anteontem ou antes | 07/10/2026 às 14h30 |

Usar formato consistente de hora/minuto. Em registro legado sem horário confiável, exibir somente a data conhecida; não inventar 00h00. Migração pode aproveitar CreatedAtUtc apenas quando corresponder de fato à emissão. Atualizar rótulos ao mudar o dia/retornar à aba. No PDF usar data e hora absolutas para que a leitura não dependa do dia em que foi aberto. Tooltip ou texto acessível pode informar data/hora completas no histórico.

## 11. Paginação Material Design

Usar MatPaginator integrado à paginação real do backend, com rótulos em português, tamanho padrão 10 e opções 10/25/50. Exibir total de registros, intervalo atual e anterior/próxima página. Não carregar todo o histórico para paginar no navegador.

API recebe page (base 1) e pageSize e retorna items, totalCount, page e pageSize. MatPaginator usa índice base 0; converter no serviço. Ordenação estável por emissão decrescente e Id como desempate, com fallback definido para legados. Limitar pageSize no servidor. Toda contagem/listagem é restrita ao usuário da sessão. Filtros/tamanho de página reiniciam na primeira página. Cancelar respostas antigas ao trocar página rapidamente, exibir loading e preservar a página em falhas recuperáveis. Cards no mobile e tabela no desktop compartilham o mesmo paginator.

## 12. Limite gratuito de 50 orçamentos

Regra adotada: **50 criações totais por usuário Free, sem renovação mensal**. Cada orçamento persistido com sucesso consome uma unidade. Edição, cálculo/prévia sem persistência e download/regeração não consomem. Duplicar orçamento é nova criação. Exclusão, se disponível, não devolve cota, para evitar contornar o limite.

Backend mantém contador persistente de criações e política centralizada por plano. Incrementar junto da criação na mesma transação, usando bloqueio/atualização condicional atômica no PostgreSQL; não usar apenas count seguido de insert ou trava em memória. Com 49 usados e duas requisições simultâneas, apenas uma deve criar. Falha com rollback não consome. Repetição da mesma Idempotency-Key não consome novamente; resolver replay idempotente antes de recusar por cota.

Configuração proposta: `QuoteLimits.FreeLifetimeLimit = 50`; `PaidLifetimeLimit = null` significa sem limite apenas quando o benefício pago estiver habilitado no servidor. Conta Paid nunca é escolhida pelo cliente. Na V1 todos os cadastros entram Free; habilitar benefícios pagos apenas por fluxo confiável futuro. Não adicionar cobrança agora.

Retornar quota em /me ou endpoint próprio: planTier, used, limit e remaining. Ao atingir 50, backend responde 403 com código `QUOTE_LIMIT_REACHED` e mensagem segura. Frontend informa “Você atingiu o limite de 50 orçamentos do plano gratuito. Mais orçamentos estarão disponíveis na versão paga.” Exibir “12 de 50 orçamentos utilizados”; bloquear somente nova criação, preservando consulta, edição e download.

Migrar contador considerando registros existentes, incluindo excluídos quando houver histórico confiável. Não apagar dados caso uma conta já tenha mais de 50: preservar tudo e impedir novas criações Free. Documentar limitações de reconstrução caso exclusões antigas não tenham rastros.

## 13. Rodapé e marca de origem

Rodapé da aplicação pública e autenticada:

**Fiscal Help • Criado por cassianolamarc.com.br**

Usar bolinha como separador e link do domínio para `https://cassianolamarc.com.br`. Adaptar quebra de linha no celular. Atualizar a configuração anterior que usava cassianolamarc.com.

No PDF gratuito usar a mesma identificação no rodapé de todas as páginas, discreta e legível, com espaço reservado independente da numeração. Não remover a origem ao remover logo/desligar marca d’água. Preservar política backend `ShowOriginBranding = !(RemoveForPaidEnabled && PlanTier == Paid)`, inicialmente RemoveForPaidEnabled=false. Quando o benefício pago for lançado, PDF elegível omite a identificação promocional inteira, sem deixar espaço vazio; rodapé da aplicação continua Fiscal Help. Cache PDF inclui decisão efetiva de branding e revisão do template/configuração.

## 14. Condições comerciais

Adicionar seção **CONDIÇÕES COMERCIAIS** no editor, abaixo dos itens/totais. Três opções independentes, inicialmente desmarcadas em orçamento novo:

| Checkbox | Campo mostrado quando marcado | Limite proposto |
| --- | --- | --- |
| Incluir formas de pagamento | Texto multilinha com condições de pagamento | 500 caracteres |
| Incluir garantia | Texto com prazo e condições de garantia | 500 caracteres |
| Incluir observações | Texto multilinha de observações | 2.000 caracteres |

Exemplos: “Pix ou cartão em 6x sem juros”; “90 dias para o serviço realizado”; “Prazo sujeito à disponibilidade das peças”. Checkbox marcado exige texto não vazio após trim. Desmarcado omite campo do payload efetivo/PDF e não exige validação. Backend canonicaliza o texto correspondente como null quando a opção é false. Formulário pode conservar temporariamente texto ao desmarcar, mas não persistir/renderizar conteúdo desativado. Não afirmar “sem garantia” automaticamente quando opção está desmarcada.

Persistir flags/textos por orçamento; reabrir edição restaura estado. PDF mostra apenas entradas habilitadas e preenchidas, com rótulos Forma de pagamento, Garantia e Observações. Se nenhuma estiver ativa, omitir título e bloco inteiro. Renderizar como texto seguro, respeitando quebras de linha; evitar corte e sobreposição. Cálculos monetários não mudam por texto de pagamento.

## 15. Layout do orçamento conforme anexo

Referência: `Modelo_de_Orcamento_MV_Eletrodiesel-orcamento-a.docx`, fornecido com este pedido. Entregar a referência ao implementador junto deste .md. Reproduzir hierarquia, alinhamento, cores e tabelas do exemplo, substituindo conteúdo por dados da conta/orçamento; não fixar nome, CNPJ, telefone, logo, assinatura ou valores da MV Eletrodiesel.

O documento usa página Carta em retrato (21,59 × 27,94 cm), margens aproximadas de 1,32 cm vertical e 1,73 cm horizontal. Esse tamanho substitui a especificação A4 anterior para o template fiel. A renderização apresentou uma segunda página vazia: evitar essa sobra no gerador.

Estrutura visual obrigatória:

1. Cabeçalho: logo proporcional à esquerda; nome da empresa grande, dourado e alinhado à direita; dados secundários em cinza, CNPJ e telefone somente quando habilitados/preenchidos. Slogan do exemplo não vira texto fixo para todas as empresas.
2. Linha horizontal dourada abaixo do cabeçalho.
3. Título central preto e em negrito “ORÇAMENTO DE SERVIÇOS”, seguido de linha com número, emissão e validade quando informada.
4. Grade de identificação com labels dourados em fundo bege claro: Cliente, Veículo, Nº do veículo e Placa. Campos opcionais ausentes são omitidos e a grade é reorganizada sem asteriscos ou espaços artificiais.
5. Linha de Assunto, quando preenchido, com rótulo dourado e conteúdo em negrito.
6. Tabela: ITEM, QTD., DESCRIÇÃO DO SERVIÇO / PEÇA, V. UNIT. e TOTAL. Cabeçalho preto com texto branco; linhas alternadas em branco/cinza claro; bordas finas; valores à direita e moeda BRL.
7. Subtotal e desconto alinhados à direita no fechamento da tabela. TOTAL GERAL com fundo preto e texto branco em destaque.
8. Condições comerciais abaixo da tabela, título dourado e rótulos em negrito.
9. Duas áreas de assinatura ao final: empresa/preparador e Cliente / Responsável, linhas para assinatura manual e data, conforme modelo. Sem assinatura eletrônica simulada.
10. Rodapé Fiscal Help da seção 13 e numeração quando houver múltiplas páginas.

Adicionar Assunto (opcional, até 250 caracteres) e Validade em dias (opcional, inteiro positivo até 365) para permitir preencher elementos do modelo sem valores fixos. Veículo/modelo também opcional, até 150 caracteres. Não adicionar KM nesta etapa: o exemplo reúne Placa / KM, mas a solicitação atual pede Placa; campos adicionais ficam preparados para evolução.

Sem logo, reposicionar cabeçalho; não exibir placeholder. Manter marca d’água da empresa conforme opção existente, discreta atrás do conteúdo. Conteúdo longo pode gerar páginas adicionais, com cabeçalho da tabela repetido, totais/assinaturas sem cortes e rodapé reservado. Evitar página final vazia. Prévia e download usam o mesmo PDF da API. Comparar visualmente com o anexo usando dados equivalentes, depois testar sem opcionais e com conteúdo extenso.

## 16. Nº do veículo e placa opcionais

Campos independentes no orçamento: vehicleNumber (até 50 caracteres) e licensePlate (até 20), ambos nullable, sem impedir emissão quando vazios. Identificador de veículo pode ser texto alfanumérico; placa pode ser estrangeira ou de máquina, portanto não impor máscara brasileira obrigatória. Trim e validações de tamanho/caracteres seguros no backend. Não renderizar label vazio nem “***”. Não criar cadastro de frota.

Preparar a organização de campos opcionais com componentes/configuração de apresentação extensíveis, mantendo DTO tipado para os campos atuais. Futuramente o usuário poderá selecionar mais campos; não implementar um construtor genérico ou dados arbitrários sem validação agora.

## 17. Telefone e nome de quem realizou o orçamento

Adicionar em Dados do usuário telefone de contato e nome padrão de quem prepara o orçamento, opcionais. Telefone não integra autenticação. Nome até 150 caracteres; telefone normalizado e validado por biblioteca compatível com países, sem exigir celular brasileiro.

No editor, oferecer “Incluir telefone no orçamento” e “Incluir nome de quem realizou o orçamento”, com pré-preenchimento dos dados do perfil e possibilidade de ajustar para aquele documento. Marcado exige dado válido; desmarcado salva valor efetivo null e omite a informação do PDF. Os dados do perfil não aparecem por padrão sem opção do usuário.

Telefone incluído vai no cabeçalho, no espaço de contato do modelo. Nome incluído aparece como “Orçamento realizado por: Nome” próximo à emissão ou à assinatura da empresa, mantendo o layout. Ele não substitui o nome empresarial nem a marca Fiscal Help. Capturar os valores efetivos no orçamento: alterar o perfil depois não modifica documentos antigos. Não expor telefone de perfil em páginas públicas.

## Contratos e persistência

Adaptar os nomes à arquitetura existente, sem endpoints duplicados. Contratos propostos:

- GET/PATCH /me/profile: consultar/editar telefone e nome padrão do preparador, com versão.
- GET /me: sessão, onboarding, plano, quota e flag efetiva de branding; campos de plano/cota somente leitura.
- PUT/PATCH /company: permitir nome, CNPJ e aparência com autorização e concorrência.
- GET /quotes: paginação da seção 11 e instante de emissão.
- POST/PUT /quotes: campos opcionais e condições; backend calcula totais e aplica limite na criação.

Exemplo dos novos campos de orçamento, além de cliente, itens e desconto existentes:

```json
{
  "vehicleName": "Máquina JCB",
  "vehicleNumber": null,
  "licensePlate": null,
  "subject": "Reparo do sistema de injeção",
  "validityDays": 15,
  "commercialConditions": {
    "includePaymentTerms": true,
    "paymentTerms": "Pix ou cartão em 6x sem juros",
    "includeWarranty": true,
    "warrantyTerms": "90 dias",
    "includeNotes": false,
    "notes": null
  },
  "includeContactPhone": true,
  "contactPhone": "+5571999831471",
  "includePreparedByName": true,
  "preparedByName": "Murillo Vítor"
}
```

Servidor retorna IssuedAtUtc; plano, contador, totais calculados e identidade do proprietário não são entradas do cliente. Migrações devem preservar registros antigos, adicionar novos textos nullable e flags com defaults seguros, contador e instante conforme disponibilidade. Usar UTC para instantes e numeric/decimal para dinheiro. Atualizar DTOs, validações, mappings, OpenAPI e exemplos sem expor segredos. Registrar migrações e procedimento para usuários de autenticação antiga.

## Verificação e critérios de aceite

- [ ] Fiscal Help aparece em todas as áreas e metadados pertinentes.
- [ ] Snackbars encerram no prazo; erros de campo continuam visíveis.
- [ ] Botões têm texto visível em todos os estados suportados.
- [ ] Marketing destaca início grátis, limite e evolução futura sem anunciar funções indisponíveis.
- [ ] Cadastro/login público usa somente Google real e botão com marca oficial.
- [ ] Usuário autenticado nunca permanece na tela de login; onboarding incompleto é retomado.
- [ ] Nome/CNPJ/logo são editáveis e PDFs antigos preservam identidade histórica.
- [ ] Hoje/ontem/datas respeitam fuso, virada do dia e registros legados sem horário.
- [ ] Histórico usa MatPaginator com paginação e contagem no servidor.
- [ ] Criações 1 a 50 Free funcionam; a 51ª falha; concorrência e idempotência não excedem/duplicam cota.
- [ ] Edição e download permanecem disponíveis após atingir o limite.
- [ ] Rodapé usa cassianolamarc.com.br; PDF respeita a política futura Paid.
- [ ] Condições opcionais aparecem só quando habilitadas; dados são preservados ao editar.
- [ ] PDF segue o modelo, sem página vazia, texto cortado ou sobreposição.
- [ ] Nº do veículo, placa, telefone e preparador são opcionais e aparecem somente quando aplicável.
- [ ] Duas contas não acessam documentos, perfil, quota ou assets uma da outra.

Executar builds e verificações exigidas pelo repositório. Testes relevantes: limite atômico/idempotente em PostgreSQL; autorização; snapshot após alteração de empresa/perfil; fluxo Google e guards; condições habilitadas/desabilitadas; formatos de data na virada do dia; PDF com e sem opcionais e multipágina. Não gerar .spec vazios ou testes que apenas espelham métodos. Ao concluir, informar arquivos alterados, migrations, configuração Google, verificações realizadas e dependências externas pendentes.
