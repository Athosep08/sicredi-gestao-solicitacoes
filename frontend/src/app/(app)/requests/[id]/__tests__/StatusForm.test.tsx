import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const changeStatusAction = vi.fn();
vi.mock('@/app/actions', () => ({ changeStatusAction: (...args: unknown[]) => changeStatusAction(...args) }));

import { StatusForm } from '../StatusForm';

describe('StatusForm', () => {
  beforeEach(() => changeStatusAction.mockReset());

  it('só oferece transições válidas a partir do status atual', () => {
    render(<StatusForm requestId="1" current="approved" />);
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Aberta', 'Em análise']);
  });

  it('não envia sem comentário e mostra o erro', async () => {
    render(<StatusForm requestId="1" current="open" />);
    await userEvent.click(screen.getByRole('button', { name: /registrar decisão/i }));
    expect(await screen.findByText('O comentário da decisão é obrigatório.')).toBeInTheDocument();
    expect(changeStatusAction).not.toHaveBeenCalled();
  });

  it('envia status e comentário quando válido', async () => {
    changeStatusAction.mockResolvedValue({});
    render(<StatusForm requestId="42" current="open" />);
    await userEvent.type(screen.getByLabelText(/comentário da decisão/i), 'Aprovado pelo orçamento');
    await userEvent.click(screen.getByRole('button', { name: /registrar decisão/i }));
    await waitFor(() =>
      expect(changeStatusAction).toHaveBeenCalledWith('42', { status: 'in_analysis', comment: 'Aprovado pelo orçamento' }),
    );
  });

  it('mostra o erro devolvido pelo servidor', async () => {
    changeStatusAction.mockResolvedValue({ error: 'Transição inválida.' });
    render(<StatusForm requestId="1" current="open" />);
    await userEvent.type(screen.getByLabelText(/comentário da decisão/i), 'ok');
    await userEvent.click(screen.getByRole('button', { name: /registrar decisão/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Transição inválida.');
  });
});
