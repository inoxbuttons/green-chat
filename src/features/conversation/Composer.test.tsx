import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Composer } from './Composer';

describe('Composer', () => {
  it('Enter отправляет, Shift+Enter переносит строку', async () => {
    const onSend = vi.fn();
    render(<Composer chatId="1" onSend={onSend} />);
    const input = screen.getByPlaceholderText('Сообщение');

    await userEvent.type(input, 'Первая{Shift>}{Enter}{/Shift}вторая');
    expect(onSend).not.toHaveBeenCalled();

    await userEvent.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledWith('Первая\nвторая');
    expect(input).toHaveValue('');
  });

  it('не отправляет пустое сообщение', async () => {
    const onSend = vi.fn();
    render(<Composer chatId="1" onSend={onSend} />);
    await userEvent.type(screen.getByPlaceholderText('Сообщение'), '   {Enter}');
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled();
  });
});
