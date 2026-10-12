import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const updateRequestAction = vi.fn();
vi.mock('@/app/actions', () => ({ updateRequestAction: (...args: unknown[]) => updateRequestAction(...args) }));

import { EditForm } from '../EditForm';

const areas = [{ id: 'a1', name: 'Financeiro' }, { id: 'a2', name: 'Jurídico' }];
const initial = { title: 'Título antigo', description: 'Descrição', areaId: 'a1' };

describe('EditForm', () => {
  beforeEach(() => updateRequestAction.mockReset());

  it('abre com os dados atuais e envia título e área alterados', async () => {
    updateRequestAction.mockResolvedValue({});
    render(<EditForm requestId="42" initial={initial} areas={areas} />);
    await userEvent.click(screen.getByRole('button', { name: /editar solicitação/i }));
    const title = screen.getByLabelText('Título');
    expect(title).toHaveValue('Título antigo');
    await userEvent.clear(title);
    await userEvent.type(title, 'Título novo');
    await userEvent.selectOptions(screen.getByLabelText('Área'), 'a2');
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));
    await waitFor(() =>
      expect(updateRequestAction).toHaveBeenCalledWith('42', { title: 'Título novo', description: 'Descrição', areaId: 'a2' }),
    );
  });

  it('não envia com título vazio', async () => {
    render(<EditForm requestId="42" initial={initial} areas={areas} />);
    await userEvent.click(screen.getByRole('button', { name: /editar solicitação/i }));
    await userEvent.clear(screen.getByLabelText('Título'));
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));
    expect(await screen.findByText('Informe o título.')).toBeInTheDocument();
    expect(updateRequestAction).not.toHaveBeenCalled();
  });
});
