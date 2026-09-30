import type { CheckAccountResult, InstanceSettings, InstanceState, Notification } from './types';

type Rec = Record<string, unknown>;

export const isRecord = (v: unknown): v is Rec =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const INSTANCE_STATES: readonly InstanceState[] = [
  'notAuthorized',
  'authorized',
  'blocked',
  'sleepMode',
  'starting',
  'yellowCard',
];

export function asStateInstance(v: unknown): InstanceState | null {
  if (!isRecord(v) || typeof v.stateInstance !== 'string') return null;
  return (INSTANCE_STATES as readonly string[]).includes(v.stateInstance)
    ? (v.stateInstance as InstanceState)
    : null;
}

export function asSettings(v: unknown): InstanceSettings | null {
  return isRecord(v) && typeof v.typeInstance === 'string' ? (v as InstanceSettings) : null;
}

export function asIdMessage(v: unknown): string | null {
  return isRecord(v) && typeof v.idMessage === 'string' && v.idMessage ? v.idMessage : null;
}

export function asCheckAccount(v: unknown): CheckAccountResult | null {
  if (!isRecord(v) || typeof v.exist !== 'boolean') return null;
  return {
    exist: v.exist,
    chatId: typeof v.chatId === 'string' ? v.chatId : '',
    username: typeof v.username === 'string' ? v.username : undefined,
  };
}

/** null — валидный ответ «уведомлений нет». */
export function asNotification(v: unknown): Notification | null | undefined {
  if (v === null) return null;
  if (
    isRecord(v) &&
    typeof v.receiptId === 'number' &&
    isRecord(v.body) &&
    typeof v.body.typeWebhook === 'string'
  ) {
    return v as unknown as Notification;
  }
  return undefined;
}

export function asResultFlag(v: unknown, key: 'result' | 'saveSettings'): boolean | null {
  return isRecord(v) && typeof v[key] === 'boolean' ? (v[key] as boolean) : null;
}
