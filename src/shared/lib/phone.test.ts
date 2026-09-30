import { describe, expect, it } from 'vitest';
import { parseInput, toApiPhone } from './phone';

describe('phone', () => {
  it('отрезает ведущую 8 у российского номера', () => {
    expect(parseInput('8 912 345-67-89', 'RU')).toEqual({ country: 'RU', national: '9123456789' });
  });

  it('определяет страну по вставленному международному номеру', () => {
    expect(parseInput('+375 29 123-45-67', 'RU')).toEqual({ country: 'BY', national: '291234567' });
  });

  it('возвращает номер в формате GREEN-API (E.164 без +)', () => {
    expect(toApiPhone('9123456789', 'RU')).toBe('79123456789');
    expect(toApiPhone('912', 'RU')).toBeNull();
  });
});
