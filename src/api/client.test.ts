import { describe, expect, it, vi } from 'vitest';
import { GreenApiClient, resolveApiUrl } from './client';
import { GreenApiError } from './errors';

const creds = { idInstance: '4100000001', apiTokenInstance: 'secret-token' };

function setup(responses: Array<Response | Error>) {
  const fetchMock = vi.fn<typeof fetch>();
  for (const r of responses) {
    if (r instanceof Error) fetchMock.mockRejectedValueOnce(r);
    else fetchMock.mockResolvedValueOnce(r);
  }
  const client = new GreenApiClient(creds, {
    apiUrl: 'https://4100.api.green-api.com',
    fetch: fetchMock,
    sleep: () => Promise.resolve(),
  });
  return { client, fetchMock };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('resolveApiUrl', () => {
  it('определяет хост по первым 4 цифрам idInstance', () => {
    expect(resolveApiUrl('4100000001')).toBe('https://4100.api.green-api.com');
    expect(resolveApiUrl('7103000000')).toBe('https://7103.api.green-api.com');
  });
});

describe('GreenApiClient', () => {
  it('строит URL по схеме {apiUrl}/waInstance{id}/{method}/{token}', async () => {
    const { client, fetchMock } = setup([json({ stateInstance: 'authorized' })]);
    await expect(client.getStateInstance()).resolves.toBe('authorized');
    expect(fetchMock.mock.calls[0]![0]).toBe(
      'https://4100.api.green-api.com/waInstance4100000001/getStateInstance/secret-token',
    );
  });

  it('sendMessage отправляет POST с JSON и возвращает idMessage', async () => {
    const { client, fetchMock } = setup([json({ idMessage: 'MSG1' })]);
    await expect(client.sendMessage({ chatId: '123', message: 'Привет' })).resolves.toBe('MSG1');
    const init = fetchMock.mock.calls[0]![1]!;
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ chatId: '123', message: 'Привет' });
  });

  it('повторяет идемпотентный запрос при 5xx', async () => {
    const { client, fetchMock } = setup([
      new Response('oops', { status: 502 }),
      json({ stateInstance: 'notAuthorized' }),
    ]);
    await expect(client.getStateInstance()).resolves.toBe('notAuthorized');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('не повторяет sendMessage при сетевой ошибке (защита от дублей)', async () => {
    const { client, fetchMock } = setup([
      new TypeError('Failed to fetch'),
      json({ idMessage: 'X' }),
    ]);
    await expect(client.sendMessage({ chatId: '1', message: 'a' })).rejects.toMatchObject({
      kind: 'network',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('401 → ошибка auth без повторов', async () => {
    const { client, fetchMock } = setup([new Response('', { status: 401 })]);
    await expect(client.getSettings()).rejects.toMatchObject({ kind: 'auth', status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('400 «not authorized» → ошибка instance', async () => {
    const { client } = setup([
      new Response('instance is starting or not authorized', { status: 400 }),
    ]);
    await expect(client.checkAccount('79990000000')).rejects.toMatchObject({ kind: 'instance' });
  });

  it('тело { status: false } → ошибка instance', async () => {
    const { client } = setup([
      json({ status: false, reason: 'instance is starting or not authorized' }),
    ]);
    await expect(client.checkAccount('79990000000')).rejects.toMatchObject({ kind: 'instance' });
  });

  it('checkAccount передаёт номер числом и разбирает ответ', async () => {
    const { client, fetchMock } = setup([json({ exist: true, chatId: '10000000' })]);
    await expect(client.checkAccount('79876543210')).resolves.toEqual({
      exist: true,
      chatId: '10000000',
      username: undefined,
    });
    expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)).toEqual({
      phoneNumber: 79876543210,
    });
  });

  it('receiveNotification: пустой ответ → null', async () => {
    const { client, fetchMock } = setup([new Response('', { status: 200 })]);
    await expect(client.receiveNotification()).resolves.toBeNull();
    expect(fetchMock.mock.calls[0]![0]).toContain('receiveTimeout=');
  });

  it('deleteNotification добавляет receiptId в путь', async () => {
    const { client, fetchMock } = setup([json({ result: true })]);
    await client.deleteNotification(42);
    expect(fetchMock.mock.calls[0]![0]).toMatch(/\/deleteNotification\/secret-token\/42$/);
    expect(fetchMock.mock.calls[0]![1]!.method).toBe('DELETE');
  });

  it('неожиданный формат ответа → badResponse', async () => {
    const { client } = setup([json({ foo: 1 })]);
    await expect(client.sendMessage({ chatId: '1', message: 'a' })).rejects.toBeInstanceOf(
      GreenApiError,
    );
  });

  it('токен не попадает в текст ошибки', async () => {
    const { client } = setup([
      new Response('', { status: 500 }),
      new Response('', { status: 500 }),
      new Response('', { status: 500 }),
    ]);
    const err: unknown = await client.getSettings().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GreenApiError);
    expect((err as Error).message).not.toContain('secret-token');
  });
});
