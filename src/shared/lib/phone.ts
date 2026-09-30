import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';

export type { CountryCode };

export interface Country {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

const PRIORITY: CountryCode[] = ['RU', 'BY', 'KZ', 'UZ', 'KG', 'AM', 'AZ', 'GE', 'TJ', 'UA'];

const flagEmoji = (code: string) =>
  String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

let cache: Country[] | null = null;

export function listCountries(): Country[] {
  if (cache) return cache;
  const names = new Intl.DisplayNames(['ru'], { type: 'region' });
  const all = getCountries().map((code) => ({
    code,
    name: names.of(code) ?? code,
    dialCode: `+${getCountryCallingCode(code)}`,
    flag: flagEmoji(code),
  }));
  const rank = (c: Country) => {
    const i = PRIORITY.indexOf(c.code);
    return i === -1 ? PRIORITY.length : i;
  };
  cache = all.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'ru'));
  return cache;
}

export function getCountry(code: CountryCode): Country {
  return listCountries().find((c) => c.code === code) ?? listCountries()[0]!;
}

export const onlyDigits = (s: string) => s.replace(/\D/g, '');

/** Форматирует национальную часть номера по мере ввода: «912 345-67-89». */
export function formatNational(digits: string, country: CountryCode): string {
  return new AsYouType(country).input(digits);
}

/**
 * Разбирает ввод целиком. Если пользователь вставил номер с «+», страна
 * определяется автоматически.
 */
export function parseInput(
  raw: string,
  country: CountryCode,
): { country: CountryCode; national: string } {
  const trimmed = raw.trim();
  if (trimmed.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(trimmed);
    if (parsed?.country) {
      return { country: parsed.country, national: String(parsed.nationalNumber) };
    }
  }
  const digits = onlyDigits(trimmed);
  // «8 912…» для России — привычная запись, отрезаем префикс.
  if (country === 'RU' && digits.length === 11 && /^[78]/.test(digits)) {
    return { country, national: digits.slice(1) };
  }
  return { country, national: digits };
}

/** Номер в формате E.164 без «+» (как ожидает GREEN-API) или null, если невалиден. */
export function toApiPhone(national: string, country: CountryCode): string | null {
  const parsed = parsePhoneNumberFromString(national, country);
  if (!parsed?.isValid()) return null;
  return parsed.number.slice(1);
}

/** «+7 912 345 67 89» для отображения. */
export function formatInternational(digits: string): string {
  const parsed = parsePhoneNumberFromString(`+${digits}`);
  return parsed ? parsed.formatInternational() : `+${digits}`;
}
