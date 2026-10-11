import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const changeStatusAction = vi.fn();
vi.mock('@/app/actions', () => ({ changeStatusAction: (...args: unknown[]) => changeStatusAction(...args) }));

import { KanbanBoard, type KanbanColumn } from '../KanbanBoard';
import type { RequestStatus } from '@/lib/types';

const card = (id: string, status: RequestStatus) => ({
  id,
  title: `Pedido ${id}`,
  status,
  priority: 'low' as const,
  createdAt: '2026-10-11T12:00:00Z',
  updatedAt: '2026-10-11T12:00:00Z',
  createdLabel: '11/10/2026, 09:00',
  area: { id: 'a', name: 'Financeiro' },
  requester: { id: 'u', name: 'Ana' },
});
const column = (status: RequestStatus, ids: string[]): KanbanColumn => ({
  status,
  data: ids.map((id) => card(id, status)),
  total: ids.length,
  page: 1,
  totalPages: 1,
  listHref: `/requests?status=${status}`,
});
const columns = [column('open', ['1']), column('in_analysis', []), column('approved', ['2']), column('rejected', [])];
const dataTransfer = () => ({ setData: vi.fn(), effectAllowed: '', dropEffect: '' });

const drag = (cardTitle: string, columnLabel: string) => {
  const dt = dataTransfer();
  fireEvent.dragStart(screen.getByText(cardTitle).closest('a')!, { dataTransfer: dt });
  const target = screen.getByRole('region', { name: columnLabel });
  fireEvent.dragOver(target, { dataTransfer: dt });
  fireEvent.drop(target, { dataTransfer: dt });
};

describe('KanbanBoard', () => {
  beforeEach(() => changeStatusAction.mockReset());

  it('soltar em coluna permitida pede o comentário e só muda ao confirmar', async () => {
    changeStatusAction.mockResolvedValue({});
    render(<KanbanBoard columns={columns} canMove />);
    drag('Pedido 1', 'Coluna Aprovada');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(changeStatusAction).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText(/comentário da decisão/i), 'Aprovado no comitê');
    await userEvent.click(screen.getByRole('button', { name: /mudar status/i }));
    await waitFor(() => expect(changeStatusAction).toHaveBeenCalledWith('1', { status: 'approved', comment: 'Aprovado no comitê' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('não envia sem comentário', async () => {
    render(<KanbanBoard columns={columns} canMove />);
    drag('Pedido 1', 'Coluna Rejeitada');
    await userEvent.click(screen.getByRole('button', { name: /mudar status/i }));
    expect(await screen.findByText('O comentário da decisão é obrigatório.')).toBeInTheDocument();
    expect(changeStatusAction).not.toHaveBeenCalled();
  });

  it('mostra o erro do servidor e mantém a janela aberta', async () => {
    changeStatusAction.mockResolvedValue({ error: 'Transição inválida.' });
    render(<KanbanBoard columns={columns} canMove />);
    drag('Pedido 1', 'Coluna Em análise');
    await userEvent.type(screen.getByLabelText(/comentário da decisão/i), 'ok');
    await userEvent.click(screen.getByRole('button', { name: /mudar status/i }));
    expect(await screen.findByText('Transição inválida.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('soltar em coluna proibida não faz nada (de Aprovada não se vai direto a Rejeitada)', () => {
    render(<KanbanBoard columns={columns} canMove />);
    drag('Pedido 2', 'Coluna Rejeitada');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancelar fecha a janela sem mudar nada', async () => {
    render(<KanbanBoard columns={columns} canMove />);
    drag('Pedido 1', 'Coluna Aprovada');
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(changeStatusAction).not.toHaveBeenCalled();
  });

  it('solicitante não arrasta: cards não são arrastáveis e soltar não abre nada', () => {
    render(<KanbanBoard columns={columns} canMove={false} />);
    expect(screen.getByText('Pedido 1').closest('a')).toHaveAttribute('draggable', 'false');
    drag('Pedido 1', 'Coluna Aprovada');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/arraste um card/i)).not.toBeInTheDocument();
  });
});
