import { create } from 'zustand';
import type { InstanceSettings, InstanceState } from '@/api';

interface InstanceStoreState {
  state: InstanceState | null;
  settings: InstanceSettings | null;
  receiving: boolean;
  setState: (state: InstanceState) => void;
  setSettings: (settings: InstanceSettings) => void;
  setReceiving: (receiving: boolean) => void;
  reset: () => void;
}

export const useInstanceStore = create<InstanceStoreState>((set) => ({
  state: null,
  settings: null,
  receiving: true,
  setState: (state) => set({ state }),
  setSettings: (settings) => set({ settings }),
  setReceiving: (receiving) => set({ receiving }),
  reset: () => set({ state: null, settings: null, receiving: true }),
}));

export const REQUIRED_NOTIFICATION_SETTINGS = {
  incomingWebhook: 'yes',
  outgoingWebhook: 'yes',
  outgoingMessageWebhook: 'yes',
  outgoingAPIMessageWebhook: 'yes',
  stateWebhook: 'yes',
} as const satisfies InstanceSettings;

export function missingNotificationSettings(settings: InstanceSettings | null): string[] {
  if (!settings) return [];
  return Object.keys(REQUIRED_NOTIFICATION_SETTINGS).filter(
    (k) => settings[k as keyof typeof REQUIRED_NOTIFICATION_SETTINGS] !== 'yes',
  );
}

export const INSTANCE_STATE_LABEL: Record<InstanceState, string> = {
  authorized: 'Авторизован',
  notAuthorized: 'Не авторизован',
  blocked: 'Заблокирован',
  sleepMode: 'Спящий режим',
  starting: 'Запускается',
  yellowCard: 'Ограничен',
};
