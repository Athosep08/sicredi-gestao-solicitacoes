# Considerações arquiteturais: Gestão de Solicitações Internas

**Desafio Técnico: Assessor de Desenvolvimento de Sistemas**\
Athos Enderle Puña · 12/10/2026\
Repositório: https://github.com/Athosep08/sicredi-gestao-solicitacoes

Este documento responde às perguntas do item 8.2 e resume a completude da entrega (item 11). Instruções de execução, API, modelo de dados, decisões técnicas e testes de segurança estão no README do repositório.

## Ponto de partida

Monorepo com API Nest.js 11 (TypeORM, PostgreSQL 16, JWT com controle de acesso por papel), frontend Next.js 15 (App Router) e Docker Compose. A regra central, a transição de status, está isolada em uma função pura e testada. Toda mudança de status grava uma linha de histórico com autor, data e comentário obrigatório, dentro de uma transação com lock na solicitação.

## 1. Evolução da solução

### 1.1 Quais mudanças arquiteturais seriam necessárias para suportar o crescimento da solução?

- **Identidade corporativa (SSO/OIDC)** no lugar da autenticação própria: os perfis passam a vir do provedor de identidade, e a aplicação deixa de guardar senha.
- **Eventos de domínio com outbox transacional**: mudanças relevantes (decisão, reabertura) passam a gerar eventos gravados na mesma transação. Esse é o mecanismo para integrações e notificações sem acoplar a API aos sistemas externos (seção 2).
- **Separar leitura de escrita onde pesar**: dashboard e listagens podem ler de réplica de leitura ou de visão materializada, sem disputar com as gravações.
- **Configuração e segredos fora do código**: cofre de segredos, rotação da chave do JWT, cookie `Secure` atrás de HTTPS.
- **Manter o monólito modular**: os módulos do Nest já são separados por domínio (autenticação, solicitações, áreas, dashboard). Separar em serviços só faria sentido com times ou cargas diferentes por domínio, não antes.

### 1.2 Quais seriam os principais riscos técnicos identificados?

| Risco | Situação atual | Tratamento |
|---|---|---|
| Segredos com valor de exemplo no compose | Aceitável para avaliação local | Cofre de segredos, rotação, HTTPS |
| Autenticação própria, sem recuperação de senha nem cadastro | Usuários vêm do seed | SSO corporativo |
| Limite de tentativas de login em memória | Reinicia com a API e não é compartilhado entre instâncias | Armazenamento compartilhado (Redis) |
| Busca com `ILIKE` + `unaccent` | Suficiente para volume pequeno | Índice trigram ou full-text; motor de busca dedicado se crescer muito |
| Dashboard calculado a cada acesso | `COUNT/GROUP BY` no banco, rápido em volume baixo | Cache curto por perfil ou visão materializada |
| Exclusão lógica sem política de retenção | `deleted_at` preserva o dado | Política de retenção e expurgo conforme LGPD |
| Reabertura de solicitação decidida | Qualquer atendente ou supervisor pode reabrir | Restringir conforme a regra de negócio (supervisor ou decisor original) |
| Integração externa acoplada à aprovação (se feita de forma direta) | Não implementada | Outbox, retry e idempotência (seção 2) |

### 1.3 Como garantir escalabilidade, disponibilidade e manutenibilidade da aplicação?

**Escalabilidade.** A API não guarda estado: o JWT é validado a cada requisição, então dá para rodar várias réplicas atrás de um balanceador sem mudar código. O banco já tem índices para os acessos mais comuns (status, data de criação, solicitante, histórico e comentários por solicitação). Os próximos passos são réplica de leitura para consultas e dashboard, e paginação por cursor se a paginação por página ficar cara em volumes grandes.

**Disponibilidade.** Pelo menos duas réplicas da API e do frontend com health check e reinício automático (orquestrador de containers), Postgres gerenciado com failover e backup testado, e deploy sem parada (rolling ou blue-green), com migrations compatíveis com a versão anterior. Integrações externas fora do caminho da requisição do usuário: se o sistema externo cair, a aplicação continua funcionando (seção 2).

