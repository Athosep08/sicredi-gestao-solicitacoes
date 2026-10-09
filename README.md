# Gestão de Solicitações Internas (protótipo)

Protótipo web para registrar, consultar e decidir solicitações internas, com três perfis: solicitante, atendente e supervisor.

**Stack:** Next.js 15 (App Router) + React 19 · Nest.js 11 (TypeScript) · PostgreSQL 16 · TypeORM · Docker

## Status da entrega

| Parte | Situação |
|---|---|
| Backend (API, auth, RBAC, validação, erros, migrations, seed) | Implementado e testado |
| Frontend Next.js (login, dashboard, listagem, nova solicitação, detalhe) | Implementado e testado |
| Testes automatizados: 17 unitários + 12 de integração (backend), 14 (frontend) | Implementado |
| Docker (Postgres + backend + frontend) | Implementado |
| Webhook para sistema externo | Pendente (ver "Evolução da solução") |
| Recuperação de senha | Pendente |

## Como executar

Pré-requisitos: Docker e Docker Compose.

```bash
docker compose up --build
```

Isso sobe o Postgres, aplica as migrations, roda o seed e inicia a API (`http://localhost:3001`) e o frontend (`http://localhost:3000`). Abra o frontend no navegador e entre com um dos usuários de teste abaixo.

Sem Docker (Node 22 + Postgres 16 local):

```bash
# terminal 1: API
cd backend
cp .env.example .env
npm install
npm run migration:run
npm run seed
npm run start:dev

# terminal 2: frontend
cd frontend
npm install
API_URL=http://localhost:3001 npm run dev
```

### Usuários de teste (criados pelo seed)

Senha de todos: `Senha@123` (apenas para avaliação).

| E-mail | Papel |
|---|---|
| solicitante@sicredi.test | requester |
| atendente@sicredi.test | agent |
| supervisor@sicredi.test | supervisor |

### Testes

```bash
cd backend
npm test            # unitários (regra de transição de status, guard de papéis)
npm run test:e2e    # integração contra Postgres real (precisa de migration + seed aplicados)

cd frontend
npm test            # validação (Zod), regras de status e formulário de decisão
```

## API

Todas as rotas, exceto `POST /auth/login`, exigem `Authorization: Bearer <token>`.

| Método | Rota | Quem pode | Descrição |
|---|---|---|---|
| POST | /auth/login | público | Retorna JWT e dados do usuário |
| GET | /auth/me | autenticado | Usuário do token |
| GET | /areas | autenticado | Áreas disponíveis |
| POST | /requests | autenticado | Cria solicitação (status `open`; solicitante vem do token) |
| GET | /requests | autenticado | Lista com filtros `status`, `priority`, `areaId`, `search`, `searchIn`, `order`, paginação `page` e `limit` (20/50/100) |
| GET | /requests/:id | autenticado | Detalhe com histórico de status e comentários |
| PATCH | /requests/:id | dono (se `open`) ou atendente/supervisor | Edita título, descrição, área e prioridade |
| PATCH | /requests/:id/status | atendente, supervisor | Muda status com comentário obrigatório |
| POST | /requests/:id/comments | autenticado | Comentário sem mudar status (interno ou externo) |
| DELETE | /requests/:id | supervisor | Exclusão lógica (soft delete) |
| GET | /dashboard | autenticado | Total, por status e por prioridade, agregado no banco |

Listagem devolve `{ data, total, page, totalPages }`. Erros saem sempre como `{ statusCode, message, errorId, path, timestamp }`.

## Decisões de modelagem

Modelo completo em `docs/modelo-dados.dbml` (cole no dbdiagram.io). Cinco tabelas: `users`, `areas`, `requests`, `request_status_history`, `request_comments`.

