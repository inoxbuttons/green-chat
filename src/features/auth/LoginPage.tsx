import { useState, type FormEvent } from 'react';
import { GreenApiClient, describeError, isGreenApiError } from '@/api';
import { attachChatsStorage } from '@/features/chats/store';
import { useInstanceStore } from '@/features/instance/store';
import { Button, Checkbox, EyeIcon, EyeOffIcon, TextField } from '@/shared/ui';
import { useSessionStore } from './session';
import s from './LoginPage.module.css';

const NAME_MAX = 60;

interface FormErrors {
  userName?: string;
  idInstance?: string;
  apiTokenInstance?: string;
  form?: string;
}

function validate(userName: string, idInstance: string, token: string): FormErrors {
  const errors: FormErrors = {};
  if (!userName.trim()) errors.userName = 'Введите имя';
  if (!/^\d{6,15}$/.test(idInstance)) errors.idInstance = 'idInstance состоит только из цифр';
  if (!/^[A-Za-z0-9]{20,}$/.test(token)) errors.apiTokenInstance = 'Проверьте apiTokenInstance';
  return errors;
}

export function LoginPage() {
  const signIn = useSessionStore((st) => st.signIn);
  const [userName, setUserName] = useState('');
  const [idInstance, setIdInstance] = useState('');
  const [token, setToken] = useState('');
  const [remember, setRemember] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const canSubmit = userName.trim() && idInstance && token && !loading;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const id = idInstance.trim();
    const apiToken = token.trim();
    const validation = validate(userName, id, apiToken);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setLoading(true);
    try {
      const client = new GreenApiClient({ idInstance: id, apiTokenInstance: apiToken });
      const [state, settings] = await Promise.all([
        client.getStateInstance(),
        client.getSettings(),
      ]);
      if (settings.typeInstance && settings.typeInstance !== 'telegram') {
        setErrors({
          form: `Это инстанс типа «${settings.typeInstance}». Приложение работает с Telegram.`,
        });
        return;
      }
      useInstanceStore.getState().setState(state);
      useInstanceStore.getState().setSettings(settings);
      await attachChatsStorage(id);
      signIn({ idInstance: id, apiTokenInstance: apiToken, userName: userName.trim(), remember });
    } catch (err) {
      let message = describeError(err);
      if (isGreenApiError(err)) {
        if (err.kind === 'auth' || err.status === 404) {
          message = 'Неверный idInstance или apiTokenInstance.';
        } else if (err.kind === 'network' && navigator.onLine) {
          // Хост API определяется по idInstance: несуществующий инстанс даёт сетевую ошибку.
          message = 'Не удалось подключиться к API инстанса. Проверьте idInstance.';
        }
      }
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`${s.page} wallpaper`}>
      <form className={s.card} onSubmit={onSubmit} noValidate aria-busy={loading}>
        <h1 className={s.title}>Вход</h1>
        <p className={s.subtitle}>
          Введите данные инстанса из{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer noopener">
            личного кабинета GREEN-API
          </a>
        </p>

        <TextField
          label="Ваше имя"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          maxLength={NAME_MAX}
          counter
          autoComplete="name"
          autoFocus
          error={errors.userName}
          disabled={loading}
        />
        <TextField
          label="idInstance"
          value={idInstance}
          onChange={(e) => setIdInstance(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          autoComplete="username"
          spellCheck={false}
          error={errors.idInstance}
          disabled={loading}
        />
        <TextField
          label="apiTokenInstance"
          type={showToken ? 'text' : 'password'}
          value={token}
          onChange={(e) => setToken(e.target.value.trim())}
          autoComplete="current-password"
          spellCheck={false}
          error={errors.apiTokenInstance}
          disabled={loading}
          endAdornment={
            <button
              type="button"
              className={s.reveal}
              onClick={() => setShowToken((v) => !v)}
              aria-label={showToken ? 'Скрыть токен' : 'Показать токен'}
              aria-pressed={showToken}
            >
              {showToken ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
            </button>
          }
        />

        <Checkbox
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          disabled={loading}
          description="Иначе данные удалятся при закрытии вкладки"
          className={s.remember}
        >
          Запомнить меня
        </Checkbox>

        {errors.form && (
          <div className={s.formError} role="alert">
            {errors.form}
          </div>
        )}

        <Button type="submit" size="l" block loading={loading} disabled={!canSubmit}>
          Войти
        </Button>
      </form>
    </main>
  );
}