**Manutenibilidade.** Módulos por domínio, regra de negócio crítica em função pura e testada, validação na borda (DTOs) e erros em formato único com `errorId` para rastrear. Testes automatizados nas duas pontas (unitários e de integração contra Postgres real no backend; componentes e regras no frontend) e testes de regressão para cada falha encontrada. Na evolução: pipeline de CI rodando testes, build e auditoria de dependências a cada mudança, e teste de ponta a ponta no navegador versionado.

### 1.4 Quais componentes ou camadas poderiam ser adicionados em uma evolução futura da arquitetura?

1. **Outbox e despachante de eventos** (seção 2), base para integração e notificações.
2. **Observabilidade**: logs estruturados com correlation id propagado do frontend ao banco, métricas (latência, taxa de erro, fila de eventos) e tracing distribuído. Hoje há logs JSON de eventos de negócio e `errorId` em cada erro.
3. **Atribuição de responsável** (`assigned_to` com histórico), com fila por atendente e prazo (SLA).
4. **Notificações** ao solicitante quando o status muda, usando os mesmos eventos.
5. **Histórico de prioridade**: hoje a triagem altera a prioridade, mas só o status entra no histórico.
6. **Administração de usuários e áreas**, hoje fixos no seed.
7. **API gateway** com limite de requisições e autenticação centralizada, se outros sistemas passarem a consumir a API.

## 2. Integração com sistemas externos

Cenário do enunciado: após a aprovação de uma solicitação, é preciso comunicar automaticamente um sistema corporativo externo. **Essa integração não foi implementada no protótipo**; abaixo está como eu a faria. O protótipo já tem a base: a decisão acontece em um único ponto transacional, existe a distinção entre decisão final e demais mudanças (gatilho natural da integração), e cada transição fica no histórico.

### 2.1 Como realizaria esta integração?

Com o **padrão outbox transacional**. Na mesma transação que muda o status para "aprovada", grava-se uma linha em uma tabela `outbox_events` (tipo do evento, id da solicitação, payload, situação, tentativas, próxima tentativa e chave de idempotência): ou as duas gravações acontecem, ou nenhuma. Um processo separado lê os eventos pendentes e os envia ao sistema externo. A aprovação nunca espera o sistema externo responder.

Descartei chamar o sistema externo direto na aprovação, ou em um webhook com retry em memória: se o processo reiniciar ou a chamada falhar depois do commit, a aprovação fica sem notificação e sem registro de que faltou enviar.

### 2.2 Quais padrões ou tecnologias utilizaria?

- **Outbox transacional** no próprio Postgres; o despachante lê com `SELECT ... FOR UPDATE SKIP LOCKED`, para várias instâncias não processarem o mesmo evento.
- **Despachante** como job periódico no início; com volume maior, publicação em uma fila ou mensageria (RabbitMQ, Kafka ou o serviço gerenciado da nuvem usada) a partir da outbox.
- **HTTPS com autenticação** exigida pelo sistema externo (OAuth2 client credentials) ou assinatura HMAC do payload com timestamp, contra adulteração e replay.
- **Idempotência**: cada evento leva uma chave estável (por exemplo, `request.approved:<id>:<versão>`) para o receptor descartar duplicatas.
- **Payload mínimo** (id, status, data e decisor), sem dados desnecessários (LGPD).

### 2.3 Como trataria falhas de comunicação?

- **Retry com backoff exponencial e jitter**, com limite de tentativas.
- **Timeout curto e circuit breaker** no cliente HTTP, para um sistema lento não travar o despachante.
- **Dead-letter**: esgotadas as tentativas, o evento fica com situação `dead`, visível para a operação e reprocessável manualmente depois da correção.
- **Entrega ao menos uma vez**: duplicatas são possíveis por definição, por isso a chave de idempotência. Eventos da mesma solicitação saem em ordem, e a versão permite ao receptor ignorar eventos antigos (por exemplo, depois de uma reabertura).

