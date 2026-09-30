import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GreenApiError, type GreenApiClient } from '@/api';
import { useSessionStore } from '@/features/auth/session';
import { AddContactDialog } from './AddContactDialog';
import { attachChatsStorage, useChatsStore } from './store';

function withClient(checkAccount: GreenApiClient['checkAccount']) {
  useSessionStore.setState({
    session: { idInstance: '1', apiTokenInstance: 't', userName: 'Я', remember: false },
    client: { checkAccount } as GreenApiClient,
  });
}

async function fillForm() {
  await userEvent.type(screen.getByLabelText(/Номер телефона/), '9123456789');
  await userEvent.type(screen.getByLabelText('Имя'), 'Наталия');
}

beforeEach(async () => {
  useChatsStore.getState().reset();
  await attachChatsStorage(`test-${Math.random()}`);
});

describe('AddContactDialog', () => {
  it('кнопка неактивна, пока номер и имя не заполнены', async () => {
    withClient(vi.fn());
    render(<AddContactDialog open onClose={() => {}} />);
    const submit = screen.getByRole('button', { name: 'Сохранить контакт' });
    expect(submit).toBeDisabled();
    await fillForm();
    expect(submit).toBeEnabled();
  });

  it('создаёт и открывает чат с chatId из checkAccount', async () => {
    const checkAccount = vi.fn().mockResolvedValue({ exist: true, chatId: '10000000' });
    const onClose = vi.fn();
    withClient(checkAccount);
    render(<AddContactDialog open onClose={onClose} />);
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить контакт' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(checkAccount).toHaveBeenCalledWith('79123456789');
    expect(useChatsStore.getState().chats['10000000']).toMatchObject({ name: 'Наталия' });
    expect(useChatsStore.getState().activeChatId).toBe('10000000');
  });

  it('показывает ошибку, если у номера нет Telegram', async () => {
    withClient(vi.fn().mockResolvedValue({ exist: false, chatId: '' }));
    render(<AddContactDialog open onClose={() => {}} />);
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить контакт' }));
    expect(await screen.findByText('У этого номера нет аккаунта Telegram')).toBeInTheDocument();
  });

  it('если инстанс не авторизован — создаёт чат по номеру', async () => {
    withClient(vi.fn().mockRejectedValue(new GreenApiError('instance', 'x')));
    const onClose = vi.fn();
    render(<AddContactDialog open onClose={onClose} />);
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить контакт' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(useChatsStore.getState().chats['79123456789@c.us']).toBeDefined();
  });
});
