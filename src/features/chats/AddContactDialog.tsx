import { useState, type FormEvent } from 'react';
import { describeError, isGreenApiError } from '@/api';
import { useClient } from '@/features/auth/session';
import { broadcastEvent } from '@/features/notifications/useNotificationSync';
import { toApiPhone } from '@/shared/lib/phone';
import { Button, Modal, PhoneField, TextField, toast, type PhoneValue } from '@/shared/ui';
import { phoneChatId } from './model';
import { useChatsStore } from './store';
import s from './AddContactDialog.module.css';

const NAME_MAX = 60;

interface AddContactDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddContactDialog({ open, onClose }: AddContactDialogProps) {
  const [busy, setBusy] = useState(false);
  const [formKey, setFormKey] = useState(open ? 1 : 0);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setFormKey((k) => k + 1);
  }

  return (
    <Modal open={open} onClose={onClose} title="Добавить контакт" dismissible={!busy}>
      {formKey > 0 && <AddContactForm key={formKey} onDone={onClose} onBusyChange={setBusy} />}
    </Modal>
  );
}

interface FormProps {
  onDone: () => void;
  onBusyChange: (busy: boolean) => void;
}

function AddContactForm({ onDone, onBusyChange }: FormProps) {
  const client = useClient();
  const [phone, setPhone] = useState<PhoneValue>({ country: 'RU', national: '' });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneError, setPhoneError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const apiPhone = toApiPhone(phone.national, phone.country);
  const canSubmit = !!apiPhone && firstName.trim().length > 0 && !loading;

  const setBusy = (v: boolean) => {
    setLoading(v);
    onBusyChange(v);
  };

  const openChat = (chatId: string, number: string) => {
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    const chat = { chatId, name, phone: number };
    const store = useChatsStore.getState();
    store.upsertChat(chat);
    broadcastEvent({ type: 'chat', chat });
    store.openChat(chatId);
    onDone();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(undefined);
    if (!apiPhone) {
      setPhoneError('Введите корректный номер телефона');
      return;
    }
    if (!firstName.trim()) return;

    setBusy(true);
    try {
      const result = await client.checkAccount(apiPhone);
      if (!result.exist || !result.chatId) {
        setPhoneError('У этого номера нет аккаунта Telegram');
        return;
      }
      openChat(result.chatId, apiPhone);
    } catch (err) {
      if (isGreenApiError(err) && err.kind === 'instance') {
        openChat(phoneChatId(apiPhone), apiPhone);
        toast.info(
          'Номер не проверен: Telegram не авторизован. Сообщения уйдут после авторизации.',
        );
        return;
      }
      setFormError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <PhoneField
        value={phone}
        onChange={(v) => {
          setPhone(v);
          setPhoneError(undefined);
        }}
        error={phoneError}
        autoFocus
        disabled={loading}
      />
      <TextField
        label="Имя"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        maxLength={NAME_MAX}
        counter
        autoComplete="off"
        disabled={loading}
      />
      <TextField
        label="Фамилия (необязательно)"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        maxLength={NAME_MAX}
        counter
        autoComplete="off"
        disabled={loading}
      />
      {formError && (
        <div className={s.formError} role="alert">
          {formError}
        </div>
      )}
      <Button
        type="submit"
        size="l"
        block
        disabled={!canSubmit}
        loading={loading}
        className={s.submit}
      >
        Сохранить контакт
      </Button>
    </form>
  );
}
