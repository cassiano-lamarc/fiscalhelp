# PRD — Frontend de orçamentos — V1

Data: 09/10/2026. Status: especificação para implementação. Nome comercial a definir.

## Objetivo
Permitir que prestadores de serviços e pequenos negócios criem orçamentos em PDF usando a identidade de sua própria empresa, cadastrada uma única vez e vinculada à conta.

## Decisões de produto
- Uma conta possui uma única empresa. Orçamentos não permitem escolher ou cadastrar outro emissor.
- Nome da empresa obrigatório; CNPJ e logo opcionais. Endereço, telefone comercial e outros dados empresariais ficam fora da V1.
- Para resolver a diferença entre escolher uma posição e a preferência final relatada, a V1 oferece duas opções independentes: logo no cabeçalho e logo como marca d’água. Com logo presente, ambas começam marcadas. O usuário pode desmarcar qualquer uma; sem logo, controles ficam desabilitados e o PDF não exibe espaços vazios.
- Cadastro por e-mail/senha, Google ou telefone com código de verificação. Telefone depende de integração real de SMS; não entregar botão simulando autenticação funcional.
- Documento disponível: orçamento. Nota fiscal fica fora da V1; não oferecer emissão fiscal ou assinatura digital funcional.
- Desconto em valor fixo, em reais. Percentual fica para uma versão futura.
- Linha para assinatura manual no PDF; sem desenho com mouse, upload de assinatura, integração Gov.br ou declaração de assinatura digital.
- Decisão proposta para impedir troca contínua do emissor: nome e CNPJ ficam bloqueados depois da confirmação do onboarding. Correções exigem suporte, sem edição autônoma na V1. A logo não é bloqueada: pode ser adicionada, substituída ou removida a qualquer momento em Minha empresa, antes ou depois de criar orçamentos, sem suporte ou aprovação. As opções visuais também podem ser atualizadas; isso não permite alterar a empresa. Esse vínculo reduz uso indevido, mas não comprova que o usuário é proprietário da empresa.

## Escopo e jornada
1. Página pública explica o serviço e oferece Criar conta e Entrar.
2. Autenticação e verificação do método escolhido.
3. Seleção de documento: cartão Orçamento com botão Continuar. Tipos futuros não têm ações ativas.
4. Dados da empresa: nome, CNPJ opcional, upload opcional, opções de logo.
5. Revisão e confirmação explícita da identidade; explicar o bloqueio antes de salvar.
6. Lista de orçamentos e botão Criar orçamento.
7. Editor com itens, desconto, resumo financeiro e prévia.
8. Salvar e Gerar PDF; baixar o documento retornado pela API.

Quem retornar após cadastro interrompido continua no passo pendente. Quem já concluir o onboarding entra na lista. Falha de rede não deve marcar um passo como concluído.

## Telas e campos
### Autenticação
E-mail, senha, confirmação da senha no cadastro; exibir/ocultar senha; recuperação de senha; login Google; telefone com seleção de país, código e reenvio sujeito a intervalo retornado pela API. Erros não devem revelar existência de conta. Não juntar automaticamente contas só porque compartilham um e-mail não verificado.

### Empresa
Nome: 2–150 caracteres após trim. CNPJ: vazio ou 14 dígitos válidos; máscara é apresentação. Logo: PNG/JPEG, até 2 MB; mostrar prévia, remover ou substituir. API é autoridade da validação. Antes da confirmação, revisar nome e CNPJ e informar: “Estes dados identificarão sua empresa nos orçamentos. Após confirmar, correções serão feitas pelo suporte.”

### Minha empresa após o onboarding
Exibir nome/CNPJ conforme a regra de confirmação e uma área de logo sempre editável. Oferecer Adicionar logo quando ausente, Substituir logo e Remover logo quando presente, além das opções de cabeçalho e marca d’água. Informar que mudanças valem para novos orçamentos. Após remover, desabilitar opções dependentes da imagem; após novo upload, permitir configurar ambas novamente. Não bloquear upload/remover com base no estado confirmado do perfil. Exibir loading e erros; só atualizar a prévia após sucesso da API.

### Lista de orçamentos
Exibir número, data de emissão, cliente quando informado, total e ação Abrir. Paginação, estado vazio e acesso ao PDF. Sem workflow de aprovação, CRM, catálogo de produtos, cobrança ou envio automático.

### Editor
- Número gerado pelo backend, somente leitura.
- Data de emissão: hoje por padrão, editável.
- Nome do cliente opcional: até 150 caracteres. Campo proposto para utilidade do documento, sem cadastro de clientes.
- 1–100 itens; cada item tem descrição de produto/serviço, quantidade e valor unitário.
- Descrição: 1–250 caracteres. Quantidade positiva, até 999.999,999, com até 3 casas; unitário de R$ 0,00 a R$ 999.999.999,99, até 2 casas.
- Adicionar e remover linhas, mantendo ao menos uma linha no formulário.
- Pergunta “Aplicar desconto?”; desativada significa desconto zero. Ativada mostra valor fixo não negativo, limitado ao subtotal.
- Resumo: subtotal, desconto e total. Quantidade × valor unitário por linha.
- Salvar, visualizar e Gerar PDF. Alterações pendentes devem ser salvas com sucesso antes da geração.

