import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

// Roda contra um Postgres real, já migrado e com seed aplicado (npm run migration:run && npm run seed).
describe('Solicitações (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let requesterToken: string;
  let agentToken: string;
  let supervisorToken: string;
  let areaId: string;
  let requestId: string;

  const login = async (email: string) =>
    (await http.post('/auth/login').send({ email, password: 'Senha@123' }).expect(200)).body.accessToken as string;
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer());

    requesterToken = await login('solicitante@sicredi.test');
    agentToken = await login('atendente@sicredi.test');
    supervisorToken = await login('supervisor@sicredi.test');
    areaId = (await http.get('/areas').set(auth(requesterToken)).expect(200)).body[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejeita login com senha errada e rota sem token', async () => {
    await http.post('/auth/login').send({ email: 'atendente@sicredi.test', password: 'errada' }).expect(401);
    await http.get('/requests').expect(401);
  });

  it('rejeita token adulterado', async () => {
    const forged = requesterToken.slice(0, -3) + 'abc';
    await http.get('/requests').set(auth(forged)).expect(401);
  });

  it('valida entrada: título vazio, prioridade inválida e campos proibidos', async () => {
    await http.post('/requests').set(auth(requesterToken)).send({ title: '', description: 'x', areaId, priority: 'low' }).expect(400);
    await http.post('/requests').set(auth(requesterToken)).send({ title: 't', description: 'x', areaId, priority: 'urgente' }).expect(400);
    // status e solicitante nunca vêm do corpo
    await http
      .post('/requests')
      .set(auth(requesterToken))
      .send({ title: 't', description: 'x', areaId, priority: 'low', status: 'approved' })
      .expect(400);
  });

  it('solicitante cria solicitação: nasce aberta e com primeira linha no histórico', async () => {
    const res = await http
      .post('/requests')
      .set(auth(requesterToken))
      .send({ title: 'Notebook novo', description: 'Preciso de **um notebook** para o time.', areaId, priority: 'high' })
      .expect(201);
    requestId = res.body.id;
    expect(res.body.status).toBe('open');

    const detail = (await http.get(`/requests/${requestId}`).set(auth(requesterToken)).expect(200)).body;
    expect(detail.history).toHaveLength(1);
    expect(detail.history[0].status).toBe('open');
  });

  it('solicitante NÃO pode mudar status; atendente pode, com comentário obrigatório', async () => {
    await http.patch(`/requests/${requestId}/status`).set(auth(requesterToken)).send({ status: 'approved', comment: 'eu mesmo aprovo' }).expect(403);
    await http.patch(`/requests/${requestId}/status`).set(auth(agentToken)).send({ status: 'in_analysis' }).expect(400);
    await http.patch(`/requests/${requestId}/status`).set(auth(agentToken)).send({ status: 'in_analysis', comment: 'Em análise.' }).expect(200);
  });

  it('bloqueia transição inválida (mesmo status) com 422', async () => {
    await http.patch(`/requests/${requestId}/status`).set(auth(agentToken)).send({ status: 'in_analysis', comment: 'de novo' }).expect(422);
  });

  it('aprova, registra responsável e depois reabre limpando o responsável', async () => {
    await http.patch(`/requests/${requestId}/status`).set(auth(agentToken)).send({ status: 'approved', comment: 'Aprovado pelo orçamento.' }).expect(200);
    let detail = (await http.get(`/requests/${requestId}`).set(auth(supervisorToken)).expect(200)).body;
    expect(detail.status).toBe('approved');
    expect(detail.resolvedBy.name).toBe('Bruno Atendente');

    await http.patch(`/requests/${requestId}/status`).set(auth(supervisorToken)).send({ status: 'open', comment: 'Reaberta a pedido.' }).expect(200);
    detail = (await http.get(`/requests/${requestId}`).set(auth(supervisorToken)).expect(200)).body;
    expect(detail.resolvedBy).toBeNull();
    expect(detail.history.map((h: any) => h.status)).toEqual(['open', 'in_analysis', 'approved', 'open']);
  });

  it('comentário interno fica escondido do solicitante', async () => {
    await http.post(`/requests/${requestId}/comments`).set(auth(agentToken)).send({ content: 'Nota só do time', visibility: 'internal' }).expect(201);
    await http.post(`/requests/${requestId}/comments`).set(auth(requesterToken)).send({ content: 'Alguma novidade?', visibility: 'internal' }).expect(201);

    const forRequester = (await http.get(`/requests/${requestId}`).set(auth(requesterToken)).expect(200)).body.comments;
    expect(forRequester.map((c: any) => c.content)).toEqual(['Alguma novidade?']);
    // mesmo tentando mandar "internal", o solicitante só cria comentário externo
    expect(forRequester[0].visibility).toBe('external');

    const forAgent = (await http.get(`/requests/${requestId}`).set(auth(agentToken)).expect(200)).body.comments;
    expect(forAgent).toHaveLength(2);
  });

  it('listagem: busca sem acento/caixa, filtros combinados e paginação com metadados', async () => {
    await http.post('/requests').set(auth(requesterToken)).send({ title: 'Solicitação de crédito', description: 'Análise', areaId, priority: 'low' }).expect(201);
    const accent = await http.get('/requests').query({ search: 'SOLICITACAO DE CREDITO', searchIn: 'title' }).set(auth(agentToken)).expect(200);
    expect(accent.body.total).toBeGreaterThanOrEqual(1);

    const res = await http.get('/requests').query({ search: 'NOTEBOOK', status: 'open', priority: 'high' }).set(auth(agentToken)).expect(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body).toEqual(expect.objectContaining({ page: 1, totalPages: expect.any(Number), data: expect.any(Array) }));

    await http.get('/requests').query({ limit: 7 }).set(auth(agentToken)).expect(400);
    const none = await http.get('/requests').query({ search: 'zzz-nao-existe' }).set(auth(agentToken)).expect(200);
    expect(none.body.total).toBe(0);
  });

  it('dashboard agrega no banco', async () => {
    const d = (await http.get('/dashboard').set(auth(supervisorToken)).expect(200)).body;
    expect(d.total).toBe(d.open + d.inAnalysis + d.approved + d.rejected);
    expect(d.byPriority.low + d.byPriority.medium + d.byPriority.high).toBe(d.total);
  });

  it('só supervisor exclui (soft delete) e some da listagem e do dashboard', async () => {
    const before = (await http.get('/dashboard').set(auth(supervisorToken)).expect(200)).body.total;
    await http.delete(`/requests/${requestId}`).set(auth(agentToken)).expect(403);
    await http.delete(`/requests/${requestId}`).set(auth(supervisorToken)).expect(204);
    await http.get(`/requests/${requestId}`).set(auth(supervisorToken)).expect(404);
    const after = (await http.get('/dashboard').set(auth(supervisorToken)).expect(200)).body.total;
    expect(after).toBe(before - 1);
  });

  it('erro sai sempre no mesmo formato, com errorId', async () => {
    const res = await http.get('/requests/nao-e-uuid').set(auth(agentToken)).expect(400);
    expect(res.body).toEqual(expect.objectContaining({ statusCode: 400, errorId: expect.any(String), path: expect.any(String) }));
  });

  // ---- Regressões dos pontos encontrados na bateria de testes de ataque ----
  describe('endurecimento (achados dos testes de ataque)', () => {
    const body = { description: 'D', areaId: '', priority: 'low' };
    const create = (over: object) => http.post('/requests').set(auth(requesterToken)).send({ ...body, areaId, title: 'T', ...over });

    it('texto só com espaços é rejeitado: título, descrição, comentário e decisão de status', async () => {
      await create({ title: '    ' }).expect(400);
      await create({ description: '   \n\t ' }).expect(400);
      const id = (await create({ title: 'Para validar' }).expect(201)).body.id;
      await http.post(`/requests/${id}/comments`).set(auth(requesterToken)).send({ content: '   ' }).expect(400);
      await http.patch(`/requests/${id}/status`).set(auth(agentToken)).send({ status: 'approved', comment: '   ' }).expect(400);
      await http.patch(`/requests/${id}`).set(auth(requesterToken)).send({ title: '   ' }).expect(400);
      await http.patch(`/requests/${id}`).set(auth(requesterToken)).send({ title: null }).expect(400);
      await http.delete(`/requests/${id}`).set(auth(supervisorToken)).expect(204);
    });

    it('entradas que antes davam 500 agora dão 400: área inexistente, caractere nulo e página gigante', async () => {
      const ghost = '00000000-0000-4000-8000-000000000000';
      await create({ areaId: ghost }).expect(400);
      await create({ title: 'a\u0000b' }).expect(400);
      const id = (await create({ title: 'Para editar' }).expect(201)).body.id;
      await http.patch(`/requests/${id}`).set(auth(requesterToken)).send({ areaId: ghost }).expect(400);
      await http.delete(`/requests/${id}`).set(auth(supervisorToken)).expect(204);
      await http.get('/requests').query({ page: '99999999999999999999' }).set(auth(agentToken)).expect(400);
      await http.get('/requests').query({ limit: '20abc' }).set(auth(agentToken)).expect(400);
      await http.get('/requests').query({ page: '1.5' }).set(auth(agentToken)).expect(400);
    });

    it('corpo grande demais devolve 413 (e não 500) e senha gigante é recusada', async () => {
      const big = await create({ description: 'x'.repeat(200_000) }).expect(413);
      expect(big.body).toEqual(expect.objectContaining({ statusCode: 413, errorId: expect.any(String) }));
      await http.post('/auth/login').send({ email: 'atendente@sicredi.test', password: 'a'.repeat(129) }).expect(400);
    });

    it('descrição e comentário têm tamanho máximo', async () => {
      await create({ description: 'x'.repeat(10_001) }).expect(400);
      const ok = await create({ description: 'x'.repeat(10_000) }).expect(201);
      await http.delete(`/requests/${ok.body.id}`).set(auth(supervisorToken)).expect(204);
    });

    it('busca trata % e _ como caracteres comuns e não como curingas', async () => {
      const all = (await http.get('/requests').query({ limit: 100 }).set(auth(agentToken)).expect(200)).body.total;
      const pct = (await http.get('/requests').query({ search: '%' }).set(auth(agentToken)).expect(200)).body.total;
      const und = (await http.get('/requests').query({ search: '_' }).set(auth(agentToken)).expect(200)).body.total;
      expect(pct).toBeLessThan(all);
      expect(und).toBeLessThan(all);
      await http.get('/requests').query({ search: 'a'.repeat(101) }).set(auth(agentToken)).expect(400);
    });

    it('cabeçalhos de segurança (helmet): sem X-Powered-By e com nosniff', async () => {
      const res = await http.get('/requests');
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('login limita tentativas por e-mail (429) sem travar outras contas', async () => {
      const email = 'brute-force@sicredi.test'; // e-mail que não existe: não interfere nas outras contas
      const codes: number[] = [];
      for (let i = 0; i < 12; i++) codes.push((await http.post('/auth/login').send({ email, password: 'errada' })).status);
      expect(codes.slice(0, 10).every((c) => c === 401)).toBe(true);
      expect(codes.slice(10)).toEqual([429, 429]);
      // outra conta continua podendo entrar
      await http.post('/auth/login').send({ email: 'atendente@sicredi.test', password: 'Senha@123' }).expect(200);
    });
  });
});
