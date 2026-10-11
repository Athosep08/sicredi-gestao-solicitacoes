import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChangeStatusDto } from './change-status.dto';
import { CreateCommentDto } from './create-comment.dto';
import { CreateRequestDto } from './create-request.dto';
import { ListRequestsQuery } from './list-requests.query';
import { UpdateRequestDto } from './update-request.dto';

const AREA = 'e7e4561f-6b8e-444e-84c7-c181cf266499';
const check = async <T extends object>(cls: new () => T, plain: object) => {
  const dto = plainToInstance(cls, plain);
  return { dto, errors: await validate(dto, { whitelist: true, forbidNonWhitelisted: true }) };
};
const valid = { title: 'Título', description: 'Descrição', areaId: AREA, priority: 'low' };

describe('CreateRequestDto', () => {
  it('aceita dados válidos e remove espaços nas pontas', async () => {
    const { dto, errors } = await check(CreateRequestDto, { ...valid, title: '  Título  ' });
    expect(errors).toHaveLength(0);
    expect(dto.title).toBe('Título');
  });

  it.each([
    ['título só com espaços', { title: '    ' }],
    ['descrição só com espaços e quebras', { description: '   \n\t ' }],
    ['título com 256 caracteres', { title: 'a'.repeat(256) }],
    ['descrição acima do limite', { description: 'x'.repeat(10001) }],
    ['título com caractere nulo', { title: 'a\u0000b' }],
    ['descrição com caractere nulo', { description: 'a\u0000b' }],
    ['título numérico', { title: 123 }],
    ['título null', { title: null }],
    ['título objeto', { title: { a: 1 } }],
  ])('rejeita %s', async (_nome, over) => {
    const { errors } = await check(CreateRequestDto, { ...valid, ...over });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('aceita título com exatamente 255 caracteres e texto com emoji e acentos', async () => {
    expect((await check(CreateRequestDto, { ...valid, title: 'a'.repeat(255) })).errors).toHaveLength(0);
    expect((await check(CreateRequestDto, { ...valid, description: 'çãõ 😀 日本語 <script>alert(1)</script>' })).errors).toHaveLength(0);
  });

  it('rejeita campos que o cliente não pode definir', async () => {
    for (const extra of [{ status: 'approved' }, { requesterId: AREA }, { resolvedById: AREA }, { createdAt: '2000-01-01' }]) {
      expect((await check(CreateRequestDto, { ...valid, ...extra })).errors.length).toBeGreaterThan(0);
    }
  });
});

describe('UpdateRequestDto', () => {
  it('aceita corpo vazio e campos omitidos', async () => {
    expect((await check(UpdateRequestDto, {})).errors).toHaveLength(0);
    expect((await check(UpdateRequestDto, { priority: 'high' })).errors).toHaveLength(0);
  });

  it.each([['título null', { title: null }], ['título só com espaços', { title: '   ' }], ['descrição null', { description: null }]])(
    'rejeita %s',
    async (_nome, over) => {
      expect((await check(UpdateRequestDto, over)).errors.length).toBeGreaterThan(0);
    },
  );
});

describe('ChangeStatusDto e CreateCommentDto', () => {
  it('a decisão exige comentário de verdade: vazio e só espaços são rejeitados', async () => {
    expect((await check(ChangeStatusDto, { status: 'approved', comment: '' })).errors.length).toBeGreaterThan(0);
    expect((await check(ChangeStatusDto, { status: 'approved', comment: '   ' })).errors.length).toBeGreaterThan(0);
    expect((await check(ChangeStatusDto, { status: 'approved', comment: 'ok' })).errors).toHaveLength(0);
  });

  it('comentário só com espaços, gigante ou com caractere nulo é rejeitado', async () => {
    expect((await check(CreateCommentDto, { content: '   ' })).errors.length).toBeGreaterThan(0);
    expect((await check(CreateCommentDto, { content: 'x'.repeat(5001) })).errors.length).toBeGreaterThan(0);
    expect((await check(CreateCommentDto, { content: 'a\u0000b' })).errors.length).toBeGreaterThan(0);
    expect((await check(CreateCommentDto, { content: 'tudo certo' })).errors).toHaveLength(0);
  });
});

describe('ListRequestsQuery', () => {
  it('converte page e limit numéricos', async () => {
    const { dto, errors } = await check(ListRequestsQuery, { page: '2', limit: '50' });
    expect(errors).toHaveLength(0);
    expect([dto.page, dto.limit]).toEqual([2, 50]);
  });

  it.each([
    ['page=0', { page: '0' }],
    ['page=-1', { page: '-1' }],
    ['page=abc', { page: 'abc' }],
    ['page=1.5', { page: '1.5' }],
    ['page enorme (estouraria o offset)', { page: '99999999999999999999' }],
    ['page vazio', { page: '' }],
    ['limit=20abc (parseInt aceitaria o prefixo)', { limit: '20abc' }],
    ['limit=7', { limit: '7' }],
    ['busca com mais de 100 caracteres', { search: 'a'.repeat(101) }],
    ['status inexistente', { status: 'hack' }],
    ['campo desconhecido', { sortBy: 'password' }],
  ])('rejeita %s', async (_nome, plain) => {
    expect((await check(ListRequestsQuery, plain)).errors.length).toBeGreaterThan(0);
  });
});