### 2.4 Como garantiria rastreabilidade das operações realizadas?

- A própria outbox é o registro: cada evento guarda quando foi criado, cada tentativa, a resposta e a situação final.
- Um **correlation id** acompanha o evento no cabeçalho da chamada, ligando a aprovação (com autor e data no histórico de status) ao registro no sistema externo.
- **Métricas e alertas**: eventos pendentes, idade do mais antigo, taxa de falha e tamanho da dead-letter.
- Na tela da solicitação, a equipe poderia ver a situação da integração (pendente, enviada, falhou).

### 2.5 Como evitaria impacto na experiência do usuário caso o sistema externo estivesse indisponível?

A aprovação é confirmada assim que a transação local termina; o envio acontece depois, em segundo plano. Se o sistema externo estiver fora do ar, o usuário não percebe atraso nem erro: os eventos se acumulam na outbox e são enviados quando ele voltar. Para teste e demonstração, um serviço falso no `docker-compose` simularia o sistema externo, incluindo falhas, sem depender do sistema real.

## 3. Completude da entrega e priorização

### 3.1 O que foi entregue

- **Todas as funcionalidades obrigatórias (4.1 a 4.4)**: cadastro, consulta com busca, filtros e ordenação, análise e decisão com comentário e data, e dashboard com os indicadores pedidos.
- **Backend**: autenticação JWT com senha em argon2, controle de acesso por papel lido do token assinado, transição de status com histórico, comentários internos e externos, triagem de prioridade pela equipe, exclusão lógica, dashboard agregado no banco com filtro por período, validação estrita e erros com `errorId`.
- **Frontend**: dashboard com gráfico de rosca e filtro por período; listagem em lista ou kanban (com arrastar para mudar status); cadastro e detalhe em popup ou tela cheia, com edição de título, descrição e área; layout para celular; token em cookie httpOnly, nunca exposto ao JavaScript do navegador.
- **Banco**: migration, enums nativos, índices e seed; modelo documentado (DBML e diagrama).
- **Testes**: 52 unitários e 21 de integração contra Postgres real no backend, 36 no frontend. Bateria de testes de segurança e robustez com 8 achados corrigidos, cada um com teste de regressão.
- **Docker**: `docker compose up --build` sobe banco, migrations, seed, API e frontend.

### 3.2 O que ficou pendente

| Item | Situação |
|---|---|
| Integração com sistema externo após aprovação | Não implementada; desenho na seção 2 |
| Logs estruturados com correlation id e métricas | Não implementados; hoje há logs JSON de eventos de negócio |
| Recuperação de senha e cadastro de usuários | Não implementados; usuários vêm do seed |
| Atribuição de responsável | Não implementada |
| Teste de ponta a ponta no navegador versionado | Fluxos conferidos em navegador real e com scripts automatizados durante o desenvolvimento, mas sem script no repositório |
| Mudar status pelo kanban no celular ou pelo teclado | O arrastar é por mouse; no celular e pelo teclado, o caminho é o formulário do detalhe |

### 3.3 Critério de priorização

Primeiro o que o enunciado exige e que dá para provar com teste: modelo de dados, regras de negócio, autenticação com controle de acesso, validação e tratamento de erros. Depois a interface que exercita tudo isso, e o Docker para quem avalia executar com um comando. Em seguida, uma bateria de testes tentando quebrar a aplicação, corrigindo o que apareceu. Com a base estável, melhorias de uso: kanban, popups, triagem de prioridade, dashboard com período e layout para celular. A integração externa foi tratada como desenho, e não como código, para não entregar algo frágil apresentado como pronto.

### 3.4 Próximos passos

1. Outbox e despachante, com serviço falso no compose para demonstrar falha e nova tentativa.
2. Logs estruturados com correlation id ponta a ponta.
3. Atribuição de responsável com histórico e fila por atendente.
4. Teste de ponta a ponta versionado e pipeline de CI.
5. SSO corporativo.
