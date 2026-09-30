import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cx } from '@/shared/lib/cx';
import {
  formatNational,
  getCountry,
  listCountries,
  parseInput,
  type CountryCode,
} from '@/shared/lib/phone';
import { ChevronDownIcon, SearchIcon } from './icons';
import s from './PhoneField.module.css';
import fieldStyles from './TextField.module.css';
import { usePopover } from './usePopover';

/** Как на макете: цифры группами через пробел («912 345 67 89»). */
const displayNational = (digits: string, country: CountryCode) =>
  formatNational(digits, country).replace(/-/g, ' ');

export interface PhoneValue {
  country: CountryCode;
  /** Только цифры национального номера. */
  national: string;
}

interface PhoneFieldProps {
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function PhoneField({
  value,
  onChange,
  error,
  label = 'Номер телефона',
  placeholder = '123 456 78 90',
  autoFocus,
  disabled,
}: PhoneFieldProps) {
  const inputId = useId();
  const messageId = `${inputId}-msg`;
  const inputRef = useRef<HTMLInputElement>(null);
  const country = getCountry(value.country);

  return (
    <div className={fieldStyles.root}>
      <div className={cx(fieldStyles.field, s.field, error && fieldStyles.invalid)}>
        <CountryPicker
          value={value.country}
          disabled={disabled}
          onSelect={(code) => {
            onChange({ country: code, national: value.national });
            inputRef.current?.focus();
          }}
        />
        <label htmlFor={inputId} className="visually-hidden">
          {label}, код страны {country.dialCode}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          data-autofocus={autoFocus || undefined}
          disabled={disabled}
          value={displayNational(value.national, value.country)}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          className={fieldStyles.input}
          onChange={(e) => {
            const raw = e.target.value;
            const next = parseInput(raw, value.country);
            // Удалили разделитель («-», пробел) — цифры не изменились. Удаляем цифру,
            // иначе форматирование вернёт символ обратно и Backspace «залипнет».
            const formatted = displayNational(value.national, value.country);
            if (next.national === value.national && raw.length < formatted.length) {
              next.national = value.national.slice(0, -1);
            }
            onChange({ country: next.country, national: next.national.slice(0, 15) });
          }}
        />
      </div>
      <div
        id={messageId}
        className={cx(fieldStyles.message, error && fieldStyles.errorText)}
        role={error ? 'alert' : undefined}
      >
        {error}
      </div>
    </div>
  );
}

interface CountryPickerProps {
  value: CountryCode;
  onSelect: (code: CountryCode) => void;
  disabled?: boolean;
}

function CountryPicker({ value, onSelect, disabled }: CountryPickerProps) {
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const current = getCountry(value);

  const { id, open, anchorRef, popoverProps, hide } = usePopover({
    placement: 'bottom-start',
    onOpenChange: (isOpen) => {
      if (isOpen) {
        setQuery('');
        requestAnimationFrame(() => {
          searchRef.current?.focus();
          listRef.current
            ?.querySelector('[aria-selected="true"]')
            ?.scrollIntoView({ block: 'center' });
        });
      }
    },
  });

  const countries = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '');
    if (!q) return listCountries();
    return listCountries().filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.slice(1).startsWith(q) ||
        c.code.toLowerCase() === q,
    );
  }, [query]);

  const options = () => [
    ...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []),
  ];

  const onListKeyDown = (e: KeyboardEvent) => {
    const items = options();
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[Math.min(i + 1, items.length - 1)]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (i <= 0) searchRef.current?.focus();
      else items[i - 1]?.focus();
    }
  };

  const choose = (code: CountryCode) => {
    onSelect(code);
    hide();
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        popoverTarget={id}
        disabled={disabled}
        className={s.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Страна: ${current.name} ${current.dialCode}`}
      >
        <span className={s.flag} aria-hidden>
          {current.flag}
        </span>
        <span className={s.dial}>{current.dialCode}</span>
        <ChevronDownIcon size={18} className={cx(s.chevron, open && s.chevronOpen)} />
      </button>

      <div {...popoverProps} className={s.picker}>
        <div className={s.search}>
          <SearchIcon size={18} />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                options()[0]?.focus();
              } else if (e.key === 'Enter' && countries[0]) {
                e.preventDefault();
                choose(countries[0].code);
              }
            }}
            placeholder="Поиск страны"
            aria-label="Поиск страны"
            aria-controls={listId}
            className={s.searchInput}
          />
        </div>
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Страна"
          className={s.list}
          onKeyDown={onListKeyDown}
        >
          {countries.map((c) => (
            <li
              key={c.code}
              role="option"
              tabIndex={-1}
              aria-selected={c.code === value}
              className={cx(s.option, c.code === value && s.selected)}
              onClick={() => choose(c.code)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  choose(c.code);
                }
              }}
            >
              <span className={s.flag} aria-hidden>
                {c.flag}
              </span>
              <span className={s.countryName}>{c.name}</span>
              <span className={s.optionDial}>{c.dialCode}</span>
            </li>
          ))}
          {countries.length === 0 && <li className={s.empty}>Ничего не найдено</li>}
        </ul>
      </div>
    </>
  );
}