- **Área em tabela** (não enum nem texto livre): texto livre quebra a agregação do dashboard e enum exigiria deploy para criar área nova.
- **Prioridade, status, papel e visibilidade como enum nativo do Postgres**: domínios fechados.
- **Histórico de status separado**: cada mudança guarda autor, data, status novo e comentário. Reabrir é só mais uma linha, sem status extra além dos quatro do enunciado.
- **Comentários soltos separados do histórico**: comunicação entre solicitante e equipe sem mudar status, com flag interno/externo.
- **Data de criação gerada pelo sistema**, imutável. `updated_at` mantido como verificação cruzada com o histórico.
- **Exclusão lógica** (`deleted_at`): preserva o dado para eventual necessidade legal (LGPD, art. 16, II) e retira da listagem e do dashboard. Expurgo definitivo por política de retenção fica fora do escopo.
- **Nomes em inglês**; camelCase no TypeScript, snake_case no Postgres (tradução feita pelo ORM em um único ponto).

## Decisões de arquitetura

- Módulos por domínio do Nest (controller → DTO → service → repositório). Sem Clean/Hexagonal: desproporcional a um protótipo.
- Regra mais crítica isolada em função pura e testada: `requests/status-transitions.ts`.
- Autenticação com JWT nativo (Passport) e senha com argon2. Papel lido sempre de dentro do token assinado, por guard global (`@Roles`).
- Solicitante só enxerga as próprias solicitações e só cria comentário externo.
- Validação com class-validator (`whitelist` + `forbidNonWhitelisted`: status e solicitante nunca vêm do corpo). Filtro global de exceções com `errorId`.
- Logs de eventos de negócio (criação, mudança de status, exclusão) em JSON.

## Decisões do frontend

- **Server Components** para dashboard, listagem e detalhe (leitura); **Client Components** só onde há estado de formulário (nova solicitação, decisão de status, comentário).
- **Filtros e paginação na URL** (`/requests?status=open&page=2`): link compartilhável e histórico do navegador funcionando. Parâmetros vazios do formulário são descartados antes de chamar a API.
- **Token em cookie httpOnly**, lido só no servidor do Next: o JavaScript do navegador nunca enxerga o JWT. As chamadas à API saem do servidor do Next (Server Actions e Server Components).
- **Validação nas duas pontas**: Zod + React Hook Form no formulário (feedback imediato) e class-validator no backend (quem garante de verdade).
- **Cache**: os dados são por usuário (o solicitante só vê as próprias solicitações), então não uso o cache de dados compartilhado do Next, que serviria dados de um usuário a outro. As telas são renderizadas sob demanda, e toda mutação (criar, decidir, comentar, excluir) chama `revalidatePath` nas telas afetadas. A navegação entre telas usa o prefetch do `<Link>`.
- Descrição em **markdown** renderizada com `react-markdown`, que não aceita HTML cru (sem XSS pelo texto digitado).
- A lista de transições de status também existe no frontend (`src/lib/status.ts`) só para esconder opções inválidas. A regra de verdade está no backend.

## Premissas e limitações

- Sem recuperação de senha nem cadastro de usuários (usuários vêm do seed).
- Busca textual usa `ILIKE` + `unaccent`; para volume grande, evoluir para índice trigram ou full-text.
- Quem pode reabrir uma solicitação decidida não é restrito além do papel atendente/supervisor.
- Não há teste automatizado de ponta a ponta no navegador versionado no repositório. O fluxo completo (login, criar, decidir, comentar, excluir) foi conferido manualmente em navegador real durante o desenvolvimento.
- Interface em português, sem internacionalização, e sem tela de administração de usuários e áreas (vêm do seed).
- Segurança: segredo JWT e senha do banco vêm de variáveis de ambiente com valores de exemplo. Em produção precisariam ser trocados e `COOKIE_SECURE=true` ativado atrás de HTTPS.

## Evolução da solução

- **Atribuição explícita de responsável** antes da decisão (hoje `resolved_by` só registra quem decidiu).
- **Integração com sistema corporativo após aprovação**: padrão outbox (tabela de eventos gravada na mesma transação da mudança de status, despachada por job com retry e backoff e chave de idempotência), para que falha do sistema externo não afete a experiência do usuário e haja rastreabilidade.
- Observabilidade (métricas, tracing), cache de leitura do dashboard, índices adicionais conforme volume, filas para processamento assíncrono.
- Recuperação de senha, SSO corporativo.