Pode exibir cálculo provisório para feedback imediato; sempre substituir pelo resultado da API. Não enviar subtotal, total de linha ou total como autoridade. Usar representação decimal segura; evitar confiar em multiplicação de ponto flutuante do JavaScript.

## PDF e identidade histórica
Prévia usa o mesmo PDF da API, evitando divergência entre HTML e documento final. A4, cabeçalho com nome e CNPJ quando presente, logo quando habilitada, identificação do orçamento, cliente quando preenchido, tabela de itens, totais e linha de assinatura. Marca d’água discreta atrás do conteúdo. Identidade e imagem são congeladas por orçamento: alterar a logo do perfil não altera documentos anteriores. Novos orçamentos usam o perfil vigente.

## Marca de origem e plano pago futuro
Na V1, a prévia e o PDF baixado incluem “Criado por cassianolamarc.com” em um rodapé discreto de todas as páginas, separado da marca d’água e da logo da empresa. Não oferecer checkbox de remoção para o usuário gratuito nem associar a marca às opções de aparência da empresa.

Consumir `GET /me` com `planTier` (`Free` ou `Paid`) e `pdfBranding: { showOriginBranding, text, url }`. Esses campos são somente leitura; o backend decide a flag efetiva. Não enviar plano ou flag de marca nos payloads de cadastro, perfil, orçamento ou PDF. Não esconder a marca editando HTML da prévia: a prévia usa o mesmo PDF produzido pela API.

Preparar a interface para informar “Os PDFs incluem a marca de origem” quando `showOriginBranding` for true. No futuro, quando a funcionalidade estiver ativa e a conta possuir o benefício pago, a flag será false e o PDF não terá a marca. Não criar botão de compra ou checkout funcional antes da implementação da cobrança. Atualizar os dados de sessão ao reabrir a área de orçamentos; a decisão final é sempre da API no momento da geração.

Documentos anteriores podem ser gerados novamente com a marca correspondente ao benefício atual, preservando a identidade histórica da empresa. PDFs já baixados permanecem iguais. Validar Free/Paid com funcionalidade ligada e desligada, presença em todas as páginas, ausência de sobreposição e independência da remoção da logo.

## Arquitetura proposta
Angular standalone + Angular Material, TypeScript e SCSS; interface em português do Brasil, moeda BRL, sem i18n na V1. Não fixar versão de framework neste PRD; selecionar versão estável suportada no início da implementação.

Separar cada componente em .ts, .html e .scss. Organização: core/auth, core/http, core/config, shared/ui, shared/validators, features/auth, features/onboarding, features/company, features/quotes. Reactive Forms tipados, serviços HTTP por feature, guards de sessão/onboarding, interceptor de erros. Componentes não contêm regras financeiras de domínio. Evitar código minificado e abstrações sem necessidade.

Ambientes possuem apenas configuração pública, como apiBaseUrl. Credenciais, chave de SMS e segredo Google pertencem ao backend. Sessão via cookie HttpOnly; requests com credenciais; proteção CSRF nas mutações. Não armazenar credencial de sessão no localStorage. Proteção de rotas no frontend complementa autorização real da API.

## Contrato de integração
Seguir os endpoints e DTOs do PRD de backend. Erros no formato Problem Details com code, fieldErrors e traceId. Tratar 401 como sessão expirada, 403 como acesso negado, 409 como concorrência ou empresa já confirmada, 422 como validação e 429 respeitando Retry-After. Não reenviar silenciosamente uma criação após timeout: reutilizar a mesma chave de idempotência.

## UX e qualidade
Interface responsiva para celular e desktop. Em celular, itens em cartões ou tabela com rolagem controlada; totais e ações não sobrepõem campos. Labels visíveis, navegação por teclado, foco em erros, contraste adequado, indicação de carregamento, mensagens em português. Confirmar saída com alterações não salvas. Preservar formulário diante de erro; não salvar logo/base64 em armazenamento persistente do navegador.

## Critérios de aceite
1. Cadastro real nos três métodos; onboarding é retomável e exigido antes do primeiro orçamento.
2. Empresa somente com nome conclui cadastro e gera PDF sem CNPJ/logo ou placeholders.
3. Logo com padrões iniciais aparece no cabeçalho e na marca d’água; cada opção pode ser desligada.
4. Nome/CNPJ não são editáveis no editor e ficam bloqueados após confirmação; logo permanece editável no perfil, com inclusão, troca e remoção, preservando documentos anteriores.
5. Dois itens de 2 × R$ 100,00 e 1 × R$ 50,00 com desconto de R$ 25,00 mostram total confirmado de R$ 225,00.
6. Falhas de upload, login, salvamento e PDF têm mensagens e nova tentativa sem duplicação.
7. PDF de várias páginas permanece legível, com tabela e assinatura sem cortes.
8. Usuário não acessa orçamentos de outra conta alterando URL.

## Entrega e validação
README com instalação, configuração de ambiente, execução local, URL da API e fluxo de cadastro. Validar build, formulários, integração real e fluxo completo no celular e desktop. Testes focados em onboarding, autorização, salvamento e geração; não criar arquivos .spec vazios apenas para acompanhar componentes.
