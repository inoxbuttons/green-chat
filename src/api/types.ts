export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
}

export type InstanceState =
  'notAuthorized' | 'authorized' | 'blocked' | 'sleepMode' | 'starting' | 'yellowCard';

export type YesNo = 'yes' | 'no';

export interface InstanceSettings {
  typeInstance?: string;
  incomingWebhook?: YesNo;
  outgoingWebhook?: YesNo;
  outgoingMessageWebhook?: YesNo;
  outgoingAPIMessageWebhook?: YesNo;
  stateWebhook?: YesNo;
  delaySendMessagesMilliseconds?: number;
}

export interface SendMessageParams {
  chatId: string;
  message: string;
}

export interface CheckAccountResult {
  exist: boolean;
  chatId: string;
  username?: string;
}

/** Статусы из уведомления outgoingMessageStatus. */
export type OutgoingStatus =
  'sent' | 'delivered' | 'read' | 'failed' | 'noAccount' | 'notInGroup' | 'yellowCard' | 'expired';

export interface SenderData {
  chatId: string;
  chatName?: string;
  sender?: string;
  senderName?: string;
  senderContactName?: string;
  senderPhoneNumber?: number;
}

export interface MessageData {
  typeMessage: string;
  textMessageData?: { textMessage: string };
  extendedTextMessageData?: { text: string };
}

export interface MessageWebhook {
  typeWebhook: 'incomingMessageReceived' | 'outgoingMessageReceived' | 'outgoingAPIMessageReceived';
  timestamp: number;
  idMessage: string;
  senderData: SenderData;
  messageData: MessageData;
}

export interface StatusWebhook {
  typeWebhook: 'outgoingMessageStatus';
  timestamp: number;
  idMessage: string;
  chatId: string;
  status: OutgoingStatus;
}

export interface StateWebhook {
  typeWebhook: 'stateInstanceChanged';
  timestamp: number;
  stateInstance: InstanceState;
}

/** Тело уведомления. Неизвестные типы тоже возможны — их просто подтверждаем. */
export type WebhookBody =
  MessageWebhook | StatusWebhook | StateWebhook | { typeWebhook: string; timestamp?: number };

export interface Notification {
  receiptId: number;
  body: WebhookBody;
}
